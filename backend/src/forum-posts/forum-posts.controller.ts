import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ForumPostsService } from './forum-posts.service';
import { CreateForumPostDto } from './dto/create-forum-post.dto';
import { UpdateForumPostDto } from './dto/update-forum-post.dto';

@Controller('posts')
export class ForumPostsController {
  constructor(private readonly service: ForumPostsService) {}

  @Post()
  create(@Body() dto: CreateForumPostDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateForumPostDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }


  @Post(':id/like')
like(@Param('id') id: string) {
  return this.service.likePost(id);
}

@Post(':id/comment')
addComment(
  @Param('id') id: string,
  @Body() body: { content: string; author: string }
) {
  return this.service.addComment(id, body);
}
}