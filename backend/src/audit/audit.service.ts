import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';
import {
  User,
  UserDocument,
  ActivityEventType,
} from '../users/entities/user.entity';

// Maximum number of entries kept per user — oldest are dropped when exceeded.
const MAX_ENTRIES = 50;

// ── Parse a rough device label from the User-Agent string ────────────────────
function parseDevice(ua: string | undefined): string {
  if (!ua) return 'Unknown device';

  const browser = ua.includes('Edg/')
    ? 'Edge'
    : ua.includes('Chrome/')
      ? 'Chrome'
      : ua.includes('Firefox/')
        ? 'Firefox'
        : ua.includes('Safari/')
          ? 'Safari'
          : ua.includes('OPR/')
            ? 'Opera'
            : 'Browser';

  const os = ua.includes('Windows NT')
    ? 'Windows'
    : ua.includes('Mac OS X')
      ? 'macOS'
      : ua.includes('Linux')
        ? 'Linux'
        : ua.includes('Android')
          ? 'Android'
          : ua.includes('iPhone') || ua.includes('iPad')
            ? 'iOS'
            : 'Unknown OS';

  return `${browser} on ${os}`;
}

// ── Extract best-effort IP from the request ───────────────────────────────────
function extractIp(req?: Request): string | undefined {
  if (!req) return undefined;
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress ?? undefined;
}

export interface LogActivityOptions {
  userId: string;
  event: ActivityEventType;
  req?: Request; // pass the Express request to capture IP + device
  metadata?: Record<string, string>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Append one activity log entry to the user document.
   * Silently swallows errors — audit logging must never break the main flow.
   * Caps the log at MAX_ENTRIES by slicing off the oldest entries.
   */
  async log(opts: LogActivityOptions): Promise<void> {
    try {
      const entry = {
        event: opts.event,
        timestamp: new Date(),
        ip: extractIp(opts.req),
        device: parseDevice(
          opts.req?.headers['user-agent'] as string | undefined,
        ),
        metadata: opts.metadata,
      };

      // $push with $slice keeps the array capped without a separate read
      await this.userModel.updateOne(
        { _id: opts.userId },
        {
          $push: {
            activityLog: {
              $each: [entry],
              $position: 0, // prepend — newest first
              $slice: MAX_ENTRIES, // keep only the most recent N
            },
          },
        },
      );
    } catch (err) {
      // Never throw — just warn so the caller isn't affected
      this.logger.warn(
        `Failed to log activity [${opts.event}] for user ${opts.userId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Return the activity log for a user, most recent first.
   * Used by GET /api/activity/:userId
   */
  async getLog(userId: string): Promise<UserDocument['activityLog']> {
    const user = await this.userModel
      .findById(userId)
      .select('activityLog')
      .lean();

    return (user?.activityLog ?? []) as UserDocument['activityLog'];
  }
}
