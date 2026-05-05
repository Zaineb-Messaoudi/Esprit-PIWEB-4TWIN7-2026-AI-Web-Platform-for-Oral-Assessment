import { PartialType } from '@nestjs/mapped-types';
import { CreateRubricDto } from './create-rubric.dto';

export class UpdateRubricDto extends PartialType(CreateRubricDto) {}
