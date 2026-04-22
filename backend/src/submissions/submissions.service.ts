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
  SubmissionFileType,
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
import { AssignmentsService } from '../assignements/assignements.service';

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
  assignmentId?: Types.ObjectId;
  recordedBy?: Types.ObjectId | null;
  fileUrl?: string;
  isDraft?: boolean;
  submittedAt?: Date;
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
    private readonly assignmentsService: AssignmentsService,
  ) {}

  // ─── PRIVATE HELPERS ─────────────────────────────────────────────────────

  private toObjectId(id: string, field = 'id'): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${field}`);
    }
    return new Types.ObjectId(id);
  }

  private buildDateRange(dateFrom?: string, dateTo?: string) {
    if (!dateFrom && !dateTo) return undefined;

    const range: { $gte?: Date; $lte?: Date } = {};
    if (dateFrom) range.$gte = new Date(dateFrom);
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
    if (!classDoc) throw new NotFoundException('Class not found');
    return classDoc;
  }

  private async findSubmissionOrFail(
    submissionId: string,
  ): Promise<SubmissionDocument> {
    const submission = await this.submissionModel.findById(
      this.toObjectId(submissionId, 'submission id'),
    );
    if (!submission) throw new NotFoundException('Submission not found');
    return submission;
  }

  private async getInstructorClassIds(currentUser: UserDocument) {
    const classes = await this.classModel
      .find({ instructorId: currentUser._id })
      .select('_id')
      .lean<{ _id: Types.ObjectId }[]>();

    return classes.map((c) => c._id);
  }

  private async ensureInstructorOwnsClass(
    classId: string,
    currentUser: UserDocument,
  ): Promise<ClassDocument> {
    const classDoc = await this.findClassOrFail(classId);
    if (classDoc.instructorId.toString() !== currentUser._id.toString()) {
      throw new ForbiddenException('You do not have access to this class');
    }
    return classDoc;
  }

  private async ensureStudentBelongsToClass(
    classDoc: ClassDocument,
    studentId: string,
  ) {
    const objectId = this.toObjectId(studentId, 'student id');
    const inClass = classDoc.studentIds.some(
      (id) => id.toString() === objectId.toString(),
    );

    if (!inClass) {
      throw new BadRequestException(
        'Student is not enrolled in the selected class',
      );
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
        .find({ _id: { $in: [...classIds].map((id) => this.toObjectId(id)) } })
        .lean<LeanClass[]>(),
      this.userModel
        .find({ _id: { $in: [...userIds].map((id) => this.toObjectId(id)) } })
        .select('username firstName lastName email role')
        .lean<LeanUser[]>(),
    ]);

    const classesMap = new Map(classes.map((c) => [c._id.toString(), c]));
    const usersMap = new Map(users.map((u) => [u._id.toString(), u]));

    return submissions.map((submission) => {
      const classItem = classesMap.get(submission.classId.toString());
      const student = usersMap.get(submission.studentId.toString());
      const recordedBy = submission.recordedBy
        ? usersMap.get(submission.recordedBy.toString())
        : null;

      return {
        id: submission._id.toString(),
        assignmentTitle: submission.assignmentTitle,
        assignmentId: submission.assignmentId?.toString() ?? null,
        title: submission.title,
        description: submission.description ?? '',
        submissionType: submission.submissionType,
        fileType: submission.fileType,
        fileUrl: submission.fileUrl ?? null,
        audioFileUrl: submission.audioFileUrl ?? null,
        videoFileUrl: submission.videoFileUrl ?? null,
        fileDuration: submission.fileDuration ?? 0,
        fileSize: submission.fileSize ?? 0,
        isDraft: submission.isDraft ?? true,
        status: submission.status,
        grade: submission.grade ?? null,
        submittedAt: submission.submittedAt ?? null,
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

  // ✅ Fixed: removed non-existent EVALUATED/IN_PROGRESS, use GRADED instead
  private buildSummary(submissions: Array<{ status: SubmissionStatus }>) {
    return submissions.reduce(
      (summary, submission) => {
        summary.total += 1;
        if (submission.status === SubmissionStatus.PENDING)
          summary.pending += 1;
        else if (submission.status === SubmissionStatus.GRADED)
          summary.graded += 1;
        else if (submission.status === SubmissionStatus.CANCELLED)
          summary.cancelled += 1;
        return summary;
      },
      { total: 0, pending: 0, graded: 0, cancelled: 0 },
    );
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────

  async create(
    createSubmissionDto: CreateSubmissionDto,
    currentUser: UserDocument,
  ) {
    const classDoc = await this.findClassOrFail(createSubmissionDto.classId);

    let studentId = currentUser._id;
    let submissionType = createSubmissionDto.submissionType;
    let recordedBy: Types.ObjectId | undefined;

    if (currentUser.role === UserRole.STUDENT) {
      const enrolled = classDoc.studentIds.some(
        (id) => id.toString() === currentUser._id.toString(),
      );
      if (!enrolled) {
        throw new ForbiddenException('You are not enrolled in this class');
      }
      // ✅ Fixed: was SubmissionType.STUDENT_UPLOADED
      submissionType = SubmissionType.UPLOAD;
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
      // ✅ Fixed: was SubmissionType.INSTRUCTOR_RECORDED
      submissionType =
        createSubmissionDto.submissionType ?? SubmissionType.LIVE;
      recordedBy = currentUser._id;
    } else {
      throw new ForbiddenException('Unsupported role for creating submissions');
    }

    if (
      createSubmissionDto.fileType === SubmissionFileType.AUDIO &&
      !createSubmissionDto.audioFileUrl
    ) {
      throw new BadRequestException(
        'audioFileUrl is required for audio submissions',
      );
    }
    if (
      createSubmissionDto.fileType === SubmissionFileType.VIDEO &&
      !createSubmissionDto.videoFileUrl
    ) {
      throw new BadRequestException(
        'videoFileUrl is required for video submissions',
      );
    }

    const submission = await this.submissionModel.create({
      studentId,
      classId: classDoc._id,
      assignmentId: createSubmissionDto.assignmentId
        ? this.toObjectId(createSubmissionDto.assignmentId, 'assignment id')
        : undefined,
      assignmentTitle: createSubmissionDto.assignmentTitle.trim(),
      title:
        createSubmissionDto.title?.trim() ||
        createSubmissionDto.assignmentTitle.trim(),
      description: createSubmissionDto.description ?? '',
      submissionType,
      fileType: createSubmissionDto.fileType,
      fileUrl: createSubmissionDto.fileUrl,
      audioFileUrl: createSubmissionDto.audioFileUrl,
      videoFileUrl: createSubmissionDto.videoFileUrl,
      fileDuration: createSubmissionDto.fileDuration ?? 0,
      fileSize: createSubmissionDto.fileSize ?? 0,
      recordedBy,
      isDraft: false,
      // ✅ Fixed: CreateSubmissionDto has no status field; always default to PENDING
      status: SubmissionStatus.PENDING,
      submittedAt: new Date(),
    });

    const [mappedSubmission] = await this.mapSubmissions([
      submission.toObject() as LeanSubmission,
    ]);

    return mappedSubmission;
  }

  // ─── DRAFT WORKFLOW ───────────────────────────────────────────────────────

  async uploadDraft(
    dto: CreateSubmissionDto,
    fileUrl: string,
    fileSize: number,
    userId: string, // ✅ just a string ID now
  ): Promise<SubmissionDocument> {
    if (!dto.assignmentId) {
      throw new BadRequestException(
        'assignmentId is required for draft upload',
      );
    }

    const assignment = await this.assignmentsService.findOne(dto.assignmentId);
    if (new Date() > assignment.deadline) {
      throw new BadRequestException('Deadline has passed');
    }

    const studentId = this.toObjectId(userId, 'student id');

    const existing = await this.submissionModel.findOne({
      studentId,
      assignmentId: this.toObjectId(dto.assignmentId, 'assignment id'),
      isDraft: true,
    });

    if (existing) {
      existing.fileUrl = fileUrl;
      existing.fileSize = fileSize;
      existing.fileType = dto.fileType;
      return existing.save();
    }

    return this.submissionModel.create({
      studentId,
      classId: this.toObjectId(dto.classId, 'class id'),
      assignmentId: this.toObjectId(dto.assignmentId, 'assignment id'),
      assignmentTitle: dto.assignmentTitle,
      title: dto.title ?? dto.assignmentTitle,
      submissionType: dto.submissionType,
      fileType: dto.fileType,
      fileUrl,
      fileSize,
      isDraft: true,
      status: SubmissionStatus.PENDING,
    });
  }

  async submitDraft(
    submissionId: string,
    currentUser: UserDocument,
  ): Promise<SubmissionDocument> {
    const submission = await this.findSubmissionOrFail(submissionId);

    if (submission.studentId.toString() !== currentUser._id.toString()) {
      throw new ForbiddenException('You do not own this submission');
    }
    if (!submission.isDraft) {
      throw new BadRequestException('This submission is already finalized');
    }
    if (!submission.assignmentId) {
      throw new BadRequestException('Submission has no linked assignment');
    }

    const assignment = await this.assignmentsService.findOne(
      submission.assignmentId.toString(),
    );
    if (new Date() > assignment.deadline) {
      throw new BadRequestException('Deadline has passed');
    }

    submission.isDraft = false;
    submission.submittedAt = new Date();
    return submission.save();
  }

  async deleteDraft(
    submissionId: string,
    currentUser: UserDocument,
  ): Promise<{ message: string }> {
    const submission = await this.findSubmissionOrFail(submissionId);

    if (submission.studentId.toString() !== currentUser._id.toString()) {
      throw new ForbiddenException('You do not own this submission');
    }
    if (!submission.isDraft) {
      throw new ForbiddenException('Cannot delete a finalized submission');
    }

    await submission.deleteOne();
    return { message: 'Draft deleted successfully' };
  }

  async getDraft(
    assignmentId: string,
    currentUser: UserDocument,
  ): Promise<SubmissionDocument | null> {
    return this.submissionModel.findOne({
      assignmentId: this.toObjectId(assignmentId, 'assignment id'),
      studentId: currentUser._id,
      isDraft: true,
    });
  }

  // ─── INSTRUCTOR VIEWS ─────────────────────────────────────────────────────

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
    if (query.status) filters.status = query.status;

    const dateRange = this.buildDateRange(query.dateFrom, query.dateTo);
    if (dateRange) filters.submittedAt = dateRange;

    const submissions = await this.submissionModel
      .find(filters)
      .sort({ submittedAt: -1 })
      .lean<LeanSubmission[]>();

    const mappedSubmissions = await this.mapSubmissions(submissions);

    return {
      filters: query,
      summary: this.buildSummary(mappedSubmissions),
      submissions: mappedSubmissions,
    };
  }

  async findByAssignment(assignmentId: string, currentUser: UserDocument) {
    const assignment = await this.assignmentsService.findOne(assignmentId);

    await this.ensureInstructorOwnsClass(
      assignment.classId.toString(),
      currentUser,
    );

    const submissions = await this.submissionModel
      .find({
        assignmentId: this.toObjectId(assignmentId, 'assignment id'),
        isDraft: false,
      })
      .sort({ submittedAt: -1 })
      .lean<LeanSubmission[]>();

    return this.mapSubmissions(submissions);
  }

  async findMissingSubmissions(
    query: MissingSubmissionsQueryDto,
    currentUser: UserDocument,
  ) {
    const classDoc = await this.ensureInstructorOwnsClass(
      query.classId,
      currentUser,
    );

    const [classLean, classStudents, submissions] = await Promise.all([
      this.classModel.findById(classDoc._id).lean<LeanClass | null>(),
      this.userModel
        .find({ _id: { $in: classDoc.studentIds }, role: UserRole.STUDENT })
        .select('username firstName lastName email')
        .lean<LeanUser[]>(),
      this.submissionModel
        .find({
          classId: classDoc._id,
          assignmentId: this.toObjectId(query.assignmentId, 'assignment id'),
          isDraft: false,
        })
        .select('studentId')
        .lean<{ studentId: Types.ObjectId }[]>(),
    ]);

    if (!classLean) throw new NotFoundException('Class not found');

    const submittedStudentIds = new Set(
      submissions.map((s) => s.studentId.toString()),
    );

    const missingStudents = classStudents
      .filter((s) => !submittedStudentIds.has(s._id.toString()))
      .map((s) => ({
        id: s._id.toString(),
        username: s.username,
        email: s.email,
        firstName: s.firstName,
        lastName: s.lastName,
      }));

    return {
      assignmentId: query.assignmentId,
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

  // ─── STUDENT VIEWS ────────────────────────────────────────────────────────

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
        (id) => id.toString() === currentUser._id.toString(),
      );
      if (!enrolled) {
        throw new ForbiddenException('You are not enrolled in this class');
      }
      filters.classId = classDoc._id;
    }

    // ✅ Fixed: StudentSubmissionHistoryQueryDto has no assignmentTitle, use assignmentId
    if (query.assignmentId) {
      filters.assignmentId = this.toObjectId(
        query.assignmentId,
        'assignment id',
      );
    }
    if (query.status) filters.status = query.status;

    const dateRange = this.buildDateRange(query.dateFrom, query.dateTo);
    if (dateRange) filters.submittedAt = dateRange;

    const submissions = await this.submissionModel
      .find(filters)
      .sort({ submittedAt: -1 })
      .lean<LeanSubmission[]>();

    const mappedSubmissions = await this.mapSubmissions(submissions);

    return {
      filters: query,
      summary: this.buildSummary(mappedSubmissions),
      submissions: mappedSubmissions,
    };
  }

  // ─── SINGLE SUBMISSION ────────────────────────────────────────────────────

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
      throw new ForbiddenException(
        'You do not have access to update this submission',
      );
    }

    // ✅ Fixed: assignmentTitle is not in UpdateSubmissionDto — removed
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
    if (updateSubmissionDto.fileUrl !== undefined) {
      submission.fileUrl = updateSubmissionDto.fileUrl;
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
      throw new ForbiddenException(
        'You do not have access to delete this submission',
      );
    }

    await this.submissionModel.deleteOne({ _id: submission._id });
    return { message: 'Submission deleted successfully' };
  }
}
