import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { Class, ClassDocument } from './entities/class.entity';
import { User, UserDocument, UserRole } from '../users/entities/user.entity';

type LeanUser = Omit<User, '_id'> & { _id: Types.ObjectId };
type LeanClass = Omit<Class, '_id' | 'instructorId' | 'studentIds'> & {
  _id: Types.ObjectId;
  instructorId: Types.ObjectId;
  studentIds: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class ClassesService {
  constructor(
    @InjectModel(Class.name) private readonly classModel: Model<ClassDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private toObjectId(id: string, field = 'id'): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${field}`);
    }
    return new Types.ObjectId(id);
  }

  private async findUserOrFail(id: string, role?: UserRole): Promise<UserDocument> {
    const user = await this.userModel.findById(this.toObjectId(id, 'user id'));
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (role && user.role !== role) {
      throw new BadRequestException(`User must have role ${role}`);
    }
    return user;
  }

  private async ensureStudents(studentIds: string[]): Promise<Types.ObjectId[]> {
    if (!studentIds.length) {
      return [];
    }

    const objectIds = studentIds.map((id) => this.toObjectId(id, 'student id'));
    const students = await this.userModel
      .find({ _id: { $in: objectIds }, role: UserRole.STUDENT })
      .select('_id')
      .lean<{ _id: Types.ObjectId }[]>();

    if (students.length !== objectIds.length) {
      throw new BadRequestException(
        'One or more student ids are invalid or do not belong to students',
      );
    }

    return objectIds;
  }

  private async getAccessibleClassOrFail(
    classId: string,
    currentUser: UserDocument,
  ): Promise<ClassDocument> {
    const classDoc = await this.classModel.findById(this.toObjectId(classId, 'class id'));

    if (!classDoc) {
      throw new NotFoundException('Class not found');
    }

    if (currentUser.role === UserRole.ADMIN) {
      return classDoc;
    }

    if (
      currentUser.role === UserRole.INSTRUCTOR &&
      classDoc.instructorId.toString() === currentUser._id.toString()
    ) {
      return classDoc;
    }

    if (
      currentUser.role === UserRole.STUDENT &&
      classDoc.studentIds.some(
        (studentId) => studentId.toString() === currentUser._id.toString(),
      )
    ) {
      return classDoc;
    }

    throw new ForbiddenException('You do not have access to this class');
  }

  private async mapClasses(classes: LeanClass[]) {
    const userIds = new Set<string>();

    for (const classItem of classes) {
      userIds.add(classItem.instructorId.toString());
      classItem.studentIds.forEach((studentId) => userIds.add(studentId.toString()));
    }

    const users = await this.userModel
      .find({ _id: { $in: [...userIds].map((id) => this.toObjectId(id, 'user id')) } })
      .select('firstName lastName email username role')
      .lean<LeanUser[]>();

    const usersMap = new Map(users.map((user) => [user._id.toString(), user]));

    return classes.map((classItem) => {
      const instructor = usersMap.get(classItem.instructorId.toString());

      return {
        id: classItem._id.toString(),
        name: classItem.name,
        description: classItem.description ?? '',
        academicYear: classItem.academicYear,
        semester: classItem.semester,
        isActive: classItem.isActive ?? true,
        instructor: instructor
          ? {
              id: instructor._id.toString(),
              username: instructor.username,
              email: instructor.email,
              firstName: instructor.firstName,
              lastName: instructor.lastName,
            }
          : null,
        students: classItem.studentIds
          .map((studentId) => usersMap.get(studentId.toString()))
          .filter((student): student is LeanUser => Boolean(student))
          .map((student) => ({
            id: student._id.toString(),
            username: student.username,
            email: student.email,
            firstName: student.firstName,
            lastName: student.lastName,
          })),
        studentCount: classItem.studentIds.length,
        createdAt: classItem.createdAt ?? null,
        updatedAt: classItem.updatedAt ?? null,
      };
    });
  }

  async create(createClassDto: CreateClassDto, currentUser: UserDocument) {
    let instructorId = currentUser._id;

    if (currentUser.role === UserRole.ADMIN) {
      if (!createClassDto.instructorId) {
        throw new BadRequestException('instructorId is required for admin-created classes');
      }
      const instructor = await this.findUserOrFail(
        createClassDto.instructorId,
        UserRole.INSTRUCTOR,
      );
      instructorId = instructor._id;
    } else if (currentUser.role !== UserRole.INSTRUCTOR) {
      throw new ForbiddenException('Only instructors or admins can create classes');
    }

    const studentIds = await this.ensureStudents(createClassDto.studentIds ?? []);

    const createdClass = await this.classModel.create({
      name: createClassDto.name,
      description: createClassDto.description ?? '',
      instructorId,
      studentIds,
      academicYear: createClassDto.academicYear,
      semester: createClassDto.semester,
      isActive: true,
    });

    const mappedClasses = await this.mapClasses([
      createdClass.toObject() as LeanClass,
    ]);

    return mappedClasses[0];
  }

  async findAll(currentUser: UserDocument) {
    const query: Record<string, unknown> = {};

    if (currentUser.role === UserRole.INSTRUCTOR) {
      query.instructorId = currentUser._id;
    } else if (currentUser.role === UserRole.STUDENT) {
      query.studentIds = currentUser._id;
      query.isActive = true;
    }

    const classes = await this.classModel
      .find(query)
      .sort({ name: 1 })
      .lean<LeanClass[]>();

    return this.mapClasses(classes);
  }

  async findOne(classId: string, currentUser: UserDocument) {
    await this.getAccessibleClassOrFail(classId, currentUser);

    const classDoc = await this.classModel
      .findById(this.toObjectId(classId, 'class id'))
      .lean<LeanClass | null>();

    if (!classDoc) {
      throw new NotFoundException('Class not found');
    }

    const mappedClasses = await this.mapClasses([classDoc]);
    return mappedClasses[0];
  }

  async update(
    classId: string,
    updateClassDto: UpdateClassDto,
    currentUser: UserDocument,
  ) {
    const classDoc = await this.getAccessibleClassOrFail(classId, currentUser);

    if (
      currentUser.role === UserRole.INSTRUCTOR &&
      classDoc.instructorId.toString() !== currentUser._id.toString()
    ) {
      throw new ForbiddenException('Only the class instructor can update this class');
    }

    if (updateClassDto.name !== undefined) classDoc.name = updateClassDto.name;
    if (updateClassDto.description !== undefined) {
      classDoc.description = updateClassDto.description;
    }
    if (updateClassDto.academicYear !== undefined) {
      classDoc.academicYear = updateClassDto.academicYear;
    }
    if (updateClassDto.semester !== undefined) {
      classDoc.semester = updateClassDto.semester;
    }

    if (updateClassDto.studentIds !== undefined) {
      classDoc.studentIds = await this.ensureStudents(updateClassDto.studentIds);
    }

    if (updateClassDto.instructorId !== undefined) {
      if (currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Only admins can reassign instructors');
      }
      const instructor = await this.findUserOrFail(
        updateClassDto.instructorId,
        UserRole.INSTRUCTOR,
      );
      classDoc.instructorId = instructor._id;
    }

    await classDoc.save();

    return this.findOne(classId, currentUser);
  }

  async remove(classId: string, currentUser: UserDocument) {
    const classDoc = await this.getAccessibleClassOrFail(classId, currentUser);

    if (
      currentUser.role === UserRole.INSTRUCTOR &&
      classDoc.instructorId.toString() !== currentUser._id.toString()
    ) {
      throw new ForbiddenException('Only the class instructor can archive this class');
    }

    classDoc.isActive = false;
    await classDoc.save();

    return { message: 'Class archived successfully' };
  }
}
