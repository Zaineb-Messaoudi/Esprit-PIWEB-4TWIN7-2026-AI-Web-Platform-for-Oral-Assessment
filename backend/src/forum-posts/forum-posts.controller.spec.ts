import { Test, TestingModule } from '@nestjs/testing';
import { ForumPostsController } from './forum-posts.controller';
import { ForumPostsService } from './forum-posts.service';

describe('ForumPostsController', () => {
  let controller: ForumPostsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ForumPostsController],
      providers: [ForumPostsService],
    }).compile();

    controller = module.get<ForumPostsController>(ForumPostsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
