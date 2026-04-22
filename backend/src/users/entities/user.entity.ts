import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type UserDocument = User & Document & { _id: Types.ObjectId };

export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
}

export enum ActivityEventType {
  LOGIN = 'login',
  LOGIN_FACE = 'login_face',
  LOGIN_OAUTH = 'login_oauth',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET = 'password_reset', // via forgot-password flow
  EMAIL_VERIFIED = 'email_verified',
  PROFILE_UPDATED = 'profile_updated',
  FACE_ENROLLED = 'face_enrolled',
  ACCOUNT_CREATED = 'account_created',
}

export interface ActivityLogEntry {
  event: ActivityEventType;
  timestamp: Date;
  ip?: string;
  device?: string; // e.g. "Chrome on Windows"
  location?: string; // e.g. "Tunis, TN" — from IP geo (optional)
  metadata?: Record<string, string>; // any extra context
}

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  username!: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  email!: string;

  @Prop({
    required: true,
    select: false,
  })
  password!: string;

  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({
    required: true,
    enum: UserRole,
    index: true,
  })
  role!: UserRole;

  @Prop()
  profileImage?: string;

  @Prop({
    sparse: true,
    index: true,
  })
  cin?: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ required: true })
  dateOfBirth!: Date;

  @Prop({
    type: {
      onUpload: { type: Boolean, default: true },
      onGrade: { type: Boolean, default: true },
      onFeedback: { type: Boolean, default: true },
    },
    default: () => ({}),
  })
  emailPreferences!: {
    onUpload: boolean;
    onGrade: boolean;
    onFeedback: boolean;
  };

  @Prop({
    type: MongooseSchema.Types.Mixed,
  })
  faceIdData?: Record<string, any>;

  @Prop({
    type: [
      {
        event: { type: String, required: true },
        timestamp: { type: Date, required: true },
        ip: { type: String },
        device: { type: String },
        location: { type: String },
        metadata: { type: MongooseSchema.Types.Mixed },
      },
    ],
    default: [],
    select: false,
  })
  activityLog!: ActivityLogEntry[];

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({ type: [String], default: [] })
  oauthProviders?: string[];

  @Prop({ default: false })
  profileIncomplete!: boolean;

  @Prop({ default: false })
  isBanned?: boolean;

  @Prop()
  banExpiresAt?: Date;

  @Prop()
  banReason?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
