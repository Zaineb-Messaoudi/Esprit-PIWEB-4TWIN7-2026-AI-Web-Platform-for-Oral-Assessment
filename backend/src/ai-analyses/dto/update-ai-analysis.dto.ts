import { PartialType } from '@nestjs/mapped-types';
import { CreateAiAnalysisDto } from './create-ai-analysis.dto';

export class UpdateAiAnalysisDto extends PartialType(CreateAiAnalysisDto) {}