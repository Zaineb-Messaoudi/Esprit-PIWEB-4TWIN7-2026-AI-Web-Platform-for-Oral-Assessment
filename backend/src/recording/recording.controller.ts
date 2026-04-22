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

  // ─── INSTRUCTOR ───────────────────────────────────────────────────────────

  // POST /recordings/session/:sessionId/instructor
  // Instructor records the current student — creates a pending Recording buffer
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

  // POST /recordings/:recordingId/save
  // Instructor previewed and confirms — converts Recording → Submission, advances session
  @Post(':recordingId/save')
  @Roles(UserRole.INSTRUCTOR)
  saveRecording(
    @Param('recordingId') recordingId: string,
    @Request() req: AuthRequest,
  ) {
    return this.recordingService.saveRecording(recordingId, req.user.userId);
  }

  // ─── STUDENT ──────────────────────────────────────────────────────────────

  // POST /recordings/session/:sessionId/student/audio
  // Student records audio during their live session turn
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
  // Student records video via webcam during their live session turn
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

  // POST /recordings/:recordingId/submit
  // Student confirms their own recording → Submission
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

  // ─── SHARED ───────────────────────────────────────────────────────────────

  // GET /recordings/:recordingId/preview
  // Both instructor and student can preview before confirming
  @Get(':recordingId/preview')
  @Roles(UserRole.INSTRUCTOR, UserRole.STUDENT)
  getPreview(@Param('recordingId') recordingId: string) {
    return this.recordingService.getPreview(recordingId);
  }

  // DELETE /recordings/:recordingId/discard
  // Reject the preview — deletes buffer and file from disk
  @Delete(':recordingId/discard')
  @Roles(UserRole.INSTRUCTOR, UserRole.STUDENT)
  discardRecording(
    @Param('recordingId') recordingId: string,
    @Request() req: AuthRequest,
  ) {
    return this.recordingService.discardRecording(recordingId, req.user.userId);
  }

  @Post('session/:sessionId/save-blob')
  @Roles(UserRole.INSTRUCTOR, UserRole.STUDENT)
  @UseInterceptors(fileUploadInterceptor)
  saveBlobRecording(
    @Param('sessionId') sessionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('fileType') fileType: FileType,
    @Body('source') source: RecordingSource,
    @Request() req: AuthRequest,
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.recordingService.saveBlobRecording(
      sessionId,
      file,
      fileType,
      source,
      req.user.userId,
    );
  }
}
