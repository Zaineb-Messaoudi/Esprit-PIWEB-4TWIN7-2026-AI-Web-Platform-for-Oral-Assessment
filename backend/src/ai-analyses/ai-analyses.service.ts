import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AIAnalysis, AIAnalysisDocument } from './entities/ai-analysis.entity';
import { CreateAiAnalysisDto } from './dto/create-ai-analysis.dto';
import { UpdateAiAnalysisDto } from './dto/update-ai-analysis.dto';

@Injectable()
export class AiAnalysesService {
  constructor(
    @InjectModel(AIAnalysis.name)
    private aiAnalysisModel: Model<AIAnalysisDocument>,
  ) {}

  // ─── CREATE ───────────────────────────────────────────────────────────────

  // Create a new AI analysis record (called after AI processes a submission)
  create(dto: CreateAiAnalysisDto) {
    return this.aiAnalysisModel.create(dto);
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  // Get all AI analyses (admin)
  findAll() {
    return this.aiAnalysisModel
      .find()
      .populate('submissionId')
      .sort({ createdAt: -1 })
      .exec();
  }

  // Get one AI analysis by its ID
  async findOne(id: string) {
    const found = await this.aiAnalysisModel
      .findById(id)
      .populate('submissionId')
      .exec();

    if (!found) throw new NotFoundException(`AI Analysis ${id} not found`);
    return found;
  }

  // Get AI analysis for a specific submission
  async findBySubmission(submissionId: string) {
    const found = await this.aiAnalysisModel
      .findOne({ submissionId })
      .populate('submissionId')
      .exec();

    if (!found)
      throw new NotFoundException(
        `No AI analysis found for submission ${submissionId}`,
      );
    return found;
  }

  // Get student's performance history over time (for line charts)
  // Two-step: populate all then filter in memory by studentId
  async findStudentHistory(studentId: string) {
    const allAnalyses = await this.aiAnalysisModel
      .find()
      .populate('submissionId')
      .sort({ processingDate: 1 })
      .exec();

    // Filter in memory — keep only analyses where submission belongs to this student
    const matched = allAnalyses.filter((a) => {
      const sub = a.submissionId as any;
      if (!sub || !sub.studentId) return false;
      return sub.studentId.toString() === studentId.toString();
    });

    return matched.map((a) => {
      const sub = a.submissionId as any;
      return {
        analysisId: a._id,
        date: a.processingDate,
        submissionTitle: sub?.title || 'Submission',
        pronunciationScore: a.pronunciationScore,
        confidenceScore: a.confidenceScore,
        speechRate: a.speechRate,
        pauseFrequency: a.pauseFrequency,
        fillerWords: a.fillerWords,
        suggestions: a.suggestions,
      };
    });
  }

  // Get student's average scores (for the report page summary)
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
      .filter((v) => v != null && !isNaN(v));
    const confidenceScores = history
      .map((h) => h.confidenceScore)
      .filter((v) => v != null && !isNaN(v));
    const speechRates = history
      .map((h) => h.speechRate)
      .filter((v) => v != null && !isNaN(v));
    const pauseFrequencies = history
      .map((h) => h.pauseFrequency)
      .filter((v) => v != null && !isNaN(v));

    // Calculate trend: compare last 3 vs first 3 confidence scores
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
      averagePronunciationScore:
        Math.round(avg(pronunciationScores) * 10) / 10,
      averageConfidenceScore:
        Math.round(avg(confidenceScores) * 10) / 10,
      averageSpeechRate:
        Math.round(avg(speechRates) * 10) / 10,
      averagePauseFrequency:
        Math.round(avg(pauseFrequencies) * 10) / 10,
      trend,
      history,
    };
  }

  // Get class-wide statistics (for instructor analytics dashboard)
  // Two-step: populate all then filter in memory by classId
  async findClassStats(classId: string) {
    const allAnalyses = await this.aiAnalysisModel
      .find()
      .populate('submissionId')
      .exec();

    // Filter in memory — keep only analyses whose submission belongs to this class
    const matched = allAnalyses.filter((a) => {
      const sub = a.submissionId as any;
      if (!sub || !sub.classId) return false;
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

    // Aggregate filler words across all submissions
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

    // Score distribution: group confidence scores into ranges
    const scoreDistribution = [
      { range: '0-20',  count: confidenceScores.filter((s) => s <= 20).length  },
      { range: '21-40', count: confidenceScores.filter((s) => s > 20 && s <= 40).length },
      { range: '41-60', count: confidenceScores.filter((s) => s > 40 && s <= 60).length },
      { range: '61-80', count: confidenceScores.filter((s) => s > 60 && s <= 80).length },
      { range: '81-100',count: confidenceScores.filter((s) => s > 80).length   },
    ];

    return {
      classId,
      totalSubmissions: matched.length,
      averagePronunciationScore:
        Math.round(avg(pronunciationScores) * 10) / 10,
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

  // ─── DELETE ───────────────────────────────────────────────────────────────

  async remove(id: string) {
    const deleted = await this.aiAnalysisModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException(`AI Analysis ${id} not found`);
    return { message: `AI Analysis ${id} deleted successfully` };
  }
}