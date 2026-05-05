import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RubricDocument = Rubric & Document & { _id: Types.ObjectId };

@Schema({ _id: false })
export class RubricCriterion {
  /**
   * Stable identifier used for matching across evaluations
   * Must never change once created
   */
  @Prop({ required: true })
  key!: string;

  /** Human-readable label shown in UI */
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  maxScore!: number;

  @Prop()
  description?: string;
}

const RubricCriterionSchema = SchemaFactory.createForClass(RubricCriterion);

@Schema({ timestamps: true })
export class Rubric {
  @Prop({ required: true })
  name!: string;

  @Prop()
  description!: string;

  /**
   * Strict rubric definition.
   * Each criterion has a stable key used for evaluation mapping.
   */
  @Prop({
    type: [RubricCriterionSchema],
    default: [],
    required: true,
  })
  criteria!: RubricCriterion[];

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  createdBy!: Types.ObjectId;

  @Prop({ default: true, index: true })
  isActive!: boolean;

  /**
   * Optional mapping of assignments this rubric applies to.
   * Empty = universal rubric
   */
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Assignment' }],
    default: [],
  })
  assignmentIds!: Types.ObjectId[];
}

export const RubricSchema = SchemaFactory.createForClass(Rubric);
