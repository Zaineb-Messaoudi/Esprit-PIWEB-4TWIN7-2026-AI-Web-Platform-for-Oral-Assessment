import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { User, UserSchema } from '../users/entities/user.entity';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import {
  EmailNotification,
  EmailNotificationSchema,
} from '../email-notifications/entities/email-notification.entity';
import { MailService } from './mail.service';
import { FaceAuthModule } from './face-auth.module';
import { AuditModule } from '../audit/audit.module';
import { SocialAuth, SocialAuthSchema } from './social-auth.schema';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}), // secrets passed per-call for flexibility
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: EmailNotification.name, schema: EmailNotificationSchema },
      { name: SocialAuth.name, schema: SocialAuthSchema }, // ← add
    ]),
    FaceAuthModule,
    AuditModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    JwtAuthGuard,
    RolesGuard,
    MailService,
  ],
  exports: [JwtAuthGuard, RolesGuard, AuthService, MailService],
})
export class AuthModule {}
