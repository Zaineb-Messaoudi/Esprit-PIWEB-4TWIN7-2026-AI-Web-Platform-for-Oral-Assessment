import {
  Controller, Post, Get, Patch, Delete, Body, Param, Request, UseGuards,
} from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common'; // ✅ Ajout
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  create(
    @Body(ValidationPipe) dto: CreateAssignmentDto, // ✅ ValidationPipe
    @Request() req: any,
  ) {
    console.log('JWT USER:', req.user);
    console.log('CREATE DTO:', dto);
    return this.assignmentsService.create(dto, req.user.userId);
  }

  @Get('class/:classId')
  findByClass(@Param('classId') classId: string) {
    return this.assignmentsService.findByClass(classId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateAssignmentDto, // ✅ ValidationPipe
    @Request() req: any,
  ) {
    return this.assignmentsService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.assignmentsService.remove(id, req.user.userId);
  }


}