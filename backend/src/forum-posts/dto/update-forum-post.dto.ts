import { PartialType } from '@nestjs/swagger';
import { CreateForumPostDto } from './create-forum-post.dto';

export class UpdateForumPostDto{

  title?: string;
  content?: string;

}
