import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request as ExpressRequest } from 'express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RecordingService } from './recording.service';
import { FileType, RecordingSource } from './recording.shema';

type AuthRequest = ExpressRequest & {
  user: { userId: string; role: UserRole };
};

const fileUploadInterceptor = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'audio/mpeg',
      'audio/wav',
      'audio/webm',
      'video/mp4',
      'video/webm',
      'video/avi',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(`Unsupported file type: ${file.mimetype}`),
        false,
      );
    }
  },
});

@Controller('recordings')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class RecordingController {
  constructor(private readonly recordingService: RecordingService) {}

  // ─── SESSION ROUTES (must all come before /:recordingId routes) ───────────

  // POST /recordings/session/:sessionId/save-blob
  // WebRTC recording ends → browser sends blob → saved as Submission directly.
  //
  // FIX: accepts optional `studentId` in the body.
  // The frontend passes the student ID that was current BEFORE nextStudent()
  // was called. Without this, getCurrentStudentById() runs after the session
  // index has advanced and attributes the recording to the wrong student.
  @Post('session/:sessionId/save-blob')
  @Roles(UserRole.INSTRUCTOR, UserRole.STUDENT)
  @UseInterceptors(fileUploadInterceptor)
  saveBlobRecording(
    @Param('sessionId') sessionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('fileType') fileType: FileType,
    @Body('source') source: RecordingSource,
    @Body('studentId') studentId: string | undefined,
    @Request() req: AuthRequest,
  ) {
    console.log('[Controller] save-blob called:', {
      sessionId,
      hasFile: !!file,
      fileType,
      source,
      studentId,
      userId: req.user?.userId,
    });

    if (!file) throw new BadRequestException('File is required');
    return this.recordingService.saveBlobRecording(
      sessionId,
      file,
      fileType,
      source,
      req.user.userId,
      studentId,
    );
  }

  // POST /recordings/session/:sessionId/instructor
  @Post('session/:sessionId/instructor')
  @Roles(UserRole.INSTRUCTOR)
  @UseInterceptors(fileUploadInterceptor)
  instructorRecord(
    @Param('sessionId') sessionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('fileType') fileType: FileType,
    @Request() req: AuthRequest,
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.recordingService.startRecording(
      sessionId,
      file,
      fileType,
      RecordingSource.INSTRUCTOR,
      req.user.userId,
    );
  }

  // POST /recordings/session/:sessionId/student/audio
  @Post('session/:sessionId/student/audio')
  @Roles(UserRole.STUDENT)
  @UseInterceptors(fileUploadInterceptor)
  studentRecordAudio(
    @Param('sessionId') sessionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthRequest,
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.recordingService.studentRecord(
      sessionId,
      req.user.userId,
      file,
      FileType.AUDIO,
    );
  }

  // POST /recordings/session/:sessionId/student/video
  @Post('session/:sessionId/student/video')
  @Roles(UserRole.STUDENT)
  @UseInterceptors(fileUploadInterceptor)
  studentRecordVideo(
    @Param('sessionId') sessionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthRequest,
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.recordingService.studentRecord(
      sessionId,
      req.user.userId,
      file,
      FileType.VIDEO,
    );
  }

  // ─── RECORDING ID ROUTES ──────────────────────────────────────────────────

  // POST /recordings/:recordingId/save
  @Post(':recordingId/save')
  @Roles(UserRole.INSTRUCTOR)
  saveRecording(
    @Param('recordingId') recordingId: string,
    @Request() req: AuthRequest,
  ) {
    return this.recordingService.saveRecording(recordingId, req.user.userId);
  }

  // POST /recordings/:recordingId/submit
  @Post(':recordingId/submit')
  @Roles(UserRole.STUDENT)
  studentSubmit(
    @Param('recordingId') recordingId: string,
    @Request() req: AuthRequest,
  ) {
    return this.recordingService.studentSubmitRecording(
      recordingId,
      req.user.userId,
    );
  }

  // GET /recordings/:recordingId/preview
  @Get(':recordingId/preview')
  @Roles(UserRole.INSTRUCTOR, UserRole.STUDENT)
  getPreview(@Param('recordingId') recordingId: string) {
    return this.recordingService.getPreview(recordingId);
  }

  // DELETE /recordings/:recordingId/discard
  @Delete(':recordingId/discard')
  @Roles(UserRole.INSTRUCTOR, UserRole.STUDENT)
  discardRecording(
    @Param('recordingId') recordingId: string,
    @Request() req: AuthRequest,
  ) {
    return this.recordingService.discardRecording(recordingId, req.user.userId);
  }
}
