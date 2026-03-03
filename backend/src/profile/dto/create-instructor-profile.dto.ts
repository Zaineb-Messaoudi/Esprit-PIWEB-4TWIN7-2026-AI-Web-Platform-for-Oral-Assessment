import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateInstructorProfileDto {

  @IsNotEmpty()
  @IsString()
  department!: string;

  @IsOptional()
  @IsString()
  bio?: string;
}