import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AiAnalysesService } from './ai-analyses.service';
import { CreateAiAnalysisDto } from './dto/create-ai-analysis.dto';
import { UpdateAiAnalysisDto } from './dto/update-ai-analysis.dto';
import { AiTriggerService } from './ai-trigger.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('ai-analyses')
export class AiAnalysesController {
  constructor(
    private readonly aiAnalysesService: AiAnalysesService,
    private readonly aiTriggerService: AiTriggerService,
  ) {}

  // ─── STATIC ROUTES FIRST (before /:id) ───────────────────────────────────

  // GET /ai-analyses — get all analyses (admin)
  @Get()
  findAll() {
    return this.aiAnalysesService.findAll();
  }

  // POST /ai-analyses — create a new AI analysis record
  @Post()
  create(@Body() dto: CreateAiAnalysisDto) {
    return this.aiAnalysesService.create(dto);
  }

  // GET /ai-analyses/submission/:submissionId — get analysis for a submission
  @Get('submission/:submissionId')
  findBySubmission(@Param('submissionId') submissionId: string) {
    return this.aiAnalysesService.findBySubmission(submissionId);
  }

  // GET /ai-analyses/student/:studentId/history — student performance over time
  @Get('student/:studentId/history')
  findStudentHistory(@Param('studentId') studentId: string) {
    return this.aiAnalysesService.findStudentHistory(studentId);
  }

  // GET /ai-analyses/student/:studentId/stats — student average scores
  @Get('student/:studentId/stats')
  findStudentStats(@Param('studentId') studentId: string) {
    return this.aiAnalysesService.findStudentStats(studentId);
  }

  // GET /ai-analyses/class/:classId/stats — class-wide statistics
  @Get('class/:classId/stats')
  findClassStats(@Param('classId') classId: string) {
    return this.aiAnalysesService.findClassStats(classId);
  }

  // ─── DYNAMIC /:id ROUTES LAST ─────────────────────────────────────────────

  @Post('trigger')
  triggerAnalysis(
    @Body()
    body: {
      submissionId: string;
      audioPath: string;
      videoPath?: string;
    },
  ) {
    return this.aiTriggerService.triggerAnalysis(
      body.submissionId,
      body.audioPath,
      body.videoPath,
    );
  }

  // GET /ai-analyses/:id — get one analysis by id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiAnalysesService.findOne(id);
  }

  // PUT /ai-analyses/:id — update an analysis
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAiAnalysisDto) {
    return this.aiAnalysesService.update(id, dto);
  }

  // DELETE /ai-analyses/:id — delete an analysis
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aiAnalysesService.remove(id);
  }

  @Patch(':id/feedback')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  updateFeedback(
    @Param('id') id: string,
    @Body()
    body: {
      aiFeedback?: string;
      visualFeedback?: string;
      suggestions?: string[];
    },
  ) {
    return this.aiAnalysesService.updateFeedback(id, body);
  }
}
