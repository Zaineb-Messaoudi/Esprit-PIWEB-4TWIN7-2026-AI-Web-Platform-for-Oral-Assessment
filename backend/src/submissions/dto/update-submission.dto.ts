import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import {
  SubmissionFileType,
  SubmissionStatus,
  SubmissionType,
} from './create-submission.dto';

export class UpdateSubmissionDto {
  @IsOptional()
  @IsString()
  assignmentTitle?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(SubmissionType)
  submissionType?: SubmissionType;

  @IsOptional()
  @IsEnum(SubmissionFileType)
  fileType?: SubmissionFileType;

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

  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @IsOptional()
  @IsNumber()
  grade?: number;
}
