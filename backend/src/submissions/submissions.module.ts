import { Module } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';
import { Submission, SubmissionSchema } from './entities/submission.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { Class, ClassSchema } from '../classes/entities/class.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { AssignmentsModule } from '../assignements/assignements.module';
import { AiAnalysesModule } from '../ai-analyses/ai-analyses.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Submission.name, schema: SubmissionSchema },
      { name: Class.name, schema: ClassSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AssignmentsModule,
    AiAnalysesModule,
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
})
export class SubmissionsModule {}
