import {Body,Controller,Delete,Get,Param,Post,Put,Request,UseGuards,} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

type AuthenticatedRequest = ExpressRequest & {
  user: {
    userId: string;
    role: UserRole;
  };
};

@Controller('evaluations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  findAll(@Request() req: AuthenticatedRequest) {
    return this.evaluationsService.findAll(req.user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  create(
    @Body() dto: CreateEvaluationDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.evaluationsService.create(dto, req.user);
  }

  @Get('submission/:submissionId')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT)
  findBySubmission(
    @Param('submissionId') submissionId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.evaluationsService.findBySubmission(submissionId, req.user);
  }

  @Get('instructor/:instructorId')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  findByInstructor(
    @Param('instructorId') instructorId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.evaluationsService.findByInstructor(instructorId, req.user);
  }

  @Get('student/:studentId')
  @Roles(UserRole.ADMIN, UserRole.STUDENT)
  findByStudent(
    @Param('studentId') studentId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.evaluationsService.findByStudent(studentId, req.user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT)
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.evaluationsService.findOne(id, req.user);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEvaluationDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.evaluationsService.update(id, dto, req.user);
  }

  @Put(':id/feedback')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  updateFeedback(
    @Param('id') id: string,
    @Body('writtenFeedback') writtenFeedback: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.evaluationsService.updateFeedback(
      id,
      writtenFeedback,
      req.user,
    );
  }

  @Put(':id/submit')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  submitEvaluation(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.evaluationsService.submitEvaluation(id, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.evaluationsService.remove(id, req.user);
  }
}
