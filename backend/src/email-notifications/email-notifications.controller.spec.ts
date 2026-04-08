import { Test, TestingModule } from '@nestjs/testing';
import { EmailNotificationsController } from './email-notifications.controller';
import { EmailNotificationsService } from './email-notifications.service';

describe('EmailNotificationsController', () => {
  let controller: EmailNotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailNotificationsController],
      providers: [EmailNotificationsService],
    }).compile();

    controller = module.get<EmailNotificationsController>(
      EmailNotificationsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
