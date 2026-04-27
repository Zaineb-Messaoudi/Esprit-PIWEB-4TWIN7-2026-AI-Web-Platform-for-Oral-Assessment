import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubmissionDocument = Submission &
  Document & { _id: Types.ObjectId };

@Schema({ timestamps: true })
export class Submission {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  studentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Class', required: true, index: true })
  classId!: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  assignmentTitle!: string;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description!: string;

  @Prop({
    required: true,
    enum: ['instructor_recorded', 'student_uploaded'],
    index: true,
  })
  submissionType!: string;

  @Prop({ required: true, enum: ['audio', 'video'] })
  fileType!: string;

  @Prop()
  audioFileUrl?: string;

  @Prop()
  videoFileUrl?: string;

  @Prop()
  fileDuration?: number = 0;

  @Prop()
  fileSize?: number = 0;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  recordedBy?: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['pending', 'evaluated', 'in_progress'],
    default: 'pending',
    index: true,
  })
  status!: string;

  @Prop({ type: Object })
  grade?: number | string;

  @Prop({ default: Date.now })
  submissionDate: Date = new Date();
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);
