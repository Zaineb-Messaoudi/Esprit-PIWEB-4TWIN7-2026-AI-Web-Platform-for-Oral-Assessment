import { Controller, Post, Get, Put, Body, Param } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateStudentProfileDto } from './dto/create-student-profile.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { CreateInstructorProfileDto } from './dto/create-instructor-profile.dto';
import { UpdateInstructorProfileDto } from './dto/update-instructor-profile.dto';

@Controller('profiles')
export class ProfileController {
  constructor(private service: ProfileService) {}

  // ---------- STUDENT ----------
  @Post('student/:userId')
  createStudent(@Param('userId') userId: string, @Body() dto: CreateStudentProfileDto) {
    return this.service.createStudent(userId, dto);
  }

  @Get('student/:userId')
  getStudent(@Param('userId') userId: string) {
    return this.service.getStudent(userId);
  }

  @Put('student/:userId')
  updateStudent(@Param('userId') userId: string, @Body() dto: UpdateStudentProfileDto) {
    return this.service.updateStudent(userId, dto);
  }

  @Get('students')
  getAllStudents() {
    return this.service.getAllStudents();
  }

  // ---------- INSTRUCTOR ----------
  @Post('instructor/:userId')
  createInstructor(@Param('userId') userId: string, @Body() dto: CreateInstructorProfileDto) {
    return this.service.createInstructor(userId, dto);
  }

  @Get('instructor/:userId')
  getInstructor(@Param('userId') userId: string) {
    return this.service.getInstructor(userId);
  }

  @Put('instructor/:userId')
  updateInstructor(@Param('userId') userId: string, @Body() dto: UpdateInstructorProfileDto) {
    return this.service.updateInstructor(userId, dto);
  }

  @Get('instructors')
  getAllInstructors() {
    return this.service.getAllInstructors();
  }
}
