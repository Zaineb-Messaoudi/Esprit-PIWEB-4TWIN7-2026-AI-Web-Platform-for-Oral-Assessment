import { Test, TestingModule } from '@nestjs/testing';
import { EmailNotificationsService } from './email-notifications.service';

describe('EmailNotificationsService', () => {
  let service: EmailNotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailNotificationsService],
    }).compile();

    service = module.get<EmailNotificationsService>(EmailNotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
