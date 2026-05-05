import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ForumPostsService } from './forum-posts.service';
import { CreateForumPostDto, AddReplyDto } from './dto/create-forum-post.dto';
import { UpdateForumPostDto } from './dto/update-forum-post.dto';

@Controller('forum-posts')
export class ForumPostsController {
  constructor(private readonly forumPostsService: ForumPostsService) {}

  // ── Core CRUD ─────────────────────────────────────────────────────────────

  @Post()
  create(@Body() dto: CreateForumPostDto) {
    return this.forumPostsService.create(dto);
  }

  /** Public feed — no flagged posts */
  @Get()
  findAll() {
    return this.forumPostsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.forumPostsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateForumPostDto) {
    return this.forumPostsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.forumPostsService.remove(id);
  }

  // ── Upvotes ───────────────────────────────────────────────────────────────

  @Patch(':id/upvote')
  toggleUpvote(@Param('id') id: string, @Body('userId') userId: string) {
    return this.forumPostsService.toggleUpvote(id, userId);
  }

  // ── Replies ───────────────────────────────────────────────────────────────

  @Post(':id/replies')
  addReply(@Param('id') id: string, @Body() dto: AddReplyDto) {
    return this.forumPostsService.addReply(id, dto);
  }

  @Delete(':id/replies/:index')
  deleteReply(@Param('id') id: string, @Param('index') index: string) {
    return this.forumPostsService.deleteReply(id, +index);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  /** All posts including flagged — admin only */
  @Get('admin/all')
  findAllForAdmin() {
    return this.forumPostsService.findAllForAdmin();
  }

  /** Only flagged, un-reviewed posts */
  @Get('admin/flagged')
  findFlagged() {
    return this.forumPostsService.findFlagged();
  }

  /** Moderation stats for admin dashboard */
  @Get('admin/stats')
  getStats() {
    return this.forumPostsService.getStats();
  }

  @Patch(':id/flag')
  flagPost(@Param('id') id: string) {
    return this.forumPostsService.flagPost(id);
  }

  @Patch(':id/unflag')
  unflagPost(@Param('id') id: string) {
    return this.forumPostsService.unflagPost(id);
  }

  /** Admin approves a post — clears all flags */
  @Patch(':id/approve')
  approvePost(@Param('id') id: string) {
    return this.forumPostsService.approvePost(id);
  }

  /** Admin flags a specific reply by index */
  @Patch(':id/replies/:index/flag')
  flagReply(@Param('id') id: string, @Param('index') index: string) {
    return this.forumPostsService.flagReply(id, +index);
  }
}
