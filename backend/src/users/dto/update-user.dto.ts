import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { StudentLevel } from '../entities/student-profile.entity';

// ─── Shared fields (all roles) ────────────────────────────────────────────────

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;
}

// ─── Student-specific fields ──────────────────────────────────────────────────

export class UpdateStudentProfileDto {
  @IsOptional()
  @IsEnum(StudentLevel)
  level?: StudentLevel;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  major?: string;

  @IsOptional()
  @IsNumber()
  @Min(1950)
  @Max(new Date().getFullYear())
  enrollmentYear?: number;
}

// ─── Instructor-specific fields ───────────────────────────────────────────────

export class UpdateInstructorProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  department?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}
