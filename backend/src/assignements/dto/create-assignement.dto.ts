import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsMongoId,
  IsOptional,
} from 'class-validator';

export enum AssignmentType {
  UPLOAD = 'upload',
  LIVE = 'live',
}

export enum AllowedFileType {
  AUDIO = 'audio',
  VIDEO = 'video',
  BOTH = 'both',
}

export class CreateAssignmentDto {
  @IsMongoId()
  @IsNotEmpty()
  classId!: string;

  // instructorId is injected from JWT in the service, not sent by client

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(AssignmentType, {
    message: 'type must be: upload or live',
  })
  type!: AssignmentType;

  @IsEnum(AllowedFileType, {
    message: 'allowedFileTypes must be: audio, video, or both',
  })
  allowedFileTypes!: AllowedFileType;

  @IsDateString()
  @IsNotEmpty()
  deadline!: string;
}
