import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsMongoId,
  IsBoolean,
} from 'class-validator';

export class CreateClassDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsMongoId()
  instructorId!: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  studentIds?: string[];

  @IsNotEmpty()
  @IsString()
  academicYear!: string;

  @IsNotEmpty()
  @IsString()
  semester!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}