import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ limit: '10mb', extended: true }));

    app.enableCors({ origin: 'http://localhost:5173', credentials: true });

    await app.listen(3000);
    console.log('✅ NestJS server is running on http://localhost:3000');
  } catch (err) {
    console.error('❌ Error during bootstrap:', err);
    process.exit(1);
  }
}
bootstrap();
