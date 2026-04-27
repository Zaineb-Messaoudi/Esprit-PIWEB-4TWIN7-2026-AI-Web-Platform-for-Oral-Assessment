import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { EmailNotificationsService } from './email-notifications.service';
import { CreateEmailNotificationDto } from './dto/create-email-notification.dto';
import { UpdateEmailNotificationDto } from './dto/update-email-notification.dto';

@Controller('email-notifications')
export class EmailNotificationsController {
  constructor(
    private readonly emailNotificationsService: EmailNotificationsService,
  ) {}

  @Post()
  create(@Body() createEmailNotificationDto: CreateEmailNotificationDto) {
    return this.emailNotificationsService.create(createEmailNotificationDto);
  }

  @Get()
  findAll() {
    return this.emailNotificationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.emailNotificationsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmailNotificationDto: UpdateEmailNotificationDto,
  ) {
    return this.emailNotificationsService.update(
      +id,
      updateEmailNotificationDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.emailNotificationsService.remove(+id);
  }
}
