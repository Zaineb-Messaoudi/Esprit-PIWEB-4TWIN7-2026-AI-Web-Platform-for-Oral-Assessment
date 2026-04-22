import { Test, TestingModule } from '@nestjs/testing';
import { AssignementsService } from './assignements.service';

describe('AssignementsService', () => {
  let service: AssignementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssignementsService],
    }).compile();

    service = module.get<AssignementsService>(AssignementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
