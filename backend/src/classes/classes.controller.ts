import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  // ─── STATIC / SPECIFIC ROUTES FIRST ──────────────────────────────────────
  // These must come before /:id routes to avoid NestJS matching
  // "instructor", "student" as an :id param

  // GET /classes — get all classes with instructor and students (admin)
  @Get()
  findAll() {
    return this.classesService.findAll();
  }

  // POST /classes — create a new class
  @Post()
  create(@Body() dto: CreateClassDto) {
    return this.classesService.create(dto);
  }

  // GET /classes/instructor/:instructorId — get all classes of an instructor
  @Get('instructor/:instructorId')
  findByInstructor(@Param('instructorId') instructorId: string) {
    return this.classesService.findByInstructor(instructorId);
  }

  // GET /classes/student/:studentId — get my class and classmates
  @Get('student/:studentId')
  findByStudent(@Param('studentId') studentId: string) {
    return this.classesService.findByStudent(studentId);
  }

  // ─── DYNAMIC /:id ROUTES LAST ─────────────────────────────────────────────
  // These come after all static routes to avoid swallowing them

  // GET /classes/:id — get detail of one class (admin)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  // GET /classes/:id/students — get students of a class (A-Z)
  @Get(':id/students')
  findStudentsInClass(@Param('id') id: string) {
    return this.classesService.findStudentsInClass(id);
  }

  // PUT /classes/:id — update a class
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.classesService.update(id, dto);
  }

  // DELETE /classes/:id — cancel a class (soft delete)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }
}