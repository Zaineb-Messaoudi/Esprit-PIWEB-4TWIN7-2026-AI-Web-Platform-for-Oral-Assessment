import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private authService: AuthService) {
    const clientID = process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;

    if (!clientID || !clientSecret) {
      throw new Error('FACEBOOK_APP_ID and FACEBOOK_APP_SECRET must be set');
    }

    super({
      clientID,
      clientSecret,
      callbackURL: 'http://localhost:3000/auth/facebook/callback',
      scope: ['email'],
      profileFields: ['id', 'emails', 'name', 'photos'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: unknown) => void,
  ) {
    try {
      const email = profile.emails?.[0]?.value;
      const firstName = profile.name?.givenName;
      const lastName = profile.name?.familyName;

      if (!email || !firstName || !lastName) {
        throw new UnauthorizedException(
          'Facebook profile is missing email or name fields',
        );
      }

      const result = await this.authService.findOrCreateOAuthUser({
        email,
        firstName,
        lastName,
        profileImage: profile.photos?.[0]?.value,
        provider: 'facebook',
        socialId: profile.id, // ← added
      });

      done(null, result);
    } catch (error) {
      done(
        error instanceof Error
          ? error
          : new Error('Facebook authentication failed'),
      );
    }
  }
}
