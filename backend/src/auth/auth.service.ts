import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import bcrypt from 'bcrypt';
import {
  User,
  UserDocument,
  UserRole,
  ActivityEventType,
} from '../users/entities/user.entity';
import { SocialAuth } from './social-auth.schema';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { MailService } from './mail.service';
import { FaceAuthService } from './face-auth.service';
import { AuditService } from '../audit/audit.service';

type JwtPayload = {
  sub: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
};

type OtpJwtPayload = {
  email: string;
  otp: string;
  purpose: 'email_verification' | 'password_reset';
};

const isJwtPayload = (value: unknown): value is JwtPayload => {
  if (typeof value !== 'object' || value === null) return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.sub === 'string' &&
    typeof payload.username === 'string' &&
    Object.values(UserRole).includes(payload.role as UserRole)
  );
};

const isOtpJwtPayload = (value: unknown): value is OtpJwtPayload => {
  if (typeof value !== 'object' || value === null) return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.email === 'string' &&
    typeof payload.otp === 'string' &&
    (payload.purpose === 'email_verification' ||
      payload.purpose === 'password_reset')
  );
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(SocialAuth.name) private socialAuthModel: Model<SocialAuth>,
    private jwtService: JwtService,
    private mailService: MailService,
    private faceAuthService: FaceAuthService,
    private auditService: AuditService,
  ) {}

  // ── Generate Username ─────────────────────────────────────────────────────
  private async generateUsername(
    firstName: string,
    lastName: string,
  ): Promise<string> {
    const baseUsername = `${firstName}${lastName}`
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, ''); // strip non-alphanumeric so names like "4twin" stay clean

    const base = baseUsername || 'user';
    let username = base;
    let counter = 1;

    while (await this.userModel.exists({ username })) {
      username = `${base}${counter}`;
      counter++;
    }

    return username;
  }

  // ── Generate OTP Token ────────────────────────────────────────────────────
  private generateOtpToken(email: string, otp: string): string {
    return this.jwtService.sign(
      { email, otp, purpose: 'email_verification' },
      {
        secret: process.env.JWT_OTP_SECRET || 'otp-secret-key',
        expiresIn: '10m',
      },
    );
  }

  // ── Generate Password Reset Token ─────────────────────────────────────────
  private generateResetToken(email: string, otp: string): string {
    return this.jwtService.sign(
      { email, otp, purpose: 'password_reset' },
      {
        secret: process.env.JWT_OTP_SECRET || 'otp-secret-key',
        expiresIn: '10m',
      },
    );
  }

  // ── Decode & Validate OTP Token ───────────────────────────────────────────
  private decodeOtpToken(token: string): OtpJwtPayload {
    try {
      const decoded: unknown = this.jwtService.verify(token, {
        secret: process.env.JWT_OTP_SECRET || 'otp-secret-key',
      });

      if (!isOtpJwtPayload(decoded)) {
        throw new BadRequestException('Invalid OTP token');
      }

      return decoded;
    } catch {
      throw new BadRequestException('OTP token is invalid or expired');
    }
  }

  // ── Register ──────────────────────────────────────────────────────────────
  async register(dto: SignupDto, req?: Request) {
    if (dto.password !== dto.confirm_password) {
      throw new BadRequestException('Passwords do not match');
    }

    const [emailExists, cinExists] = await Promise.all([
      this.userModel.findOne({ email: dto.email }),
      dto.cin
        ? this.userModel.findOne({ cin: dto.cin })
        : Promise.resolve(null),
    ]);

    if (emailExists) throw new ConflictException('Email already in use');
    if (cinExists) throw new ConflictException('CIN already registered');

    const username = await this.generateUsername(dto.first_name, dto.last_name);
    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      username,
      email: dto.email,
      password: hashed,
      firstName: dto.first_name,
      lastName: dto.last_name,
      role: dto.user_type as UserRole,
      cin: dto.cin,
      phone: dto.phone_num,
      dateOfBirth: new Date(dto.birth_date),
      profileIncomplete: false,
    });

    void this.auditService.log({
      userId: user._id.toString(),
      event: ActivityEventType.ACCOUNT_CREATED,
      req,
    });

    let faceEnrolled = false;
    if (dto.face_image) {
      try {
        await this.faceAuthService.enrollFace(
          user._id.toString(),
          dto.face_image,
        );
        faceEnrolled = true;

        void this.auditService.log({
          userId: user._id.toString(),
          event: ActivityEventType.FACE_ENROLLED,
          req,
        });
      } catch (err) {
        this.logger.warn(
          `Face enroll failed during registration for ${user.email}: ${(err as Error).message}`,
        );
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpToken = this.generateOtpToken(dto.email.toLowerCase(), otp);

    try {
      await this.mailService.sendOtp(user._id, dto.email, otp);
    } catch (err) {
      console.error('OTP email failed (user still created):', err);
    }

    return {
      message:
        'Registration successful. Check your email for the verification code.',
      user_id: user._id.toString(),
      email: user.email,
      username: user.username,
      otp_token: otpToken,
      face_enrolled: faceEnrolled,
    };
  }

  // ── Send OTP (resend) ─────────────────────────────────────────────────────
  async sendOtp(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new BadRequestException('User not found');
    if (user.isEmailVerified)
      throw new BadRequestException('Email already verified');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpToken = this.generateOtpToken(email.toLowerCase(), otp);

    await this.mailService.sendOtp(user._id, email, otp);

    return {
      message: 'OTP sent to your email',
      otp_token: otpToken,
    };
  }

  // ── Verify OTP ────────────────────────────────────────────────────────────
  async verifyOtp(email: string, otp: string, otpToken: string, req?: Request) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.userModel.findOne({ email: normalizedEmail });
    if (!user) throw new BadRequestException('User not found');
    if (user.isEmailVerified)
      throw new BadRequestException('Email already verified');

    const payload = this.decodeOtpToken(otpToken);

    if (payload.email !== normalizedEmail || payload.otp !== otp) {
      throw new BadRequestException('Invalid OTP code');
    }

    await this.userModel.updateOne(
      { email: normalizedEmail },
      { isEmailVerified: true },
    );

    void this.auditService.log({
      userId: user._id.toString(),
      event: ActivityEventType.EMAIL_VERIFIED,
      req,
    });

    return { message: 'Email verified successfully' };
  }

  // ── Forgot Password ───────────────────────────────────────────────────────
  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.userModel.findOne({ email: normalizedEmail });

    if (!user) {
      return { message: 'If this email exists, a reset code has been sent.' };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = this.generateResetToken(normalizedEmail, otp);

    try {
      await this.mailService.sendPasswordResetOtp(
        user._id,
        normalizedEmail,
        otp,
      );
    } catch (err) {
      console.error('Password reset email failed:', err);
    }

    return {
      message: 'If this email exists, a reset code has been sent.',
      reset_token: resetToken,
    };
  }

  // ── Reset Password ────────────────────────────────────────────────────────
  async resetPassword(
    email: string,
    otp: string,
    resetToken: string,
    newPassword: string,
    confirmPassword: string,
    req?: Request,
  ) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const normalizedEmail = email.toLowerCase();
    const user = await this.userModel.findOne({ email: normalizedEmail });
    if (!user) throw new BadRequestException('User not found');

    const payload = this.decodeOtpToken(resetToken);

    if (
      payload.purpose !== 'password_reset' ||
      payload.email !== normalizedEmail ||
      payload.otp !== otp
    ) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userModel.updateOne(
      { email: normalizedEmail },
      { password: hashed },
    );

    void this.auditService.log({
      userId: user._id.toString(),
      event: ActivityEventType.PASSWORD_RESET,
      req,
      metadata: { method: 'forgot_password_flow' },
    });

    return { message: 'Password reset successfully. You can now log in.' };
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async login(dto: LoginDto, req?: Request) {
    const username = dto.username?.toLowerCase().trim();
    if (!username || !dto.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.userModel.findOne({ username }).select('+password');
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is disabled');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      void this.auditService.log({
        userId: user._id.toString(),
        event: ActivityEventType.LOGIN_FAILED,
        req,
        metadata: { reason: 'wrong_password' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const { access_token, refresh_token } = this.generateTokens(user);

    void this.auditService.log({
      userId: user._id.toString(),
      event: ActivityEventType.LOGIN,
      req,
    });

    return {
      access: access_token,
      refresh: refresh_token,
      username: user.username,
      user_type: user.role,
      user_id: user._id.toString(),
    };
  }

  // ── Token Verify ──────────────────────────────────────────────────────────
  verifyToken(token: string) {
    try {
      const decoded: unknown = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
      });

      if (!isJwtPayload(decoded)) {
        throw new UnauthorizedException('Token payload is invalid');
      }

      return { valid: true, payload: decoded };
    } catch {
      throw new UnauthorizedException('Token is invalid or expired');
    }
  }

  // ── Token Refresh ─────────────────────────────────────────────────────────
  async refreshToken(refresh: string) {
    try {
      const decoded: unknown = this.jwtService.verify(refresh, {
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      });

      if (!isJwtPayload(decoded)) {
        throw new UnauthorizedException('Refresh token payload is invalid');
      }

      const user = await this.userModel.findById(decoded.sub);
      if (!user || !user.isActive) throw new UnauthorizedException();

      const access_token = this.jwtService.sign(
        { sub: user._id.toString(), username: user.username, role: user.role },
        {
          secret: process.env.JWT_SECRET || 'your-secret-key',
          expiresIn: '15m',
        },
      );

      return { access: access_token };
    } catch {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }
  }

  async findOrCreateOAuthUser(data: {
    email: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    provider: string;
    socialId: string;
  }) {
    // 1️⃣ Check social link first
    const existingSocial = await this.socialAuthModel.findOne({
      provider: data.provider,
      socialId: data.socialId,
    });

    if (existingSocial) {
      const user = await this.userModel.findById(existingSocial.userId);
      if (!user) {
        throw new Error('Linked user not found');
      }
      return user;
    }

    // 2️⃣ Check if user exists by email
    let user = await this.userModel.findOne({ email: data.email });

    if (!user) {
      // 3️⃣ Create new user
      user = await this.userModel.create({
        email: data.email,
        username: data.email.split('@')[0],
        firstName: data.firstName,
        lastName: data.lastName,
        role: UserRole.STUDENT,
        password: crypto.randomUUID(), // dummy
        phone: '00000000',
        dateOfBirth: new Date('2000-01-01'),
        oauthProviders: [data.provider],
        profileIncomplete: true,
      });
    }

    // 4️⃣ Create social link
    await this.socialAuthModel.create({
      provider: data.provider,
      socialId: data.socialId,
      userId: user._id,
    });

    return user;
  }

  // ── Complete OAuth Profile ────────────────────────────────────────────────
  async completeProfile(
    userId: string,
    dto: CompleteProfileDto,
    req?: Request,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    // Generate a clean username from the real name provided by the user
    const username = await this.generateUsername(dto.first_name, dto.last_name);

    await this.userModel.updateOne(
      { _id: userId },
      {
        username,
        role: dto.user_type as UserRole,
        firstName: dto.first_name,
        lastName: dto.last_name,
        phone: dto.phone_num,
        dateOfBirth: new Date(dto.birth_date),
        profileIncomplete: false,
        ...(dto.cin ? { cin: dto.cin } : {}),
      },
    );

    // Optional face enroll
    let faceEnrolled = false;
    if (dto.face_image) {
      try {
        await this.faceAuthService.enrollFace(userId, dto.face_image);
        faceEnrolled = true;
        void this.auditService.log({
          userId,
          event: ActivityEventType.FACE_ENROLLED,
          req,
        });
      } catch (err) {
        this.logger.warn(
          `Face enroll failed during profile completion: ${(err as Error).message}`,
        );
      }
    }

    void this.auditService.log({
      userId,
      event: ActivityEventType.PROFILE_UPDATED,
      req,
    });

    // Re-fetch to build tokens with the updated username + role
    const updatedUser = await this.userModel.findById(userId);
    if (!updatedUser)
      throw new BadRequestException('User not found after update');

    const { access_token, refresh_token } = this.generateTokens(updatedUser);

    return {
      message: 'Profile completed successfully',
      access: access_token,
      refresh: refresh_token,
      username: updatedUser.username,
      user_type: updatedUser.role,
      user_id: updatedUser._id.toString(),
      face_enrolled: faceEnrolled,
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  // In AuthService
  public generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      username: user.username,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: '15m',
    });

    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      expiresIn: '7d',
    });

    return { access_token, refresh_token };
  }
}
