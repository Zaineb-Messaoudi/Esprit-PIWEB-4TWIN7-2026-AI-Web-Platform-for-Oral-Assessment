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
        isAutoFlagged: { type: Boolean, default: false },
        flagReasons: { type: [String], default: [] },
      },
    ],
    default: [],
  })
  replies!: {
    authorId: Types.ObjectId;
    content: string;
    createdAt: Date;
    isAutoFlagged: boolean;
    flagReasons: string[];
  }[];

  // ── Manual moderation ───────────────────────────────────────────────────
  @Prop({ default: false })
  isModerated!: boolean;

  @Prop({ default: false })
  isFlagged!: boolean;

  // ── Auto moderation ─────────────────────────────────────────────────────
  @Prop({ default: false })
  isAutoFlagged!: boolean;

  @Prop({ type: [String], default: [] })
  flagReasons!: string[];

  @Prop({
    type: String,
    enum: ['none', 'low', 'medium', 'high'],
    default: 'none',
  })
  flagSeverity!: string;
}

export const ForumPostSchema = SchemaFactory.createForClass(ForumPost);
