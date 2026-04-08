import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AssignmentDocument = Assignment & Document & { _id: Types.ObjectId };

@Schema({ timestamps: true })
export class Assignment {
  @Prop({ type: Types.ObjectId, ref: 'Class', required: true, index: true })
  classId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  instructorId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ required: true, enum: ['audio', 'video', 'both'] })
  allowedFileTypes!: string;

  @Prop({ required: true })
  deadline!: Date;

  @Prop({ default: true })
  isActive!: boolean;
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);