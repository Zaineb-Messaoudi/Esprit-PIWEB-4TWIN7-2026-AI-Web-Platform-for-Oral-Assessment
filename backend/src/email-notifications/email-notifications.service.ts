import { Injectable } from '@nestjs/common';
import { CreateEmailNotificationDto } from './dto/create-email-notification.dto';
import { UpdateEmailNotificationDto } from './dto/update-email-notification.dto';

@Injectable()
export class EmailNotificationsService {
  create(createEmailNotificationDto: CreateEmailNotificationDto) {
    return 'This action adds a new emailNotification';
  }

  findAll() {
    return `This action returns all emailNotifications`;
  }

  findOne(id: number) {
    return `This action returns a #${id} emailNotification`;
  }

  update(id: number, updateEmailNotificationDto: UpdateEmailNotificationDto) {
    return `This action updates a #${id} emailNotification`;
  }

  remove(id: number) {
    return `This action removes a #${id} emailNotification`;
  }
}
