import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { SubmissionStatus, SubmissionType } from './create-submission.dto';

// Used by instructor — M5
export class InstructorSubmissionQueryDto {
  @IsOptional()
  @IsMongoId()
  classId?: string;

  @IsOptional()
  @IsMongoId()
  studentId?: string;

  @IsOptional()
  @IsMongoId()
  assignmentId?: string;

  // Keep assignmentTitle for free-text search if needed
  @IsOptional()
  @IsString()
  assignmentTitle?: string;

  @IsOptional()
  @IsEnum(SubmissionType)
  submissionType?: SubmissionType;

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

// Used by student — M4 + M5
export class StudentSubmissionHistoryQueryDto {
  @IsOptional()
  @IsMongoId()
  classId?: string;

  @IsOptional()
  @IsMongoId()
  assignmentId?: string;

  @IsOptional()
  @IsEnum(SubmissionType)
  submissionType?: SubmissionType;

  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  // studentId injected from JWT — never sent by client
}

// Used by instructor to find who hasn't submitted yet — M5
export class MissingSubmissionsQueryDto {
  @IsMongoId()
  classId!: string;

  @IsMongoId()
  assignmentId!: string;

  // assignmentTitle removed — use assignmentId for precise lookup,
  // not a string that can have typos
}
