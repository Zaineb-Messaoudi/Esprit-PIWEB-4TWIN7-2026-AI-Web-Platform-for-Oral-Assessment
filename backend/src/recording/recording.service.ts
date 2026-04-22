import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Recording,
  RecordingDocument,
  FileType,
  RecordingSource,
} from './recording.shema';
import {
  Submission,
  SubmissionDocument,
} from '../submissions/entities/submission.entity';
import {
  Assignment,
  AssignmentDocument,
} from '../assignements/entities/assignement.entity';
import { SessionsService } from '../sessions/sessions.service';
import {
  SubmissionType,
  SubmissionStatus,
} from '../submissions/dto/create-submission.dto';
import { SubmissionFileType } from '../submissions/entities/submission.entity';
import * as fs from 'fs';
import * as path from 'path';
import { Express } from 'express';
import 'multer';

@Injectable()
export class RecordingService {
  constructor(
    @InjectModel(Recording.name)
    private readonly recordingModel: Model<RecordingDocument>,
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
    @InjectModel(Assignment.name)
    private readonly assignmentModel: Model<AssignmentDocument>,
    private readonly sessionsService: SessionsService,
  ) {}

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  private toObjectId(id: string, field = 'id'): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${field}`);
    }
    return new Types.ObjectId(id);
  }

  private saveFileToDisk(file: Express.Multer.File): string {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, file.buffer);
    return filePath;
  }

  // ─── START RECORDING (creates a pending Recording buffer) ─────────────────

  async startRecording(
    sessionId: string,
    file: Express.Multer.File,
    fileType: FileType,
    source: RecordingSource,
    actorId: string, // instructorId or studentId depending on source
  ): Promise<RecordingDocument> {
    const { student, session } =
      await this.sessionsService.getCurrentStudent(sessionId);

    // For instructor recordings, actorId is the instructorId — verify ownership
    if (source === RecordingSource.INSTRUCTOR) {
      if (session.instructorId.toString() !== actorId) {
        throw new ForbiddenException('Not your session');
      }
    }

    // For student recordings, actorId is the studentId — verify it's their turn
    if (source === RecordingSource.STUDENT) {
      if (!student._id.equals(this.toObjectId(actorId, 'student id'))) {
        throw new ForbiddenException('It is not your turn yet');
      }
    }

    const filePath = this.saveFileToDisk(file);

    // Delete any previous pending recording for this student in this session
    await this.recordingModel.deleteMany({
      sessionId: this.toObjectId(sessionId, 'session id'),
      studentId: student._id,
      isPending: true,
    });

    return this.recordingModel.create({
      sessionId: this.toObjectId(sessionId, 'session id'),
      studentId: student._id,
      classId: session.classId,
      assignmentId: session.assignmentId,
      filePath,
      fileType,
      source,
      fileDuration: 0,
      fileSize: file.size,
      isPending: true,
    });
  }

  // ─── PREVIEW ──────────────────────────────────────────────────────────────

  async getPreview(
    recordingId: string,
  ): Promise<{ filePath: string; fileType: string }> {
    const recording = await this.recordingModel.findById(
      this.toObjectId(recordingId, 'recording id'),
    );
    if (!recording) throw new NotFoundException('Recording not found');
    if (!recording.isPending) {
      throw new BadRequestException('This recording has already been saved');
    }

    return { filePath: recording.filePath, fileType: recording.fileType };
  }

  // ─── SAVE — converts Recording → Submission, then deletes the buffer ──────

  async saveRecording(
    recordingId: string,
    instructorId: string,
  ): Promise<SubmissionDocument> {
    const recording = await this.recordingModel.findById(
      this.toObjectId(recordingId, 'recording id'),
    );
    if (!recording) throw new NotFoundException('Recording not found');
    if (!recording.isPending) {
      throw new BadRequestException('This recording has already been saved');
    }

    const session = await this.sessionsService.findOne(
      recording.sessionId.toString(),
    );

    if (session.instructorId.toString() !== instructorId) {
      throw new ForbiddenException('Not your session');
    }

    const assignment = await this.assignmentModel.findById(
      recording.assignmentId,
    );
    if (!assignment) throw new NotFoundException('Assignment not found');

    // Build the final Submission from the Recording buffer
    const submissionData: Partial<Submission> = {
      studentId: recording.studentId,
      classId: recording.classId,
      assignmentId: recording.assignmentId,
      assignmentTitle: assignment.title,
      title: assignment.title,
      submissionType: SubmissionType.LIVE,
      fileType:
        recording.fileType === FileType.AUDIO
          ? SubmissionFileType.AUDIO
          : SubmissionFileType.VIDEO,
      fileDuration: recording.fileDuration,
      fileSize: recording.fileSize,
      recordedBy: new Types.ObjectId(instructorId),
      sessionId: recording.sessionId,
      isDraft: false,
      status: SubmissionStatus.PENDING,
      submittedAt: new Date(),
    };

    // Assign to the correct URL field based on file type
    if (recording.fileType === FileType.AUDIO) {
      submissionData.audioFileUrl = recording.filePath;
    } else {
      submissionData.videoFileUrl = recording.filePath;
    }

    const submission = await this.submissionModel.create(submissionData);

    // Mark buffer as no longer pending (soft — keeps file on disk for now)
    recording.isPending = false;
    await recording.save();

    // Advance the session to the next student
    await this.sessionsService.nextStudent(
      recording.sessionId.toString(),
      recording.studentId.toString(),
      instructorId,
    );

    return submission;
  }

  // ─── DISCARD (instructor or student rejects preview) ──────────────────────

  async discardRecording(
    recordingId: string,
    actorId: string,
  ): Promise<{ message: string }> {
    const recording = await this.recordingModel.findById(
      this.toObjectId(recordingId, 'recording id'),
    );
    if (!recording) throw new NotFoundException('Recording not found');
    if (!recording.isPending) {
      throw new BadRequestException(
        'This recording has already been finalized',
      );
    }

    const session = await this.sessionsService.findOne(
      recording.sessionId.toString(),
    );

    const isInstructor = session.instructorId.toString() === actorId;
    const isStudent = recording.studentId.toString() === actorId;

    if (!isInstructor && !isStudent) {
      throw new ForbiddenException('You cannot discard this recording');
    }

    // Remove file from disk
    if (fs.existsSync(recording.filePath)) {
      fs.unlinkSync(recording.filePath);
    }

    await recording.deleteOne();
    return { message: 'Recording discarded' };
  }

  // ─── STUDENT SELF-RECORDING ───────────────────────────────────────────────
  // Student records themselves (audio or video) during the live session

  async studentRecord(
    sessionId: string,
    studentId: string,
    file: Express.Multer.File,
    fileType: FileType,
  ): Promise<RecordingDocument> {
    return this.startRecording(
      sessionId,
      file,
      fileType,
      RecordingSource.STUDENT,
      studentId,
    );
  }

  // Student submits their own recording → becomes a Submission
  async studentSubmitRecording(
    recordingId: string,
    studentId: string,
  ): Promise<SubmissionDocument> {
    const recording = await this.recordingModel.findById(
      this.toObjectId(recordingId, 'recording id'),
    );
    if (!recording) throw new NotFoundException('Recording not found');
    if (!recording.isPending) {
      throw new BadRequestException('Already submitted');
    }
    if (recording.studentId.toString() !== studentId) {
      throw new ForbiddenException('Not your recording');
    }

    const assignment = await this.assignmentModel.findById(
      recording.assignmentId,
    );
    if (!assignment) throw new NotFoundException('Assignment not found');

    const submissionData: Partial<Submission> = {
      studentId: recording.studentId,
      classId: recording.classId,
      assignmentId: recording.assignmentId,
      assignmentTitle: assignment.title,
      title: assignment.title,
      submissionType: SubmissionType.LIVE,
      fileType:
        recording.fileType === FileType.AUDIO
          ? SubmissionFileType.AUDIO
          : SubmissionFileType.VIDEO,
      fileDuration: recording.fileDuration,
      fileSize: recording.fileSize,
      sessionId: recording.sessionId,
      isDraft: false,
      status: SubmissionStatus.PENDING,
      submittedAt: new Date(),
    };

    if (recording.fileType === FileType.AUDIO) {
      submissionData.audioFileUrl = recording.filePath;
    } else {
      submissionData.videoFileUrl = recording.filePath;
    }

    const submission = await this.submissionModel.create(submissionData);

    recording.isPending = false;
    await recording.save();

    return submission;
  }

  async saveBlobRecording(
    sessionId: string,
    file: Express.Multer.File,
    fileType: FileType,
    source: RecordingSource,
    actorId: string,
  ): Promise<SubmissionDocument> {
    const session = await this.sessionsService.findOne(sessionId);

    // Resolve which student this blob is for
    let studentId: Types.ObjectId;
    if (source === RecordingSource.INSTRUCTOR) {
      if (session.instructorId.toString() !== actorId) {
        throw new ForbiddenException('Not your session');
      }
      // Get the student whose turn just ended from session state
      const students =
        await this.sessionsService.getCurrentStudentById(sessionId);
      studentId = students._id;
    } else {
      studentId = this.toObjectId(actorId, 'student id');
    }

    const filePath = this.saveFileToDisk(file);

    const assignment = await this.assignmentModel.findById(
      session.assignmentId,
    );
    if (!assignment) throw new NotFoundException('Assignment not found');

    const submissionData: Partial<Submission> = {
      studentId,
      classId: session.classId,
      assignmentId: session.assignmentId,
      assignmentTitle: assignment.title,
      title: assignment.title,
      submissionType: SubmissionType.LIVE,
      fileType:
        fileType === FileType.AUDIO
          ? SubmissionFileType.AUDIO
          : SubmissionFileType.VIDEO,
      fileDuration: 0,
      fileSize: file.size,
      recordedBy:
        source === RecordingSource.INSTRUCTOR
          ? this.toObjectId(actorId, 'instructor id')
          : undefined,
      sessionId: this.toObjectId(sessionId, 'session id'),
      isDraft: false,
      status: SubmissionStatus.PENDING,
      submittedAt: new Date(),
    };

    if (fileType === FileType.AUDIO) {
      submissionData.audioFileUrl = filePath;
    } else {
      submissionData.videoFileUrl = filePath;
    }

    return this.submissionModel.create(submissionData);
  }
}
