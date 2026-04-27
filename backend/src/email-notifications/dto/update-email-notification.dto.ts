import { PartialType } from '@nestjs/swagger';
import { CreateEmailNotificationDto } from './create-email-notification.dto';

export class UpdateEmailNotificationDto extends PartialType(
  CreateEmailNotificationDto,
) {}
