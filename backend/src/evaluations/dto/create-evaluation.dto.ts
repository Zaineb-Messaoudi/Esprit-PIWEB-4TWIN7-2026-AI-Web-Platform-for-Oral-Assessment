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
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CriterionScoreInputDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  instructorScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  finalScore?: number;

  @IsOptional()
  @IsString()
  overrideReason?: string;

  /** Per-criterion comment */
  @IsOptional()
  @IsString()
  comments?: string;
}

export class CreateEvaluationDto {
  @IsNotEmpty()
  @IsMongoId()
  submissionId!: string;

  @IsNotEmpty()
  @IsMongoId()
  rubricId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CriterionScoreInputDto)
  criterionScores!: CriterionScoreInputDto[];

  @IsOptional()
  @IsObject()
  scores?: Record<string, number>;

  @IsOptional()
  @IsString()
  writtenFeedback?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  overallScore?: number;

  @IsOptional()
  finalGrade?: number | string;

  // ✅ FIXED: grade is now optional (system or override)
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(20)
  grade?: number;

  @IsNotEmpty()
  @IsString()
  @IsIn(['pending', 'graded', 'cancelled'])
  targetSubmissionStatus!: string;

  @IsOptional()
  @IsString()
  @IsIn(['draft', 'submitted'])
  status?: string;

  @IsOptional()
  @IsBoolean()
  aiInsightsUsed?: boolean;
}
