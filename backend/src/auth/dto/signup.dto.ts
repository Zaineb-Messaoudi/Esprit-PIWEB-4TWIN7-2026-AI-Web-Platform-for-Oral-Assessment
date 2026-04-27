import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class SignupDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.toLowerCase())
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsNotEmpty()
  first_name!: string;

  @IsString()
  @IsNotEmpty()
  last_name!: string;

  @IsEnum(['student', 'instructor', 'admin'])
  user_type!: string;

  @IsOptional()
  @IsString()
  cin?: string;

  @IsString()
  @IsNotEmpty()
  phone_num!: string;

  @IsDateString()
  birth_date!: string;

  @IsString()
  @MinLength(6)
  confirm_password!: string;

  @IsOptional()
  @IsString()
  face_image?: string;
}
