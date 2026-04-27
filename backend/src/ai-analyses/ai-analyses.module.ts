import { Module } from '@nestjs/common';
import { AiAnalysesService } from './ai-analyses.service';
import { AiAnalysesController } from './ai-analyses.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AIAnalysis, AIAnalysisSchema } from './entities/ai-analysis.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AIAnalysis.name, schema: AIAnalysisSchema },
    ]),
  ],
  controllers: [AiAnalysesController],
  providers: [AiAnalysesService],
})
export class AiAnalysesModule {}
