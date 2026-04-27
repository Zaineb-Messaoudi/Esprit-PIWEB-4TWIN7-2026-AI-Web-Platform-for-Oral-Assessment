import {
  Injectable,
  NotFoundException,
  ConflictException,
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
} from './admin.dto';

// Typed lean results to avoid unsafe `any`
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

  // ─── Students ──────────────────────────────────────────────────────────────

  async getAllStudents() {
    const users = await this.userModel
      .find({ role: UserRole.STUDENT })
      .lean<LeanUser[]>();

    const userIds = users.map((u) => u._id);
    const profiles = await this.studentProfileModel
      .find({ userId: { $in: userIds } })
      .lean<LeanStudentProfile[]>();

    const profileMap = new Map<string, LeanStudentProfile>(
      profiles.map((p) => [p.userId.toString(), p]),
    );

    return users.map((user) => {
      const profile = profileMap.get(user._id.toString()) ?? null;
      return {
        id: user._id.toString(),
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        is_active: user.isActive,
        // minimal fields for card display only
        profile_image: user.profileImage ?? null,
        fields: profile
          ? [profile.major, profile.level, String(profile.enrollmentYear)]
          : [],
      };
    });
  }

  async getStudentDetail(id: string) {
    const user = await this.userModel.findById(id);
    if (!user || user.role !== UserRole.STUDENT) {
      throw new NotFoundException('Student not found');
    }

    const [profile, activityLog] = await Promise.all([
      this.studentProfileModel
        .findOne({ userId: user._id })
        .lean<LeanStudentProfile>(),
      this.auditService.getLog(id),
    ]);

    return {
      id: user._id.toString(),
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      cin: user.cin ?? null,
      phone_num: user.phone,
      birth_date: user.dateOfBirth,
      is_active: user.isActive,
      is_email_verified: user.isEmailVerified,
      profile_image: user.profileImage ?? null,
      oauth_providers: user.oauthProviders ?? [],
      fields: profile
        ? [profile.major, profile.level, String(profile.enrollmentYear)]
        : [],
      profile: profile
        ? {
            level: profile.level,
            major: profile.major,
            enrollmentYear: profile.enrollmentYear,
          }
        : null,
      activity_log: activityLog,
    };
  }

  async updateStudent(id: string, dto: UpdateStudentDto) {
    const user = await this.userModel.findById(id);
    if (!user || user.role !== UserRole.STUDENT) {
      throw new NotFoundException('Student not found');
    }

    const { level, major, enrollmentYear, ...userFields } = dto;

    if (userFields.firstName) user.firstName = userFields.firstName;
    if (userFields.lastName) user.lastName = userFields.lastName;
    if (userFields.email) user.email = userFields.email;
    if (userFields.phone) user.phone = userFields.phone;
    if (userFields.cin !== undefined) user.cin = userFields.cin;
    if (userFields.dateOfBirth)
      user.dateOfBirth = new Date(userFields.dateOfBirth);
    await user.save();

    if (level ?? major ?? enrollmentYear) {
      await this.studentProfileModel.findOneAndUpdate(
        { userId: user._id },
        {
          ...(level && { level }),
          ...(major && { major }),
          ...(enrollmentYear && { enrollmentYear }),
        },
        { new: true },
      );
    }

    const profile = await this.studentProfileModel
      .findOne({ userId: user._id })
      .lean<LeanStudentProfile>();

    return {
      id: user._id.toString(),
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      cin: user.cin ?? null,
      phone_num: user.phone,
      birth_date: user.dateOfBirth,
      is_active: user.isActive,
      fields: profile
        ? [profile.major, profile.level, String(profile.enrollmentYear)]
        : [],
      profile,
    };
  }

  async deactivateStudent(id: string) {
    const user = await this.userModel.findById(id);
    if (!user || user.role !== UserRole.STUDENT) {
      throw new NotFoundException('Student not found');
    }
    user.isActive = false;
    await user.save();
    return { message: 'Student deactivated successfully' };
  }

  async activateStudent(id: string) {
    const user = await this.userModel.findById(id);
    if (!user || user.role !== UserRole.STUDENT) {
      throw new NotFoundException('Student not found');
    }
    user.isActive = true;
    await user.save();
    return { message: 'Student activated successfully' };
  }

  async hardDeleteStudent(id: string) {
    const user = await this.userModel.findById(id);
    if (!user || user.role !== UserRole.STUDENT) {
      throw new NotFoundException('Student not found');
    }
    await this.studentProfileModel.deleteOne({ userId: user._id });
    await this.userModel.deleteOne({ _id: user._id });
    return { message: 'Student permanently deleted' };
  }

  // ─── Teachers ──────────────────────────────────────────────────────────────

  async getAllTeachers() {
    const users = await this.userModel
      .find({ role: UserRole.INSTRUCTOR })
      .lean<LeanUser[]>();

    const userIds = users.map((u) => u._id);
    const profiles = await this.instructorProfileModel
      .find({ userId: { $in: userIds } })
      .lean<LeanInstructorProfile[]>();

    const profileMap = new Map<string, LeanInstructorProfile>(
      profiles.map((p) => [p.userId.toString(), p]),
    );

    return users.map((user) => {
      const profile = profileMap.get(user._id.toString()) ?? null;
      return {
        id: user._id.toString(),
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        is_active: user.isActive,
        profile_image: user.profileImage ?? null,
        fields: profile ? [profile.department] : [],
      };
    });
  }

  async getTeacherDetail(id: string) {
    const user = await this.userModel.findById(id);
    if (!user || user.role !== UserRole.INSTRUCTOR) {
      throw new NotFoundException('Teacher not found');
    }

    const [profile, activityLog] = await Promise.all([
      this.instructorProfileModel
        .findOne({ userId: user._id })
        .lean<LeanInstructorProfile>(),
      this.auditService.getLog(id),
    ]);

    return {
      id: user._id.toString(),
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      cin: user.cin ?? null,
      phone_num: user.phone,
      birth_date: user.dateOfBirth,
      is_active: user.isActive,
      is_email_verified: user.isEmailVerified,
      profile_image: user.profileImage ?? null,
      oauth_providers: user.oauthProviders ?? [],
      fields: profile ? [profile.department] : [],
      profile: profile
        ? {
            department: profile.department,
            bio: profile.bio ?? null,
          }
        : null,
      activity_log: activityLog,
    };
  }

  async createTeacher(dto: CreateTeacherDto) {
    const exists = await this.userModel.findOne({
      $or: [{ email: dto.email }, { username: dto.username }],
    });
    if (exists) {
      throw new ConflictException('Email or username already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel.create({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: UserRole.INSTRUCTOR,
      phone: dto.phone,
      dateOfBirth: new Date(dto.dateOfBirth),
      cin: dto.cin,
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
      is_active: user.isActive,
      fields: [profile.department],
      profile,
    };
  }

  async updateTeacher(id: string, dto: UpdateTeacherDto) {
    const user = await this.userModel.findById(id);
    if (!user || user.role !== UserRole.INSTRUCTOR) {
      throw new NotFoundException('Teacher not found');
    }

    const { department, bio, ...userFields } = dto;

    if (userFields.firstName) user.firstName = userFields.firstName;
    if (userFields.lastName) user.lastName = userFields.lastName;
    if (userFields.email) user.email = userFields.email;
    if (userFields.phone) user.phone = userFields.phone;
    if (userFields.cin !== undefined) user.cin = userFields.cin;
    if (userFields.dateOfBirth)
      user.dateOfBirth = new Date(userFields.dateOfBirth);
    await user.save();

    if (department ?? bio !== undefined) {
      await this.instructorProfileModel.findOneAndUpdate(
        { userId: user._id },
        {
          ...(department && { department }),
          ...(bio !== undefined && { bio }),
        },
        { new: true },
      );
    }

    const profile = await this.instructorProfileModel
      .findOne({ userId: user._id })
      .lean<LeanInstructorProfile>();

    return {
      id: user._id.toString(),
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      is_active: user.isActive,
      fields: profile ? [profile.department] : [],
      profile,
    };
  }

  async deactivateTeacher(id: string) {
    const user = await this.userModel.findById(id);
    if (!user || user.role !== UserRole.INSTRUCTOR) {
      throw new NotFoundException('Teacher not found');
    }
    user.isActive = false;
    await user.save();
    return { message: 'Teacher deactivated successfully' };
  }

  async activateTeacher(id: string) {
    const user = await this.userModel.findById(id);
    if (!user || user.role !== UserRole.INSTRUCTOR) {
      throw new NotFoundException('Teacher not found');
    }
    user.isActive = true;
    await user.save();
    return { message: 'Teacher activated successfully' };
  }

  async hardDeleteTeacher(id: string) {
    const user = await this.userModel.findById(id);
    if (!user || user.role !== UserRole.INSTRUCTOR) {
      throw new NotFoundException('Teacher not found');
    }
    await this.instructorProfileModel.deleteOne({ userId: user._id });
    await this.userModel.deleteOne({ _id: user._id });
    return { message: 'Teacher permanently deleted' };
  }
}
