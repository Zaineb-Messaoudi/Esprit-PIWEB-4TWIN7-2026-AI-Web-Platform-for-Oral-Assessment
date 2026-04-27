import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Rubric, RubricDocument } from './entities/rubric.entity';
import { CreateRubricDto } from './dto/create-rubric.dto';
import { UpdateRubricDto } from './dto/update-rubric.dto';

@Injectable()
export class RubricsService {
  constructor(
    @InjectModel(Rubric.name)
    private rubricModel: Model<RubricDocument>,
  ) {}

  // ─── Créer un rubric ─────────────────────────────────────────────────────
  async create(dto: CreateRubricDto, instructorId: string): Promise<RubricDocument> {
    const rubric = new this.rubricModel({
      ...dto,
      createdBy: new Types.ObjectId(instructorId),
    });
    return rubric.save();
  }

  // ─── Récupérer tous les rubrics d'un instructeur ─────────────────────────
  async findAll(instructorId: string): Promise<RubricDocument[]> {
    return this.rubricModel
      .find({
        createdBy: new Types.ObjectId(instructorId),
        isActive: true,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  // ─── Récupérer un rubric par ID ───────────────────────────────────────────
  async findOne(id: string): Promise<RubricDocument> {
    const rubric = await this.rubricModel.findById(id).exec();
    if (!rubric) throw new NotFoundException('Rubric introuvable');
    return rubric;
  }

  // ─── Modifier un rubric ───────────────────────────────────────────────────
  async update(id: string, dto: UpdateRubricDto, instructorId: string): Promise<RubricDocument> {
    const rubric = await this.findOne(id);
    if (rubric.createdBy.toString() !== instructorId)
      throw new ForbiddenException('Accès refusé');
    Object.assign(rubric, dto);
    return rubric.save();
  }

  // ─── Supprimer (soft delete) un rubric ───────────────────────────────────
  async remove(id: string, instructorId: string): Promise<void> {
    const rubric = await this.findOne(id);
    if (rubric.createdBy.toString() !== instructorId)
      throw new ForbiddenException('Accès refusé');
    rubric.isActive = false;
    await rubric.save();
  }

  // ─── Ajouter un critère ───────────────────────────────────────────────────
  async addCriterion(
    id: string,
    criterion: { name: string; maxScore: number; description?: string },
    instructorId: string,
  ): Promise<RubricDocument> {
    const rubric = await this.findOne(id);
    if (rubric.createdBy.toString() !== instructorId)
      throw new ForbiddenException('Accès refusé');
    rubric.criteria.push(criterion as any);
    return rubric.save();
  }

  // ─── Supprimer un critère par index ──────────────────────────────────────
  async removeCriterion(id: string, index: number, instructorId: string): Promise<RubricDocument> {
    const rubric = await this.findOne(id);
    if (rubric.createdBy.toString() !== instructorId)
      throw new ForbiddenException('Accès refusé');
    if (index < 0 || index >= rubric.criteria.length)
      throw new NotFoundException('Critère introuvable');
    rubric.criteria.splice(index, 1);
    return rubric.save();
  }

  // ─── Dupliquer un rubric ──────────────────────────────────────────────────
  async duplicate(id: string, instructorId: string): Promise<RubricDocument> {
    const original = await this.findOne(id);
    const copy = new this.rubricModel({
      name: original.name + ' (copie)',
      description: original.description,
      criteria: original.criteria,
      createdBy: new Types.ObjectId(instructorId),
    });
    return copy.save();
  }

  // ─── Score total max d'un rubric ──────────────────────────────────────────
  async getTotalScore(id: string): Promise<number> {
    const rubric = await this.findOne(id);
    return rubric.criteria.reduce((sum, c) => sum + c.maxScore, 0);
  }
}