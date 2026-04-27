import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './entities/user.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { FaceValidationService } from './face-validation.service';
import { AuditModule } from '../audit/audit.module';
import {
  StudentProfile,
  StudentProfileSchema,
} from './entities/student-profile.entity';
import {
  InstructorProfile,
  InstructorProfileSchema,
} from './entities/instructor-profile.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: StudentProfile.name, schema: StudentProfileSchema },
      { name: InstructorProfile.name, schema: InstructorProfileSchema },
    ]),
    AuthModule,
    AuditModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, FaceValidationService],
  exports: [MongooseModule],
})
export class UsersModule {}
