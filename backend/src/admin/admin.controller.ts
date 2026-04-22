// admin.controller.ts
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
  BulkActionDto,
} from './admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

// ✅ FIX 1: No leading slash
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  // ✅ FIX 2: bulk BEFORE :id or 'bulk' gets captured as an id param
  @Post('users/bulk')
  bulkUserAction(@Body() dto: BulkActionDto) {
    return this.adminService.bulkUserAction(dto);
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Put('users/:id/activate')
  activateUser(@Param('id') id: string) {
    return this.adminService.activateUser(id);
  }

  @Put('users/:id/deactivate')
  deactivateUser(@Param('id') id: string) {
    return this.adminService.deactivateUser(id);
  }

  @Put('users/:id/ban')
  deactivateForPeriod(
    @Param('id') id: string,
    @Body() body: { hours: number },
  ) {
    return this.adminService.deactivateForPeriod(id, body.hours);
  }

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

  @Get('teachers')
  getAllTeachers() {
    return this.adminService.getAllTeachers();
  }

  @Get('teachers/:id')
  getTeacherDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Post('teachers')
  createTeacher(@Body() dto: CreateTeacherDto) {
    return this.adminService.createTeacher(dto);
  }

  @Put('teachers/:id')
  updateTeacher(@Param('id') id: string, @Body() dto: UpdateTeacherDto) {
    return this.adminService.updateTeacher(id, dto);
  }
}
