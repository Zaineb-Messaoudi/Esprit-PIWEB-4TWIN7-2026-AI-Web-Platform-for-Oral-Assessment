import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData, createCanvas, loadImage } from 'canvas';
import * as path from 'path';
import { User, UserDocument } from '../users/entities/user.entity';

// ── Monkey-patch exactly like your existing FaceValidationService ─────────────
faceapi.env.monkeyPatch({
  Canvas: Canvas as unknown as typeof HTMLCanvasElement,
  Image: Image as unknown as typeof HTMLImageElement,
  ImageData: ImageData as unknown as typeof globalThis.ImageData,
});

// ── Euclidean distance between two 128-d descriptors ─────────────────────────
function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

// Lower = stricter. 0.6 is face-api default, 0.5 is stricter, 0.45 is very strict.
// For webcam captures, 0.55 is a good balance of accuracy vs tolerance.
const MATCH_THRESHOLD = 0.55;

// TinyFaceDetector options — inputSize must be a multiple of 32.
// 416 works well for webcam frames (320×240 up to 1280×720).
// scoreThreshold: 0.3 is more lenient than the default 0.5 — important for
// webcam stills that may have motion blur, backlight, or slight angles.
const DETECTOR_OPTIONS = new faceapi.TinyFaceDetectorOptions({
  inputSize: 416,
  scoreThreshold: 0.3,
});

@Injectable()
export class FaceAuthService implements OnModuleInit {
  private readonly logger = new Logger(FaceAuthService.name);
  private modelsLoaded = false;
  private readonly modelsPath = path.join(process.cwd(), 'models');

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  // ── Load models on startup (same models folder as FaceValidationService) ──
  async onModuleInit(): Promise<void> {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromDisk(this.modelsPath),
        faceapi.nets.faceLandmark68TinyNet.loadFromDisk(this.modelsPath),
        faceapi.nets.faceRecognitionNet.loadFromDisk(this.modelsPath),
      ]);
      this.modelsLoaded = true;
      this.logger.log('Face recognition models loaded successfully');
    } catch (err) {
      this.logger.error('Failed to load face recognition models', err);
    }
  }

  // ── Shared: base64 image → canvas → 128-d descriptor ─────────────────────
  private async extractDescriptorFromBase64(
    base64Image: string,
  ): Promise<Float32Array | null> {
    if (!this.modelsLoaded) {
      this.logger.warn(
        'Face models not loaded — descriptor extraction skipped',
      );
      return null;
    }

    // Strip data URI prefix if present (e.g. "data:image/jpeg;base64,")
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Log image size to help diagnose bad captures
    this.logger.debug(`Image buffer size: ${buffer.length} bytes`);

    let img: Awaited<ReturnType<typeof loadImage>>;
    try {
      img = await loadImage(buffer);
    } catch (err) {
      this.logger.warn(`loadImage failed: ${(err as Error).message}`);
      return null;
    }

    this.logger.debug(`Loaded image: ${img.width}×${img.height}px`);

    // Draw onto canvas so face-api.js can process it
    const canvas = createCanvas(img.width, img.height);
    canvas.getContext('2d').drawImage(img as unknown as HTMLImageElement, 0, 0);

    // withFaceLandmarks(true) = use the tiny 68-point landmark model
    const result = await faceapi
      .detectSingleFace(
        canvas as unknown as HTMLCanvasElement,
        DETECTOR_OPTIONS,
      )
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    if (!result) {
      this.logger.warn(
        `No face detected in image (${img.width}×${img.height}px, ${buffer.length} bytes)`,
      );
    } else {
      this.logger.debug(
        `Face detected — detection score: ${result.detection.score.toFixed(3)}`,
      );
    }

    return result?.descriptor ?? null;
  }

  // ── Enroll: called right after register() stores the user ─────────────────
  // Used internally by AuthService.register() — not exposed as its own endpoint.
  // Also available as POST /api/face-enroll for existing users (via controller).
  async enrollFace(
    userId: string,
    base64Image: string,
  ): Promise<{ message: string }> {
    const descriptor = await this.extractDescriptorFromBase64(base64Image);

    if (!descriptor) {
      throw new BadRequestException(
        'No face detected in the provided image. Please use a clear, well-lit photo.',
      );
    }

    await this.userModel.updateOne(
      { _id: userId },
      {
        // Save as profileImage so the user's photo appears everywhere in the app
        profileImage: base64Image,
        faceIdData: {
          descriptor: Array.from(descriptor),
          enrolledAt: new Date().toISOString(),
        },
      },
    );

    this.logger.log(`Face enrolled for user ${userId}`);
    return { message: 'Face enrolled successfully.' };
  }

  // ── Face Login ─────────────────────────────────────────────────────────────
  // Frontend sends the captured frame as a base64 JPEG.
  // Descriptor is extracted server-side using the same face-api.js pipeline.
  async faceLogin(base64Image: string): Promise<{
    access: string;
    refresh: string;
    username: string;
    user_type: string;
    user_id: string;
  }> {
    if (!this.modelsLoaded) {
      throw new BadRequestException(
        'Face recognition is temporarily unavailable.',
      );
    }

    const incoming = await this.extractDescriptorFromBase64(base64Image);

    if (!incoming) {
      throw new BadRequestException(
        'No face detected. Please try again in better lighting.',
      );
    }

    // Fetch all active users that have an enrolled descriptor
    const users = await this.userModel
      .find({ isActive: true, 'faceIdData.descriptor': { $exists: true } })
      .select('+faceIdData')
      .lean();

    if (!users.length) {
      throw new UnauthorizedException('No enrolled faces found.');
    }

    this.logger.debug(`Comparing against ${users.length} enrolled user(s)`);

    let bestMatch: { user: (typeof users)[0]; distance: number } | null = null;

    for (const user of users) {
      const stored = user.faceIdData?.descriptor as number[] | undefined;
      if (!stored || stored.length !== 128) continue;

      const distance = euclideanDistance(Array.from(incoming), stored);
      this.logger.debug(
        `  ${user.username}: distance = ${distance.toFixed(4)}`,
      );

      if (distance < MATCH_THRESHOLD) {
        if (!bestMatch || distance < bestMatch.distance) {
          bestMatch = { user, distance };
        }
      }
    }

    if (!bestMatch) {
      this.logger.warn(
        `Face login failed — no match within threshold ${MATCH_THRESHOLD}`,
      );
      throw new UnauthorizedException(
        'Face not recognised. Please try again or use your password.',
      );
    }

    this.logger.log(
      `Face login success — ${bestMatch.user.username} (distance: ${bestMatch.distance.toFixed(4)})`,
    );

    const { user } = bestMatch;
    const payload = {
      sub: user._id.toString(),
      username: user.username,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: '15m',
    });
    const refresh_token = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      expiresIn: '7d',
    });

    return {
      access: access_token,
      refresh: refresh_token,
      username: user.username,
      user_type: user.role,
      user_id: user._id.toString(),
    };
  }
}
