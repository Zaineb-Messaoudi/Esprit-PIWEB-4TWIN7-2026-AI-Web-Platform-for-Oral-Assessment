import {
  IsEmail,
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { StudentLevel } from '../users/entities/student-profile.entity';

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  cin?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  // Student profile fields
  @IsOptional()
  @IsEnum(StudentLevel)
  level?: StudentLevel;

  @IsOptional()
  @IsString()
  major?: string;

  @IsOptional()
  enrollmentYear?: number;
}

export class UpdateTeacherDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  cin?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  // Instructor profile fields
  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class CreateTeacherDto {
  @IsString()
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  phone!: string;

  @IsDateString()
  dateOfBirth!: string;

  @IsOptional()
  @IsString()
  cin?: string;

  // Instructor profile
  @IsString()
  department!: string;

  @IsOptional()
  @IsString()
  bio?: string;
}
