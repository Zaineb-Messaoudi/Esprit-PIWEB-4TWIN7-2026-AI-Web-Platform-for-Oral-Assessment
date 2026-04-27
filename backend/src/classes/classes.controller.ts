import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserDocument, UserRole } from '../users/entities/user.entity';

type AuthenticatedRequest = ExpressRequest & { user: UserDocument };

@Controller('classes')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  create(
    @Body() createClassDto: CreateClassDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.classesService.create(createClassDto, req.user);
  }

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.classesService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.classesService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateClassDto: UpdateClassDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.classesService.update(id, updateClassDto, req.user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.classesService.remove(id, req.user);
  }
}
