import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import * as dotenv from 'dotenv';
import { join } from 'path';
import * as fs from 'fs';
import { IoAdapter } from '@nestjs/platform-socket.io';

dotenv.config();

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ limit: '10mb', extended: true }));

    // ✅ FIX 1: Explicit CORS with all methods allowed — the original config
    // only passed `origin` and `credentials`, which defaults to GET-only
    app.enableCors({
      origin: 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // ✅ FIX 2: ValidationPipe — without this, class-validator decorators on
    // DTOs (@IsString, @IsEmail, @Length, etc.) do absolutely nothing.
    // Any malformed body either crashes silently or passes through raw,
    // which causes NestJS to return 400 Bad Request with no helpful message.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true, // auto-converts "2024" string → number
        },
      }),
    );

    const uploadDir = join(process.cwd(), 'uploads', 'submissions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    app.useStaticAssets(join(process.cwd(), 'uploads'), {
      prefix: '/uploads',
    });

    app.useWebSocketAdapter(new IoAdapter(app));

    await app.listen(3000);
    console.log('✅ NestJS server is running on http://localhost:3000');
  } catch (err) {
    console.error('❌ Error during bootstrap:', err);
    process.exit(1);
  }
}

void bootstrap();
