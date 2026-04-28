import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EvaluationDocument = Evaluation &
  Document & { _id: Types.ObjectId };

@Schema({ _id: false })
export class EvaluationCriterionScore {
  @Prop({ required: true, trim: true })
  key!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ required: true, min: 0 })
  maxScore!: number;

  @Prop({ type: Number, default: null })
  aiScore?: number | null;

  @Prop({ type: Number, default: null })
  instructorScore?: number | null;

  @Prop({ type: Number, default: null })
  finalScore?: number | null;

  @Prop({ default: false })
  overrideApplied!: boolean;

  @Prop()
  overrideReason?: string;
}

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

  @Prop({
    type: [SchemaFactory.createForClass(EvaluationCriterionScore)],
    default: [],
  })
  criterionScores!: EvaluationCriterionScore[];

  @Prop({ type: Object, default: {} })
  scores!: Record<string, number>;

  @Prop()
  writtenFeedback!: string;

  @Prop({ default: 0 })
  maxRubricScore!: number;

  @Prop({ default: 0 })
  totalAiScore!: number;

  @Prop({ default: 0 })
  totalInstructorScore!: number;

  @Prop({ default: 0 })
  totalFinalScore!: number;

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
