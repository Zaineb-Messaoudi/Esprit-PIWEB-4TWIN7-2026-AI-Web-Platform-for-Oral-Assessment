import { Test, TestingModule } from '@nestjs/testing';
import { AiAnalysesController } from './ai-analyses.controller';
import { AiAnalysesService } from './ai-analyses.service';

describe('AiAnalysesController', () => {
  let controller: AiAnalysesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiAnalysesController],
      providers: [AiAnalysesService],
    }).compile();

    controller = module.get<AiAnalysesController>(AiAnalysesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
