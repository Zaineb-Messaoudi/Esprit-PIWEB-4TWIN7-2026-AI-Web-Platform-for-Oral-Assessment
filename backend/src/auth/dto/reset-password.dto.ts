import { IsEmail, IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  otp!: string;

  @IsString()
  reset_token!: string;

  @IsString()
  @MinLength(6)
  new_password!: string;

  @IsString()
  @MinLength(6)
  confirm_password!: string;
}
