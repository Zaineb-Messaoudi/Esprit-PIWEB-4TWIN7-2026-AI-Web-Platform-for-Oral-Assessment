import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class CreateClassDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  // instructorId injected from JWT in the service for instructor role,
  // or sent explicitly only by admin
  @IsOptional()
  @IsMongoId()
  instructorId?: string;

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
}
