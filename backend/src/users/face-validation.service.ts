import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData, createCanvas, loadImage } from 'canvas';
import * as path from 'path';

faceapi.env.monkeyPatch({
  Canvas: Canvas as unknown as typeof HTMLCanvasElement,
  Image: Image as unknown as typeof HTMLImageElement,
  ImageData: ImageData as unknown as typeof globalThis.ImageData,
});

export interface FaceValidationResult {
  valid: boolean;
  error: string | null;
  faceCount: number;
}

@Injectable()
export class FaceValidationService implements OnModuleInit {
  private readonly logger = new Logger(FaceValidationService.name);
  private modelsLoaded = false;

  private readonly modelsPath = path.join(process.cwd(), 'models');

  async onModuleInit(): Promise<void> {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromDisk(this.modelsPath);
      this.modelsLoaded = true;
      this.logger.log('Face detection models loaded successfully');
    } catch (err) {
      this.logger.error('Failed to load face detection models', err);
    }
  }

  async validateFace(base64Image: string): Promise<FaceValidationResult> {
    if (!this.modelsLoaded) {
      this.logger.warn('Face validation skipped: models not loaded');
      return { valid: true, error: null, faceCount: -1 };
    }

    try {
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const img = await loadImage(buffer);
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img as unknown as HTMLImageElement, 0, 0);

      const detections = await faceapi.detectAllFaces(
        canvas as unknown as HTMLCanvasElement,
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }),
      );

      const faceCount = detections.length;

      if (faceCount === 0) {
        return {
          valid: false,
          error: 'No face detected in the uploaded image.',
          faceCount,
        };
      }

      if (faceCount > 1) {
        return {
          valid: false,
          error: `${faceCount} faces detected. Only one face is allowed in the profile photo.`,
          faceCount,
        };
      }

      return { valid: true, error: null, faceCount };
    } catch (err) {
      this.logger.error('Face validation error:', err);
      return { valid: true, error: null, faceCount: -1 };
    }
  }
}
