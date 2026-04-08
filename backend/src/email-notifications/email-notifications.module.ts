import { Module } from '@nestjs/common';
import { EmailNotificationsService } from './email-notifications.service';
import { EmailNotificationsController } from './email-notifications.controller';
import {
  EmailNotification,
  EmailNotificationSchema,
} from './entities/email-notification.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailNotification.name, schema: EmailNotificationSchema },
    ]),
  ],
  controllers: [EmailNotificationsController],
  providers: [EmailNotificationsService],
})
export class EmailNotificationsModule {}
