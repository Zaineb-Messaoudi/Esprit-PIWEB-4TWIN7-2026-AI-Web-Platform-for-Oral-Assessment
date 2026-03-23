import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientID || !clientSecret) {
      throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set');
    }

    super({
      clientID,
      clientSecret,
      callbackURL: 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
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
          'Google profile is missing email or name fields',
        );
      }

      // ✅ Just return the raw profile data — let the controller handle DB logic
      done(null, {
        email,
        firstName,
        lastName,
        picture: profile.photos?.[0]?.value,
        googleId: profile.id, // ← this is what the controller expects
      });
    } catch (error) {
      done(
        error instanceof Error
          ? error
          : new Error('Google authentication failed'),
      );
    }
  }
}
