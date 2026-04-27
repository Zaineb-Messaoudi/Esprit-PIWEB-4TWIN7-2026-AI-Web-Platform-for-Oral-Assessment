import { Injectable } from '@nestjs/common';
import { CreateAiAnalysisDto } from './dto/create-ai-analysis.dto';
import { UpdateAiAnalysisDto } from './dto/update-ai-analysis.dto';

@Injectable()
export class AiAnalysesService {
  create(createAiAnalysisDto: CreateAiAnalysisDto) {
    return 'This action adds a new aiAnalysis';
  }

  findAll() {
    return `This action returns all aiAnalyses`;
  }

  findOne(id: number) {
    return `This action returns a #${id} aiAnalysis`;
  }

  update(id: number, updateAiAnalysisDto: UpdateAiAnalysisDto) {
    return `This action updates a #${id} aiAnalysis`;
  }

  remove(id: number) {
    return `This action removes a #${id} aiAnalysis`;
  }
}
