import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InstructorProfileDocument = InstructorProfile & Document;

@Schema({ timestamps: true })
export class InstructorProfile {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  department!: string;

  @Prop()
  bio?: string;
}

export const InstructorProfileSchema =
  SchemaFactory.createForClass(InstructorProfile);
