import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class CompleteProfileDto {
  @IsEnum([UserRole.STUDENT, UserRole.INSTRUCTOR])
  user_type!: UserRole;

  @IsString()
  @IsNotEmpty()
  first_name!: string;

  @IsString()
  @IsNotEmpty()
  last_name!: string;

  @IsString()
  @IsNotEmpty()
  phone_num!: string;

  @IsDateString()
  birth_date!: string;

  @IsString()
  @IsOptional()
  cin?: string;

  @IsString()
  @IsOptional()
  face_image?: string;
}
