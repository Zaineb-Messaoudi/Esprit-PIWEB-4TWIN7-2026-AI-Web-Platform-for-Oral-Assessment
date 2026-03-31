// recording.controller.ts
import { Controller, Post, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RecordingService } from './recording.service';

@Controller('recordings')
export class RecordingController {
  constructor(private readonly recordingService: RecordingService) {}

  // Envoi final
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async saveRecording(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    return this.recordingService.save(file, body, false);
  }

  // Envoi brouillon
  @Post('draft')
  @UseInterceptors(FileInterceptor('file'))
  async saveDraft(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    return this.recordingService.save(file, body, true);
  }
}