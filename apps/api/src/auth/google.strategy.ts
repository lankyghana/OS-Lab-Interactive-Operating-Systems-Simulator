import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    private readonly auth: AuthService,
  ) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID') || 'not-configured',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') || 'not-configured',
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL') ?? 'http://localhost:4000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(_access: string, _refresh: string, profile: Profile) {
    const email = profile.emails?.find((e) => e.verified)?.value ?? profile.emails?.[0]?.value;
    return this.auth.findOrCreateGoogleUser({
      googleId: profile.id,
      email: email!,
      name: profile.displayName || email!.split('@')[0],
      avatarUrl: profile.photos?.[0]?.value ?? null,
    });
  }
}
