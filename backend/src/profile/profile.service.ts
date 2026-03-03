import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StudentProfile } from './entities/profile_student.schema';
import { InstructorProfile } from './entities/profile_instructor.schema';
import { CreateStudentProfileDto } from './dto/create-student-profile.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { CreateInstructorProfileDto } from './dto/create-instructor-profile.dto';
import { UpdateInstructorProfileDto } from './dto/update-instructor-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(StudentProfile.name) private studentModel: Model<StudentProfile>,
    @InjectModel(InstructorProfile.name) private instructorModel: Model<InstructorProfile>,
  ) {}

  // STUDENT PROFILE
  createStudent(userId: string, dto: CreateStudentProfileDto) {
    return this.studentModel.create({ userId, ...dto });
  }

  getStudent(userId: string) {
    return this.studentModel.findOne({ userId });
  }

  updateStudent(userId: string, dto: UpdateStudentProfileDto) {
    return this.studentModel.findOneAndUpdate({ userId }, dto, { new: true });
  }

  getAllStudents() {
    return this.studentModel.find().populate('userId');
  }

  // INSTRUCTOR PROFILE
  createInstructor(userId: string, dto: CreateInstructorProfileDto) {
    return this.instructorModel.create({ userId, ...dto });
  }

  getInstructor(userId: string) {
    return this.instructorModel.findOne({ userId });
  }

  updateInstructor(userId: string, dto: UpdateInstructorProfileDto) {
    return this.instructorModel.findOneAndUpdate({ userId }, dto, { new: true });
  }

  getAllInstructors() {
    return this.instructorModel.find().populate('userId');
  }
}
