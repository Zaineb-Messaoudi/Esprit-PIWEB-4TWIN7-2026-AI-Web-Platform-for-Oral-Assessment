import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AssignmentsService } from './assignements.service';
import { CreateAssignmentDto } from './dto/create-assignement.dto';
import { UpdateAssignmentDto } from './dto/update-assignement.dto';

type AuthRequest = ExpressRequest & {
  user: { userId: string; role: UserRole };
};

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  // POST /assignments — instructor creates an assignment
  @Post()
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  create(@Body() dto: CreateAssignmentDto, @Request() req: AuthRequest) {
    return this.assignmentsService.create(dto, req.user.userId);
  }

  // GET /assignments/class/:classId — all active assignments for a class
  @Get('class/:classId')
  @Roles(UserRole.INSTRUCTOR, UserRole.STUDENT, UserRole.ADMIN)
  findByClass(@Param('classId') classId: string) {
    return this.assignmentsService.findByClass(classId);
  }

  // GET /assignments/class/:classId/upload — UPLOAD type only (M4 student flow)
  @Get('class/:classId/upload')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN)
  findUploadAssignments(@Param('classId') classId: string) {
    return this.assignmentsService.findUploadAssignmentsByClass(classId);
  }

  // GET /assignments/class/:classId/live — LIVE type only (M2 session creation)
  @Get('class/:classId/live')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  findLiveAssignments(@Param('classId') classId: string) {
    return this.assignmentsService.findLiveAssignmentsByClass(classId);
  }

  // GET /assignments/instructor/mine — all assignments by current instructor
  @Get('instructor/mine')
  @Roles(UserRole.INSTRUCTOR)
  findMyAssignments(@Request() req: AuthRequest) {
    return this.assignmentsService.findByInstructor(req.user.userId);
  }

  // GET /assignments/:id — single assignment
  @Get(':id')
  @Roles(UserRole.INSTRUCTOR, UserRole.STUDENT, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  // PATCH /assignments/:id — update title, description, deadline, isActive
  @Patch(':id')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentDto,
    @Request() req: AuthRequest,
  ) {
    return this.assignmentsService.update(id, dto, req.user.userId);
  }

  // DELETE /assignments/:id — soft delete (sets isActive: false)
  @Delete(':id')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.assignmentsService.remove(id, req.user.userId);
  }
}
