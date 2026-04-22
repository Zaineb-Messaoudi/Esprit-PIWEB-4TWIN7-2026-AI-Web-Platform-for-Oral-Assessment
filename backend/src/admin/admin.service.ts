import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument, UserRole } from '../users/entities/user.entity';
import {
  StudentProfile,
  StudentProfileDocument,
} from '../users/entities/student-profile.entity';
import {
  InstructorProfile,
  InstructorProfileDocument,
} from '../users/entities/instructor-profile.entity';
import { AuditService } from '../audit/audit.service';

import {
  UpdateStudentDto,
  UpdateTeacherDto,
  CreateTeacherDto,
  BulkActionDto,
} from './admin.dto';

type LeanUser = Omit<User, '_id'> & { _id: Types.ObjectId };
type LeanStudentProfile = Omit<StudentProfile, '_id'> & {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
};
type LeanInstructorProfile = Omit<InstructorProfile, '_id'> & {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
};

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(StudentProfile.name)
    private studentProfileModel: Model<StudentProfileDocument>,
    @InjectModel(InstructorProfile.name)
    private instructorProfileModel: Model<InstructorProfileDocument>,
    private readonly auditService: AuditService,
  ) {}

  // ─────────────────────────────────────────────
  // USERS CORE
  // ─────────────────────────────────────────────

  async getAllUsers() {
    return this.userModel.find().lean();
  }

  async getUserDetail(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const profile =
      user.role === UserRole.STUDENT
        ? await this.studentProfileModel.findOne({ userId: user._id }).lean()
        : await this.instructorProfileModel
            .findOne({ userId: user._id })
            .lean();

    const activity_log = await this.auditService.getLog(id);

    return {
      id: user._id.toString(),
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      phone_num: user.phone,
      cin: user.cin ?? null,
      birth_date: user.dateOfBirth,
      role: user.role,
      is_active: user.isActive,
      is_email_verified: user.isEmailVerified,
      profile_image: user.profileImage ?? null,
      profile,
      activity_log,
    };
  }

  // ─────────────────────────────────────────────
  // STUDENTS
  // ─────────────────────────────────────────────

  async getAllStudents() {
    const users = await this.userModel
      .find({ role: UserRole.STUDENT })
      .lean<LeanUser[]>();

    const profiles = await this.studentProfileModel
      .find({ userId: { $in: users.map((u) => u._id) } })
      .lean<LeanStudentProfile[]>();

    const map = new Map(profiles.map((p) => [p.userId.toString(), p]));

    return users.map((u) => ({
      id: u._id.toString(),
      first_name: u.firstName,
      last_name: u.lastName,
      email: u.email,
      phone_num: u.phone,
      cin: u.cin ?? null,
      birth_date: u.dateOfBirth,
      is_active: u.isActive,
      profile_image: u.profileImage ?? null,
      profile: map.get(u._id.toString()) ?? null,
    }));
  }

  // ✅ FIX: Previously returned raw Mongoose document — the frontend detail
  // view got an object with Mongoose internals ($__, $isNew, etc.) instead
  // of plain fields, so first_name/email/activity_log were all undefined.
  async getStudentDetail(id: string) {
    const user = await this.userModel.findById(id);
    if (!user || user.role !== UserRole.STUDENT) {
      throw new NotFoundException('Student not found');
    }

    const profile = await this.studentProfileModel
      .findOne({ userId: user._id })
      .lean();

    const activity_log = await this.auditService.getLog(id);

    return {
      id: user._id.toString(),
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      phone_num: user.phone,
      cin: user.cin ?? null,
      birth_date: user.dateOfBirth,
      role: user.role,
      is_active: user.isActive,
      is_email_verified: user.isEmailVerified,
      profile_image: user.profileImage ?? null,
      profile,
      activity_log,
    };
  }

  async updateStudent(id: string, dto: UpdateStudentDto) {
    const user = await this.userModel.findById(id);
    if (!user || user.role !== UserRole.STUDENT) {
      throw new NotFoundException('Student not found');
    }

    Object.assign(user, {
      firstName: dto.firstName ?? user.firstName,
      lastName: dto.lastName ?? user.lastName,
      email: dto.email ?? user.email,
      phone: dto.phone ?? user.phone,
      cin: dto.cin ?? user.cin,
      dateOfBirth: dto.dateOfBirth
        ? new Date(dto.dateOfBirth)
        : user.dateOfBirth,
    });

    await user.save();

    if (dto.level || dto.major || dto.enrollmentYear) {
      // ✅ upsert:true handles missing profiles gracefully
      await this.studentProfileModel.findOneAndUpdate(
        { userId: user._id },
        {
          ...(dto.level && { level: dto.level }),
          ...(dto.major && { major: dto.major }),
          ...(dto.enrollmentYear && { enrollmentYear: dto.enrollmentYear }),
        },
        { upsert: true },
      );
    }

    return { message: 'Student updated' };
  }

  // ─────────────────────────────────────────────
  // TEACHERS
  // ─────────────────────────────────────────────

  async getAllTeachers() {
    const users = await this.userModel
      .find({ role: UserRole.INSTRUCTOR })
      .lean<LeanUser[]>();

    const profiles = await this.instructorProfileModel
      .find({ userId: { $in: users.map((u) => u._id) } })
      .lean<LeanInstructorProfile[]>();

    const map = new Map(profiles.map((p) => [p.userId.toString(), p]));

    return users.map((u) => ({
      id: u._id.toString(),
      first_name: u.firstName,
      last_name: u.lastName,
      email: u.email,
      phone_num: u.phone,
      cin: u.cin ?? null,
      birth_date: u.dateOfBirth,
      is_active: u.isActive,
      profile_image: u.profileImage ?? null,
      profile: map.get(u._id.toString()) ?? null,
    }));
  }

  async createTeacher(dto: CreateTeacherDto) {
    const exists = await this.userModel.findOne({
      $or: [{ email: dto.email }, { username: dto.username }],
    });

    if (exists) throw new ConflictException('User already exists');

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      username: dto.username,
      email: dto.email,
      password: hashed,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      dateOfBirth: new Date(dto.dateOfBirth),
      cin: dto.cin,
      role: UserRole.INSTRUCTOR,
    });

    const profile = await this.instructorProfileModel.create({
      userId: user._id,
      department: dto.department,
      bio: dto.bio,
    });

    return {
      id: user._id.toString(),
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      profile,
    };
  }

  async updateTeacher(id: string, dto: UpdateTeacherDto) {
    const user = await this.userModel.findById(id);
    if (!user || user.role !== UserRole.INSTRUCTOR) {
      throw new NotFoundException('Teacher not found');
    }

    Object.assign(user, {
      firstName: dto.firstName ?? user.firstName,
      lastName: dto.lastName ?? user.lastName,
      email: dto.email ?? user.email,
      phone: dto.phone ?? user.phone,
      cin: dto.cin ?? user.cin,
      dateOfBirth: dto.dateOfBirth
        ? new Date(dto.dateOfBirth)
        : user.dateOfBirth,
    });

    await user.save();

    if (dto.department || dto.bio !== undefined) {
      await this.instructorProfileModel.findOneAndUpdate(
        { userId: user._id },
        {
          ...(dto.department && { department: dto.department }),
          ...(dto.bio !== undefined && { bio: dto.bio }),
        },
        { upsert: true },
      );
    }

    return { message: 'Teacher updated' };
  }

  // ─────────────────────────────────────────────
  // ACTIVATE / DEACTIVATE / BAN
  // ─────────────────────────────────────────────

  async activateUser(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    await this.userModel.findByIdAndUpdate(id, {
      isActive: true,
      bannedUntil: null,
    });
    return { message: 'User activated' };
  }

  async deactivateUser(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    await this.userModel.findByIdAndUpdate(id, { isActive: false });
    return { message: 'User deactivated' };
  }

  async deactivateForPeriod(id: string, hours: number) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    const bannedUntil = new Date();
    bannedUntil.setHours(bannedUntil.getHours() + hours);
    await this.userModel.findByIdAndUpdate(id, {
      isActive: false,
      bannedUntil,
    });
    return { message: 'User temporarily banned' };
  }

  // ─────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────

  async deleteUser(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    await this.studentProfileModel.deleteOne({ userId: id });
    await this.instructorProfileModel.deleteOne({ userId: id });
    await this.userModel.deleteOne({ _id: id });
    return { message: 'User deleted' };
  }

  // ─────────────────────────────────────────────
  // BULK ACTIONS
  // ─────────────────────────────────────────────

  async bulkUserAction(dto: BulkActionDto) {
    const { userIds, action, duration } = dto;

    switch (action) {
      case 'activate':
        await this.userModel.updateMany(
          { _id: { $in: userIds } },
          { isActive: true, bannedUntil: null },
        );
        break;

      case 'deactivate':
        await this.userModel.updateMany(
          { _id: { $in: userIds } },
          { isActive: false },
        );
        break;

      case 'delete':
        await this.studentProfileModel.deleteMany({
          userId: { $in: userIds },
        });
        await this.instructorProfileModel.deleteMany({
          userId: { $in: userIds },
        });
        await this.userModel.deleteMany({ _id: { $in: userIds } });
        break;

      case 'ban': {
        if (!duration) throw new BadRequestException('duration required');
        const bannedUntil = new Date();
        bannedUntil.setHours(bannedUntil.getHours() + duration);
        await this.userModel.updateMany(
          { _id: { $in: userIds } },
          { isActive: false, bannedUntil },
        );
        break;
      }

      default:
        throw new BadRequestException('Invalid action');
    }

    return { message: 'Bulk action completed' };
  }

  // ─────────────────────────────────────────────
  // AUDIT
  // ─────────────────────────────────────────────

  async getUserAudit(id: string) {
    return this.auditService.getLog(id);
  }
}
