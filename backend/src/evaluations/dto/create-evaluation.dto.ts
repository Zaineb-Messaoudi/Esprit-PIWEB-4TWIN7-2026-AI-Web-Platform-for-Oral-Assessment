import {
  ArrayNotEmpty,
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsObject,
  IsIn,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CriterionScoreInputDto {
  @IsString()
  @IsNotEmpty()
  criterionName!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  instructorScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  finalScore?: number;

  @IsOptional()
  @IsString()
  overrideReason?: string;
}

export class CreateEvaluationDto {
  @IsNotEmpty()
  @IsMongoId()
  submissionId!: string;

  @IsNotEmpty()
  @IsMongoId()
  rubricId!: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CriterionScoreInputDto)
  criterionScores?: CriterionScoreInputDto[];

  @IsOptional()
  @IsObject()
  scores?: Record<string, number>;

  @IsOptional()
  @IsString()
  writtenFeedback?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  overallScore?: number;

  @IsOptional()
  finalGrade?: number | string;

  @IsOptional()
  @IsString()
  @IsIn(['draft', 'submitted'])
  status?: string;

  @IsOptional()
  @IsBoolean()
  aiInsightsUsed?: boolean;
}
