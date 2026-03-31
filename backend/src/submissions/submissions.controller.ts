import {
  Controller, Post, Patch, Delete, Get,
  Param, Body, UseGuards, Request,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { multerConfig } from './upload.config';

@Controller('submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post('upload')
  @Roles(UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  uploadDraft(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateSubmissionDto,
    @Request() req: any,
  ) {
    // CORRECTION : req.user._id au lieu de req.user.userId
    return this.submissionsService.uploadDraft(dto, file, req.user._id);
  }

  // PATCH /submissions/:id/submit → finaliser le brouillon
  @Patch(':id/submit')
  @Roles(UserRole.STUDENT)
  submitDraft(@Param('id') id: string, @Request() req: any) {
    // ON CHANGE req.user.userId PAR req.user._id
    return this.submissionsService.submitDraft(id, req.user._id);
  }

  @Delete(':id')
  @Roles(UserRole.STUDENT)
  deleteDraft(@Param('id') id: string, @Request() req: any) {
    // CORRECTION : req.user._id au lieu de req.user.userId
    return this.submissionsService.deleteDraft(id, req.user._id);
  }

  @Get('draft/:assignmentId')
  @Roles(UserRole.STUDENT)
  getDraft(@Param('assignmentId') assignmentId: string, @Request() req: any) {
    // CORRECTION : req.user._id au lieu de req.user.userId
    return this.submissionsService.getDraft(assignmentId, req.user._id);
  }

  @Get('my')
  @Roles(UserRole.STUDENT)
  findMine(@Request() req: any) {
    // CORRECTION : req.user._id au lieu de req.user.userId
    return this.submissionsService.findByStudent(req.user._id);
  }

  @Get('assignment/:id')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  findByAssignment(@Param('id') id: string) {
    return this.submissionsService.findByAssignment(id);
  }
}