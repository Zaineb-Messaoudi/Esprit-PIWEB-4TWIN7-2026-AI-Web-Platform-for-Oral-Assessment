import { Module } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { EvaluationsController } from './evaluations.controller';
import { Evaluation, EvaluationSchema } from './entities/evaluation.entity';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Submission,
  SubmissionSchema,
} from '../submissions/entities/submission.entity';
import { Rubric, RubricSchema } from '../rubrics/entities/rubric.entity';
import {
  AIAnalysis,
  AIAnalysisSchema,
} from '../ai-analyses/entities/ai-analysis.entity';
import { Class, ClassSchema } from '../classes/entities/class.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Evaluation.name, schema: EvaluationSchema },
      { name: Submission.name, schema: SubmissionSchema },
      { name: Rubric.name, schema: RubricSchema },
      { name: AIAnalysis.name, schema: AIAnalysisSchema },
      { name: Class.name, schema: ClassSchema },
    ]),
  ],
  controllers: [EvaluationsController],
  providers: [EvaluationsService],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}
