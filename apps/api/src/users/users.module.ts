import { Body, Controller, Delete, Get, HttpCode, Module, NotFoundException, Patch, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { toPublicUser } from '../auth/auth.service';

class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;
}

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async me(@CurrentUser() u: AuthUser) {
    const user = await this.prisma.user.findUnique({ where: { id: u.id } });
    if (!user) throw new NotFoundException();
    return toPublicUser(user);
  }

  @Patch()
  async update(@CurrentUser() u: AuthUser, @Body() dto: UpdateMeDto) {
    return toPublicUser(await this.prisma.user.update({ where: { id: u.id }, data: dto }));
  }

  /** Deletes the account and (via cascades) all of its learning data. */
  @Delete()
  @HttpCode(204)
  async remove(@CurrentUser() u: AuthUser) {
    await this.prisma.user.delete({ where: { id: u.id } });
  }
}

@Module({ controllers: [MeController] })
export class UsersModule {}
