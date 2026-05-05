import {
  Controller,
  Get,
  Post,
  Put,
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
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

type AuthRequest = ExpressRequest & {
  user: { userId: string; role: UserRole };
};

@Controller('/classes/')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  // ─── COLLECTION ───────────────────────────────────────────────────────────

  // GET /classes — admin sees all active classes
  @Get()
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  findAll() {
    return this.classesService.findAll();
  }

  // POST /classes — admin or instructor creates a class
  @Post()
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  create(@Body() dto: CreateClassDto, @Request() req: AuthRequest) {
    return this.classesService.create(dto, req.user);
  }

  // ─── NAMED STATIC ROUTES (must come before /:id) ──────────────────────────

  // GET /classes/instructor/mine — instructor sees their own classes
  @Get('instructor/mine')
  @Roles(UserRole.INSTRUCTOR)
  findMyClasses(@Request() req: AuthRequest) {
    console.log('JWT userId:', req.user.userId); // ← add this
    return this.classesService.findByInstructor(req.user.userId);
  }

  // GET /classes/instructor/:instructorId — admin looks up any instructor's classes
  @Get('instructor/:instructorId')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  findByInstructor(@Param('instructorId') instructorId: string) {
    return this.classesService.findByInstructor(instructorId);
  }

  // GET /classes/student/mine — student sees their own classes (array)
  @Get('student/mine')
  @Roles(UserRole.STUDENT)
  findMyClass(@Request() req: AuthRequest) {
    return this.classesService.findByStudent(req.user.userId);
  }

  // GET /classes/student/:studentId — instructor/admin looks up a student's classes
  @Get('student/:studentId')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.STUDENT)
  findByStudent(@Param('studentId') studentId: string) {
    return this.classesService.findByStudent(studentId);
  }

  // ─── DYNAMIC /:id ROUTES ──────────────────────────────────────────────────

  // GET /classes/:id/students — sorted A-Z student list
  // All three roles allowed; checkOwnership in service handles student passthrough
  @Get(':id/students')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.STUDENT)
  findStudentsInClass(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.classesService.findStudentsInClass(id, req.user);
  }

  // POST /classes/:id/enroll/:studentId
  @Post(':id/enroll/:studentId')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  enrollStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Request() req: AuthRequest,
  ) {
    return this.classesService.enrollStudent(id, studentId, req.user);
  }

  // DELETE /classes/:id/enroll/:studentId
  @Delete(':id/enroll/:studentId')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  unenrollStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Request() req: AuthRequest,
  ) {
    return this.classesService.unenrollStudent(id, studentId, req.user);
  }

  // GET /classes/:id — single class detail
  @Get(':id')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  findOne(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.classesService.findOne(id, req.user);
  }

  // PUT /classes/:id — INSTRUCTOR added so they can edit their own classes
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
    @Request() req: AuthRequest, // ← required for ownership check
  ) {
    return this.classesService.update(id, dto, req.user);
  }

  // DELETE /classes/:id — soft delete, admin only
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.INSTRUCTOR) // instructors can cancel their own
  remove(@Param('id') id: string, @Request() req: AuthRequest) {
    // Only admins can cancel any class; instructors can only cancel their own.
    // checkOwnership inside remove handles this via the user param.
    return this.classesService.remove(id, req.user);
  }
}
