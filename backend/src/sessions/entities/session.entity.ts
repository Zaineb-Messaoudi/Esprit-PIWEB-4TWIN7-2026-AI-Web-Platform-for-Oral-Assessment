import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SessionDocument = Session & Document & { _id: Types.ObjectId };

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Session {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ type: Types.ObjectId, ref: 'Class', required: true, index: true })
  classId!: Types.ObjectId;

  // ✅ renamed from createdBy → instructorId for consistency with Assignment
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  instructorId!: Types.ObjectId;

  // ✅ added — links session to its LIVE assignment (M1 creates assignment first)
  @Prop({
    type: Types.ObjectId,
    ref: 'Assignment',
    required: true,
    index: true,
  })
  assignmentId!: Types.ObjectId;

  @Prop({ required: true })
  scheduledDate!: Date;

  @Prop({ required: true, min: 1, max: 120 })
  waitTimePerStudent!: number;

  @Prop({
    required: true,
    enum: SessionStatus,
    default: SessionStatus.SCHEDULED,
    index: true,
  })
  status!: SessionStatus;

  // Tracks which student is currently being recorded (index into Class.studentIds sorted A-Z)
  @Prop({ default: 0, min: 0 })
  currentStudentIndex!: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  skippedStudents!: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  recordedStudents!: Types.ObjectId[];

  // ✅ added — when status flipped to 'active' (for ETA calculations on student dashboard)
  @Prop()
  startedAt?: Date;

  // ✅ added — when status flipped to 'completed'
  @Prop()
  completedAt?: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
