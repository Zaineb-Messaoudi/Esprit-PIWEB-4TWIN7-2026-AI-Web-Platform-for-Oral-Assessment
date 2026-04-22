import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export { SessionStatus } from '../entities/session.entity';

export class UpdateSessionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  waitTimePerStudent?: number;

  // assignmentId and classId excluded — cannot be changed after creation
}
