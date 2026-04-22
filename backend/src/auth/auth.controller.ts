import {
  Body,
  Controller,
  Post,
  Patch,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { LoginDto } from './dto/login.dto';
import { FaceLoginDto, FaceEnrollDto } from './dto/face-auth.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { FaceAuthService } from './face-auth.service';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserDocument, ActivityEventType } from '../users/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { UnauthorizedException } from '@nestjs/common';

type AuthenticatedRequest = Request & {
  user: UserDocument;
};

type GoogleOAuthUser = {
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  googleId: string;
};

type FacebookOAuthUser = {
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  facebookId: string;
};

@Controller()
export class AuthController {
  constructor(
    private authService: AuthService,
    private faceAuthService: FaceAuthService,
    private auditService: AuditService,
  ) {}

  // ── Registration & Login ──────────────────────────────────────────────────

  @Post('api/register')
  register(@Body() dto: SignupDto, @Req() req: Request) {
    return this.authService.register(dto, req);
  }

  @HttpCode(HttpStatus.OK)
  @Post('api/login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req);
  }

  // ── Token ─────────────────────────────────────────────────────────────────

  @HttpCode(HttpStatus.OK)
  @Post('token/verify')
  verifyToken(@Body('token') token: string) {
    return this.authService.verifyToken(token);
  }

  @HttpCode(HttpStatus.OK)
  @Post('token/refresh')
  refreshToken(@Body('refresh') refresh: string) {
    return this.authService.refreshToken(refresh);
  }

  // ── OTP / Email Verification ──────────────────────────────────────────────

  @HttpCode(HttpStatus.OK)
  @Post('api/verify-otp')
  verifyOtp(
    @Body('email') email: string,
    @Body('otp') otp: string,
    @Body('otp_token') otpToken: string,
    @Req() req: Request,
  ) {
    return this.authService.verifyOtp(email, otp, otpToken, req);
  }

  @HttpCode(HttpStatus.OK)
  @Post('api/resend-otp')
  resendOtp(@Body('email') email: string) {
    return this.authService.sendOtp(email);
  }

  // ── Password Reset ────────────────────────────────────────────────────────

  @HttpCode(HttpStatus.OK)
  @Post('api/forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('api/reset-password')
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    return this.authService.resetPassword(
      dto.email,
      dto.otp,
      dto.reset_token,
      dto.new_password,
      dto.confirm_password,
      req,
    );
  }

  // ── Face Auth ─────────────────────────────────────────────────────────────

  @HttpCode(HttpStatus.OK)
  @Post('api/face-login')
  async faceLogin(@Body() dto: FaceLoginDto, @Req() req: Request) {
    const result = await this.faceAuthService.faceLogin(dto.image);

    void this.auditService.log({
      userId: result.user_id,
      event: ActivityEventType.LOGIN_FACE,
      req,
    });

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('api/face-enroll')
  async enrollFace(
    @Req() req: AuthenticatedRequest,
    @Body() dto: FaceEnrollDto,
  ) {
    const userId = (req.user._id as unknown as string).toString();
    const result = await this.faceAuthService.enrollFace(userId, dto.image);

    void this.auditService.log({
      userId,
      event: ActivityEventType.FACE_ENROLLED,
      req,
    });

    return result;
  }

  // ── Profile ───────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('api/me')
  getMe(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('api/complete-profile')
  completeProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CompleteProfileDto,
  ) {
    const userId = (req.user._id as unknown as string).toString();
    return this.authService.completeProfile(userId, dto, req);
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────

  @Get('auth/google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('auth/google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const oauthUser = req.user as GoogleOAuthUser;

    try {
      // findOrCreateOAuthUser throws UnauthorizedException if banned/inactive
      const user = await this.authService.findOrCreateOAuthUser({
        email: oauthUser.email,
        firstName: oauthUser.firstName,
        lastName: oauthUser.lastName,
        profileImage: oauthUser.picture,
        provider: 'google',
        socialId: oauthUser.googleId,
      });

      const { access_token, refresh_token } =
        this.authService.generateTokens(user);

      const params = new URLSearchParams({
        access: access_token,
        refresh: refresh_token,
      });

      if (user.profileIncomplete) {
        params.set('profile_incomplete', 'true');
      }

      return res.redirect(`${frontendUrl}/auth?${params.toString()}`);
    } catch (err) {
      // ✅ banned/inactive account — redirect to login with a clear error
      // instead of silently issuing tokens
      const message =
        err instanceof UnauthorizedException
          ? err.message
          : 'Authentication failed';

      return res.redirect(
        `${frontendUrl}/auth?error=${encodeURIComponent(message)}`,
      );
    }
  }

  // ── Facebook OAuth ────────────────────────────────────────────────────────

  @Get('auth/facebook')
  @UseGuards(AuthGuard('facebook'))
  facebookLogin() {}

  @Get('auth/facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const oauthUser = req.user as FacebookOAuthUser;

    try {
      const user = await this.authService.findOrCreateOAuthUser({
        email: oauthUser.email,
        firstName: oauthUser.firstName,
        lastName: oauthUser.lastName,
        profileImage: oauthUser.picture,
        provider: 'facebook',
        socialId: oauthUser.facebookId,
      });

      const { access_token, refresh_token } =
        this.authService.generateTokens(user);

      const params = new URLSearchParams({
        access: access_token,
        refresh: refresh_token,
      });

      if (user.profileIncomplete) {
        params.set('profile_incomplete', 'true');
      }

      return res.redirect(`${frontendUrl}/auth?${params.toString()}`);
    } catch (err) {
      const message =
        err instanceof UnauthorizedException
          ? err.message
          : 'Authentication failed';

      return res.redirect(
        `${frontendUrl}/auth?error=${encodeURIComponent(message)}`,
      );
    }
  }
}
