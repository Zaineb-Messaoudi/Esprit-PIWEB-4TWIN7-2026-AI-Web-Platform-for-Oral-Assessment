import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RecordingDocument = Recording & Document & { _id: Types.ObjectId };

export enum RecordingSource {
  INSTRUCTOR = 'instructor',
  STUDENT = 'student',
}

export enum FileType {
  AUDIO = 'audio',
  VIDEO = 'video',
}

// This is a TEMPORARY buffer — created during a live session,
// converted to a Submission once the instructor saves, then deleted.
@Schema({ timestamps: true })
export class Recording {
  @Prop({ type: Types.ObjectId, ref: 'Session', required: true, index: true })
  sessionId!: Types.ObjectId;

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
  assignmentId!: Types.ObjectId;

  @Prop({ required: true })
  filePath!: string;

  @Prop({ type: String, required: true, enum: FileType })
  fileType!: FileType;

  @Prop({
    type: String,
    required: true,
    enum: RecordingSource,
    default: RecordingSource.INSTRUCTOR,
  })
  source!: RecordingSource;

  @Prop({ default: 0 })
  fileDuration!: number;

  @Prop({ default: 0 })
  fileSize!: number;

  // true = still previewing, false = saved as Submission and can be deleted
  @Prop({ default: true })
  isPending!: boolean;
}

export const RecordingSchema = SchemaFactory.createForClass(Recording);
