import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ForumPostDocument = ForumPost & Document;

@Schema({ timestamps: true })
export class ForumPost {

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  content!: string;

  @Prop()
  author!: string;


   @Prop({ default: 0 })
  likes!: number;

  // 💬 comments
  @Prop({
    type: [
      {
        content: String,
        author: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  comments!: {
    content: string;
    author: string;
    createdAt: Date;
  }[];

}

export const ForumPostSchema = SchemaFactory.createForClass(ForumPost);