import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../users/entities/user.entity'; // Vérifie le chemin
import { SocialAuth } from './social-auth.schema';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(SocialAuth.name) private socialAuthModel: Model<SocialAuth>,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // --- MÉTHODE LOGIN CLASSIQUE (Celle qui te manque) ---
  async validateUser(username: string, pass: string): Promise<any> {
    // 1. Chercher l'utilisateur par son username
    const user = await this.userModel.findOne({ username }).select('+password');
    
    // 2. Vérifier si l'utilisateur existe et si le mot de passe correspond
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  // --- GÉNÉRATION DU TOKEN JWT ---
  async login(user: any) {
    const payload = { 
        username: user.username, 
        sub: user._id, 
        role: user.role 
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
    };
  }

  // --- MÉTHODE LOGIN SOCIAL (GOOGLE/FB) ---
  async validateSocialLogin(profile: any, provider: string) {
    const { id, emails, name, photos } = profile;
    const email = emails[0].value;

    const linkedAccount = await this.socialAuthModel.findOne({ socialId: id, provider });
    if (linkedAccount) {
      return this.userModel.findById(linkedAccount.userId);
    }

    const user = await this.userModel.findOne({ email });
    if (user) {
      await this.socialAuthModel.create({
        socialId: id,
        provider,
        userId: user._id,
      });
      return user;
    }

    throw new UnauthorizedException({
      message: 'USER_NOT_FOUND',
      socialInfo: {
        email,
        firstName: name?.givenName,
        lastName: name?.familyName,
        profileImage: photos[0]?.value,
        socialId: id,
        provider
      }
    });
  }
}