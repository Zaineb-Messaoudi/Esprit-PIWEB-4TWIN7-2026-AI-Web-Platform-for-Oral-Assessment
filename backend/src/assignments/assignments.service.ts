import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assignment, AssignmentDocument } from './entities/assignment.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name)
    private assignmentModel: Model<AssignmentDocument>,
  ) {}

  async create(dto: CreateAssignmentDto, instructorId: string): Promise<Assignment> {
    const assignment = new this.assignmentModel({
      ...dto,
      classId: new Types.ObjectId(dto.classId),
      instructorId: new Types.ObjectId(instructorId),
      deadline: new Date(dto.deadline),
    });
    return assignment.save();
  }

  async findByClass(classId: string): Promise<Assignment[]> {
    return this.assignmentModel
      .find({ classId: new Types.ObjectId(classId), isActive: true })
      .sort({ deadline: 1 })
      .exec();
  }

  async findOne(id: string): Promise<AssignmentDocument> {
    const assignment = await this.assignmentModel.findById(id).exec();
    if (!assignment) throw new NotFoundException(`Assignment ${id} not found`);
    return assignment;
  }

  async update(id: string, dto: UpdateAssignmentDto, instructorId: string): Promise<Assignment> {
    const assignment = await this.findOne(id);
    if (assignment.instructorId.toString() !== instructorId)
      throw new ForbiddenException('Not your assignment');
    
    // ✅ Safe navigation pour propriétés optionnelles
    if (dto.title) assignment.title = dto.title;
    if (dto.description) assignment.description = dto.description;
    if (dto.allowedFileTypes) assignment.allowedFileTypes = dto.allowedFileTypes;
    if (dto.deadline) assignment.deadline = new Date(dto.deadline);
    
    return assignment.save();
  }

  async remove(id: string, instructorId: string): Promise<void> {
    const assignment = await this.findOne(id);
    if (assignment.instructorId.toString() !== instructorId)
      throw new ForbiddenException('Not your assignment');
    assignment.isActive = false;
    await assignment.save();
  }

  // ✅ Méthode utilitaire pour transformer "both"
  getAllowedFileTypesAsArray(allowedFileTypes: string): string[] {
    if (allowedFileTypes === 'both') return ['audio', 'video'];
    if (allowedFileTypes === 'audio') return ['audio'];
    if (allowedFileTypes === 'video') return ['video'];
    return [allowedFileTypes];
  }
}