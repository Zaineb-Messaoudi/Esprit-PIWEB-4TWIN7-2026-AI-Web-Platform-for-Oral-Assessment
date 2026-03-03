import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudentProfileDocument = StudentProfile & Document;

@Schema({ timestamps: true })
export class StudentProfile {

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ required: true, enum: ['bachelor', 'master', 'phd'] })
  level!: string;

  @Prop({ required: true })
  major!: string;

  @Prop({ required: true })
  enrollmentYear!: number;
}

export const StudentProfileSchema = SchemaFactory.createForClass(StudentProfile);