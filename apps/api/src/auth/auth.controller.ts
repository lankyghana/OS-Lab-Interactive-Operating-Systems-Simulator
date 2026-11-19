import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import type { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  /** Starts the Google OAuth flow. */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  google() {
    /* redirected by passport */
  }

  /** Google redirects here; we hand a JWT to the frontend in the URL fragment (never sent to servers). */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: Request, @Res() res: Response) {
    const web = (this.config.get<string>('WEB_URL') ?? 'http://localhost:3000').split(',')[0];
    const token = this.auth.tokenFor(req.user as User);
    res.redirect(`${web}/auth/callback#token=${encodeURIComponent(token)}`);
  }
}
