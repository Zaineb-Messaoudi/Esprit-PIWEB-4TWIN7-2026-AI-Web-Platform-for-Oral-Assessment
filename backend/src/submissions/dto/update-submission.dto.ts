import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { SubmissionFileType, SubmissionStatus } from './create-submission.dto';

export class UpdateSubmissionDto {
  // Student updating their draft (M4)
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(SubmissionFileType)
  fileType?: SubmissionFileType;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  audioFileUrl?: string;

  @IsOptional()
  @IsString()
  videoFileUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fileDuration?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fileSize?: number;

  // Student submitting their draft → sets isDraft: false + submittedAt
  // Sent as true only — service ignores if false
  @IsOptional()
  @IsBoolean()
  submit?: boolean;

  // Instructor grading (M5) — status + grade + feedback
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  grade?: number;

  @IsOptional()
  @IsString()
  gradeFeedback?: string;

  // assignmentId, classId, studentId, submissionType, sessionId, recordedBy
  // are all immutable after creation — intentionally excluded
}
