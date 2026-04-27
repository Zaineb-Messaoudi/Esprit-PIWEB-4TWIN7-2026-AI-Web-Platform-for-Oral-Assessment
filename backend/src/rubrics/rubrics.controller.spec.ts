import { Test, TestingModule } from '@nestjs/testing';
import { RubricsController } from './rubrics.controller';
import { RubricsService } from './rubrics.service';

describe('RubricsController', () => {
  let controller: RubricsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RubricsController],
      providers: [RubricsService],
    }).compile();

    controller = module.get<RubricsController>(RubricsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
