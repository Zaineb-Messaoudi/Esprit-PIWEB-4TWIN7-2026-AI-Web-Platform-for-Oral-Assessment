import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assignment, AssignmentDocument } from './entities/assignement.entity';
import { Class, ClassDocument } from '../classes/entities/class.entity';
import {
  CreateAssignmentDto,
  AssignmentType,
  AllowedFileType,
} from './dto/create-assignement.dto';
import { UpdateAssignmentDto } from './dto/update-assignement.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name)
    private readonly assignmentModel: Model<AssignmentDocument>,
    @InjectModel(Class.name)
    private readonly classModel: Model<ClassDocument>,
  ) {}

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private toObjectId(id: string, field = 'id'): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${field}`);
    }
    return new Types.ObjectId(id);
  }

  private async findClassOrFail(classId: string): Promise<ClassDocument> {
    const cls = await this.classModel.findById(
      this.toObjectId(classId, 'class id'),
    );
    if (!cls) throw new NotFoundException(`Class ${classId} not found`);
    return cls;
  }

  async findOne(id: string): Promise<AssignmentDocument> {
    const assignment = await this.assignmentModel
      .findById(this.toObjectId(id, 'assignment id'))
      .exec();
    if (!assignment) throw new NotFoundException(`Assignment ${id} not found`);
    return assignment;
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────

  async create(
    dto: CreateAssignmentDto,
    instructorId: string,
  ): Promise<AssignmentDocument> {
    const cls = await this.findClassOrFail(dto.classId);

    // Verify the instructor owns this class
    if (cls.instructorId.toString() !== instructorId) {
      throw new ForbiddenException('You do not manage this class');
    }

    // Deadline must be in the future
    const deadline = new Date(dto.deadline);
    if (deadline <= new Date()) {
      throw new BadRequestException('Deadline must be in the future');
    }

    return this.assignmentModel.create({
      classId: this.toObjectId(dto.classId, 'class id'),
      instructorId: this.toObjectId(instructorId, 'instructor id'),
      title: dto.title.trim(),
      description: dto.description?.trim(),
      type: dto.type,
      allowedFileTypes: dto.allowedFileTypes,
      deadline,
      isActive: true,
    });
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  // All active assignments for a class (used by M4 student view)
  async findByClass(classId: string): Promise<AssignmentDocument[]> {
    return this.assignmentModel
      .find({ classId: this.toObjectId(classId, 'class id'), isActive: true })
      .sort({ deadline: 1 })
      .exec();
  }

  // Only UPLOAD assignments for a class (student upload flow — M4)
  async findUploadAssignmentsByClass(
    classId: string,
  ): Promise<AssignmentDocument[]> {
    return this.assignmentModel
      .find({
        classId: this.toObjectId(classId, 'class id'),
        isActive: true,
        type: AssignmentType.UPLOAD,
      })
      .sort({ deadline: 1 })
      .exec();
  }

  // Only LIVE assignments for a class (session creation — M2)
  async findLiveAssignmentsByClass(
    classId: string,
  ): Promise<AssignmentDocument[]> {
    return this.assignmentModel
      .find({
        classId: this.toObjectId(classId, 'class id'),
        isActive: true,
        type: AssignmentType.LIVE,
      })
      .sort({ deadline: 1 })
      .exec();
  }

  // All assignments by instructor (instructor dashboard — M1)
  async findByInstructor(instructorId: string): Promise<AssignmentDocument[]> {
    return this.assignmentModel
      .find({
        instructorId: this.toObjectId(instructorId, 'instructor id'),
        isActive: true,
      })
      .sort({ deadline: 1 })
      .exec();
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateAssignmentDto,
    instructorId: string,
  ): Promise<AssignmentDocument> {
    const assignment = (await this.assignmentModel
      .findById(this.toObjectId(id, 'assignment id'))
      .exec()) as AssignmentDocument | null;

    if (!assignment) throw new NotFoundException(`Assignment ${id} not found`);

    if (assignment.instructorId.toString() !== instructorId) {
      throw new ForbiddenException('Not your assignment');
    }

    // Build a plain update object — no direct property mutation
    const updateFields: Partial<{
      title: string;
      description: string;
      allowedFileTypes: AllowedFileType;
      isActive: boolean;
      deadline: Date;
    }> = {};

    if (dto.title !== undefined) updateFields.title = dto.title.trim();
    if (dto.description !== undefined)
      updateFields.description = dto.description.trim();
    if (dto.allowedFileTypes !== undefined)
      updateFields.allowedFileTypes = dto.allowedFileTypes;
    if (dto.isActive !== undefined) updateFields.isActive = dto.isActive;

    if (dto.deadline !== undefined) {
      const deadline = new Date(dto.deadline);
      if (deadline <= new Date()) {
        throw new BadRequestException('Deadline must be in the future');
      }
      updateFields.deadline = deadline;
    }

    const updated = (await this.assignmentModel
      .findByIdAndUpdate(
        assignment._id,
        { $set: updateFields },
        { new: true, runValidators: true },
      )
      .exec()) as AssignmentDocument | null;

    if (!updated) throw new NotFoundException(`Assignment ${id} not found`);
    return updated;
  }

  // Soft delete — sets isActive: false
  async remove(id: string, instructorId: string): Promise<{ message: string }> {
    const assignment = await this.findOne(id);

    if (assignment.instructorId.toString() !== instructorId) {
      throw new ForbiddenException('Not your assignment');
    }

    assignment.isActive = false;
    await assignment.save();
    return { message: `Assignment ${id} cancelled successfully` };
  }

  // ─── DEADLINE CHECK (used by M4 SubmissionsService) ───────────────────────

  async validateDeadline(assignmentId: string): Promise<AssignmentDocument> {
    const assignment = await this.findOne(assignmentId);

    if (!assignment.isActive) {
      throw new ForbiddenException('This assignment has been cancelled');
    }
    if (new Date() > assignment.deadline) {
      throw new ForbiddenException(
        'The deadline for this assignment has passed',
      );
    }

    return assignment;
  }

  // ─── UTILITY ──────────────────────────────────────────────────────────────

  getAllowedFileTypesAsArray(allowedFileTypes: string): string[] {
    if (allowedFileTypes === 'both') return ['audio', 'video'];
    return [allowedFileTypes]; // 'audio' | 'video'
  }
}
