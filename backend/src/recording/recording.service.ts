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
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
ffmpeg.setFfmpegPath(ffmpegPath as string);

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

    const filename = `${Date.now()}-raw.webm`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, file.buffer);

    return filePath;
  }

  // ─── START RECORDING ──────────────────────────────────────────────────────

  async startRecording(
    sessionId: string,
    file: Express.Multer.File,
    fileType: FileType,
    source: RecordingSource,
    actorId: string,
  ): Promise<RecordingDocument> {
    const { student, session } =
      await this.sessionsService.getCurrentStudent(sessionId);

    if (source === RecordingSource.INSTRUCTOR) {
      if (session.instructorId.toString() !== actorId) {
        throw new ForbiddenException('Not your session');
      }
    }

    if (source === RecordingSource.STUDENT) {
      if (!student._id.equals(this.toObjectId(actorId, 'student id'))) {
        throw new ForbiddenException('It is not your turn yet');
      }
    }

    const filePath = this.saveFileToDisk(file);

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

  // ─── SAVE ─────────────────────────────────────────────────────────────────

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

    const relativeUrl = `/uploads/${path.basename(recording.filePath)}`;

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

    if (recording.fileType === FileType.AUDIO) {
      submissionData.audioFileUrl = relativeUrl;
    } else {
      submissionData.videoFileUrl = relativeUrl;
    }

    const submission = await this.submissionModel.create(submissionData);

    recording.isPending = false;
    await recording.save();

    await this.sessionsService.nextStudent(
      recording.sessionId.toString(),
      recording.studentId.toString(),
      instructorId,
    );

    return submission;
  }

  // ─── DISCARD ──────────────────────────────────────────────────────────────

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

    if (fs.existsSync(recording.filePath)) {
      fs.unlinkSync(recording.filePath);
    }

    await recording.deleteOne();
    return { message: 'Recording discarded' };
  }

  // ─── STUDENT SELF-RECORDING ───────────────────────────────────────────────

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

    const relativeUrl = `/uploads/${path.basename(recording.filePath)}`;

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
      submissionData.audioFileUrl = relativeUrl;
    } else {
      submissionData.videoFileUrl = relativeUrl;
    }

    const submission = await this.submissionModel.create(submissionData);

    recording.isPending = false;
    await recording.save();

    return submission;
  }

  // ─── SAVE BLOB (WebRTC flow) ───────────────────────────────────────────────
  //
  // explicitStudentId — passed from the frontend when source === 'instructor'.
  // The frontend sets this BEFORE calling nextStudent(), so we get the correct
  // student even though the session index has already advanced by the time the
  // blob finishes uploading (race condition fix).

  async saveBlobRecording(
    sessionId: string,
    file: Express.Multer.File,
    fileType: FileType,
    source: RecordingSource,
    actorId: string,
    explicitStudentId?: string,
  ): Promise<SubmissionDocument> {
    const session = await this.sessionsService.findOne(sessionId);

    let studentId: Types.ObjectId;

    if (source === RecordingSource.INSTRUCTOR) {
      if (session.instructorId.toString() !== actorId) {
        throw new ForbiddenException('Not your session');
      }

      if (explicitStudentId && Types.ObjectId.isValid(explicitStudentId)) {
        // Use the student ID sent by the frontend — this was captured before
        // nextStudent() advanced the session, so it's always correct.
        studentId = new Types.ObjectId(explicitStudentId);
      } else {
        // Fallback: derive from current session state.
        // This may return the wrong student if nextStudent() already ran,
        // but it's kept as a safety net for edge cases.
        const student =
          await this.sessionsService.getCurrentStudentById(sessionId);
        studentId = student._id;
      }
    } else {
      studentId = this.toObjectId(actorId, 'student id');
    }

    const rawPath = this.saveFileToDisk(file);
    const filePath = await this.fixWebmDuration(rawPath);

    const relativeUrl = `/uploads/${path.basename(filePath)}`;

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
      submissionData.audioFileUrl = relativeUrl;
    } else {
      submissionData.videoFileUrl = relativeUrl;
    }

    return this.submissionModel.create(submissionData);
  }

  private fixWebmDuration(inputPath: string): Promise<string> {
    const outputPath = inputPath.replace('-raw.webm', '.webm');

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions(['-c copy', '-fflags +genpts'])
        .save(outputPath)
        .on('end', () => {
          try {
            fs.unlinkSync(inputPath); // delete raw file
          } catch (e) {
            console.warn('Failed to delete raw file:', e);
          }
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err); // fallback to raw if fails
        });
    });
  }
}
