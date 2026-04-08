import { Module } from '@nestjs/common';
import { FaceAuthService } from './face-auth.service';
import { FaceAuthController } from './face-auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { User, UserSchema } from '../users/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({}),
  ],
  controllers: [FaceAuthController],
  providers: [FaceAuthService],
  exports: [FaceAuthService],
})
export class FaceAuthModule {}
