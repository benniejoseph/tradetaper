import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

/**
 * AI Quota Limits per subscription plan (calls per month).
 * 0 = no access. null = unlimited.
 */
const PLAN_AI_QUOTAS: Record<string, number | null> = {
  free: 0,
  essential: 0,
  premium: null, // unlimited
};

/**
 * AiQuotaService
 *
 * Enforces per-user monthly AI call limits to prevent uncapped Gemini API costs.
 * Uses Redis with a monthly-rolling TTL key per user.
 *
 * Key format: `ai:quota:{userId}:{YYYY-MM}`
 * TTL: auto-expires at month boundary.
 */
@Injectable()
export class AiQuotaService {
  private readonly logger = new Logger(AiQuotaService.name);
  private client: RedisClientType | null = null;
  private ready = false;

  constructor(private readonly configService: ConfigService) {
    this.initRedis();
  }

  private async initRedis(): Promise<void> {
    const url = this.configService.get<string>('REDIS_URL');
    if (!url) {
      this.logger.warn('AiQuotaService: REDIS_URL not configured — quota enforcement disabled (fail-open)');
      return;
    }
    try {
      this.client = createClient({ url }) as RedisClientType;
      this.client.on('error', (err) =>
        this.logger.error(`AiQuotaService Redis error: ${err.message}`),
      );
      await this.client.connect();
      this.ready = true;
      this.logger.log('AiQuotaService: Redis connected for quota tracking');
    } catch (err) {
      this.logger.error(`AiQuotaService: Failed to connect to Redis: ${err.message}. Quota enforcement disabled.`);
    }
  }

  /** Returns the quota limit for the given plan. null = unlimited. 0 = blocked. */
  getQuotaForPlan(plan: string): number | null {
    return PLAN_AI_QUOTAS[plan] ?? PLAN_AI_QUOTAS['free'];
  }

  /**
   * Check if user can make an AI call. Throws 403/429 if over quota.
   * Call this BEFORE making any Gemini/AI request.
   */
  async checkAndIncrement(userId: string, plan: string): Promise<void> {
    const limit = this.getQuotaForPlan(plan);

    // null = unlimited — skip quota check
    if (limit === null) return;

    // 0 = plan has no AI access
    if (limit === 0) {
      throw new HttpException(
        {
          statusCode: 403,
          message: 'AI features are not available on your current plan. Upgrade to Premium to unlock.',
          code: 'AI_ACCESS_DENIED',
          upgradeUrl: '/plans',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    if (!this.ready || !this.client) {
      // No Redis — fail open (log warning, don't block users)
      this.logger.warn('AiQuotaService: Redis not ready, skipping quota check');
      return;
    }

    const key = this.buildKey(userId);
    const current = await this.client.incr(key);

    // On first increment, set TTL to end of current month
    if (current === 1) {
      await this.client.expire(key, this.secondsUntilEndOfMonth());
    }

    if (current > limit) {
      // Decrement back to prevent overcounting
      void this.client.decr(key);

      throw new HttpException(
        {
          statusCode: 429,
          message: `Monthly AI call limit reached (${limit} calls/month on your plan). Upgrade to Premium for unlimited access.`,
          code: 'AI_QUOTA_EXCEEDED',
          limit,
          used: current - 1,
          upgradeUrl: '/plans',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.logger.debug(`AI quota: user ${userId} — ${current}/${limit} calls used this month`);
  }

  /** Get current month usage for a user (for display in UI) */
  async getCurrentUsage(userId: string, plan: string): Promise<{ used: number; limit: number | null }> {
    const limit = this.getQuotaForPlan(plan);
    if (!this.ready || !this.client) return { used: 0, limit };

    const key = this.buildKey(userId);
    const raw = await this.client.get(key);
    const used = raw ? parseInt(raw, 10) : 0;
    return { used, limit };
  }

  private buildKey(userId: string): string {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return `ai:quota:${userId}:${month}`;
  }

  private secondsUntilEndOfMonth(): number {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    return Math.floor((endOfMonth.getTime() - now.getTime()) / 1000);
  }
}
