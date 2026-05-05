import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecordingController } from './recording.controller';
import { RecordingService } from './recording.service';
import { Recording, RecordingSchema } from './recording.shema';
import {
  Submission,
  SubmissionSchema,
} from '../submissions/entities/submission.entity';
import {
  Assignment,
  AssignmentSchema,
} from '../assignements/entities/assignement.entity';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recording.name, schema: RecordingSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Assignment.name, schema: AssignmentSchema },
    ]),
    SessionsModule, // Import SessionsModule to access SessionsService
  ],
  controllers: [RecordingController],
  providers: [RecordingService],
  exports: [RecordingService],
})
export class RecordingModule {}
