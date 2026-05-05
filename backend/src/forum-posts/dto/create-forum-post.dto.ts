import { IsString, IsNotEmpty, IsMongoId, IsOptional } from 'class-validator';

export class CreateForumPostDto {
  @IsMongoId()
  authorId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsOptional()
  category?: string;
}

export class AddReplyDto {
  @IsMongoId()
  authorId!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}
