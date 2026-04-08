import { PartialType } from '@nestjs/swagger';
import { CreateAiAnalysisDto } from './create-ai-analysis.dto';

export class UpdateAiAnalysisDto extends PartialType(CreateAiAnalysisDto) {}
