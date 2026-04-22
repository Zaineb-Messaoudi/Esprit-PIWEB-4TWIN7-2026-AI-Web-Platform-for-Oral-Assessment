import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Request as ExpressRequest } from 'express';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import {
  InstructorSubmissionQueryDto,
  MissingSubmissionsQueryDto,
  StudentSubmissionHistoryQueryDto,
} from './dto/submission-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserDocument, UserRole } from '../users/entities/user.entity';

// ─── JWT payload shape (what strategy actually attaches to req.user) ──────────
type JwtUser = { _id: { toString(): string }; userId: string; role: UserRole };
type AuthenticatedRequest = ExpressRequest & { user: JwtUser };

// ─── Multer storage config ────────────────────────────────────────────────────
const submissionStorage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'submissions'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

const ALLOWED_MIMETYPES = [
  'audio/mpeg', // .mp3
  'audio/wav', // .wav
  'audio/x-wav',
  'audio/mp4', // .m4a
  'audio/x-m4a',
  'video/mp4', // .mp4
  'video/x-msvideo', // .avi
  'video/quicktime', // .mov
];

const fileFilter = (
  _req: ExpressRequest,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed: mp3, wav, m4a, mp4, avi, mov`,
      ),
      false,
    );
  }
};

// ─── Controller ───────────────────────────────────────────────────────────────

@Controller('submissions')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  // ─── Helper: cast JwtUser to UserDocument for service methods ────────────
  // Safe because all service methods only access ._id and .role from the doc
  private asUser(jwtUser: JwtUser): UserDocument {
    return jwtUser as unknown as UserDocument;
  }

  // ─── CREATE (JSON body — instructor LIVE flow) ────────────────────────────

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR)
  create(
    @Body() createSubmissionDto: CreateSubmissionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.submissionsService.create(
      createSubmissionDto,
      this.asUser(req.user),
    );
  }

  // ─── DRAFT UPLOAD (multipart/form-data — student UPLOAD flow) ────────────

  @Post('draft/upload')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: submissionStorage,
      fileFilter,
      limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
    }),
  )
  async uploadDraft(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateSubmissionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    if (!file) throw new BadRequestException('A file is required');

    const fileUrl = `/uploads/submissions/${file.filename}`;
    // ✅ pass userId string — service resolves ObjectId internally
    return this.submissionsService.uploadDraft(
      body,
      fileUrl,
      file.size,
      req.user.userId,
    );
  }

  // ─── DRAFT WORKFLOW ───────────────────────────────────────────────────────

  @Post('draft/submit/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  submitDraft(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.submissionsService.submitDraft(id, this.asUser(req.user));
  }

  @Delete('draft/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  deleteDraft(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.submissionsService.deleteDraft(id, this.asUser(req.user));
  }

  @Get('draft/:assignmentId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  getDraft(
    @Param('assignmentId') assignmentId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.submissionsService.getDraft(
      assignmentId,
      this.asUser(req.user),
    );
  }

  // ─── INSTRUCTOR VIEWS ─────────────────────────────────────────────────────

  @Get('instructor/overview')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  findInstructorOverview(
    @Query() query: InstructorSubmissionQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.submissionsService.findInstructorOverview(
      query,
      this.asUser(req.user),
    );
  }

  @Get('instructor/missing')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  findMissingSubmissions(
    @Query() query: MissingSubmissionsQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.submissionsService.findMissingSubmissions(
      query,
      this.asUser(req.user),
    );
  }

  @Get('instructor/by-assignment/:assignmentId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  findByAssignment(
    @Param('assignmentId') assignmentId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.submissionsService.findByAssignment(
      assignmentId,
      this.asUser(req.user),
    );
  }

  // ─── STUDENT VIEWS ────────────────────────────────────────────────────────

  @Get('student/history')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  findStudentHistory(
    @Query() query: StudentSubmissionHistoryQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.submissionsService.findStudentHistory(
      query,
      this.asUser(req.user),
    );
  }

  // ─── SINGLE SUBMISSION ────────────────────────────────────────────────────

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.submissionsService.findOne(id, this.asUser(req.user));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.submissionsService.update(
      id,
      updateSubmissionDto,
      this.asUser(req.user),
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.submissionsService.remove(id, this.asUser(req.user));
  }
}
