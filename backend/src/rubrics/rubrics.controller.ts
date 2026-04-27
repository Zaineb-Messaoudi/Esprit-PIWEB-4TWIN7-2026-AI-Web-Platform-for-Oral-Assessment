import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, Request,
} from '@nestjs/common';
import { RubricsService } from './rubrics.service';
import { CreateRubricDto, CriterionDto } from './dto/create-rubric.dto';
import { UpdateRubricDto } from './dto/update-rubric.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('rubrics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RubricsController {
  constructor(private readonly rubricsService: RubricsService) {}

  // POST /rubrics → créer un rubric
  @Post()
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  create(@Body() dto: CreateRubricDto, @Request() req: any) {
    return this.rubricsService.create(dto, req.user._id.toString());
  }

  // GET /rubrics → tous mes rubrics
  @Get()
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  findAll(@Request() req: any) {
    return this.rubricsService.findAll(req.user._id.toString());
  }

  // GET /rubrics/:id → un rubric
  @Get(':id')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.rubricsService.findOne(id);
  }

  // GET /rubrics/:id/total-score → score total max
  @Get(':id/total-score')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  getTotalScore(@Param('id') id: string) {
    return this.rubricsService.getTotalScore(id);
  }

  // PATCH /rubrics/:id → modifier un rubric
  @Patch(':id')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateRubricDto, @Request() req: any) {
    return this.rubricsService.update(id, dto, req.user._id.toString());
  }

  // DELETE /rubrics/:id → supprimer un rubric
  @Delete(':id')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.rubricsService.remove(id, req.user._id.toString());
  }

  // POST /rubrics/:id/criteria → ajouter un critère
  @Post(':id/criteria')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  addCriterion(
    @Param('id') id: string,
    @Body() criterion: CriterionDto,
    @Request() req: any,
  ) {
    return this.rubricsService.addCriterion(id, criterion, req.user._id.toString());
  }

  // DELETE /rubrics/:id/criteria/:index → supprimer un critère
  @Delete(':id/criteria/:index')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  removeCriterion(
    @Param('id') id: string,
    @Param('index') index: string,
    @Request() req: any,
  ) {
    return this.rubricsService.removeCriterion(id, parseInt(index), req.user._id.toString());
  }

  // POST /rubrics/:id/duplicate → dupliquer un rubric
  @Post(':id/duplicate')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  duplicate(@Param('id') id: string, @Request() req: any) {
    return this.rubricsService.duplicate(id, req.user._id.toString());
  }
}