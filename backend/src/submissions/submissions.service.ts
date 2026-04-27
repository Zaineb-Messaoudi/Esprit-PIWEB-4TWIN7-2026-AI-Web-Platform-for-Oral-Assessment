import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CreateSubmissionDto,
  SubmissionStatus,
  SubmissionType,
} from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import {
  InstructorSubmissionQueryDto,
  MissingSubmissionsQueryDto,
  StudentSubmissionHistoryQueryDto,
} from './dto/submission-query.dto';
import { Submission, SubmissionDocument } from './entities/submission.entity';
import { Class, ClassDocument } from '../classes/entities/class.entity';
import { User, UserDocument, UserRole } from '../users/entities/user.entity';

type LeanUser = Omit<User, '_id'> & { _id: Types.ObjectId };
type LeanClass = Omit<Class, '_id' | 'instructorId' | 'studentIds'> & {
  _id: Types.ObjectId;
  instructorId: Types.ObjectId;
  studentIds: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
};
type LeanSubmission = Omit<
  Submission,
  '_id' | 'studentId' | 'classId' | 'recordedBy'
> & {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  classId: Types.ObjectId;
  recordedBy?: Types.ObjectId | null;
  createdAt?: Date;
  updatedAt?: Date;
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
    @InjectModel(Class.name)
    private readonly classModel: Model<ClassDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private toObjectId(id: string, field = 'id'): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${field}`);
    }
    return new Types.ObjectId(id);
  }

  private buildDateRange(dateFrom?: string, dateTo?: string) {
    if (!dateFrom && !dateTo) {
      return undefined;
    }

    const range: { $gte?: Date; $lte?: Date } = {};

    if (dateFrom) {
      range.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      const inclusiveDate = new Date(dateTo);
      inclusiveDate.setHours(23, 59, 59, 999);
      range.$lte = inclusiveDate;
    }

    return range;
  }

  private async findClassOrFail(classId: string): Promise<ClassDocument> {
    const classDoc = await this.classModel.findById(
      this.toObjectId(classId, 'class id'),
    );
    if (!classDoc) {
      throw new NotFoundException('Class not found');
    }
    return classDoc;
  }

  private async findSubmissionOrFail(submissionId: string) {
    const submission = await this.submissionModel.findById(
      this.toObjectId(submissionId, 'submission id'),
    );
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    return submission;
  }

  private async getInstructorClassIds(currentUser: UserDocument) {
    const classes = await this.classModel
      .find({ instructorId: currentUser._id })
      .select('_id')
      .lean<{ _id: Types.ObjectId }[]>();

    return classes.map((classItem) => classItem._id);
  }

  private async ensureInstructorOwnsClass(
    classId: string,
    currentUser: UserDocument,
  ) {
    const classDoc = await this.findClassOrFail(classId);

    if (classDoc.instructorId.toString() !== currentUser._id.toString()) {
      throw new ForbiddenException('You do not have access to this class');
    }

    return classDoc;
  }

  private async ensureStudentBelongsToClass(classDoc: ClassDocument, studentId: string) {
    const objectId = this.toObjectId(studentId, 'student id');
    const inClass = classDoc.studentIds.some(
      (existingStudentId) => existingStudentId.toString() === objectId.toString(),
    );

    if (!inClass) {
      throw new BadRequestException('Student is not enrolled in the selected class');
    }

    const student = await this.userModel.findById(objectId);
    if (!student || student.role !== UserRole.STUDENT) {
      throw new BadRequestException('Student not found');
    }

    return student;
  }

  private async mapSubmissions(submissions: LeanSubmission[]) {
    const classIds = new Set<string>();
    const userIds = new Set<string>();

    for (const submission of submissions) {
      classIds.add(submission.classId.toString());
      userIds.add(submission.studentId.toString());
      if (submission.recordedBy) {
        userIds.add(submission.recordedBy.toString());
      }
    }

    const [classes, users] = await Promise.all([
      this.classModel
        .find({
          _id: { $in: [...classIds].map((id) => this.toObjectId(id, 'class id')) },
        })
        .lean<LeanClass[]>(),
      this.userModel
        .find({
          _id: { $in: [...userIds].map((id) => this.toObjectId(id, 'user id')) },
        })
        .select('username firstName lastName email role')
        .lean<LeanUser[]>(),
    ]);

    const classesMap = new Map(classes.map((classItem) => [classItem._id.toString(), classItem]));
    const usersMap = new Map(users.map((user) => [user._id.toString(), user]));

    return submissions.map((submission) => {
      const classItem = classesMap.get(submission.classId.toString());
      const student = usersMap.get(submission.studentId.toString());
      const recordedBy = submission.recordedBy
        ? usersMap.get(submission.recordedBy.toString())
        : null;

      return {
        id: submission._id.toString(),
        assignmentTitle: submission.assignmentTitle,
        title: submission.title,
        description: submission.description ?? '',
        submissionType: submission.submissionType,
        fileType: submission.fileType,
        audioFileUrl: submission.audioFileUrl ?? null,
        videoFileUrl: submission.videoFileUrl ?? null,
        fileDuration: submission.fileDuration ?? 0,
        fileSize: submission.fileSize ?? 0,
        status: submission.status,
        grade: submission.grade ?? null,
        submissionDate: submission.submissionDate,
        createdAt: submission.createdAt ?? null,
        updatedAt: submission.updatedAt ?? null,
        class: classItem
          ? {
              id: classItem._id.toString(),
              name: classItem.name,
              academicYear: classItem.academicYear,
              semester: classItem.semester,
            }
          : null,
        student: student
          ? {
              id: student._id.toString(),
              username: student.username,
              email: student.email,
              firstName: student.firstName,
              lastName: student.lastName,
            }
          : null,
        recordedBy: recordedBy
          ? {
              id: recordedBy._id.toString(),
              username: recordedBy.username,
              firstName: recordedBy.firstName,
              lastName: recordedBy.lastName,
            }
          : null,
      };
    });
  }

  private buildSummary(submissions: Array<{ status: string }>) {
    return submissions.reduce(
      (summary, submission) => {
        summary.total += 1;

        if (submission.status === SubmissionStatus.PENDING) {
          summary.pending += 1;
        } else if (submission.status === SubmissionStatus.EVALUATED) {
          summary.evaluated += 1;
        } else if (submission.status === SubmissionStatus.IN_PROGRESS) {
          summary.inProgress += 1;
        }

        return summary;
      },
      { total: 0, pending: 0, evaluated: 0, inProgress: 0 },
    );
  }

  async create(createSubmissionDto: CreateSubmissionDto, currentUser: UserDocument) {
    const classDoc = await this.findClassOrFail(createSubmissionDto.classId);

    let studentId = currentUser._id;
    let submissionType = createSubmissionDto.submissionType;
    let recordedBy: Types.ObjectId | undefined;

    if (currentUser.role === UserRole.STUDENT) {
      const enrolled = classDoc.studentIds.some(
        (existingStudentId) =>
          existingStudentId.toString() === currentUser._id.toString(),
      );

      if (!enrolled) {
        throw new ForbiddenException('You are not enrolled in this class');
      }

      submissionType = SubmissionType.STUDENT_UPLOADED;
    } else if (currentUser.role === UserRole.INSTRUCTOR) {
      if (classDoc.instructorId.toString() !== currentUser._id.toString()) {
        throw new ForbiddenException('You do not manage this class');
      }

      if (!createSubmissionDto.studentId) {
        throw new BadRequestException(
          'studentId is required when an instructor creates a submission',
        );
      }

      const student = await this.ensureStudentBelongsToClass(
        classDoc,
        createSubmissionDto.studentId,
      );
      studentId = student._id;
      submissionType =
        createSubmissionDto.submissionType ?? SubmissionType.INSTRUCTOR_RECORDED;
      recordedBy = currentUser._id;
    } else {
      throw new ForbiddenException('Unsupported role for creating submissions');
    }

    if (
      createSubmissionDto.fileType === 'audio' &&
      !createSubmissionDto.audioFileUrl
    ) {
      throw new BadRequestException('audioFileUrl is required for audio submissions');
    }

    if (
      createSubmissionDto.fileType === 'video' &&
      !createSubmissionDto.videoFileUrl
    ) {
      throw new BadRequestException('videoFileUrl is required for video submissions');
    }

    const submission = await this.submissionModel.create({
      studentId,
      classId: classDoc._id,
      assignmentTitle: createSubmissionDto.assignmentTitle.trim(),
      title:
        createSubmissionDto.title?.trim() ||
        createSubmissionDto.assignmentTitle.trim(),
      description: createSubmissionDto.description ?? '',
      submissionType,
      fileType: createSubmissionDto.fileType,
      audioFileUrl: createSubmissionDto.audioFileUrl,
      videoFileUrl: createSubmissionDto.videoFileUrl,
      fileDuration: createSubmissionDto.fileDuration ?? 0,
      fileSize: createSubmissionDto.fileSize ?? 0,
      recordedBy,
      status:
        currentUser.role === UserRole.INSTRUCTOR
          ? createSubmissionDto.status ?? SubmissionStatus.IN_PROGRESS
          : SubmissionStatus.PENDING,
      submissionDate: new Date(),
    });

    const [mappedSubmission] = await this.mapSubmissions([
      submission.toObject() as LeanSubmission,
    ]);

    return mappedSubmission;
  }

  async findInstructorOverview(
    query: InstructorSubmissionQueryDto,
    currentUser: UserDocument,
  ) {
    const accessibleClassIds = query.classId
      ? [(await this.ensureInstructorOwnsClass(query.classId, currentUser))._id]
      : await this.getInstructorClassIds(currentUser);

    const filters: Record<string, unknown> = {
      classId: { $in: accessibleClassIds },
    };

    if (query.studentId) {
      filters.studentId = this.toObjectId(query.studentId, 'student id');
    }

    if (query.assignmentTitle?.trim()) {
      filters.assignmentTitle = {
        $regex: escapeRegex(query.assignmentTitle.trim()),
        $options: 'i',
      };
    }

    if (query.status) {
      filters.status = query.status;
    }

    const submissionDateRange = this.buildDateRange(query.dateFrom, query.dateTo);
    if (submissionDateRange) {
      filters.submissionDate = submissionDateRange;
    }

    const submissions = await this.submissionModel
      .find(filters)
      .sort({ submissionDate: -1 })
      .lean<LeanSubmission[]>();

    const mappedSubmissions = await this.mapSubmissions(submissions);

    return {
      filters: query,
      summary: this.buildSummary(mappedSubmissions),
      submissions: mappedSubmissions,
    };
  }

  async findStudentHistory(
    query: StudentSubmissionHistoryQueryDto,
    currentUser: UserDocument,
  ) {
    const filters: Record<string, unknown> = {
      studentId: currentUser._id,
    };

    if (query.classId) {
      const classDoc = await this.findClassOrFail(query.classId);
      const enrolled = classDoc.studentIds.some(
        (studentId) => studentId.toString() === currentUser._id.toString(),
      );

      if (!enrolled) {
        throw new ForbiddenException('You are not enrolled in this class');
      }

      filters.classId = classDoc._id;
    }

    if (query.assignmentTitle?.trim()) {
      filters.assignmentTitle = {
        $regex: escapeRegex(query.assignmentTitle.trim()),
        $options: 'i',
      };
    }

    if (query.status) {
      filters.status = query.status;
    }

    const submissionDateRange = this.buildDateRange(query.dateFrom, query.dateTo);
    if (submissionDateRange) {
      filters.submissionDate = submissionDateRange;
    }

    const submissions = await this.submissionModel
      .find(filters)
      .sort({ submissionDate: -1 })
      .lean<LeanSubmission[]>();

    const mappedSubmissions = await this.mapSubmissions(submissions);

    return {
      filters: query,
      summary: this.buildSummary(mappedSubmissions),
      submissions: mappedSubmissions,
    };
  }

  async findMissingSubmissions(
    query: MissingSubmissionsQueryDto,
    currentUser: UserDocument,
  ) {
    const classDoc = await this.ensureInstructorOwnsClass(query.classId, currentUser);
    const normalizedAssignmentTitle = query.assignmentTitle.trim();

    if (!normalizedAssignmentTitle) {
      throw new BadRequestException('assignmentTitle is required');
    }

    const [classLean, classStudents, submissions] = await Promise.all([
      this.classModel
        .findById(classDoc._id)
        .lean<LeanClass | null>(),
      this.userModel
        .find({
          _id: { $in: classDoc.studentIds },
          role: UserRole.STUDENT,
        })
        .select('username firstName lastName email')
        .lean<LeanUser[]>(),
      this.submissionModel
        .find({
          classId: classDoc._id,
          assignmentTitle: {
            $regex: new RegExp(`^${escapeRegex(normalizedAssignmentTitle)}$`, 'i'),
          },
        })
        .select('studentId')
        .lean<{ studentId: Types.ObjectId }[]>(),
    ]);

    if (!classLean) {
      throw new NotFoundException('Class not found');
    }

    const submittedStudentIds = new Set(
      submissions.map((submission) => submission.studentId.toString()),
    );

    const missingStudents = classStudents
      .filter((student) => !submittedStudentIds.has(student._id.toString()))
      .map((student) => ({
        id: student._id.toString(),
        username: student.username,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
      }));

    return {
      assignmentTitle: normalizedAssignmentTitle,
      class: {
        id: classLean._id.toString(),
        name: classLean.name,
        academicYear: classLean.academicYear,
        semester: classLean.semester,
      },
      counts: {
        totalStudents: classStudents.length,
        submitted: submittedStudentIds.size,
        missing: missingStudents.length,
      },
      missingStudents,
    };
  }

  async findOne(submissionId: string, currentUser: UserDocument) {
    const submission = await this.findSubmissionOrFail(submissionId);
    const classDoc = await this.findClassOrFail(submission.classId.toString());

    const isInstructorOwner =
      currentUser.role === UserRole.INSTRUCTOR &&
      classDoc.instructorId.toString() === currentUser._id.toString();
    const isStudentOwner =
      currentUser.role === UserRole.STUDENT &&
      submission.studentId.toString() === currentUser._id.toString();
    const isAdmin = currentUser.role === UserRole.ADMIN;

    if (!isInstructorOwner && !isStudentOwner && !isAdmin) {
      throw new ForbiddenException('You do not have access to this submission');
    }

    const [mappedSubmission] = await this.mapSubmissions([
      submission.toObject() as LeanSubmission,
    ]);

    return mappedSubmission;
  }

  async update(
    submissionId: string,
    updateSubmissionDto: UpdateSubmissionDto,
    currentUser: UserDocument,
  ) {
    const submission = await this.findSubmissionOrFail(submissionId);
    const classDoc = await this.findClassOrFail(submission.classId.toString());

    const isInstructorOwner =
      currentUser.role === UserRole.INSTRUCTOR &&
      classDoc.instructorId.toString() === currentUser._id.toString();
    const isStudentOwner =
      currentUser.role === UserRole.STUDENT &&
      submission.studentId.toString() === currentUser._id.toString();
    const isAdmin = currentUser.role === UserRole.ADMIN;

    if (!isInstructorOwner && !isStudentOwner && !isAdmin) {
      throw new ForbiddenException('You do not have access to update this submission');
    }

    if (updateSubmissionDto.assignmentTitle !== undefined) {
      submission.assignmentTitle = updateSubmissionDto.assignmentTitle.trim();
    }
    if (updateSubmissionDto.title !== undefined) {
      submission.title = updateSubmissionDto.title.trim();
    }
    if (updateSubmissionDto.description !== undefined) {
      submission.description = updateSubmissionDto.description;
    }

    if (isInstructorOwner || isAdmin) {
      if (updateSubmissionDto.status !== undefined) {
        submission.status = updateSubmissionDto.status;
      }
      if (updateSubmissionDto.grade !== undefined) {
        submission.grade = updateSubmissionDto.grade;
      }
    }

    if (updateSubmissionDto.audioFileUrl !== undefined) {
      submission.audioFileUrl = updateSubmissionDto.audioFileUrl;
    }
    if (updateSubmissionDto.videoFileUrl !== undefined) {
      submission.videoFileUrl = updateSubmissionDto.videoFileUrl;
    }
    if (updateSubmissionDto.fileDuration !== undefined) {
      submission.fileDuration = updateSubmissionDto.fileDuration;
    }
    if (updateSubmissionDto.fileSize !== undefined) {
      submission.fileSize = updateSubmissionDto.fileSize;
    }

    await submission.save();

    return this.findOne(submissionId, currentUser);
  }

  async remove(submissionId: string, currentUser: UserDocument) {
    const submission = await this.findSubmissionOrFail(submissionId);
    const classDoc = await this.findClassOrFail(submission.classId.toString());

    const isInstructorOwner =
      currentUser.role === UserRole.INSTRUCTOR &&
      classDoc.instructorId.toString() === currentUser._id.toString();
    const isStudentOwner =
      currentUser.role === UserRole.STUDENT &&
      submission.studentId.toString() === currentUser._id.toString();
    const isAdmin = currentUser.role === UserRole.ADMIN;

    if (!isInstructorOwner && !isStudentOwner && !isAdmin) {
      throw new ForbiddenException('You do not have access to delete this submission');
    }

    await this.submissionModel.deleteOne({ _id: submission._id });
    return { message: 'Submission deleted successfully' };
  }
}
