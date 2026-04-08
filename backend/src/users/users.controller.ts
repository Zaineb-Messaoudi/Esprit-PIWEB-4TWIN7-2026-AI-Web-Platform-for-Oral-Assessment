import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { UsersService } from './users.service';
import {
  UpdateProfileDto,
  UpdateStudentProfileDto,
  UpdateInstructorProfileDto,
} from './dto/update-user.dto';
import { ChangePasswordDto } from '../auth/dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserDocument } from './entities/user.entity';
import { AuditService } from '../audit/audit.service';

type AuthenticatedRequest = ExpressRequest & { user: UserDocument };

@UseGuards(JwtAuthGuard)
@Controller('api')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  // ─── Only let a user touch their own data ──────────────────────────────────

  private assertSelf(req: AuthenticatedRequest, userId: string): void {
    if (req.user._id.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }

  // ─── Shared profile ─────────────────────────────────────────────────────────

  @Get('profile/:userId')
  getProfile(
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    this.assertSelf(req, userId);
    return this.usersService.getProfile(userId);
  }

  @Put('profile/:userId')
  updateProfile(
    @Param('userId') userId: string,
    @Body() dto: UpdateProfileDto,
    @Request() req: AuthenticatedRequest,
  ) {
    this.assertSelf(req, userId);
    return this.usersService.updateProfile(userId, dto, req);
  }

  // ─── Student profile ─────────────────────────────────────────────────────────

  @Get('profile/:userId/student')
  getStudentProfile(
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    this.assertSelf(req, userId);
    return this.usersService.getStudentProfile(userId);
  }

  @Put('profile/:userId/student')
  updateStudentProfile(
    @Param('userId') userId: string,
    @Body() dto: UpdateStudentProfileDto,
    @Request() req: AuthenticatedRequest,
  ) {
    this.assertSelf(req, userId);
    return this.usersService.updateStudentProfile(userId, dto, req);
  }

  // ─── Instructor profile ──────────────────────────────────────────────────────

  @Get('profile/:userId/instructor')
  getInstructorProfile(
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    this.assertSelf(req, userId);
    return this.usersService.getInstructorProfile(userId);
  }

  @Put('profile/:userId/instructor')
  updateInstructorProfile(
    @Param('userId') userId: string,
    @Body() dto: UpdateInstructorProfileDto,
    @Request() req: AuthenticatedRequest,
  ) {
    this.assertSelf(req, userId);
    return this.usersService.updateInstructorProfile(userId, dto, req);
  }

  // ─── Password ────────────────────────────────────────────────────────────────

  @Put('change_password/:userId')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Param('userId') userId: string,
    @Body() dto: ChangePasswordDto,
    @Request() req: AuthenticatedRequest,
  ) {
    this.assertSelf(req, userId);
    return this.usersService.changePassword(userId, dto, req);
  }

  // ─── Activity log ────────────────────────────────────────────────────────────

  @Get('activity/:userId')
  getActivity(
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    this.assertSelf(req, userId);
    return this.auditService.getLog(userId);
  }
}
