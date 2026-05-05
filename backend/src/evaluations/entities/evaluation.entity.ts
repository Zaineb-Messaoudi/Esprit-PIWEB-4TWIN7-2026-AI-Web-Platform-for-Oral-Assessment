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

  /** Per-criterion instructor comment */
  @Prop({ default: '' })
  comments?: string;
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

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  instructorId!: Types.ObjectId;

  /** ALWAYS required — system is strictly rubric-based */
  @Prop({
    type: Types.ObjectId,
    ref: 'Rubric',
    required: true,
  })
  rubricId!: Types.ObjectId;

  /**
   * Scores per rubric criterion.
   * Must match rubric definition (validated in service layer).
   */
  @Prop({
    type: [SchemaFactory.createForClass(EvaluationCriterionScore)],
    required: true,
  })
  criterionScores!: EvaluationCriterionScore[];

  /** Legacy (optional, can be removed if unused) */
  @Prop({ type: Object, default: {} })
  scores!: Record<string, number>;

  /** Overall instructor feedback */
  @Prop({ default: '' })
  writtenFeedback!: string;

  /** Sum of max scores from rubric */
  @Prop({ default: 0 })
  maxRubricScore!: number;

  /** Aggregated scores */
  @Prop({ default: 0 })
  totalAiScore!: number;

  @Prop({ default: 0 })
  totalInstructorScore!: number;

  @Prop({ default: 0 })
  totalFinalScore!: number;

  /** Percentage (0–100) */
  @Prop({ required: true, min: 0, max: 100 })
  overallScore!: number;

  /** Legacy compatibility */
  @Prop({ type: Object })
  finalGrade?: number | string;

  /**
   * Final resolved grade (0–20 scale).
   * This is the ONLY authoritative grade stored.
   */
  @Prop({ type: Number, required: true, min: 0, max: 20 })
  grade!: number;

  /**
   * Submission lifecycle control
   */
  @Prop({
    required: true,
    default: 'graded',
    enum: ['pending', 'graded', 'cancelled'],
  })
  targetSubmissionStatus!: string;

  @Prop({ default: Date.now })
  evaluationDate!: Date;

  @Prop({
    required: true,
    enum: ['draft', 'submitted'],
    default: 'draft',
    index: true,
  })
  status!: string;

  /** Whether AI insights influenced the evaluation */
  @Prop({ default: false })
  aiInsightsUsed?: boolean;
}

export const EvaluationSchema = SchemaFactory.createForClass(Evaluation);
