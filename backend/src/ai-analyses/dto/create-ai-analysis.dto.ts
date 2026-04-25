import {
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsNumber,
  IsArray,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PauseDurationDto {
  @IsNumber() average!: number;
  @IsNumber() minimum!: number;
  @IsNumber() maximum!: number;
}

export class FillerWordDto {
  @IsString() word!: string;
  @IsNumber() count!: number;
}

export class CreateAiAnalysisDto {
  @IsNotEmpty()
  @IsMongoId()
  submissionId!: string;

  @IsOptional()
  @IsNumber()
  speechRate?: number;

  @IsOptional()
  @IsNumber()
  pauseFrequency?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => PauseDurationDto)
  pauseDuration?: PauseDurationDto;

  @IsOptional()
  @IsNumber()
  pronunciationScore?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FillerWordDto)
  fillerWords?: FillerWordDto[];

  @IsOptional()
  @IsNumber()
  confidenceScore?: number;

  @IsOptional()
  @IsObject()
  voiceMetrics?: { pitch: any; energy: any; stability: any };

  @IsOptional()
  @IsObject()
  emotionDetection?: Record<string, any>;

  @IsOptional()
  @IsObject()
  bodyLanguage?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suggestions?: string[];
}