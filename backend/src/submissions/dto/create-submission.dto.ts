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
  UPLOAD = 'upload', // student uploads async (M4)
  LIVE = 'live', // instructor records during session (M3)
}

export enum SubmissionFileType {
  AUDIO = 'audio',
  VIDEO = 'video',
}

export enum SubmissionStatus {
  PENDING = 'pending',
  GRADED = 'graded',
  CANCELLED = 'cancelled',
}

export class CreateSubmissionDto {
  // studentId injected from JWT for UPLOAD flow
  // sent explicitly by instructor service for LIVE flow
  @IsOptional()
  @IsMongoId()
  studentId?: string;

  @IsMongoId()
  classId!: string;

  @IsMongoId()
  assignmentId!: string;

  // Denormalized title — copied from Assignment at creation time
  @IsString()
  @IsNotEmpty()
  assignmentTitle!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(SubmissionType)
  submissionType!: SubmissionType;

  @IsEnum(SubmissionFileType)
  fileType!: SubmissionFileType;

  // UPLOAD flow: one file URL
  @IsOptional()
  @IsString()
  fileUrl?: string;

  // LIVE flow: separate tracks
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

  // LIVE flow only — set by service from JWT, not sent by client
  @IsOptional()
  @IsMongoId()
  recordedBy?: string;

  // LIVE flow only
  @IsOptional()
  @IsMongoId()
  sessionId?: string;

  // true = draft (UPLOAD flow only), false = final
  // LIVE submissions are always created as final (isDraft: false)
  // not sent by client — controlled by service logic
}
