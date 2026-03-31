import { 
  IsString, 
  IsNotEmpty, 
  IsEnum, 
  IsDateString, 
  IsMongoId, 
  IsOptional 
} from 'class-validator';

export class UpdateAssignmentDto {
  @IsOptional()
  @IsMongoId()
  classId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['audio', 'video', 'both'])
  allowedFileTypes?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}