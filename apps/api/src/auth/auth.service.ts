import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto, RegisterDto } from './dto';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  provider: 'local' | 'google';
}

export const toPublicUser = (u: User): PublicUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  avatarUrl: u.avatarUrl,
  provider: u.provider === 'GOOGLE' ? 'google' : 'local',
});

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private issue(user: User) {
    return { accessToken: this.jwt.sign({ sub: user.id, email: user.email }), user: toPublicUser(user) };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException(
        existing.passwordHash ? 'An account with this email already exists. Sign in instead.' : 'This email is registered with Google. Use “Continue with Google”.',
      );
    }
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, passwordHash: await bcrypt.hash(dto.password, 12), provider: 'LOCAL' },
    });
    return this.issue(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // Same message for unknown email and wrong password (no account enumeration).
    if (!user?.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      if (user && !user.passwordHash) throw new BadRequestException('This account uses Google sign-in. Use “Continue with Google”.');
      throw new UnauthorizedException('Incorrect email or password.');
    }
    return this.issue(user);
  }

  /** Google sign-in: match by Google ID, then link to an existing account with the same email, else create. */
  async findOrCreateGoogleUser(p: { googleId: string; email: string; name: string; avatarUrl: string | null }) {
    if (!p.email) throw new UnauthorizedException('Your Google account has no email address.');
    const email = p.email.toLowerCase();
    const byGoogle = await this.prisma.user.findUnique({ where: { googleId: p.googleId } });
    if (byGoogle) return byGoogle;
    const byEmail = await this.prisma.user.findUnique({ where: { email } });
    if (byEmail) return this.prisma.user.update({ where: { id: byEmail.id }, data: { googleId: p.googleId, avatarUrl: byEmail.avatarUrl ?? p.avatarUrl } });
    return this.prisma.user.create({ data: { email, name: p.name, googleId: p.googleId, avatarUrl: p.avatarUrl, provider: 'GOOGLE' } });
  }

  tokenFor(user: User) {
    return this.issue(user).accessToken;
  }
}
