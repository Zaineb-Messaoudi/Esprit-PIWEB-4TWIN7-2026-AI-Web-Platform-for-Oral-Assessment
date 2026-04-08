import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AIAnalysisDocument = AIAnalysis &
  Document & { _id: Types.ObjectId };

@Schema({ timestamps: true })
export class AIAnalysis {
  @Prop({
    type: Types.ObjectId,
    ref: 'Submission',
    required: true,
    index: true,
  })
  submissionId!: Types.ObjectId;

  @Prop()
  speechRate!: number;

  @Prop()
  pauseFrequency!: number;

  @Prop({
    type: { average: Number, minimum: Number, maximum: Number },
    default: {},
  })
  pauseDuration!: { average: number; minimum: number; maximum: number };

  @Prop()
  pronunciationScore!: number;

  @Prop({ type: [{ word: String, count: Number }], default: [] })
  fillerWords!: { word: string; count: number }[];

  @Prop()
  confidenceScore!: number;

  @Prop({
    type: { pitch: Object, energy: Object, stability: Object },
    default: {},
  })
  voiceMetrics!: { pitch: any; energy: any; stability: any };

  @Prop({ type: Object })
  emotionDetection?: Record<string, any>;

  @Prop({ type: Object })
  bodyLanguage?: Record<string, any>;

  @Prop({ type: [String], default: [] })
  suggestions!: string[];

  @Prop({ default: Date.now })
  processingDate!: Date;
}

export const AIAnalysisSchema = SchemaFactory.createForClass(AIAnalysis);
