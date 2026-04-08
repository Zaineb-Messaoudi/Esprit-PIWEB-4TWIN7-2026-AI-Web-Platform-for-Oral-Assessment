import { IsString, IsNotEmpty } from 'class-validator';

export class FaceLoginDto {
  @IsString()
  @IsNotEmpty()
  image!: string; // base64 data-URL, e.g. "data:image/jpeg;base64,..."
}

export class FaceEnrollDto {
  @IsString()
  @IsNotEmpty()
  image!: string;
}
