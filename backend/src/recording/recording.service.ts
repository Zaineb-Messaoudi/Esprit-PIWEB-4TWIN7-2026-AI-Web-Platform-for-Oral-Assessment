// recording.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recording, RecordingDocument } from './recording.shema';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RecordingService {
  constructor(@InjectModel(Recording.name) private recordingModel: Model<RecordingDocument>) {}

  async save(file: Express.Multer.File, body: any, isDraft = false) {
    // Chemin où le fichier sera enregistré
    const uploadPath = path.join(__dirname, '../../uploads', file.originalname);
    fs.writeFileSync(uploadPath, file.buffer);

    // Création de l'enregistrement dans la DB
    const recording = new this.recordingModel({
      studentId: body.studentId,
      classId: body.classId,
      filePath: uploadPath,
      isDraft,
    });

    return recording.save();
  }
}