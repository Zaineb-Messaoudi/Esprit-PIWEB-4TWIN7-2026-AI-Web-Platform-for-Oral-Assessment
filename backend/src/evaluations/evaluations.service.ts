import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Evaluation, EvaluationDocument } from './entities/evaluation.entity';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectModel(Evaluation.name)
    private evaluationModel: Model<EvaluationDocument>,
  ) {}

  // ─── CREATE ───────────────────────────────────────────────────────────────

  // Create a new evaluation (instructor starts grading a submission)
  create(dto: CreateEvaluationDto) {
    return this.evaluationModel.create(dto);
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  // Get all evaluations (admin view)
  findAll() {
    return this.evaluationModel
      .find()
      .populate('submissionId')
      .populate('instructorId', 'firstName lastName email')
      .populate('rubricId')
      .sort({ createdAt: -1 })
      .exec();
  }

  // Get one evaluation by its ID
  async findOne(id: string) {
    const found = await this.evaluationModel
      .findById(id)
      .populate('submissionId')
      .populate('instructorId', 'firstName lastName email')
      .populate('rubricId')
      .exec();

    if (!found) throw new NotFoundException(`Evaluation ${id} not found`);
    return found;
  }

  // Get evaluation for a specific submission
  async findBySubmission(submissionId: string) {
    const found = await this.evaluationModel
      .findOne({ submissionId })
      .populate('submissionId')
      .populate('instructorId', 'firstName lastName email')
      .populate('rubricId')
      .exec();

    if (!found)
      throw new NotFoundException(
        `No evaluation found for submission ${submissionId}`,
      );
    return found;
  }

  // Get all evaluations done by a specific instructor
  findByInstructor(instructorId: string) {
    return this.evaluationModel
      .find({ instructorId })
      .populate('submissionId')
      .populate('rubricId')
      .sort({ createdAt: -1 })
      .exec();
  }

  // Get all submitted evaluations visible to a student
  // Two-step: populate all submitted evaluations then filter in memory by studentId
  async findByStudent(studentId: string) {
    const allEvals = await this.evaluationModel
      .find({ status: 'submitted' })
      .populate('submissionId')
      .populate('instructorId', 'firstName lastName email')
      .populate('rubricId')
      .sort({ createdAt: -1 })
      .exec();

    // Filter in memory — keep only evaluations whose submission belongs to this student
    return allEvals.filter((e) => {
      const sub = e.submissionId as any;
      if (!sub || !sub.studentId) return false;
      return sub.studentId.toString() === studentId.toString();
    });
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  // General update (scores, grade, aiInsightsUsed, etc.)
  async update(id: string, dto: UpdateEvaluationDto) {
    const updated = await this.evaluationModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    if (!updated) throw new NotFoundException(`Evaluation ${id} not found`);
    return updated;
  }

  // Update ONLY the written feedback (instructor adds/edits comment)
  async updateFeedback(id: string, writtenFeedback: string) {
    const updated = await this.evaluationModel
      .findByIdAndUpdate(id, { writtenFeedback }, { new: true })
      .exec();

    if (!updated) throw new NotFoundException(`Evaluation ${id} not found`);
    return updated;
  }

  // Submit evaluation — changes status from draft to submitted
  // Once submitted, the student can see the feedback
  async submitEvaluation(id: string) {
    const updated = await this.evaluationModel
      .findByIdAndUpdate(
        id,
        { status: 'submitted', evaluationDate: new Date() },
        { new: true },
      )
      .exec();

    if (!updated) throw new NotFoundException(`Evaluation ${id} not found`);
    return updated;
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────

  async remove(id: string) {
    const deleted = await this.evaluationModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException(`Evaluation ${id} not found`);
    return { message: `Evaluation ${id} deleted successfully` };
  }
}