import { Test, TestingModule } from '@nestjs/testing';
import { AssignementsController } from './assignements.controller';
import { AssignementsService } from './assignements.service';

describe('AssignementsController', () => {
  let controller: AssignementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignementsController],
      providers: [AssignementsService],
    }).compile();

    controller = module.get<AssignementsController>(AssignementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
