import {
  IsEmail,
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsArray,
  ArrayNotEmpty,
  IsMongoId,
  IsIn,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
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

  @IsOptional()
  @IsEnum(StudentLevel)
  level?: StudentLevel;

  @IsOptional()
  @IsString()
  major?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
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
  @MinLength(6)
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

  @IsString()
  department!: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class BanUserDto {
  @IsInt()
  @Min(1)
  @Max(720)
  duration!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkActionDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  userIds!: string[];

  @IsString()
  @IsIn(['activate', 'deactivate', 'delete', 'ban'])
  action!: string;

  @IsOptional()
  @IsInt()
  duration?: number;
}
