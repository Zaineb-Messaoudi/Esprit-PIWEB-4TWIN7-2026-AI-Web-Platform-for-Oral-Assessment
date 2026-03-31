import { IsString, IsNotEmpty, IsOptional, IsArray, IsMongoId } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsMongoId()
  instructorId!: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  studentIds?: string[];

  @IsString()
  @IsNotEmpty()
  academicYear!: string;

  @IsString()
  @IsNotEmpty()
  semester!: string;
}