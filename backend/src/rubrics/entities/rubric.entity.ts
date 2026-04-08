import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RubricDocument = Rubric & Document & { _id: Types.ObjectId };

@Schema({ timestamps: true })
export class Rubric {
  @Prop({ required: true })
  name!: string;

  @Prop()
  description!: string;

  @Prop({
    type: [{ name: String, maxScore: Number, description: String }],
    default: [],
  })
  criteria!: { name: string; maxScore: number; description: string }[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy!: Types.ObjectId;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const RubricSchema = SchemaFactory.createForClass(Rubric);
