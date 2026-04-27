import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClassDocument = Class & Document;

@Schema({ timestamps: true })
export class Class {
  @Prop({ required: true })
  name!: string;

  @Prop()
  description!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  instructorId!: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  studentIds!: Types.ObjectId[];

  @Prop({ required: true })
  academicYear!: string;

  @Prop({ required: true })
  semester!: string;

  @Prop({ default: true, index: true })
  isActive?: boolean;
}

export const ClassSchema = SchemaFactory.createForClass(Class);
