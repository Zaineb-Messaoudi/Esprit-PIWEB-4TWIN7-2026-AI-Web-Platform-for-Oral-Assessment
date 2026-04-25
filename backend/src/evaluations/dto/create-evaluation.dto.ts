import {
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsObject,
  IsEnum,
} from 'class-validator';

export class CreateEvaluationDto {
  @IsNotEmpty()
  @IsMongoId()
  submissionId!: string;

  @IsNotEmpty()
  @IsMongoId()
  instructorId!: string;

  @IsNotEmpty()
  @IsMongoId()
  rubricId!: string;

  @IsOptional()
  @IsObject()
  scores?: Record<string, number>;

  @IsOptional()
  @IsString()
  writtenFeedback?: string;

  @IsOptional()
  @IsNumber()
  overallScore?: number;

  @IsOptional()
  finalGrade?: number | string;

  @IsOptional()
  @IsEnum(['draft', 'submitted'])
  status?: string;

  @IsOptional()
  @IsBoolean()
  aiInsightsUsed?: boolean;
}
