import { 
  IsString, 
  IsNotEmpty, 
  IsEnum, 
  IsDateString, 
  IsMongoId 
} from 'class-validator';

export class CreateAssignmentDto {
  @IsMongoId()
  @IsNotEmpty()
  classId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  // ✅ description OBLIGATOIRE (enlève IsOptional)
  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(['audio', 'video', 'both'], {
    message: 'allowedFileTypes must be one of: audio, video, both'
  })
  allowedFileTypes!: string;

  @IsDateString()
  @IsNotEmpty()
  deadline!: string;
}