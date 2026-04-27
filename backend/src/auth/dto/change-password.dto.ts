import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  old_password!: string;

  @IsString()
  @MinLength(6)
  new_password!: string;

  @IsString()
  @MinLength(6)
  confirm_password!: string;
}
