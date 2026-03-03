import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { StudentLevel } from '../enums/student-level.enum';

export class CreateStudentProfileDto {

  @IsEnum(StudentLevel)
  level!: StudentLevel;

  @IsNotEmpty()
  major!: string;

  @IsNumber()
  enrollmentYear!: number;
}