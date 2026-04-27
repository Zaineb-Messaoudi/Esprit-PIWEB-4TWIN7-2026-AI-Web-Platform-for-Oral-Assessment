import { Test, TestingModule } from '@nestjs/testing';
import { AiAnalysesService } from './ai-analyses.service';

describe('AiAnalysesService', () => {
  let service: AiAnalysesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiAnalysesService],
    }).compile();

    service = module.get<AiAnalysesService>(AiAnalysesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
