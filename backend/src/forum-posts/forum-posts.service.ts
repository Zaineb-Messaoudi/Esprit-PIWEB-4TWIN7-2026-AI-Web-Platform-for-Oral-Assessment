import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ForumPost, ForumPostDocument } from './entities/forum-post.entity';
import { CreateForumPostDto } from './dto/create-forum-post.dto';
import { UpdateForumPostDto } from './dto/update-forum-post.dto';

@Injectable()
export class ForumPostsService {
  constructor(
    @InjectModel(ForumPost.name)
    private forumPostModel: Model<ForumPostDocument>,
  ) {}

  async create(dto: CreateForumPostDto) {
    return this.forumPostModel.create(dto);
  }

  async findAll() {
    return this.forumPostModel.find().exec();
  }

  async findOne(id: string) {
    return this.forumPostModel.findById(id).exec();
  }

  async update(id: string, dto: UpdateForumPostDto) {
    return this.forumPostModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async delete(id: string) {
    return this.forumPostModel.findByIdAndDelete(id);
  }


  // ❤️ LIKE POST
async likePost(id: string) {
  return this.forumPostModel.findByIdAndUpdate(
    id,
    { $inc: { likes: 1 } },
    { new: true }
  );
}

// 💬 ADD COMMENT
async addComment(id: string, comment: { content: string; author: string }) {
  return this.forumPostModel.findByIdAndUpdate(
    id,
    {
      $push: {
        comments: {
          ...comment,
          createdAt: new Date(),
        },
      },
    },
    { new: true }
  );
}
}