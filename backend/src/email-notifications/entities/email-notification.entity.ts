import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EmailNotificationDocument = EmailNotification &
  Document & { _id: Types.ObjectId };

@Schema()
export class EmailNotification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  recipientId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  type!: string;

  @Prop({ required: true })
  subject!: string;

  @Prop({ required: true })
  body!: string;

  @Prop({ default: Date.now, index: true })
  sentAt!: Date;

  @Prop({
    required: true,
    enum: ['sent', 'failed', 'pending'],
    default: 'pending',
  })
  status!: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const EmailNotificationSchema =
  SchemaFactory.createForClass(EmailNotification);
