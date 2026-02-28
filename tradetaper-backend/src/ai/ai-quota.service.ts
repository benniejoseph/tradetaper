import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * AI Quota Limits per subscription plan (calls per month).
 * 0 = no access (blocked). null = unlimited.
 */
const PLAN_AI_QUOTAS: Record<string, number | null> = {
  free: 0,
  essential: 0,
  premium: null, // unlimited
};

/**
 * AiQuotaService — Upstash HTTP REST edition
 *
 * Uses Upstash Redis via HTTP REST API instead of a persistent TCP Redis client.
 * This means: zero idle cost, no connection pool, serverless-friendly.
 *
 * Key format:  ai:quota:{userId}:{YYYY-MM}
 * TTL:         auto-expires at the end of the current calendar month.
 *
 * Required env vars:
 *   UPSTASH_REDIS_REST_URL   — e.g. https://xxx.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN — Bearer token from Upstash dashboard
 *
 * Fails OPEN if env vars are missing (logs a warning, doesn't block users).
 */
@Injectable()
export class AiQuotaService {
  private readonly logger = new Logger(AiQuotaService.name);
  private readonly url: string | null;
  private readonly token: string | null;

  constructor(private readonly configService: ConfigService) {
    this.url   = this.configService.get<string>('UPSTASH_REDIS_REST_URL') ?? null;
    this.token = this.configService.get<string>('UPSTASH_REDIS_REST_TOKEN') ?? null;

    if (!this.url || !this.token) {
      this.logger.warn(
        'AiQuotaService: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not configured — quota enforcement disabled (fail-open)',
      );
    } else {
      this.logger.log('AiQuotaService: Upstash HTTP REST configured for quota tracking');
    }
  }

  /* ── Public API ────────────────────────────────────────── */

  getQuotaForPlan(plan: string): number | null {
    return PLAN_AI_QUOTAS[plan] ?? PLAN_AI_QUOTAS['free'];
  }

  /**
   * Check quota and increment counter.
   * Throws 403 if plan has no AI access.
   * Throws 429 if monthly limit is reached.
   * Call this BEFORE any Gemini/AI request.
   */
  async checkAndIncrement(userId: string, plan: string): Promise<void> {
    const limit = this.getQuotaForPlan(plan);

    // null = unlimited — skip all Redis calls
    if (limit === null) return;

    // 0 = plan has no AI access at all
    if (limit === 0) {
      throw new HttpException(
        {
          statusCode: 403,
          message:
            'AI features are not available on your current plan. Upgrade to Premium to unlock.',
          code: 'AI_ACCESS_DENIED',
          plan,
          upgradeUrl: '/plans',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    // Fail-open if Upstash not configured
    if (!this.url || !this.token) {
      this.logger.warn('AiQuotaService: Upstash not configured, skipping quota check (fail-open)');
      return;
    }

    const key     = this.buildKey(userId);
    const current = await this.upstashIncr(key);

    // First call this month — set expiry
    if (current === 1) {
      await this.upstashExpire(key, this.secondsUntilEndOfMonth());
    }

    if (current > limit) {
      // Roll back to avoid overcounting
      void this.upstashDecr(key).catch(() => {});

      throw new HttpException(
        {
          statusCode: 429,
          message: `Monthly AI call limit reached (${limit} calls/month on your plan). Upgrade to Premium for unlimited access.`,
          code: 'AI_QUOTA_EXCEEDED',
          limit,
          used: current - 1,
          plan,
          upgradeUrl: '/plans',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.logger.debug(`AI quota: user ${userId} — ${current}/${limit} this month`);
  }

  /** Returns current month usage (safe for display in UI) */
  async getCurrentUsage(userId: string, plan: string): Promise<{ used: number; limit: number | null }> {
    const limit = this.getQuotaForPlan(plan);
    if (!this.url || !this.token) return { used: 0, limit };

    const key = this.buildKey(userId);
    const raw = await this.upstashGet(key);
    return { used: raw ? parseInt(raw, 10) : 0, limit };
  }

  /* ── Upstash HTTP helpers ──────────────────────────────── */

  private async upstashRequest(command: string[]): Promise<any> {
    const res = await fetch(`${this.url}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });
    if (!res.ok) {
      throw new Error(`Upstash HTTP ${res.status}: ${await res.text()}`);
    }
    const json = await res.json();
    return json.result;
  }

  private async upstashIncr(key: string): Promise<number> {
    return this.upstashRequest(['INCR', key]);
  }

  private async upstashDecr(key: string): Promise<number> {
    return this.upstashRequest(['DECR', key]);
  }

  private async upstashExpire(key: string, seconds: number): Promise<void> {
    await this.upstashRequest(['EXPIRE', key, String(seconds)]);
  }

  private async upstashGet(key: string): Promise<string | null> {
    return this.upstashRequest(['GET', key]);
  }

  /* ── Utilities ─────────────────────────────────────────── */

  private buildKey(userId: string): string {
    const now   = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return `ai:quota:${userId}:${month}`;
  }

  private secondsUntilEndOfMonth(): number {
    const now        = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    return Math.floor((endOfMonth.getTime() - now.getTime()) / 1000);
  }
}
