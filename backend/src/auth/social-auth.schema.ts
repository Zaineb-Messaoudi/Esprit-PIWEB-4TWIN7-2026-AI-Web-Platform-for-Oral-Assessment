import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class SocialAuth extends Document {
  @Prop({ required: true })
  provider!: string; // 'google' | 'facebook'

  @Prop({ required: true })
  socialId!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;
}

export const SocialAuthSchema = SchemaFactory.createForClass(SocialAuth);

// Compound unique index — one social account per provider
SocialAuthSchema.index({ socialId: 1, provider: 1 }, { unique: true });
