import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ForumPost, ForumPostDocument } from './entities/forum-post.entity';
import { CreateForumPostDto, AddReplyDto } from './dto/create-forum-post.dto';
import { UpdateForumPostDto } from './dto/update-forum-post.dto';
import {
  AutoModerationService,
  ModerationResult,
} from './auto-moderation.service';

@Injectable()
export class ForumPostsService {
  constructor(
    @InjectModel(ForumPost.name)
    private forumPostModel: Model<ForumPostDocument>,
    private readonly autoModerationService: AutoModerationService,
  ) {}

  // ── CRUD ──────────────────────────────────────────────────────────────────

  async create(dto: CreateForumPostDto): Promise<ForumPostDocument> {
    const result: ModerationResult = await this.autoModerationService.moderate(
      `${dto.title} ${dto.content}`,
    );

    const post = new this.forumPostModel({
      ...dto,
      authorId: new Types.ObjectId(dto.authorId),
      isAutoFlagged: result.isFlagged,
      isFlagged: result.isFlagged,
      flagReasons: result.reasons,
      flagSeverity: result.severity,
    });

    return post.save();
  }

  /** Public feed — hides flagged, un-approved posts */
  async findAll(): Promise<ForumPostDocument[]> {
    return this.forumPostModel
      .find({ isFlagged: false })
      .populate('authorId', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<ForumPostDocument> {
    const post = await this.forumPostModel
      .findById(id)
      .populate('authorId', 'name email')
      .exec();
    if (!post) throw new NotFoundException(`Post ${id} not found`);
    return post;
  }

  async update(
    id: string,
    dto: UpdateForumPostDto,
  ): Promise<ForumPostDocument> {
    // Re-run auto-mod if content changed
    if (dto.title || dto.content) {
      const existing = await this.findOne(id);
      const newTitle = dto.title ?? existing.title;
      const newContent = dto.content ?? existing.content;
      const result: ModerationResult =
        await this.autoModerationService.moderate(`${newTitle} ${newContent}`);

      Object.assign(dto, {
        isAutoFlagged: result.isFlagged,
        isFlagged: result.isFlagged,
        flagReasons: result.reasons,
        flagSeverity: result.severity,
        isModerated: false, // editing resets approval
      });
    }

    const post = await this.forumPostModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!post) throw new NotFoundException(`Post ${id} not found`);
    return post;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const result = await this.forumPostModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Post ${id} not found`);
    return { deleted: true };
  }

  // ── Upvotes ───────────────────────────────────────────────────────────────

  async toggleUpvote(
    postId: string,
    userId: string,
  ): Promise<ForumPostDocument> {
    const post = await this.forumPostModel.findById(postId).exec();
    if (!post) throw new NotFoundException(`Post ${postId} not found`);

    const uid = new Types.ObjectId(userId);
    const alreadyUpvoted = post.upvotedBy.some((id) => id.equals(uid));

    if (alreadyUpvoted) {
      post.upvotedBy = post.upvotedBy.filter((id) => !id.equals(uid));
      post.upvotes = Math.max(0, post.upvotes - 1);
    } else {
      post.upvotedBy.push(uid);
      post.upvotes += 1;
    }

    return post.save();
  }

  // ── Replies ───────────────────────────────────────────────────────────────

  async addReply(postId: string, dto: AddReplyDto): Promise<ForumPostDocument> {
    const post = await this.forumPostModel.findById(postId).exec();
    if (!post) throw new NotFoundException(`Post ${postId} not found`);
    if (post.isFlagged && !post.isModerated)
      throw new BadRequestException('Cannot reply to a flagged post');

    const result: ModerationResult = await this.autoModerationService.moderate(
      dto.content,
    );

    post.replies.push({
      authorId: new Types.ObjectId(dto.authorId),
      content: dto.content,
      createdAt: new Date(),
      isAutoFlagged: result.isFlagged,
      flagReasons: result.reasons,
    });

    return post.save();
  }

  async deleteReply(
    postId: string,
    replyIndex: number,
  ): Promise<ForumPostDocument> {
    const post = await this.forumPostModel.findById(postId).exec();
    if (!post) throw new NotFoundException(`Post ${postId} not found`);
    if (replyIndex < 0 || replyIndex >= post.replies.length)
      throw new BadRequestException('Reply index out of range');

    post.replies.splice(replyIndex, 1);
    return post.save();
  }

  // ── Admin moderation ──────────────────────────────────────────────────────

  /** All posts sorted by: flagged first, then newest */
  async findAllForAdmin(): Promise<ForumPostDocument[]> {
    return this.forumPostModel
      .find()
      .populate('authorId', 'name email')
      .sort({ isFlagged: -1, createdAt: -1 })
      .exec();
  }

  /** Only auto-flagged posts awaiting admin review */
  async findFlagged(): Promise<ForumPostDocument[]> {
    return this.forumPostModel
      .find({ isAutoFlagged: true, isModerated: false })
      .populate('authorId', 'name email')
      .sort({ flagSeverity: -1, createdAt: -1 })
      .exec();
  }

  async flagPost(id: string): Promise<ForumPostDocument> {
    return this._setFlag(id, true);
  }

  async unflagPost(id: string): Promise<ForumPostDocument> {
    return this._setFlag(id, false);
  }

  /** Admin approves a post — clears all flags and marks as reviewed */
  async approvePost(id: string): Promise<ForumPostDocument> {
    const post = await this.forumPostModel
      .findByIdAndUpdate(
        id,
        {
          isModerated: true,
          isFlagged: false,
          isAutoFlagged: false,
          flagReasons: [],
          flagSeverity: 'none',
        },
        { new: true },
      )
      .exec();
    if (!post) throw new NotFoundException(`Post ${id} not found`);
    return post;
  }

  /** Admin flags a specific reply by index */
  async flagReply(
    postId: string,
    replyIndex: number,
  ): Promise<ForumPostDocument> {
    const post = await this.forumPostModel.findById(postId).exec();
    if (!post) throw new NotFoundException(`Post ${postId} not found`);
    if (replyIndex < 0 || replyIndex >= post.replies.length)
      throw new BadRequestException('Reply index out of range');

    post.replies[replyIndex].isAutoFlagged = true;
    post.markModified('replies');
    return post.save();
  }

  // ── Stats (admin dashboard) ───────────────────────────────────────────────

  async getStats(): Promise<{
    total: number;
    flagged: number;
    approved: number;
    pending: number;
    byReason: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    const [total, flagged, approved] = await Promise.all([
      this.forumPostModel.countDocuments(),
      this.forumPostModel.countDocuments({ isFlagged: true }),
      this.forumPostModel.countDocuments({ isModerated: true }),
    ]);

    const flaggedPosts = await this.forumPostModel
      .find({ isAutoFlagged: true })
      .select('flagReasons flagSeverity')
      .exec();

    const byReason: Record<string, number> = {};
    const bySeverity: Record<string, number> = {
      high: 0,
      medium: 0,
      low: 0,
      none: 0,
    };

    for (const p of flaggedPosts) {
      for (const reason of p.flagReasons) {
        byReason[reason] = (byReason[reason] ?? 0) + 1;
      }
      bySeverity[p.flagSeverity] = (bySeverity[p.flagSeverity] ?? 0) + 1;
    }

    return {
      total,
      flagged,
      approved,
      pending: flagged - approved,
      byReason,
      bySeverity,
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async _setFlag(
    id: string,
    flag: boolean,
  ): Promise<ForumPostDocument> {
    const post = await this.forumPostModel
      .findByIdAndUpdate(id, { isFlagged: flag }, { new: true })
      .exec();
    if (!post) throw new NotFoundException(`Post ${id} not found`);
    return post;
  }
}
