import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsMongoId()
  classId!: string;

  // assignmentId must reference a LIVE-type assignment
  @IsMongoId()
  assignmentId!: string;

  @IsDateString()
  scheduledDate!: string;

  @IsInt()
  @Min(1)
  @Max(120)
  waitTimePerStudent!: number;

  // instructorId injected from JWT in the service
}
