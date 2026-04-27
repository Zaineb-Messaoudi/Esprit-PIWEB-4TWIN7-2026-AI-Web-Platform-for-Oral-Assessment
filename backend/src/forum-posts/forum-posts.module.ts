import { Module } from '@nestjs/common';
import { ForumPostsService } from './forum-posts.service';
import { ForumPostsController } from './forum-posts.controller';
import { ForumPost, ForumPostSchema } from './entities/forum-post.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ForumPost.name, schema: ForumPostSchema },
    ]),
  ],
  controllers: [ForumPostsController],
  providers: [ForumPostsService],
})
export class ForumPostsModule {}
