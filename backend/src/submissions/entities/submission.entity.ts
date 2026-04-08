import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubmissionDocument = Submission & Document & { _id: Types.ObjectId };

@Schema({ timestamps: true })
export class Submission {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  studentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Class', required: true, index: true })
  classId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Assignment', required: true, index: true })
  assignmentId!: Types.ObjectId;

  @Prop({ required: true, enum: ['audio', 'video'] })
  fileType!: string;

  @Prop()
  fileUrl?: string;

  @Prop()
  fileDuration?: number;

  @Prop()
  fileSize?: number;

  @Prop({ default: true, index: true })
  isDraft!: boolean;

  @Prop({
    required: true,
    enum: ['pending', 'evaluated', 'in_progress'],
    default: 'pending',
    index: true,
  })
  status!: string;

  @Prop({ type: Object })
  grade?: number | string;

  @Prop()
  submittedAt?: Date;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);