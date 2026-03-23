import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  UpdateStudentDto,
  UpdateTeacherDto,
  CreateTeacherDto,
} from './admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('/api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Students ──────────────────────────────────────────────────────────────

  @Get('students')
  getAllStudents() {
    return this.adminService.getAllStudents();
  }

  @Get('students/:id')
  getStudentDetail(@Param('id') id: string) {
    return this.adminService.getStudentDetail(id);
  }

  @Put('students/:id')
  updateStudent(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.adminService.updateStudent(id, dto);
  }

  @Delete('students/:id/deactivate')
  deactivateStudent(@Param('id') id: string) {
    return this.adminService.deactivateStudent(id);
  }

  @Put('students/:id/activate')
  activateStudent(@Param('id') id: string) {
    return this.adminService.activateStudent(id);
  }

  @Delete('students/:id/delete')
  hardDeleteStudent(@Param('id') id: string) {
    return this.adminService.hardDeleteStudent(id);
  }

  // ─── Teachers ──────────────────────────────────────────────────────────────

  @Get('teachers')
  getAllTeachers() {
    return this.adminService.getAllTeachers();
  }

  @Get('teachers/:id')
  getTeacherDetail(@Param('id') id: string) {
    return this.adminService.getTeacherDetail(id);
  }

  @Post('teachers')
  createTeacher(@Body() dto: CreateTeacherDto) {
    return this.adminService.createTeacher(dto);
  }

  @Put('teachers/:id')
  updateTeacher(@Param('id') id: string, @Body() dto: UpdateTeacherDto) {
    return this.adminService.updateTeacher(id, dto);
  }

  @Delete('teachers/:id/deactivate')
  deactivateTeacher(@Param('id') id: string) {
    return this.adminService.deactivateTeacher(id);
  }

  @Put('teachers/:id/activate')
  activateTeacher(@Param('id') id: string) {
    return this.adminService.activateTeacher(id);
  }

  @Delete('teachers/:id/delete')
  hardDeleteTeacher(@Param('id') id: string) {
    return this.adminService.hardDeleteTeacher(id);
  }
}
