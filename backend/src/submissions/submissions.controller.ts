import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import {
  InstructorSubmissionQueryDto,
  MissingSubmissionsQueryDto,
  StudentSubmissionHistoryQueryDto,
} from './dto/submission-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserDocument, UserRole } from '../users/entities/user.entity';

type AuthenticatedRequest = ExpressRequest & { user: UserDocument };

@Controller('submissions')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR)
  create(
    @Body() createSubmissionDto: CreateSubmissionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.submissionsService.create(createSubmissionDto, req.user);
  }

  @Get('instructor/overview')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  findInstructorOverview(
    @Query() query: InstructorSubmissionQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.submissionsService.findInstructorOverview(query, req.user);
  }

  @Get('instructor/missing')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  findMissingSubmissions(
    @Query() query: MissingSubmissionsQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.submissionsService.findMissingSubmissions(query, req.user);
  }

  @Get('student/history')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  findStudentHistory(
    @Query() query: StudentSubmissionHistoryQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.submissionsService.findStudentHistory(query, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.submissionsService.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.submissionsService.update(id, updateSubmissionDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.submissionsService.remove(id, req.user);
  }
}
