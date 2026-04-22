import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument } from './entities/session.entity';
import { Class, ClassDocument } from '../classes/entities/class.entity';
import {
  Assignment,
  AssignmentDocument,
  AssignmentType,
} from '../assignements/entities/assignement.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto, SessionStatus } from './dto/update-session.dto';
import {
  EmailNotification,
  EmailNotificationDocument,
} from '../email-notifications/entities/email-notification.entity';
import { forwardRef, Inject } from '@nestjs/common';
import { SessionsGateway } from './sessions.gateway';

type PopulatedStudent = {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
};

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(Class.name)
    private readonly classModel: Model<ClassDocument>,
    @InjectModel(Assignment.name)
    private readonly assignmentModel: Model<AssignmentDocument>,
    @InjectModel(EmailNotification.name)
    private readonly emailModel: Model<EmailNotificationDocument>,
    @Inject(forwardRef(() => SessionsGateway))
    private readonly gateway: SessionsGateway,
  ) {}

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private toObjectId(id: string, field = 'id'): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${field}`);
    }
    return new Types.ObjectId(id);
  }

  // ✅ Not async — no await needed at call sites
  private assertOwner(session: SessionDocument, instructorId: string) {
    if (session.instructorId.toString() !== instructorId) {
      throw new ForbiddenException('Not your session');
    }
  }

  private async getSortedStudents(
    classId: Types.ObjectId,
  ): Promise<PopulatedStudent[]> {
    const cls = await this.classModel
      .findById(classId)
      .populate<{
        studentIds: PopulatedStudent[];
      }>('studentIds', 'firstName lastName email')
      .exec();

    if (!cls) throw new NotFoundException('Class not found');

    return [...cls.studentIds].sort(
      (a, b) =>
        a.lastName.localeCompare(b.lastName) ||
        a.firstName.localeCompare(b.firstName),
    );
  }

  private async sendTurnNotification(
    recipientId: Types.ObjectId,
    sessionId: string,
    message: string,
  ) {
    await this.emailModel.create({
      recipientId,
      type: 'session_turn',
      subject: "C'est votre tour",
      body: message,
      status: 'sent',
      sentAt: new Date(),
      metadata: { sessionId },
    });
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────

  async create(
    dto: CreateSessionDto,
    instructorId: string,
  ): Promise<SessionDocument> {
    const cls = await this.classModel.findById(
      this.toObjectId(dto.classId, 'class id'),
    );
    if (!cls) throw new NotFoundException('Class not found');

    if (cls.instructorId.toString() !== instructorId) {
      throw new ForbiddenException('You do not manage this class');
    }

    const assignment = await this.assignmentModel.findById(
      this.toObjectId(dto.assignmentId, 'assignment id'),
    );
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.type !== AssignmentType.LIVE) {
      throw new BadRequestException('Only LIVE assignments can have a session');
    }
    if (assignment.classId.toString() !== cls._id.toString()) {
      throw new BadRequestException('Assignment does not belong to this class');
    }
    if (!assignment.isActive) {
      throw new BadRequestException('Assignment is cancelled');
    }

    return this.sessionModel.create({
      title: dto.title.trim(),
      classId: this.toObjectId(dto.classId, 'class id'),
      assignmentId: this.toObjectId(dto.assignmentId, 'assignment id'),
      instructorId: this.toObjectId(instructorId, 'instructor id'),
      scheduledDate: new Date(dto.scheduledDate),
      waitTimePerStudent: dto.waitTimePerStudent,
      status: SessionStatus.SCHEDULED, // ✅ was 'scheduled'
      currentStudentIndex: 0,
      skippedStudents: [],
      recordedStudents: [],
    });
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  async update(
    sessionId: string,
    dto: UpdateSessionDto,
    instructorId: string,
  ): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(
      this.toObjectId(sessionId, 'session id'),
    );
    if (!session) throw new NotFoundException('Session not found');

    this.assertOwner(session, instructorId); // ✅ no await

    // ✅ .includes() on string[] unsafe — use explicit OR instead
    if (
      session.status === SessionStatus.ACTIVE ||
      session.status === SessionStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Cannot edit a started or completed session',
      );
    }

    if (dto.title !== undefined) session.title = dto.title.trim();
    if (dto.scheduledDate !== undefined) {
      session.scheduledDate = new Date(dto.scheduledDate);
    }
    if (dto.waitTimePerStudent !== undefined) {
      session.waitTimePerStudent = dto.waitTimePerStudent;
    }

    return session.save();
  }

  // ─── CANCEL ───────────────────────────────────────────────────────────────

  async cancel(
    sessionId: string,
    instructorId: string,
  ): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(
      this.toObjectId(sessionId, 'session id'),
    );
    if (!session) throw new NotFoundException('Session not found');

    this.assertOwner(session, instructorId); // ✅ no await

    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed session');
    }
    if (session.status === SessionStatus.CANCELLED) {
      throw new BadRequestException('Session is already cancelled');
    }

    session.status = SessionStatus.CANCELLED;
    return session.save();
  }

  // ─── START ────────────────────────────────────────────────────────────────

  async startSession(
    sessionId: string,
    instructorId: string,
  ): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(
      this.toObjectId(sessionId, 'session id'),
    );
    if (!session) throw new NotFoundException('Session not found');

    this.assertOwner(session, instructorId); // ✅ no await

    if (session.status !== SessionStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled sessions can be started');
    }

    const today = new Date().toISOString().slice(0, 10);
    const scheduled = new Date(session.scheduledDate)
      .toISOString()
      .slice(0, 10);
    if (today !== scheduled) {
      throw new BadRequestException(
        'Session can only be started on its scheduled date',
      );
    }

    session.status = SessionStatus.ACTIVE;
    session.startedAt = new Date();
    await session.save();

    const students = await this.getSortedStudents(session.classId);
    if (students.length > 0) {
      const firstStudent = students[0];
      await this.sendTurnNotification(
        firstStudent._id,
        sessionId,
        'La session a commencé. Vous êtes le premier étudiant.',
      );

      // Emit socket event — tells first student their turn has started
      const assignment = await this.assignmentModel.findById(
        session.assignmentId,
      );
      const mediaType = (assignment?.allowedFileTypes as string) ?? 'both';
      this.gateway.notifyStudentTurn(
        sessionId,
        firstStudent._id.toString(),
        session.waitTimePerStudent * 60, // convert minutes → seconds
        mediaType as 'audio' | 'video' | 'both',
      );
    }
    return session;
  }

  // ─── GET STUDENTS ─────────────────────────────────────────────────────────

  async getSessionStudents(
    sessionId: string,
    instructorId: string,
  ): Promise<{
    students: PopulatedStudent[];
    recordedStudents: Types.ObjectId[];
    skippedStudents: Types.ObjectId[];
    currentStudentIndex: number;
    currentStudent: PopulatedStudent | null;
  }> {
    const session = await this.sessionModel.findById(
      this.toObjectId(sessionId, 'session id'),
    );
    if (!session) throw new NotFoundException('Session not found');

    this.assertOwner(session, instructorId); // ✅ no await

    if (session.status !== SessionStatus.ACTIVE) {
      // ✅ was 'active'
      throw new BadRequestException('Session is not active');
    }

    const students = await this.getSortedStudents(session.classId);
    const currentStudent = students[session.currentStudentIndex] ?? null;

    return {
      students,
      recordedStudents: session.recordedStudents,
      skippedStudents: session.skippedStudents,
      currentStudentIndex: session.currentStudentIndex,
      currentStudent,
    };
  }

  // ─── CURRENT STUDENT ──────────────────────────────────────────────────────

  async getCurrentStudent(sessionId: string): Promise<{
    student: PopulatedStudent;
    session: SessionDocument;
  }> {
    const session = await this.sessionModel.findById(
      this.toObjectId(sessionId, 'session id'),
    );
    if (!session) throw new NotFoundException('Session not found');

    if (session.status !== SessionStatus.ACTIVE) {
      // ✅ was 'active'
      throw new BadRequestException('Session is not active');
    }

    const students = await this.getSortedStudents(session.classId);
    const student = students[session.currentStudentIndex];

    if (!student) {
      throw new NotFoundException('No more students in this session');
    }

    return { student, session };
  }

  // ─── NEXT STUDENT ─────────────────────────────────────────────────────────

  async nextStudent(
    sessionId: string,
    currentStudentId: string,
    instructorId: string,
  ): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(
      this.toObjectId(sessionId, 'session id'),
    );
    if (!session) throw new NotFoundException('Session not found');

    this.assertOwner(session, instructorId); // ✅ no await

    if (session.status !== SessionStatus.ACTIVE) {
      // ✅ was 'active'
      throw new BadRequestException('Session is not active');
    }

    const studentObjId = this.toObjectId(currentStudentId, 'student id');

    if (!session.recordedStudents.some((id) => id.equals(studentObjId))) {
      session.recordedStudents.push(studentObjId);
    }
    session.skippedStudents = session.skippedStudents.filter(
      (id) => !id.equals(studentObjId),
    );

    session.currentStudentIndex += 1;
    await session.save();

    const students = await this.getSortedStudents(session.classId);
    const nextStudent = students[session.currentStudentIndex];

    if (nextStudent) {
      await this.sendTurnNotification(
        nextStudent._id,
        sessionId,
        'Préparez-vous, vous êtes le prochain.',
      );

      const assignment = await this.assignmentModel.findById(
        session.assignmentId,
      );
      const mediaType = (assignment?.allowedFileTypes as string) ?? 'both';
      this.gateway.notifyStudentTurn(
        sessionId,
        nextStudent._id.toString(),
        session.waitTimePerStudent * 60,
        mediaType as 'audio' | 'video' | 'both',
      );
    }
    return session;
  }

  // ─── SKIP STUDENT ─────────────────────────────────────────────────────────

  async skipStudent(
    sessionId: string,
    studentId: string,
    instructorId: string,
  ): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(
      this.toObjectId(sessionId, 'session id'),
    );
    if (!session) throw new NotFoundException('Session not found');

    this.assertOwner(session, instructorId); // ✅ no await

    if (session.status !== SessionStatus.ACTIVE) {
      // ✅ was 'active'
      throw new BadRequestException('Session is not active');
    }

    const studentObjId = this.toObjectId(studentId, 'student id');

    if (!session.skippedStudents.some((id) => id.equals(studentObjId))) {
      session.skippedStudents.push(studentObjId);
    }

    session.currentStudentIndex += 1;
    await session.save();

    await this.sendTurnNotification(
      studentObjId,
      sessionId,
      'Vous avez été passé. Veuillez contacter votre instructeur.',
    );

    return session;
  }

  // ─── COMPLETE ─────────────────────────────────────────────────────────────

  async completeSession(
    sessionId: string,
    instructorId: string,
  ): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(
      this.toObjectId(sessionId, 'session id'),
    );
    if (!session) throw new NotFoundException('Session not found');

    this.assertOwner(session, instructorId); // ✅ no await

    if (session.status !== SessionStatus.ACTIVE) {
      // ✅ was 'active'
      throw new BadRequestException('Only active sessions can be completed');
    }

    session.status = SessionStatus.COMPLETED;
    session.completedAt = new Date();
    return session.save();
  }

  // ─── STUDENT SCHEDULE VIEW ────────────────────────────────────────────────

  async getMySlot(
    sessionId: string,
    studentId: string,
  ): Promise<{
    position: number;
    estimatedTime: Date;
    status: 'waiting' | 'current' | 'done' | 'skipped';
  }> {
    const session = await this.sessionModel.findById(
      this.toObjectId(sessionId, 'session id'),
    );
    if (!session) throw new NotFoundException('Session not found');

    const students = await this.getSortedStudents(session.classId);
    const studentObjId = this.toObjectId(studentId, 'student id');

    const position = students.findIndex((s) => s._id.equals(studentObjId));
    if (position === -1) {
      throw new NotFoundException(
        "You are not enrolled in this session's class",
      );
    }

    const baseTime = session.startedAt ?? session.scheduledDate;
    const estimatedTime = new Date(baseTime);
    estimatedTime.setMinutes(
      estimatedTime.getMinutes() + position * session.waitTimePerStudent,
    );

    let status: 'waiting' | 'current' | 'done' | 'skipped' = 'waiting';
    if (session.recordedStudents.some((id) => id.equals(studentObjId))) {
      status = 'done';
    } else if (session.skippedStudents.some((id) => id.equals(studentObjId))) {
      status = 'skipped';
    } else if (session.currentStudentIndex === position) {
      status = 'current';
    }

    return { position: position + 1, estimatedTime, status };
  }

  // ─── FIND BY CLASS ────────────────────────────────────────────────────────

  async findByClass(classId: string): Promise<SessionDocument[]> {
    return this.sessionModel
      .find({ classId: this.toObjectId(classId, 'class id') })
      .sort({ scheduledDate: -1 })
      .exec();
  }

  async findOne(sessionId: string): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(
      this.toObjectId(sessionId, 'session id'),
    );
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async getCurrentStudentById(sessionId: string): Promise<{
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
  }> {
    const session = await this.sessionModel.findById(
      this.toObjectId(sessionId, 'session id'),
    );
    if (!session) throw new NotFoundException('Session not found');
    const students = await this.getSortedStudents(session.classId);
    const student = students[session.currentStudentIndex];
    if (!student) throw new NotFoundException('No current student');
    return student;
  }
}
