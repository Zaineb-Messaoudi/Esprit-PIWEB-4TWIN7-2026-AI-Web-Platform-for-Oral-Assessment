import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AssignmentDocument = Assignment &
  Document & { _id: Types.ObjectId };

export enum AssignmentType {
  UPLOAD = 'upload', // student uploads a file async
  LIVE = 'live', // instructor records student in a live session
}

export enum AllowedFileType {
  AUDIO = 'audio',
  VIDEO = 'video',
  BOTH = 'both',
}

@Schema({ timestamps: true })
export class Assignment {
  @Prop({ type: Types.ObjectId, ref: 'Class', required: true, index: true })
  classId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  instructorId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({
    required: true,
    enum: AssignmentType,
    default: AssignmentType.UPLOAD,
    index: true,
  })
  type!: AssignmentType;

  @Prop({
    required: true,
    enum: AllowedFileType,
  })
  allowedFileTypes!: AllowedFileType;

  @Prop({ required: true })
  deadline!: Date;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);
