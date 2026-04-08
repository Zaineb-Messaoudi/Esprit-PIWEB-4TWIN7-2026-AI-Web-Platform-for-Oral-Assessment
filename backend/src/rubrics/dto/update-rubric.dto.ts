import { PartialType } from '@nestjs/swagger';
import { CreateRubricDto } from './create-rubric.dto';

export class UpdateRubricDto extends PartialType(CreateRubricDto) {}
