import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ForumPostDocument = ForumPost & Document & { _id: Types.ObjectId };

@Schema({ timestamps: true })
export class ForumPost {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ index: true })
  category!: string;

  @Prop({ default: 0 })
  upvotes!: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  upvotedBy!: Types.ObjectId[];

  @Prop({
    type: [
      {
        authorId: { type: Types.ObjectId, ref: 'User' },
        content: String,
        createdAt: Date,
      },
    ],
    default: [],
  })
  replies!: { authorId: Types.ObjectId; content: string; createdAt: Date }[];

  @Prop({ default: false })
  isModerated!: boolean;

  @Prop({ default: false })
  isFlagged!: boolean;
}

export const ForumPostSchema = SchemaFactory.createForClass(ForumPost);
