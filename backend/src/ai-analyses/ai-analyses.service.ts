import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AIAnalysis, AIAnalysisDocument } from './entities/ai-analysis.entity';
import { CreateAiAnalysisDto } from './dto/create-ai-analysis.dto';
import { UpdateAiAnalysisDto } from './dto/update-ai-analysis.dto';

/** Shape of submissionId after Mongoose .populate('submissionId') */
interface PopulatedSubmission {
  _id: unknown;
  studentId?: { toString(): string };
  classId?: { toString(): string };
  title?: string;
}

/** AIAnalysisDocument with submissionId already populated */
type AnalysisWithPopulatedSubmission = Omit<
  AIAnalysisDocument,
  'submissionId'
> & {
  submissionId: PopulatedSubmission | null;
};

@Injectable()
export class AiAnalysesService {
  private readonly logger = new Logger(AiAnalysesService.name);

  constructor(
    @InjectModel(AIAnalysis.name)
    private aiAnalysisModel: Model<AIAnalysisDocument>,
  ) {}

  // ─── CREATE ───────────────────────────────────────────────────────────────

  async create(dto: CreateAiAnalysisDto) {
    try {
      const result = await this.aiAnalysisModel.create({
        ...dto,
        submissionId: new Types.ObjectId(dto.submissionId), // force cast
      });
      this.logger.log(`Created AI analysis record: ${result._id.toString()}`);
      return result;
    } catch (err) {
      this.logger.error('Failed to create AI analysis record:', err);
      throw err;
    }
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  findAll() {
    return this.aiAnalysisModel
      .find()
      .populate('submissionId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    const found = await this.aiAnalysisModel
      .findById(id)
      .populate('submissionId')
      .exec();

    if (!found) throw new NotFoundException(`AI Analysis ${id} not found`);
    return found;
  }

  async findBySubmission(submissionId: string) {
    const found = await this.aiAnalysisModel
      .findOne({
        $or: [
          { submissionId: submissionId },
          { submissionId: new Types.ObjectId(submissionId) },
        ],
      })
      .populate('submissionId')
      .exec();

    if (!found) {
      return { status: 'processing', data: null };
    }

    return {
      status: found.status ?? 'completed',
      data: found,
    };
  }

  async findStudentHistory(studentId: string) {
    const allAnalyses = (await this.aiAnalysisModel
      .find()
      .populate('submissionId')
      .sort({ processingDate: 1 })
      .exec()) as AnalysisWithPopulatedSubmission[];

    const matched = allAnalyses.filter((a) => {
      const sub = a.submissionId;
      if (!sub?.studentId) return false;
      return sub.studentId.toString() === studentId.toString();
    });

    return matched.map((a) => {
      const sub = a.submissionId;
      return {
        analysisId: a._id,
        date: a.processingDate,
        submissionTitle: sub?.title ?? 'Submission',
        pronunciationScore: a.pronunciationScore,
        confidenceScore: a.confidenceScore,
        speechRate: a.speechRate,
        pauseFrequency: a.pauseFrequency,
        fillerWords: a.fillerWords,
        suggestions: a.suggestions,
      };
    });
  }

  async findStudentStats(studentId: string) {
    const history = await this.findStudentHistory(studentId);

    if (history.length === 0) {
      return {
        totalSubmissions: 0,
        averagePronunciationScore: 0,
        averageConfidenceScore: 0,
        averageSpeechRate: 0,
        averagePauseFrequency: 0,
        trend: 'no data',
        history: [],
      };
    }

    const avg = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const pronunciationScores = history
      .map((h) => h.pronunciationScore)
      .filter((v): v is number => v != null && !isNaN(v));
    const confidenceScores = history
      .map((h) => h.confidenceScore)
      .filter((v): v is number => v != null && !isNaN(v));
    const speechRates = history
      .map((h) => h.speechRate)
      .filter((v): v is number => v != null && !isNaN(v));
    const pauseFrequencies = history
      .map((h) => h.pauseFrequency)
      .filter((v): v is number => v != null && !isNaN(v));

    let trend = 'stable';
    if (history.length >= 4) {
      const firstHalf = confidenceScores.slice(
        0,
        Math.floor(confidenceScores.length / 2),
      );
      const secondHalf = confidenceScores.slice(
        Math.floor(confidenceScores.length / 2),
      );
      const firstAvg = avg(firstHalf);
      const secondAvg = avg(secondHalf);
      if (secondAvg > firstAvg + 5) trend = 'improving';
      else if (secondAvg < firstAvg - 5) trend = 'declining';
    }

    return {
      totalSubmissions: history.length,
      averagePronunciationScore: Math.round(avg(pronunciationScores) * 10) / 10,
      averageConfidenceScore: Math.round(avg(confidenceScores) * 10) / 10,
      averageSpeechRate: Math.round(avg(speechRates) * 10) / 10,
      averagePauseFrequency: Math.round(avg(pauseFrequencies) * 10) / 10,
      trend,
      history,
    };
  }

  async findClassStats(classId: string) {
    const allAnalyses = (await this.aiAnalysisModel
      .find()
      .populate('submissionId')
      .exec()) as AnalysisWithPopulatedSubmission[];

    const matched = allAnalyses.filter((a) => {
      const sub = a.submissionId;
      if (!sub?.classId) return false;
      return sub.classId.toString() === classId.toString();
    });

    if (matched.length === 0) {
      return {
        classId,
        totalSubmissions: 0,
        averagePronunciationScore: 0,
        averageConfidenceScore: 0,
        averageSpeechRate: 0,
        topFillerWords: [],
        scoreDistribution: [],
        message: 'No AI analyses found for this class',
      };
    }

    const avg = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const pronunciationScores = matched
      .map((a) => a.pronunciationScore)
      .filter(Boolean);
    const confidenceScores = matched
      .map((a) => a.confidenceScore)
      .filter(Boolean);
    const speechRates = matched.map((a) => a.speechRate).filter(Boolean);

    const fillerWordMap: Record<string, number> = {};
    matched.forEach((a) => {
      (a.fillerWords || []).forEach(({ word, count }) => {
        fillerWordMap[word] = (fillerWordMap[word] || 0) + count;
      });
    });

    const topFillerWords = Object.entries(fillerWordMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }));

    const scoreDistribution = [
      { range: '0-20', count: confidenceScores.filter((s) => s <= 20).length },
      {
        range: '21-40',
        count: confidenceScores.filter((s) => s > 20 && s <= 40).length,
      },
      {
        range: '41-60',
        count: confidenceScores.filter((s) => s > 40 && s <= 60).length,
      },
      {
        range: '61-80',
        count: confidenceScores.filter((s) => s > 60 && s <= 80).length,
      },
      { range: '81-100', count: confidenceScores.filter((s) => s > 80).length },
    ];

    return {
      classId,
      totalSubmissions: matched.length,
      averagePronunciationScore: Math.round(avg(pronunciationScores) * 10) / 10,
      averageConfidenceScore: Math.round(avg(confidenceScores) * 10) / 10,
      averageSpeechRate: Math.round(avg(speechRates) * 10) / 10,
      topFillerWords,
      scoreDistribution,
    };
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateAiAnalysisDto) {
    const updated = await this.aiAnalysisModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    if (!updated) throw new NotFoundException(`AI Analysis ${id} not found`);
    return updated;
  }

  async updateBySubmissionId(submissionId: string, dto: Partial<AIAnalysis>) {
    let objectId: Types.ObjectId;

    try {
      objectId = new Types.ObjectId(submissionId);
    } catch {
      this.logger.error(
        `updateBySubmissionId: invalid ObjectId "${submissionId}"`,
      );
      throw new Error(`Invalid submissionId: ${submissionId}`);
    }

    const updated = await this.aiAnalysisModel.findOneAndUpdate(
      { submissionId: objectId },
      { $set: dto },
      {
        new: true,
        upsert: false, // never create a duplicate — the placeholder always exists
      },
    );

    if (!updated) {
      this.logger.warn(
        `updateBySubmissionId: no document found for submission ${submissionId}`,
      );
    }

    return updated;
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────

  async remove(id: string) {
    const deleted = await this.aiAnalysisModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException(`AI Analysis ${id} not found`);
    return { message: `AI Analysis ${id} deleted successfully` };
  }

  async updateFeedback(
    id: string,
    dto: {
      aiFeedback?: string;
      visualFeedback?: string;
      suggestions?: string[];
    },
  ) {
    const updated = await this.aiAnalysisModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!updated) throw new NotFoundException(`AI Analysis ${id} not found`);
    return updated;
  }

  // In AiAnalysesService — add this method

  async updateById(id: string, dto: Partial<AIAnalysis>) {
    let objectId: Types.ObjectId;
    try {
      objectId = new Types.ObjectId(id);
    } catch {
      this.logger.error(`updateById: invalid ObjectId "${id}"`);
      throw new Error(`Invalid id: ${id}`);
    }

    const updated = await this.aiAnalysisModel.findByIdAndUpdate(
      objectId,
      { $set: dto },
      { new: true },
    );

    if (!updated) {
      this.logger.warn(`updateById: no document found for _id ${id}`);
    } else {
      this.logger.log(
        `updateById: successfully updated _id ${id}, status=${dto.status}`,
      );
    }

    return updated;
  }
}
