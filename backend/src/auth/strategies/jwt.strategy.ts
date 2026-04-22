import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../users/entities/user.entity';

// lean() returns a plain object — User class has no _id, so we extend it
type LeanUser = User & { _id: Types.ObjectId };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: { sub: string; username: string; role: string }) {
    const user = await this.userModel.findById(payload.sub).lean<LeanUser>();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    if (user.banExpiresAt && new Date(user.banExpiresAt) > new Date()) {
      throw new UnauthorizedException(
        `Account is temporarily banned until ${new Date(user.banExpiresAt).toISOString()}`,
      );
    }

    return {
      _id: user._id,
      userId: user._id.toString(),
      role: user.role,
    };
  }
}
