import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum SubmissionType {
  INSTRUCTOR_RECORDED = 'instructor_recorded',
  STUDENT_UPLOADED = 'student_uploaded',
}

export enum SubmissionFileType {
  AUDIO = 'audio',
  VIDEO = 'video',
}

export enum SubmissionStatus {
  PENDING = 'pending',
  EVALUATED = 'evaluated',
  IN_PROGRESS = 'in_progress',
}

export class CreateSubmissionDto {
  @IsMongoId()
  classId!: string;

  @IsOptional()
  @IsMongoId()
  studentId?: string;

  @IsString()
  @IsNotEmpty()
  assignmentTitle!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(SubmissionType)
  submissionType?: SubmissionType;

  @IsEnum(SubmissionFileType)
  fileType!: SubmissionFileType;

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
}
