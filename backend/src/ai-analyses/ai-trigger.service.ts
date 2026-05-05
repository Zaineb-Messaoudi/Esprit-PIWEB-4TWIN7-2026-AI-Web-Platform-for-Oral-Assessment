import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import { AiAnalysesService } from './ai-analyses.service';
import { CreateAiAnalysisDto } from './dto/create-ai-analysis.dto';
import { HttpService } from '@nestjs/axios';
import { AIAnalysis } from './entities/ai-analysis.entity';

interface SpeechQuality {
  wpm_std: number;
  wpm_min: number;
  wpm_max: number;
  total_pauses: number;
  long_pauses: number;
  avg_pause_duration: number;
  max_pause_duration: number;
  pitch_mean: number;
  pitch_std: number;
  pitch_range: number;
  volume_mean: number;
  volume_std: number;
  avg_word_confidence: number;
  low_confidence_words: string[];
}

interface VisualMetrics {
  eye_contact_pct: number;
  posture_upright_pct: number;
  unique_expressions: number;
}

interface Scores {
  pace: number | null;
  clarity: number | null;
  expression: number | null;
  posture: number | null;
  overall: number;
}

interface PythonAnalysisResult {
  duration_seconds: number;
  transcript: string;
  avg_wpm: number;
  word_count: number;
  filler_count: number;
  filler_words: Record<string, number>;
  top_fillers: [string, number][];
  scores: Scores;
  speech_quality: SpeechQuality;
  visual: VisualMetrics | null;
  cefr: string;
  cefr_level: string;
  ai_feedback: string;
  visual_feedback: string;
  charts: Record<string, string | null>;
}

// ai-trigger.service.ts

@Injectable()
export class AiTriggerService {
  private readonly logger = new Logger(AiTriggerService.name);
  private readonly pythonUrl =
    process.env.PYTHON_AI_URL ?? 'http://localhost:8000';

  constructor(
    private readonly http: HttpService,
    private readonly aiAnalysesService: AiAnalysesService,
  ) {}

  async triggerAnalysis(
    submissionId: string,
    audioPath: string,
    videoPath?: string,
  ) {
    // ── 1. Create the placeholder and VERIFY it was created ──────────────
    const placeholder = await this.aiAnalysesService.create({
      submissionId,
      status: 'processing',
    } as CreateAiAnalysisDto);

    // ADD THIS — log the created doc so you can verify it exists
    this.logger.log(
      `Placeholder created: _id=${placeholder._id.toString()}, submissionId=${placeholder.submissionId.toString()}`,
    );

    try {
      const form = new FormData({ maxDataSize: Infinity });
      form.append('audio', fs.createReadStream(audioPath));
      if (videoPath && fs.existsSync(videoPath)) {
        form.append('video', fs.createReadStream(videoPath));
      }

      this.logger.log(`Sending submission ${submissionId} to Python AI...`);

      const response: AxiosResponse<PythonAnalysisResult> =
        await firstValueFrom(
          this.http.post<PythonAnalysisResult>(
            `${this.pythonUrl}/analyze`,
            form,
            {
              headers: form.getHeaders(),
              timeout: 0,
            },
          ),
        );

      const data: PythonAnalysisResult = response.data;
      this.logger.log(`Python returned OK for submission ${submissionId}`);

      const sq: SpeechQuality = data.speech_quality;
      const vis: VisualMetrics | null = data.visual;
      const scores: Scores = data.scores;

      const charts: Record<string, string | null> = {};
      for (const [k, v] of Object.entries(data.charts ?? {})) {
        charts[k] = v ?? null;
      }

      const updatePayload: Partial<AIAnalysis> = {
        status: 'completed',
        speechRate: data.avg_wpm,
        pauseFrequency: sq.total_pauses,
        pauseDuration: {
          average: sq.avg_pause_duration,
          minimum: 0,
          maximum: sq.max_pause_duration,
        },
        pronunciationScore:
          sq.avg_word_confidence > 0
            ? Math.round(sq.avg_word_confidence * 100)
            : (scores.clarity ?? 0),
        fillerWords: Object.entries(data.filler_words).map(([word, count]) => ({
          word,
          count,
        })),
        confidenceScore: scores.overall,
        voiceMetrics: {
          pitch: {
            mean: sq.pitch_mean,
            std: sq.pitch_std,
            range: sq.pitch_range,
          },
          energy: {
            mean: sq.volume_mean,
            std: sq.volume_std,
          },
          stability: {
            wpm_std: sq.wpm_std,
            wpm_min: sq.wpm_min,
            wpm_max: sq.wpm_max,
          },
        },
        emotionDetection: vis
          ? {
              eye_contact_pct: vis.eye_contact_pct,
              unique_expressions: vis.unique_expressions,
            }
          : {},
        bodyLanguage: vis
          ? { posture_upright_pct: vis.posture_upright_pct }
          : {},
        suggestions: [],
        transcript: data.transcript,
        cefrLevel: data.cefr_level,
        aiFeedback: data.ai_feedback,
        visualFeedback: data.visual_feedback,
        charts,
        overallScore: scores.overall,
        wordCount: data.word_count,
        durationSeconds: data.duration_seconds,
      };

      // ── CHANGED: use the placeholder's _id directly — no query needed ──
      const updated = await this.aiAnalysesService.updateById(
        placeholder._id.toString(),
        updatePayload,
      );

      // ADD THIS — catch the silent null case
      if (!updated) {
        this.logger.error(
          `updateById returned null for _id=${placeholder._id.toString()}. ` +
            `Attempting fallback by submissionId...`,
        );
        // Fallback: try by submissionId in case _id lookup fails
        const fallback = await this.aiAnalysesService.updateBySubmissionId(
          submissionId,
          updatePayload,
        );
        if (!fallback) {
          this.logger.error(
            `Both update strategies failed for submission ${submissionId}`,
          );
        }
        return fallback;
      }

      this.logger.log(`Analysis saved for submission ${submissionId}`);
      return updated;
    } catch (err) {
      this.logger.error(
        `Analysis pipeline failed for submission ${submissionId}:`,
        err instanceof Error ? err.message : err,
      );
      // Use _id here too — same robustness
      await this.aiAnalysesService
        .updateById(placeholder._id.toString(), { status: 'failed' })
        .catch((e) =>
          this.logger.error('Could not mark analysis as failed:', e),
        );
      throw err;
    }
  }
}
