import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/entities/user.entity'; 
import { SocialAuth, SocialAuthSchema } from './social-auth.schema'; // Nouveau
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    UsersModule, 
    PassportModule,
    JwtModule.register({
      secret: 'TON_SECRET', 
      signOptions: { expiresIn: '1d' },
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: SocialAuth.name, schema: SocialAuthSchema } // On ajoute la liaison ici
    ])
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}