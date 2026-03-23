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

type AuthenticatedRequest = Request & {
  user: UserDocument;
};

// Returned by Passport OAuth strategies (google / facebook)
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

// Used by the complete-profile endpoint where we only need the JWT sub
type JwtAuthenticatedRequest = Request & {
  user: { sub: string; username: string; role: string };
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

  // ── Complete OAuth Profile ────────────────────────────────────────────────
  // Called after a new OAuth sign-up — user fills in the missing fields
  // (role, real name, phone, DOB, optional CIN / face).

  @UseGuards(JwtAuthGuard)
  @Patch('api/complete-profile')
  completeProfile(
    @Req() req: JwtAuthenticatedRequest,
    @Body() dto: CompleteProfileDto,
  ) {
    return this.authService.completeProfile(req.user.sub, dto, req);
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────

  @Get('auth/google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport redirects to Google — nothing needed here
  }

  @Get('auth/google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const oauthUser = req.user as GoogleOAuthUser;

    // 1️⃣ Find or create user
    const user = await this.authService.findOrCreateOAuthUser({
      email: oauthUser.email,
      firstName: oauthUser.firstName,
      lastName: oauthUser.lastName,
      profileImage: oauthUser.picture,
      provider: 'google',
      socialId: oauthUser.googleId,
    });

    // 2️⃣ Generate JWT tokens
    const { access_token, refresh_token } =
      this.authService.generateTokens(user);

    // 3️⃣ Build query params for redirect
    const params = new URLSearchParams({
      access: access_token,
      refresh: refresh_token,
    });

    if (user.profileIncomplete) {
      params.set('profile_incomplete', 'true');
    }

    // 4️⃣ Redirect to frontend
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/auth?${params.toString()}`);
  }

  // ── Facebook OAuth ────────────────────────────────────────────────────────

  @Get('auth/facebook')
  @UseGuards(AuthGuard('facebook'))
  facebookLogin() {}

  @Get('auth/facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(@Req() req: Request, @Res() res: Response) {
    const oauthUser = req.user as FacebookOAuthUser;

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

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/auth?${params.toString()}`);
  }
}
