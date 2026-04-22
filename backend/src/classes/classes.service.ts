import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Class, ClassDocument } from './entities/class.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { UserRole } from '../users/entities/user.entity';

export interface PopulatedStudent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

@Injectable()
export class ClassesService {
  constructor(
    @InjectModel(Class.name) private classModel: Model<ClassDocument>,
  ) {}

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  /**
   * Loads a class by ID and enforces ownership for INSTRUCTOR role.
   * ADMIN and STUDENT roles always pass through.
   * Does NOT filter by isActive — callers decide whether that matters.
   */
  private async checkOwnership(
    classId: string,
    user: { userId: string; role: UserRole },
  ): Promise<ClassDocument> {
    const classDoc = await this.classModel.findById(classId).exec();

    if (!classDoc) {
      throw new NotFoundException(`Class ${classId} not found`);
    }

    if (
      user.role === UserRole.INSTRUCTOR &&
      classDoc.instructorId.toString() !== user.userId
    ) {
      throw new ForbiddenException('You do not own this class');
    }

    return classDoc;
  }

  // ─── CREATE ──────────────────────────────────────────────────────────────

  async create(dto: CreateClassDto, user: { userId: string; role: UserRole }) {
    let instructorId: Types.ObjectId;

    if (user.role === UserRole.INSTRUCTOR) {
      instructorId = new Types.ObjectId(user.userId);
    } else if (user.role === UserRole.ADMIN) {
      if (!dto.instructorId) {
        throw new ForbiddenException('Admin must provide instructorId');
      }
      instructorId = new Types.ObjectId(dto.instructorId);
    } else {
      throw new ForbiddenException('Unauthorized');
    }

    return this.classModel.create({
      name: dto.name,
      description: dto.description,
      academicYear: dto.academicYear,
      semester: dto.semester,
      studentIds: dto.studentIds
        ? dto.studentIds.map((id) => new Types.ObjectId(id))
        : [],
      instructorId,
      isActive: true,
    });
  }

  // ─── READ — INSTRUCTOR ────────────────────────────────────────────────────

  findByInstructor(instructorId: string) {
    return this.classModel
      .find({ instructorId: new Types.ObjectId(instructorId), isActive: true })
      .populate('instructorId', 'firstName lastName email')
      .populate('studentIds', 'firstName lastName email')
      .sort({ name: 1 })
      .exec();
  }

  // ─── READ — SINGLE ────────────────────────────────────────────────────────

  /**
   * Returns a single populated class.
   * Accessible by INSTRUCTOR (own classes only) and ADMIN.
   * checkOwnership already handles the 404 and 403 cases,
   * so we just re-query with populate instead of doing two DB calls on different filters.
   */
  async findOne(classId: string, user: { userId: string; role: UserRole }) {
    // Validates existence + ownership
    await this.checkOwnership(classId, user);

    // Re-fetch with full populate (checkOwnership result is unpopulated)
    const found = await this.classModel
      .findById(classId)
      .populate('instructorId', 'firstName lastName email')
      .populate('studentIds', 'firstName lastName email')
      .exec();

    if (!found) throw new NotFoundException(`Class ${classId} not found`);
    return found;
  }

  // ─── READ — STUDENTS IN CLASS ─────────────────────────────────────────────

  async findStudentsInClass(
    classId: string,
    user: { userId: string; role: UserRole },
  ): Promise<PopulatedStudent[]> {
    // checkOwnership now passes STUDENT through, so this is safe for all three roles
    await this.checkOwnership(classId, user);

    const populated = await this.classModel
      .findById(classId)
      .populate('studentIds', 'firstName lastName email')
      .exec();

    if (!populated) throw new NotFoundException(`Class ${classId} not found`);

    const students = populated.studentIds as unknown as PopulatedStudent[];

    return students.sort((a, b) => {
      const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  // ─── READ — ALL (admin) ───────────────────────────────────────────────────

  findAll() {
    return this.classModel
      .find({ isActive: true })
      .populate('instructorId', 'firstName lastName email')
      .populate('studentIds', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  // ─── READ — BY STUDENT ────────────────────────────────────────────────────

  async findByStudent(studentId: string) {
    const found = await this.classModel
      .find({ studentIds: studentId, isActive: true })
      .populate('instructorId', 'firstName lastName email')
      .populate('studentIds', 'firstName lastName email')
      .exec();

    if (!found || found.length === 0) {
      throw new NotFoundException(
        `No active classes found for student ${studentId}`,
      );
    }

    return found; // always an array — frontend takes [0] or handles multi-class
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  async update(
    classId: string,
    dto: UpdateClassDto,
    user: { userId: string; role: UserRole },
  ) {
    // Instructors may only update their own classes; admins pass freely
    await this.checkOwnership(classId, user);

    const updated = await this.classModel
      .findByIdAndUpdate(
        classId,
        {
          ...dto,
          ...(dto.instructorId && {
            instructorId: new Types.ObjectId(dto.instructorId),
          }),
        },
        { new: true },
      )
      .populate('instructorId', 'firstName lastName email')
      .populate('studentIds', 'firstName lastName email')
      .exec();

    if (!updated) throw new NotFoundException(`Class ${classId} not found`);
    return updated;
  }

  // ─── DELETE (soft) ────────────────────────────────────────────────────────

  // In classes.service.ts — replace the remove method:
  async remove(classId: string, user: { userId: string; role: UserRole }) {
    await this.checkOwnership(classId, user); // instructors can only cancel their own

    const updated = await this.classModel
      .findByIdAndUpdate(classId, { isActive: false }, { new: true })
      .exec();

    if (!updated) throw new NotFoundException(`Class ${classId} not found`);
    return { message: `Class ${classId} has been cancelled successfully` };
  }

  // ─── ENROLLMENT ───────────────────────────────────────────────────────────

  async enrollStudent(
    classId: string,
    studentId: string,
    user: { userId: string; role: UserRole },
  ) {
    await this.checkOwnership(classId, user);

    const updated = await this.classModel
      .findByIdAndUpdate(
        classId,
        { $addToSet: { studentIds: new Types.ObjectId(studentId) } },
        { new: true },
      )
      .populate('instructorId', 'firstName lastName email')
      .populate('studentIds', 'firstName lastName email')
      .exec();

    if (!updated) throw new NotFoundException(`Class ${classId} not found`);
    return updated;
  }

  async unenrollStudent(
    classId: string,
    studentId: string,
    user: { userId: string; role: UserRole },
  ) {
    await this.checkOwnership(classId, user);

    const updated = await this.classModel
      .findByIdAndUpdate(
        classId,
        { $pull: { studentIds: new Types.ObjectId(studentId) } },
        { new: true },
      )
      .populate('instructorId', 'firstName lastName email')
      .populate('studentIds', 'firstName lastName email')
      .exec();

    if (!updated) throw new NotFoundException(`Class ${classId} not found`);
    return updated;
  }
}