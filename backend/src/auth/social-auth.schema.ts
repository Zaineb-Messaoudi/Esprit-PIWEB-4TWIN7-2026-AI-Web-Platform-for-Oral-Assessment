import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class SocialAuth extends Document {
  @Prop({ required: true })
  provider!: string; // 'google' or 'facebook'

  @Prop({ required: true, unique: true })
  socialId!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;
}

export const SocialAuthSchema = SchemaFactory.createForClass(SocialAuth);