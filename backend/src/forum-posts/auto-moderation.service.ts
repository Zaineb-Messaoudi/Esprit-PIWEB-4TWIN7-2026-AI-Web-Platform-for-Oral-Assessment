import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';

export interface ModerationResult {
  isFlagged: boolean;
  reasons: string[];
  severity: 'none' | 'low' | 'medium' | 'high';
}

interface ProfanityApiResponse {
  isProfanity: boolean;
  score: number;
}

@Injectable()
export class AutoModerationService {
  private readonly logger = new Logger(AutoModerationService.name);

  private readonly bullyingPatterns = [
    /you(?:'re| are) (?:so )?stupid/i,
    /nobody (?:likes|cares about) you/i,
    /you(?:'re| are) (?:such )?an? (?:idiot|moron|loser|freak)/i,
    /you don'?t belong here/i,
    /everyone hates you/i,
    /go kill yourself/i,
    /kys\b/i,
    /you(?:'re| are) worthless/i,
    /no one (?:likes|wants) you/i,
    /you should (?:quit|leave|die)/i,
  ];

  private readonly threatPatterns = [
    /i(?:'ll| will) (?:hurt|kill|find) you/i,
    /watch your back/i,
    /you(?:'ll| will) (?:pay|regret) (?:for )?this/i,
    /i know where you (?:live|are)/i,
    /i(?:'m| am) (?:going to|gonna) (?:hurt|attack|find) you/i,
  ];

  private readonly spamPatterns = [
    /(.)\1{9,}/, // same char repeated 10+ times
    /(https?:\/\/\S+\s*){4,}/i, // 4+ links in one post
    /(\b\w+\b)(\s+\1){4,}/i, // same word repeated 5+ times
  ];

  async moderate(text: string): Promise<ModerationResult> {
    const reasons: string[] = [];

    // ── 1. profanity.dev — free, no API key, vector-based ─────────────────
    try {
      const response: AxiosResponse<ProfanityApiResponse> =
        await axios.post<ProfanityApiResponse>(
          'https://vector.profanity.dev',
          { message: text },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 3000,
          },
        );
      if (response.data.isProfanity === true) {
        reasons.push('profanity');
      }
    } catch {
      this.logger.warn('profanity.dev unreachable — skipping API check');
    }

    // ── 2. Bullying patterns ───────────────────────────────────────────────
    if (this.bullyingPatterns.some((p) => p.test(text))) {
      reasons.push('bullying');
    }

    // ── 3. Threat patterns ─────────────────────────────────────────────────
    if (this.threatPatterns.some((p) => p.test(text))) {
      reasons.push('threat');
    }

    // ── 4. Spam patterns ───────────────────────────────────────────────────
    if (this.spamPatterns.some((p) => p.test(text))) {
      reasons.push('spam');
    }

    // ── 5. Excessive caps (80%+ uppercase, 10+ letters) ───────────────────
    const letters = text.replace(/[^a-zA-Z]/g, '');
    if (
      letters.length >= 10 &&
      letters.replace(/[^A-Z]/g, '').length / letters.length > 0.8
    ) {
      reasons.push('excessive_caps');
    }

    return {
      isFlagged: reasons.length > 0,
      reasons,
      severity: this.getSeverity(reasons),
    };
  }

  private getSeverity(reasons: string[]): ModerationResult['severity'] {
    if (reasons.includes('threat')) return 'high';
    if (reasons.includes('bullying')) return 'medium';
    if (reasons.includes('profanity') || reasons.includes('spam')) return 'low';
    if (reasons.includes('excessive_caps')) return 'low';
    return 'none';
  }
}
