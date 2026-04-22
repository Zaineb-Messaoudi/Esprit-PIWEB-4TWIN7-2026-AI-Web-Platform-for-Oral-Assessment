import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { Session, SessionSchema } from './entities/session.entity';
import {
  EmailNotification,
  EmailNotificationSchema,
} from '../email-notifications/entities/email-notification.entity';
import { Class, ClassSchema } from '../classes/entities/class.entity';
import {
  Assignment,
  AssignmentSchema,
} from '../assignements/entities/assignement.entity';
import { SessionsGateway } from './sessions.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
      { name: Class.name, schema: ClassSchema }, // 👈
      { name: Assignment.name, schema: AssignmentSchema }, // 👈
      { name: EmailNotification.name, schema: EmailNotificationSchema }, // 👈
    ]),
  ],
  controllers: [SessionsController],
  providers: [SessionsService, SessionsGateway],
  exports: [SessionsService, SessionsGateway],
})
export class SessionsModule {}
