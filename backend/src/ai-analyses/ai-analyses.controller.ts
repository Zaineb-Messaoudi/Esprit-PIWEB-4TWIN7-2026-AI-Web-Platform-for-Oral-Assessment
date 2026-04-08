import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AiAnalysesService } from './ai-analyses.service';
import { CreateAiAnalysisDto } from './dto/create-ai-analysis.dto';
import { UpdateAiAnalysisDto } from './dto/update-ai-analysis.dto';

@Controller('ai-analyses')
export class AiAnalysesController {
  constructor(private readonly aiAnalysesService: AiAnalysesService) {}

  @Post()
  create(@Body() createAiAnalysisDto: CreateAiAnalysisDto) {
    return this.aiAnalysesService.create(createAiAnalysisDto);
  }

  @Get()
  findAll() {
    return this.aiAnalysesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiAnalysesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAiAnalysisDto: UpdateAiAnalysisDto,
  ) {
    return this.aiAnalysesService.update(+id, updateAiAnalysisDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aiAnalysesService.remove(+id);
  }
}
