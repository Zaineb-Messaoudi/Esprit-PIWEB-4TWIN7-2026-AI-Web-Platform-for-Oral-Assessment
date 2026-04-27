import {
  ArrayUnique,
  IsArray,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateClassDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsMongoId()
  instructorId?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsMongoId({ each: true })
  studentIds?: string[];

  @IsOptional()
  @IsString()
  academicYear?: string;

  @IsOptional()
  @IsString()
  semester?: string;
}
