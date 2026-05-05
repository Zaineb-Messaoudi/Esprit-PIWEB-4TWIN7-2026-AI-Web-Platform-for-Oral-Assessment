import { Module } from '@nestjs/common';
import { AiAnalysesService } from './ai-analyses.service';
import { AiAnalysesController } from './ai-analyses.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AIAnalysis, AIAnalysisSchema } from './entities/ai-analysis.entity';
import { AiTriggerService } from './ai-trigger.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AIAnalysis.name, schema: AIAnalysisSchema },
    ]),
    HttpModule,
  ],
  controllers: [AiAnalysesController],
  providers: [AiAnalysesService, AiTriggerService],
  exports: [AiAnalysesService, AiTriggerService],
})
export class AiAnalysesModule {}
