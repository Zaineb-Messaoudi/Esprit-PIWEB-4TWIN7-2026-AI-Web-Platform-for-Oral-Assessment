import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import { Submission, SubmissionDocument } from './entities/submission.entity';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { AssignmentsService } from '../assignments/assignments.service';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectModel(Submission.name)
    private submissionModel: Model<SubmissionDocument>,
    private assignmentsService: AssignmentsService,
  ) {}

  // Upload & sauvegarde brouillon
  async uploadDraft(
    dto: CreateSubmissionDto,
    file: Express.Multer.File,
    studentId: string,
  ): Promise<SubmissionDocument> {
    // 1. Vérifier deadline
    const assignment = await this.assignmentsService.findOne(dto.assignmentId);
    if (new Date() > assignment.deadline) {
      fs.unlinkSync(file.path);
      throw new BadRequestException('La date limite est dépassée');
    }

    // 2. Si brouillon existe déjà → remplacer le fichier
    const existing = await this.submissionModel.findOne({
      studentId: new Types.ObjectId(studentId),
      assignmentId: new Types.ObjectId(dto.assignmentId),
      isDraft: true,
    });

    if (existing) {
      if (existing.fileUrl) {
        const oldPath = existing.fileUrl.replace('/uploads/', './uploads/');
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      existing.fileUrl = `/uploads/submissions/${file.filename}`;
      existing.fileSize = file.size;
      existing.fileType = dto.fileType;
      return existing.save();
    }

    // 3. Nouveau brouillon
    const submission = new this.submissionModel({
      studentId: new Types.ObjectId(studentId),
      classId: new Types.ObjectId(dto.classId),
      assignmentId: new Types.ObjectId(dto.assignmentId),
      fileType: dto.fileType,
      fileUrl: `/uploads/submissions/${file.filename}`,
      fileSize: file.size,
      isDraft: true,
      status: 'pending',
    });
    return submission.save();
  }

  // Soumettre le brouillon (finaliser)
  async submitDraft(submissionId: string, studentId: string): Promise<SubmissionDocument> {
    const submission = await this.findOneOwned(submissionId, studentId);
    if (!submission.isDraft)
      throw new BadRequestException('Cette soumission est déjà finalisée');

    const assignment = await this.assignmentsService.findOne(
      submission.assignmentId.toString(),
    );
    if (new Date() > assignment.deadline)
      throw new BadRequestException('La date limite est dépassée');

    submission.isDraft = false;
    submission.submittedAt = new Date();
    return submission.save();
  }

  // Supprimer le brouillon
  async deleteDraft(submissionId: string, studentId: string): Promise<void> {
    const submission = await this.findOneOwned(submissionId, studentId);
    if (!submission.isDraft)
      throw new ForbiddenException('Impossible de supprimer une soumission finalisée');

    if (submission.fileUrl) {
      const filePath = submission.fileUrl.replace('/uploads/', './uploads/');
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await submission.deleteOne();
  }

  // Récupérer le brouillon d'un étudiant pour un devoir
  async getDraft(assignmentId: string, studentId: string): Promise<SubmissionDocument | null> {
    return this.submissionModel.findOne({
      assignmentId: new Types.ObjectId(assignmentId),
      studentId: new Types.ObjectId(studentId),
      isDraft: true,
    });
  }

  // Récupérer toutes les soumissions d'un étudiant
  async findByStudent(studentId: string): Promise<SubmissionDocument[]> {
    return this.submissionModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .populate('assignmentId', 'title deadline')
      .sort({ createdAt: -1 });
  }

  // Récupérer toutes les soumissions finales d'un devoir (prof)
  async findByAssignment(assignmentId: string): Promise<SubmissionDocument[]> {
    return this.submissionModel
      .find({
        assignmentId: new Types.ObjectId(assignmentId),
        isDraft: false,
      })
      .populate('studentId', 'name email');
  }

  // Helper: trouver une soumission qui appartient à l'étudiant
  private async findOneOwned(id: string, studentId: any): Promise<SubmissionDocument> {
    const submission = await this.submissionModel.findById(id);
    
    if (!submission) throw new NotFoundException('Soumission introuvable');

    // AJOUTE CES LOGS POUR VOIR LE PROBLÈME DANS TON TERMINAL
    console.log("ID dans la DB:", submission.studentId.toString());
    console.log("ID de l'utilisateur:", studentId.toString());

    // CORRECTION : On ajoute .toString() sur les deux IDs pour être sûr
    if (submission.studentId.toString() !== studentId.toString()) {
      throw new ForbiddenException('Accès refusé : vous n\'êtes pas le propriétaire de cette soumission');
    }
    
    return submission;
  }
}