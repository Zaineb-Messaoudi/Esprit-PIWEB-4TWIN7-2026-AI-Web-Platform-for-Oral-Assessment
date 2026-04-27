import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import {
  User,
  UserDocument,
  ActivityEventType,
  UserRole,
} from './entities/user.entity';
import {
  StudentProfile,
  StudentProfileDocument,
} from './entities/student-profile.entity';
import {
  InstructorProfile,
  InstructorProfileDocument,
} from './entities/instructor-profile.entity';
import { ChangePasswordDto } from '../auth/dto/change-password.dto';
import { MailService } from '../auth/mail.service';
import {
  UpdateProfileDto,
  UpdateStudentProfileDto,
  UpdateInstructorProfileDto,
} from './dto/update-user.dto';
import { FaceValidationService } from './face-validation.service';
import { AuditService } from '../audit/audit.service';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(StudentProfile.name)
    private readonly studentModel: Model<StudentProfileDocument>,
    @InjectModel(InstructorProfile.name)
    private readonly instructorModel: Model<InstructorProfileDocument>,
    private readonly mailService: MailService,
    private readonly faceValidationService: FaceValidationService,
    private readonly auditService: AuditService,
  ) {}

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private toObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID');
    }
    return new Types.ObjectId(id);
  }

  private async findByIdOrFail(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(this.toObjectId(id));
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ─── Shared profile (all roles) ────────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await this.findByIdOrFail(userId);

    return {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profileImage: user.profileImage ?? null,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      isEmailVerified: user.isEmailVerified,
      emailPreferences: user.emailPreferences,
    };
  }

  // ─── Student profile ────────────────────────────────────────────────────────

  async getStudentProfile(userId: string) {
    const [base, extra] = await Promise.all([
      this.getProfile(userId),
      this.studentModel.findOne({ userId: this.toObjectId(userId) }),
    ]);

    return {
      ...base,
      studentProfile: extra
        ? {
            level: extra.level,
            major: extra.major,
            enrollmentYear: extra.enrollmentYear,
          }
        : null,
    };
  }

  async updateStudentProfile(
    userId: string,
    dto: UpdateStudentProfileDto,
    req?: Request,
  ) {
    const user = await this.findByIdOrFail(userId);

    if (user.role !== UserRole.STUDENT) {
      throw new BadRequestException('User is not a student');
    }

    const updated = await this.studentModel.findOneAndUpdate(
      { userId: this.toObjectId(userId) },
      { $set: dto },
      { new: true, upsert: true }, // upsert: creates if missing
    );

    void this.auditService.log({
      userId,
      event: ActivityEventType.PROFILE_UPDATED,
      req,
    });

    return {
      message: 'Student profile updated successfully',
      studentProfile: updated,
    };
  }

  // ─── Instructor profile ─────────────────────────────────────────────────────

  async getInstructorProfile(userId: string) {
    const [base, extra] = await Promise.all([
      this.getProfile(userId),
      this.instructorModel.findOne({ userId: this.toObjectId(userId) }),
    ]);

    return {
      ...base,
      instructorProfile: extra
        ? {
            department: extra.department,
            bio: extra.bio ?? null,
          }
        : null,
    };
  }

  async updateInstructorProfile(
    userId: string,
    dto: UpdateInstructorProfileDto,
    req?: Request,
  ) {
    const user = await this.findByIdOrFail(userId);

    if (user.role !== UserRole.INSTRUCTOR) {
      throw new BadRequestException('User is not an instructor');
    }

    const updated = await this.instructorModel.findOneAndUpdate(
      { userId: this.toObjectId(userId) },
      { $set: dto },
      { new: true, upsert: true },
    );

    void this.auditService.log({
      userId,
      event: ActivityEventType.PROFILE_UPDATED,
      req,
    });

    return {
      message: 'Instructor profile updated successfully',
      instructorProfile: updated,
    };
  }

  // ─── Update shared profile fields ──────────────────────────────────────────

  async updateProfile(userId: string, dto: UpdateProfileDto, req?: Request) {
    const user = await this.findByIdOrFail(userId);

    if (dto.profileImage !== undefined && dto.profileImage !== '') {
      const { valid, error } = await this.faceValidationService.validateFace(
        dto.profileImage,
      );
      if (!valid)
        throw new BadRequestException(error ?? 'Invalid profile image');
    }

    if (dto.username !== undefined) {
      const taken = await this.userModel.findOne({
        username: dto.username.toLowerCase().trim(),
        _id: { $ne: this.toObjectId(userId) },
      });
      if (taken) throw new ConflictException('Username is already taken');
      user.username = dto.username.toLowerCase().trim();
    }

    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.dateOfBirth !== undefined)
      user.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.profileImage !== undefined) user.profileImage = dto.profileImage;

    await user.save();

    void this.auditService.log({
      userId,
      event: ActivityEventType.PROFILE_UPDATED,
      req,
    });

    return {
      message: 'Profile updated successfully',
      profile: await this.getProfile(userId),
    };
  }

  // ─── Change password ────────────────────────────────────────────────────────

  async changePassword(userId: string, dto: ChangePasswordDto, req?: Request) {
    if (dto.new_password !== dto.confirm_password) {
      throw new BadRequestException('New passwords do not match');
    }

    const user = await this.userModel
      .findById(this.toObjectId(userId))
      .select('+password');

    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.old_password, user.password);
    if (!isMatch)
      throw new BadRequestException('Current password is incorrect');

    if (await bcrypt.compare(dto.new_password, user.password)) {
      throw new BadRequestException(
        'New password must differ from the current password',
      );
    }

    user.password = await bcrypt.hash(dto.new_password, SALT_ROUNDS);
    await user.save();

    void this.auditService.log({
      userId,
      event: ActivityEventType.PASSWORD_CHANGED,
      req,
    });

    this.mailService
      .sendPasswordChangedConfirmation(user._id, user.email, user.firstName)
      .catch((err) =>
        console.error('Password-change confirmation email failed:', err),
      );

    return { message: 'Password changed successfully' };
  }
}
