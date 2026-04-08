// recording.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RecordingDocument = Recording & Document;

@Schema({ timestamps: true })
export class Recording {
  @Prop({ required: true })
  studentId !: string;       // ID de l'étudiant
  @Prop({ required: false })
  classId !: string;         // ID de la classe (facultatif pour étudiant)
  @Prop({ required: true })
  filePath !: string;        // chemin du fichier sur le serveur
  @Prop({ default: false })
  isDraft !: boolean;        // si c’est un brouillon
}

export const RecordingSchema = SchemaFactory.createForClass(Recording);