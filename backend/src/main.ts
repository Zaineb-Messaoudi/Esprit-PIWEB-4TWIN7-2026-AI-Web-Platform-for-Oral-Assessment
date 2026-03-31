import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    //app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

    app.enableCors({ origin: 'http://localhost:5173', credentials: true });

    await app.listen(3000);
    console.log('✅ NestJS server is running on http://localhost:3000');
  } catch (err) {
    console.error('❌ Error during bootstrap:', err);
    process.exit(1);
  }
}
bootstrap();