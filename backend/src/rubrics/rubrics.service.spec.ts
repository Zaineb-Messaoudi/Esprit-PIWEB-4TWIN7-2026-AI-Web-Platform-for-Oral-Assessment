import { Test, TestingModule } from '@nestjs/testing';
import { RubricsService } from './rubrics.service';

describe('RubricsService', () => {
  let service: RubricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RubricsService],
    }).compile();

    service = module.get<RubricsService>(RubricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
