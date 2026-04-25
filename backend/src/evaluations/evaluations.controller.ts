import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';

@Controller('evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  // ─── STATIC ROUTES FIRST (before /:id) ───────────────────────────────────

  // GET /evaluations — get all evaluations (admin)
  @Get()
  findAll() {
    return this.evaluationsService.findAll();
  }

  // POST /evaluations — create a new evaluation
  @Post()
  create(@Body() dto: CreateEvaluationDto) {
    return this.evaluationsService.create(dto);
  }

  // GET /evaluations/submission/:submissionId — get evaluation for a submission
  @Get('submission/:submissionId')
  findBySubmission(@Param('submissionId') submissionId: string) {
    return this.evaluationsService.findBySubmission(submissionId);
  }

  // GET /evaluations/instructor/:instructorId — get all evaluations by instructor
  @Get('instructor/:instructorId')
  findByInstructor(@Param('instructorId') instructorId: string) {
    return this.evaluationsService.findByInstructor(instructorId);
  }

  // GET /evaluations/student/:studentId — get evaluations visible to a student
  @Get('student/:studentId')
  findByStudent(@Param('studentId') studentId: string) {
    return this.evaluationsService.findByStudent(studentId);
  }

  // ─── DYNAMIC /:id ROUTES LAST ─────────────────────────────────────────────

  // GET /evaluations/:id — get one evaluation by id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.evaluationsService.findOne(id);
  }

  // PUT /evaluations/:id — general update (scores, grade, etc.)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEvaluationDto) {
    return this.evaluationsService.update(id, dto);
  }

  // PUT /evaluations/:id/feedback — instructor adds or edits written feedback
  @Put(':id/feedback')
  updateFeedback(
    @Param('id') id: string,
    @Body('writtenFeedback') writtenFeedback: string,
  ) {
    return this.evaluationsService.updateFeedback(id, writtenFeedback);
  }

  // PUT /evaluations/:id/submit — instructor submits evaluation (draft → submitted)
  @Put(':id/submit')
  submitEvaluation(@Param('id') id: string) {
    return this.evaluationsService.submitEvaluation(id);
  }

  // DELETE /evaluations/:id — delete an evaluation
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.evaluationsService.remove(id);
  }
}