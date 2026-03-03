import { PartialType } from '@nestjs/mapped-types';
import { CreateInstructorProfileDto } from './create-instructor-profile.dto';

export class UpdateInstructorProfileDto extends PartialType(CreateInstructorProfileDto) {}
