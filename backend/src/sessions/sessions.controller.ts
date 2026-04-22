import {
  Controller,
  Post,
  Put,
  Get,
  Patch,
  Body,
  Param,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

type AuthRequest = ExpressRequest & {
  user: { userId: string; role: UserRole };
};

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  // ─── INSTRUCTOR ───────────────────────────────────────────────────────────

  // POST /sessions
  @Post()
  @Roles(UserRole.INSTRUCTOR)
  create(@Body() dto: CreateSessionDto, @Request() req: AuthRequest) {
    return this.sessionsService.create(dto, req.user.userId);
  }

  // PUT /sessions/:id
  @Put(':id')
  @Roles(UserRole.INSTRUCTOR)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
    @Request() req: AuthRequest,
  ) {
    return this.sessionsService.update(id, dto, req.user.userId);
  }

  // PATCH /sessions/:id/cancel
  @Patch(':id/cancel')
  @Roles(UserRole.INSTRUCTOR)
  cancel(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.sessionsService.cancel(id, req.user.userId);
  }

  // PATCH /sessions/:id/start — open session on the scheduled day
  @Patch(':id/start')
  @Roles(UserRole.INSTRUCTOR)
  startSession(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.sessionsService.startSession(id, req.user.userId);
  }

  // GET /sessions/:id/students — A-Z student list with recording state
  @Get(':id/students')
  @Roles(UserRole.INSTRUCTOR)
  getSessionStudents(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.sessionsService.getSessionStudents(id, req.user.userId);
  }

  // PATCH /sessions/:id/next/:studentId — save & advance to next student
  @Patch(':id/next/:studentId')
  @Roles(UserRole.INSTRUCTOR)
  nextStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Request() req: AuthRequest,
  ) {
    return this.sessionsService.nextStudent(id, studentId, req.user.userId);
  }

  // PATCH /sessions/:id/skip/:studentId — skip a student
  @Patch(':id/skip/:studentId')
  @Roles(UserRole.INSTRUCTOR)
  skipStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Request() req: AuthRequest,
  ) {
    return this.sessionsService.skipStudent(id, studentId, req.user.userId);
  }

  // PATCH /sessions/:id/complete
  @Patch(':id/complete')
  @Roles(UserRole.INSTRUCTOR)
  completeSession(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.sessionsService.completeSession(id, req.user.userId);
  }

  // GET /sessions/class/:classId — all sessions for a class
  @Get('class/:classId')
  @Roles(UserRole.INSTRUCTOR, UserRole.STUDENT)
  findByClass(@Param('classId') classId: string) {
    return this.sessionsService.findByClass(classId);
  }

  // GET /sessions/:id — single session detail
  @Get(':id')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.STUDENT)
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  // ─── STUDENT ──────────────────────────────────────────────────────────────

  // GET /sessions/:id/my-slot — student sees their position + ETA
  @Get(':id/my-slot')
  @Roles(UserRole.STUDENT)
  getMySlot(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.sessionsService.getMySlot(id, req.user.userId);
  }
}
