import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { FaceAuthService } from './face-auth.service';
import { FaceLoginDto, FaceEnrollDto } from './dto/face-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserDocument } from '../users/entities/user.entity';

type AuthenticatedRequest = Request & { user: UserDocument };

@Controller()
export class FaceAuthController {
  constructor(private faceAuthService: FaceAuthService) {}

  /**
   * POST /api/face-login
   * Public — no JWT required.
   * Body: { image: string }  ← base64 JPEG/PNG of the webcam frame
   * Returns: { access, refresh, username, user_type, user_id }
   *
   * The descriptor is extracted server-side using face-api.js + canvas,
   * exactly the same pipeline as FaceValidationService. No @vladmandic needed.
   */
  @HttpCode(HttpStatus.OK)
  @Post('api/face-login')
  faceLogin(@Body() dto: FaceLoginDto) {
    return this.faceAuthService.faceLogin(dto.image);
  }

  /**
   * POST /api/face-enroll
   * Protected — requires a valid JWT.
   * Body: { image: string }  ← base64 JPEG/PNG
   *
   * Use this from a profile/settings page for users who registered before
   * face auth was added. During normal sign-up, AuthService.register()
   * calls FaceAuthService.enrollFace() directly — no HTTP round-trip.
   */
  @UseGuards(JwtAuthGuard)
  @Post('api/face-enroll')
  enrollFace(@Req() req: AuthenticatedRequest, @Body() dto: FaceEnrollDto) {
    return this.faceAuthService.enrollFace(
      (req.user._id as unknown as string).toString(),
      dto.image,
    );
  }
}
