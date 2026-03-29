import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Class, ClassDocument } from './entities/class.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectModel(Class.name) private classModel: Model<ClassDocument>,
  ) {}

  // ─── INSTRUCTOR ───────────────────────────────────────────────────────────

  // Create a new class
  create(dto: CreateClassDto) {
    return this.classModel.create(dto);
  }

  // Get all classes belonging to a specific instructor
  findByInstructor(instructorId: string) {
    return this.classModel
      .find({ instructorId, isActive: true })
      .populate('instructorId', 'firstName lastName email')
      .populate('studentIds', 'firstName lastName email')
      .sort({ name: 1 })
      .exec();
  }

  // Get the student list of a specific class (A-Z)
  async findStudentsInClass(classId: string) {
    const found = await this.classModel
      .findById(classId)
      .populate('studentIds', 'firstName lastName email')
      .exec();

    if (!found) throw new NotFoundException(`Class ${classId} not found`);

    // Sort students A-Z by lastName then firstName
    const students = (found.studentIds as any[]).sort((a, b) => {
      const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return students;
  }

  // Update a class (modify or cancel)
  async update(classId: string, dto: UpdateClassDto) {
    const updated = await this.classModel
      .findByIdAndUpdate(classId, dto, { new: true })
      .exec();

    if (!updated) throw new NotFoundException(`Class ${classId} not found`);
    return updated;
  }

  // Delete (cancel) a class — sets isActive to false instead of hard delete
  async remove(classId: string) {
    const updated = await this.classModel
      .findByIdAndUpdate(classId, { isActive: false }, { new: true })
      .exec();

    if (!updated) throw new NotFoundException(`Class ${classId} not found`);
    return { message: `Class ${classId} has been cancelled successfully` };
  }

  // ─── ADMIN ────────────────────────────────────────────────────────────────

  // Get all classes with instructor and students populated (admin view)
  findAll() {
    return this.classModel
      .find()
      .populate('instructorId', 'firstName lastName email')
      .populate('studentIds', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  // Get detail of one class (instructor + student list)
  async findOne(classId: string) {
    const found = await this.classModel
      .findById(classId)
      .populate('instructorId', 'firstName lastName email')
      .populate('studentIds', 'firstName lastName email')
      .exec();

    if (!found) throw new NotFoundException(`Class ${classId} not found`);
    return found;
  }

  // ─── STUDENT ──────────────────────────────────────────────────────────────

  // Get the class a student belongs to + their classmates
  async findByStudent(studentId: string) {
    const found = await this.classModel
      .findOne({ studentIds: studentId, isActive: true })
      .populate('instructorId', 'firstName lastName email')
      .populate('studentIds', 'firstName lastName email')
      .exec();

    if (!found)
      throw new NotFoundException(
        `No active class found for student ${studentId}`,
      );

    return found;
  }
}