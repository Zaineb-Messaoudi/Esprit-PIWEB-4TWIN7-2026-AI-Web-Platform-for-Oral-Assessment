import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubmissionDocument = Submission &
  Document & { _id: Types.ObjectId };

export enum SubmissionType {
  UPLOAD = 'upload', // student uploaded a file themselves (M4)
  LIVE = 'live', // instructor recorded the student in a session (M3)
}

export enum SubmissionFileType {
  AUDIO = 'audio',
  VIDEO = 'video',
}

export enum SubmissionStatus {
  PENDING = 'pending', // submitted, awaiting grade
  GRADED = 'graded',
  CANCELLED = 'cancelled', // assignment was cancelled by instructor
}

@Schema({ timestamps: true })
export class Submission {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  studentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Class', required: true, index: true })
  classId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Assignment',
    required: true,
    index: true,
  })
  assignmentId!: Types.ObjectId; // always required — every submission belongs to an assignment

  // Denormalized for display without extra lookups
  @Prop({ required: true, trim: true })
  assignmentTitle!: string;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({
    required: true,
    enum: SubmissionType,
    index: true,
  })
  submissionType!: SubmissionType;

  @Prop({ required: true, enum: SubmissionFileType })
  fileType!: SubmissionFileType;

  // For UPLOAD type: student uploads one file
  @Prop()
  fileUrl?: string;

  // For LIVE type: separate audio/video tracks if needed
  @Prop()
  audioFileUrl?: string;

  @Prop()
  videoFileUrl?: string;

  @Prop({ default: 0 })
  fileDuration!: number;

  @Prop({ default: 0 })
  fileSize!: number;

  // Only set for LIVE submissions — the instructor who ran the session
  @Prop({ type: Types.ObjectId, ref: 'User' })
  recordedBy?: Types.ObjectId;

  // Only set for LIVE submissions — links back to the session
  @Prop({ type: Types.ObjectId, ref: 'Session' })
  sessionId?: Types.ObjectId;

  // true = draft (student saved but not submitted), false = final
  // For LIVE submissions isDraft is always false (instructor saves = final)
  @Prop({ default: true, index: true })
  isDraft!: boolean;

  @Prop({
    required: true,
    enum: SubmissionStatus,
    default: SubmissionStatus.PENDING,
    index: true,
  })
  status!: SubmissionStatus;

  @Prop({ type: Number })
  grade?: number;

  @Prop()
  gradeFeedback?: string;

  // Set when student hits "Submit" (isDraft → false) or instructor saves live recording
  @Prop()
  submittedAt?: Date;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);
