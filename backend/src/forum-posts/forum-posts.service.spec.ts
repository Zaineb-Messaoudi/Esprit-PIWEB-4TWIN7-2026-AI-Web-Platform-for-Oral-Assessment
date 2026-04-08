import { Test, TestingModule } from '@nestjs/testing';
import { ForumPostsService } from './forum-posts.service';

describe('ForumPostsService', () => {
  let service: ForumPostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ForumPostsService],
    }).compile();

    service = module.get<ForumPostsService>(ForumPostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
