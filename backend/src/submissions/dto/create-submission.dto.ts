import { IsMongoId, IsEnum } from 'class-validator';

export class CreateSubmissionDto {
  @IsMongoId()
  classId!: string;

  @IsMongoId()
  assignmentId!: string;

  @IsEnum(['audio', 'video'])
  fileType!: string;
}