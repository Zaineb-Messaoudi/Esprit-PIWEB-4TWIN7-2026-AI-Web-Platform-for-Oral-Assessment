import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EvaluationDocument = Evaluation &
  Document & { _id: Types.ObjectId };

@Schema({ timestamps: true })
export class Evaluation {
  @Prop({
    type: Types.ObjectId,
    ref: 'Submission',
    required: true,
    index: true,
  })
  submissionId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  instructorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Rubric', required: true })
  rubricId!: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  scores!: Record<string, number>;

  @Prop()
  writtenFeedback!: string;

  @Prop()
  overallScore!: number;

  @Prop({ type: Object })
  finalGrade?: number | string;

  @Prop({ default: Date.now })
  evaluationDate!: Date;

  @Prop({
    required: true,
    enum: ['draft', 'submitted'],
    default: 'draft',
    index: true,
  })
  status!: string;

  @Prop({ default: false })
  aiInsightsUsed?: boolean;
}

export const EvaluationSchema = SchemaFactory.createForClass(Evaluation);
