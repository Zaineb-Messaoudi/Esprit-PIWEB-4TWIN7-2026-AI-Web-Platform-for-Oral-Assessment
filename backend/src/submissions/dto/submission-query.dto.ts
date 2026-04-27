import { IsDateString, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { SubmissionStatus } from './create-submission.dto';

export class InstructorSubmissionQueryDto {
  @IsOptional()
  @IsMongoId()
  classId?: string;

  @IsOptional()
  @IsMongoId()
  studentId?: string;

  @IsOptional()
  @IsString()
  assignmentTitle?: string;

  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class StudentSubmissionHistoryQueryDto {
  @IsOptional()
  @IsMongoId()
  classId?: string;

  @IsOptional()
  @IsString()
  assignmentTitle?: string;

  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class MissingSubmissionsQueryDto {
  @IsMongoId()
  classId!: string;

  @IsString()
  assignmentTitle!: string;
}
