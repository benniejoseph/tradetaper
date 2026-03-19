import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import os from 'os';
import { statfsSync } from 'fs';
import { User } from '../users/entities/user.entity';
import { Account } from '../users/entities/account.entity';
import { Trade } from '../trades/entities/trade.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';
import { TradeDirection, TradeStatus, AssetType } from '../types/enums';
import { RequestMetricsStore } from '../common/services/request-metrics.store';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly nonActiveSubscriptionStatuses: SubscriptionStatus[] = [
    SubscriptionStatus.INCOMPLETE,
    SubscriptionStatus.INCOMPLETE_EXPIRED,
  ];
  private readonly revenueSubscriptionStatuses: SubscriptionStatus[] = [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.TRIALING,
    SubscriptionStatus.PAST_DUE,
    SubscriptionStatus.UNPAID,
  ];

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(Trade)
    private tradeRepository: Repository<Trade>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private dataSource: DataSource,
  ) {}

  private toNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  private toNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    return this.toNumber(value);
  }

  private round(value: number, digits: number = 2): number {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }

  private parseTimeRangeToMs(timeRange: string, fallbackMs: number): number {
    const normalized = (timeRange || '').trim().toLowerCase();
    const match = normalized.match(/^(\d+)(m|h|d)$/);
    if (!match) {
      return fallbackMs;
    }
    const amount = Number(match[1]);
    const unit = match[2];
    if (!Number.isFinite(amount) || amount <= 0) {
      return fallbackMs;
    }
    switch (unit) {
      case 'm':
        return amount * 60 * 1000;
      case 'h':
        return amount * 60 * 60 * 1000;
      case 'd':
        return amount * 24 * 60 * 60 * 1000;
      default:
        return fallbackMs;
    }
  }

  private getMemoryUsagePercent(): number {
    const total = os.totalmem();
    if (!Number.isFinite(total) || total <= 0) {
      return 0;
    }
    const used = process.memoryUsage().rss;
    return this.round(Math.min((used / total) * 100, 100));
  }

  private getCpuUsagePercent(): number {
    const cpuCount = os.cpus().length || 1;
    const loadAverage = os.loadavg()[0] || 0;
    return this.round(Math.min((loadAverage / cpuCount) * 100, 100));
  }

  private getDiskUsagePercent(): number {
    try {
      const stats = statfsSync('/');
      const totalBytes = Number(stats.blocks) * Number(stats.bsize);
      const freeBytes = Number(stats.bfree) * Number(stats.bsize);
      if (!Number.isFinite(totalBytes) || totalBytes <= 0) {
        return 0;
      }
      const usedBytes = Math.max(totalBytes - freeBytes, 0);
      return this.round(Math.min((usedBytes / totalBytes) * 100, 100));
    } catch {
      return 0;
    }
  }

  private getSubscriptionPlanSql(alias: string): string {
    return `COALESCE(NULLIF(LOWER(${alias}.plan::text), ''), LOWER(${alias}.tier::text), 'free')`;
  }

  private normalizePlanKey(plan?: string | null, tier?: string | null): string {
    const raw = (plan || tier || '').trim().toLowerCase();
    if (!raw) return 'free';
    switch (raw) {
      case 'free':
      case 'starter':
      case 'basic':
        return 'free';
      case 'pro':
        return 'essential';
      default:
        return raw;
    }
  }

  private toPlanLabel(plan?: string | null, tier?: string | null): string {
    const key = this.normalizePlanKey(plan, tier);
    switch (key) {
      case 'free':
        return 'Free';
      case 'essential':
        return 'Essential';
      case 'premium':
        return 'Premium';
      case 'enterprise':
        return 'Enterprise';
      default:
        return key.charAt(0).toUpperCase() + key.slice(1);
    }
  }

  private async getLatestSubscriptionsForUsers(userIds: string[]) {
    const subscriptionsByUserId = new Map<
      string,
      {
        plan: string;
        planKey: string;
        status: string | null;
        price: number;
      }
    >();

    if (userIds.length === 0) {
      return subscriptionsByUserId;
    }

    const rows = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .select('sub.userId', 'userId')
      .addSelect('sub.plan', 'plan')
      .addSelect('sub.tier', 'tier')
      .addSelect('sub.status', 'status')
      .addSelect('sub.price', 'price')
      .where('sub.userId IN (:...userIds)', { userIds })
      .andWhere('sub.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: this.nonActiveSubscriptionStatuses,
      })
      .distinctOn(['sub.userId'])
      .orderBy('sub.userId', 'ASC')
      .addOrderBy('sub.updatedAt', 'DESC')
      .addOrderBy('sub.createdAt', 'DESC')
      .getRawMany<{
        userId: string;
        plan: string | null;
        tier: string | null;
        status: string | null;
        price: string | null;
      }>();

    for (const row of rows) {
      const planKey = this.normalizePlanKey(row.plan, row.tier);
      subscriptionsByUserId.set(row.userId, {
        planKey,
        plan: this.toPlanLabel(row.plan, row.tier),
        status: row.status,
        price: Math.round(this.toNumber(row.price) * 100) / 100,
      });
    }

    return subscriptionsByUserId;
  }

  private percentGrowth(current: number, previous: number): number {
    if (previous <= 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 10000) / 100;
  }

  private getRangeStart(days: number): Date {
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - (days - 1));
    start.setUTCHours(0, 0, 0, 0);
    return start;
  }

  private getPreviousRangeStart(days: number): Date {
    const start = this.getRangeStart(days);
    const previousStart = new Date(start);
    previousStart.setUTCDate(previousStart.getUTCDate() - days);
    return previousStart;
  }

  private buildUtcDateLabels(days: number): string[] {
    const labels: string[] = [];
    const start = this.getRangeStart(days);
    for (let i = 0; i < days; i += 1) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + i);
      labels.push(date.toISOString().slice(0, 10));
    }
    return labels;
  }

  async getDashboardStats() {
    const periodDays = 30;
    const currentStart = this.getRangeStart(periodDays);
    const previousStart = this.getPreviousRangeStart(periodDays);
    const planSql = this.getSubscriptionPlanSql('sub');

    const [
      totalUsers,
      totalTrades,
      totalSubscriptions,
      totalRevenueRaw,
      currentUsersRaw,
      previousUsersRaw,
      currentTradesRaw,
      previousTradesRaw,
      currentActiveUsersRaw,
      previousActiveUsersRaw,
      currentRevenueRaw,
      previousRevenueRaw,
      closedTradeSummaryRaw,
    ] = await Promise.all([
      this.userRepository.count(),
      this.tradeRepository.count(),
      this.subscriptionRepository
        .createQueryBuilder('sub')
        .where('sub.status NOT IN (:...excludedStatuses)', {
          excludedStatuses: this.nonActiveSubscriptionStatuses,
        })
        .getCount(),
      this.subscriptionRepository
        .createQueryBuilder('sub')
        .select(
          `COALESCE(SUM(CASE WHEN ${planSql} <> 'free' THEN sub.price ELSE 0 END), 0)`,
          'value',
        )
        .where('sub.status IN (:...statuses)', {
          statuses: this.revenueSubscriptionStatuses,
        })
        .getRawOne(),
      this.userRepository
        .createQueryBuilder('user')
        .select('COUNT(*)', 'value')
        .where('user.createdAt >= :start', { start: currentStart })
        .getRawOne(),
      this.userRepository
        .createQueryBuilder('user')
        .select('COUNT(*)', 'value')
        .where('user.createdAt >= :start AND user.createdAt < :end', {
          start: previousStart,
          end: currentStart,
        })
        .getRawOne(),
      this.tradeRepository
        .createQueryBuilder('trade')
        .select('COUNT(*)', 'value')
        .where('trade.openTime >= :start', { start: currentStart })
        .getRawOne(),
      this.tradeRepository
        .createQueryBuilder('trade')
        .select('COUNT(*)', 'value')
        .where('trade.openTime >= :start AND trade.openTime < :end', {
          start: previousStart,
          end: currentStart,
        })
        .getRawOne(),
      this.tradeRepository
        .createQueryBuilder('trade')
        .select('COUNT(DISTINCT trade.userId)', 'value')
        .where('trade.openTime >= :start', { start: currentStart })
        .getRawOne(),
      this.tradeRepository
        .createQueryBuilder('trade')
        .select('COUNT(DISTINCT trade.userId)', 'value')
        .where('trade.openTime >= :start AND trade.openTime < :end', {
          start: previousStart,
          end: currentStart,
        })
        .getRawOne(),
      this.subscriptionRepository
        .createQueryBuilder('sub')
        .select(
          `COALESCE(SUM(CASE WHEN ${planSql} <> 'free' THEN sub.price ELSE 0 END), 0)`,
          'value',
        )
        .where('sub.createdAt >= :start', { start: currentStart })
        .andWhere('sub.status IN (:...statuses)', {
          statuses: this.revenueSubscriptionStatuses,
        })
        .getRawOne(),
      this.subscriptionRepository
        .createQueryBuilder('sub')
        .select(
          `COALESCE(SUM(CASE WHEN ${planSql} <> 'free' THEN sub.price ELSE 0 END), 0)`,
          'value',
        )
        .where('sub.createdAt >= :start AND sub.createdAt < :end', {
          start: previousStart,
          end: currentStart,
        })
        .andWhere('sub.status IN (:...statuses)', {
          statuses: this.revenueSubscriptionStatuses,
        })
        .getRawOne(),
      this.tradeRepository
        .createQueryBuilder('trade')
        .select('COUNT(*)', 'total')
        .addSelect(
          'SUM(CASE WHEN COALESCE(trade.profitOrLoss, 0) > 0 THEN 1 ELSE 0 END)',
          'wins',
        )
        .where('trade.status = :status', { status: TradeStatus.CLOSED })
        .getRawOne(),
    ]);

    const totalRevenue = this.toNumber(totalRevenueRaw?.value);
    const currentUsers = this.toNumber(currentUsersRaw?.value);
    const previousUsers = this.toNumber(previousUsersRaw?.value);
    const currentTrades = this.toNumber(currentTradesRaw?.value);
    const previousTrades = this.toNumber(previousTradesRaw?.value);
    const currentActiveUsers = this.toNumber(currentActiveUsersRaw?.value);
    const previousActiveUsers = this.toNumber(previousActiveUsersRaw?.value);
    const currentRevenue = this.toNumber(currentRevenueRaw?.value);
    const previousRevenue = this.toNumber(previousRevenueRaw?.value);
    const closedTrades = this.toNumber(closedTradeSummaryRaw?.total);
    const winningTrades = this.toNumber(closedTradeSummaryRaw?.wins);
    const successRate =
      closedTrades > 0
        ? Math.round((winningTrades / closedTrades) * 10000) / 100
        : 0;

    return {
      totalUsers,
      totalTrades,
      totalSubscriptions,
      activeUsers: currentActiveUsers,
      userGrowth: this.percentGrowth(currentUsers, previousUsers),
      activeGrowth: this.percentGrowth(currentActiveUsers, previousActiveUsers),
      totalRevenue,
      revenueGrowth: this.percentGrowth(currentRevenue, previousRevenue),
      tradeGrowth: this.percentGrowth(currentTrades, previousTrades),
      avgTradesPerUser:
        totalUsers > 0 ? Math.round((totalTrades / totalUsers) * 100) / 100 : 0,
      successRate,
      monthlyGrowth: this.percentGrowth(currentUsers, previousUsers),
    };
  }

  async getUserAnalytics(timeRange: string) {
    const days = this.getDaysFromTimeRange(timeRange);
    const start = this.getRangeStart(days);

    const rows = await this.userRepository
      .createQueryBuilder('user')
      .select("TO_CHAR(DATE_TRUNC('day', user.createdAt), 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('user.createdAt >= :start', { start })
      .groupBy("DATE_TRUNC('day', user.createdAt)")
      .orderBy("DATE_TRUNC('day', user.createdAt)", 'ASC')
      .getRawMany<{ date: string; count: string }>();

    const buckets = new Map<string, number>();
    for (const row of rows) {
      buckets.set(row.date, this.toNumber(row.count));
    }

    const labels = this.buildUtcDateLabels(days);
    const data = labels.map((date) => ({
      date,
      users: buckets.get(date) || 0,
    }));

    return {
      labels,
      values: data.map((d) => d.users),
      data,
    };
  }

  async getRevenueAnalytics(timeRange: string) {
    const days = this.getDaysFromTimeRange(timeRange);
    const start = this.getRangeStart(days);
    const planSql = this.getSubscriptionPlanSql('sub');

    const rows = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .select("TO_CHAR(DATE_TRUNC('day', sub.createdAt), 'YYYY-MM-DD')", 'date')
      .addSelect(
        `COALESCE(SUM(CASE WHEN ${planSql} <> 'free' THEN sub.price ELSE 0 END), 0)`,
        'revenue',
      )
      .where('sub.createdAt >= :start', { start })
      .andWhere('sub.status IN (:...statuses)', {
        statuses: this.revenueSubscriptionStatuses,
      })
      .groupBy("DATE_TRUNC('day', sub.createdAt)")
      .orderBy("DATE_TRUNC('day', sub.createdAt)", 'ASC')
      .getRawMany<{ date: string; revenue: string }>();

    const buckets = new Map<string, number>();
    for (const row of rows) {
      buckets.set(row.date, this.toNumber(row.revenue));
    }

    const labels = this.buildUtcDateLabels(days);
    const data = labels.map((date) => ({
      date,
      revenue: Math.round((buckets.get(date) || 0) * 100) / 100,
    }));

    return {
      labels,
      values: data.map((d) => d.revenue),
      data,
    };
  }

  async getSystemHealth() {
    const metricsLast24h = RequestMetricsStore.getMetricsSince(24 * 60 * 60 * 1000);
    const metricsLast5m = RequestMetricsStore.getMetricsSince(5 * 60 * 1000);
    const apiCalls24h = metricsLast24h.length;
    const errors24h = metricsLast24h.filter((metric) => metric.statusCode >= 500).length;

    let dbLatencyMs = 0;
    let dbConnections = 0;
    let cacheHitRate = 0;
    let dbIsHealthy = true;

    try {
      const start = Date.now();
      await this.dataSource.query('SELECT 1');
      dbLatencyMs = Date.now() - start;

      const dbConnectionRow = await this.dataSource.query(
        `SELECT COUNT(*)::int AS value
         FROM pg_stat_activity
         WHERE datname = current_database()`,
      );
      dbConnections = this.toNumber(dbConnectionRow?.[0]?.value);

      const cacheHitRow = await this.dataSource.query(
        `SELECT CASE
            WHEN SUM(blks_hit + blks_read) = 0 THEN 0
            ELSE ROUND((SUM(blks_hit)::numeric / NULLIF(SUM(blks_hit + blks_read), 0)) * 100, 2)
          END AS value
         FROM pg_stat_database
         WHERE datname = current_database()`,
      );
      cacheHitRate = this.toNumber(cacheHitRow?.[0]?.value);
    } catch (error) {
      dbIsHealthy = false;
      this.logger.warn(
        `System health DB probe failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }

    const requestResponseTime =
      metricsLast5m.length > 0
        ? metricsLast5m.reduce((sum, metric) => sum + metric.durationMs, 0) /
          metricsLast5m.length
        : 0;
    const responseTime = this.round(
      requestResponseTime > 0 ? requestResponseTime : dbLatencyMs,
    );
    const memoryUsage = this.getMemoryUsagePercent();
    const cpuUsage = this.getCpuUsagePercent();
    const diskUsage = this.getDiskUsagePercent();
    const uptimeSeconds = process.uptime();
    const uptimeDays = uptimeSeconds / (24 * 60 * 60);
    const uptime = this.round(Math.min((uptimeDays / 30) * 100, 100));

    const status: 'healthy' | 'warning' | 'critical' =
      !dbIsHealthy || responseTime > 1_500 || cpuUsage > 90 || memoryUsage > 95
        ? 'critical'
        : responseTime > 700 || cpuUsage > 80 || memoryUsage > 85
          ? 'warning'
          : 'healthy';

    return {
      status,
      uptime,
      responseTime,
      memoryUsage,
      cpuUsage,
      diskUsage,
      databaseConnections: dbConnections,
      errors24h,
      apiCalls24h,
      cacheHitRate: this.round(cacheHitRate),
      timestamp: new Date().toISOString(),
    };
  }

  async getSystemLogs(
    limit: number = 100,
    offset: number = 0,
    level?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const resolvedLimit = Math.min(Math.max(limit, 1), 250);
    const resolvedOffset = Math.max(offset, 0);
    const normalizedLevel = level?.trim().toLowerCase();
    const now = Date.now();
    const startTimestamp = startDate
      ? new Date(startDate).getTime()
      : now - 24 * 60 * 60 * 1000;
    const endTimestamp = endDate ? new Date(endDate).getTime() : now;
    const isValidRange =
      Number.isFinite(startTimestamp) &&
      Number.isFinite(endTimestamp) &&
      endTimestamp >= startTimestamp;

    const logs = RequestMetricsStore.getRecentLogs(7 * 24 * 60 * 60 * 1000).filter(
      (entry) => {
        if (normalizedLevel && entry.level !== normalizedLevel) {
          return false;
        }
        if (!isValidRange) {
          return true;
        }
        const timestamp = new Date(entry.timestamp).getTime();
        return timestamp >= startTimestamp && timestamp <= endTimestamp;
      },
    );

    const paginated = logs
      .slice(resolvedOffset, resolvedOffset + resolvedLimit)
      .map((entry, index) => ({
        id: `${entry.timestamp}-${resolvedOffset + index}`,
        level: entry.level,
        message: entry.message,
        context: 'ApiCall',
        details: {
          method: entry.method,
          endpoint: entry.endpoint,
          statusCode: entry.statusCode,
          responseTime: entry.responseTime,
        },
        timestamp: entry.timestamp,
        endpoint: entry.endpoint,
        method: entry.method,
      }));

    return {
      data: paginated,
      total: logs.length,
      limit: resolvedLimit,
      offset: resolvedOffset,
    };
  }

  async getPerformanceMetrics(timeRange: string = '1h') {
    const rangeMs = this.parseTimeRangeToMs(timeRange, 60 * 60 * 1000);
    const baseSeries = RequestMetricsStore.buildPerformanceSeries(rangeMs, 12);
    const cpuUsage = this.getCpuUsagePercent();
    const memoryUsage = this.getMemoryUsagePercent();

    return {
      data: baseSeries.map((item) => ({
        ...item,
        cpuUsage,
        memoryUsage,
      })),
    };
  }

  async getApiUsageStats(timeRange: string = '24h') {
    const rangeMs = this.parseTimeRangeToMs(timeRange, 24 * 60 * 60 * 1000);
    const usage = RequestMetricsStore.buildUsageStats(rangeMs);
    return {
      totalRequests: usage.totalRequests,
      requestsByEndpoint: usage.requestsByEndpoint,
      requestsByMethod: usage.requestsByMethod,
      timeRange,
    };
  }

  async getActivityFeed(limit: number = 5) {
    const cappedLimit = Math.min(Math.max(limit, 1), 50);

    const [recentTrades, recentUsers, recentSubscriptions] = await Promise.all([
      this.tradeRepository
        .createQueryBuilder('trade')
        .leftJoinAndSelect('trade.user', 'user')
        .orderBy('trade.createdAt', 'DESC')
        .take(cappedLimit)
        .getMany(),
      this.userRepository
        .createQueryBuilder('user')
        .orderBy('user.createdAt', 'DESC')
        .take(cappedLimit)
        .getMany(),
      this.subscriptionRepository
        .createQueryBuilder('sub')
        .leftJoinAndSelect('sub.user', 'user')
        .orderBy('sub.updatedAt', 'DESC')
        .take(cappedLimit)
        .getMany(),
    ]);

    const activity = [
      ...recentTrades.map((trade) => ({
        id: `trade-${trade.id}`,
        type: trade.status === TradeStatus.CLOSED ? 'trade_closed' : 'trade_created',
        description:
          trade.status === TradeStatus.CLOSED
            ? `Trade closed on ${trade.symbol} — P/L ${this.toNumber(trade.profitOrLoss) >= 0 ? '+' : ''}${this.toNumber(trade.profitOrLoss).toFixed(2)}`
            : `New trade opened on ${trade.symbol}`,
        timestamp: (
          trade.closeTime ||
          trade.openTime ||
          trade.createdAt
        ).toISOString(),
        user: {
          id: trade.user?.id || trade.userId,
          name:
            trade.user?.firstName ||
            trade.user?.email?.split('@')[0] ||
            'Trader',
        },
      })),
      ...recentUsers.map((user) => ({
        id: `user-${user.id}`,
        type: 'user_created',
        description: `New user signup: ${user.email}`,
        timestamp: user.createdAt.toISOString(),
        user: {
          id: user.id,
          name: user.firstName || user.email.split('@')[0],
        },
      })),
      ...recentSubscriptions.map((sub) => ({
        id: `sub-${sub.id}`,
        type: 'subscription_changed',
        description: `Subscription ${sub.plan} is ${sub.status}`,
        timestamp: (sub.updatedAt || sub.createdAt).toISOString(),
        user: {
          id: sub.user?.id || sub.userId,
          name: sub.user?.firstName || sub.user?.email?.split('@')[0] || 'User',
        },
      })),
    ];

    return activity
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, cappedLimit);
  }

  async getSubscriptionAnalytics(timeRange: string) {
    const planColors: Record<string, string> = {
      free: '#6B7280',
      essential: '#10B981',
      premium: '#22D3EE',
    };
    const days = this.getDaysFromTimeRange(timeRange);
    const start = this.getRangeStart(days);
    const planSql = this.getSubscriptionPlanSql('sub');

    const rows = await this.subscriptionRepository
      .createQueryBuilder('sub')
      .select(planSql, 'plan')
      .addSelect('COUNT(*)', 'count')
      .addSelect(
        `COALESCE(SUM(CASE WHEN ${planSql} <> 'free' THEN sub.price ELSE 0 END), 0)`,
        'revenue',
      )
      .addSelect(
        `COALESCE(AVG(CASE WHEN ${planSql} <> 'free' THEN sub.price END), 0)`,
        'price',
      )
      .where('sub.createdAt >= :start', { start })
      .andWhere('sub.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: this.nonActiveSubscriptionStatuses,
      })
      .groupBy(planSql)
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany<{
        plan: string;
        count: string;
        revenue: string;
        price: string;
      }>();

    return {
      subscriptionDistribution: rows.map((row) => ({
        plan: this.toPlanLabel(row.plan),
        planKey: this.normalizePlanKey(row.plan),
        count: this.toNumber(row.count),
        revenue: Math.round(this.toNumber(row.revenue) * 100) / 100,
        price: Math.round(this.toNumber(row.price) * 100) / 100,
        color: planColors[this.normalizePlanKey(row.plan)] || '#34D399',
      })),
    };
  }

  async getUsers(page: number = 1, limit: number = 20, search?: string) {
    const qb = this.userRepository.createQueryBuilder('user');

    if (search) {
      qb.where(
        'LOWER(user.email) LIKE :q OR LOWER(user.firstName) LIKE :q OR LOWER(user.lastName) LIKE :q',
        { q: `%${search.toLowerCase()}%` },
      );
    }

    qb.orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [users, total] = await qb.getManyAndCount();
    const subscriptionsByUserId = await this.getLatestSubscriptionsForUsers(
      users.map((user) => user.id),
    );
    const data = users.map((user) => ({
      ...user,
      subscription: subscriptionsByUserId.get(user.id) || {
        plan: 'Free',
        planKey: 'free',
        status: null,
        price: 0,
      },
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserDetail(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) return { error: 'User not found' };

    const [trades, tradeCount] = await this.tradeRepository.findAndCount({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const [accounts, accountCount] = await this.accountRepository.findAndCount({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });

    const totalPnl = trades
      .filter((t) => t.profitOrLoss != null)
      .reduce((sum, t) => sum + Number(t.profitOrLoss || 0), 0);
    const subscriptionsByUserId = await this.getLatestSubscriptionsForUsers([
      userId,
    ]);

    const normalizedTrades = trades.map((trade) => ({
      ...trade,
      openPrice: this.toNumber(trade.openPrice),
      closePrice: this.toNullableNumber(trade.closePrice),
      profitOrLoss: this.toNullableNumber(trade.profitOrLoss),
    }));

    const normalizedAccounts = accounts.map((account) => ({
      ...account,
      balance: this.toNullableNumber(account.balance),
    }));

    return {
      user: {
        ...user,
        subscription: subscriptionsByUserId.get(userId) || {
          plan: 'Free',
          planKey: 'free',
          status: null,
          price: 0,
        },
      },
      trades: normalizedTrades,
      tradeCount,
      accounts: normalizedAccounts,
      accountCount,
      totalPnl,
    };
  }

  async getTrades(page: number = 1, limit: number = 50, status?: string, userId?: string) {
    const qb = this.tradeRepository
      .createQueryBuilder('trade')
      .leftJoinAndSelect('trade.user', 'user')
      .orderBy('trade.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('trade.status = :status', { status });
    if (userId) qb.andWhere('user.id = :userId', { userId });

    const summaryQb = this.tradeRepository
      .createQueryBuilder('trade')
      .select('COALESCE(SUM(COALESCE(trade.profitOrLoss, 0)), 0)', 'totalPnl')
      .addSelect(
        'SUM(CASE WHEN trade.status = :closedStatus AND COALESCE(trade.profitOrLoss, 0) > 0 THEN 1 ELSE 0 END)',
        'winCount',
      )
      .addSelect(
        'SUM(CASE WHEN trade.status = :closedStatus THEN 1 ELSE 0 END)',
        'closedCount',
      )
      .setParameter('closedStatus', TradeStatus.CLOSED);

    if (status) summaryQb.andWhere('trade.status = :status', { status });
    if (userId) summaryQb.andWhere('trade.userId = :userId', { userId });

    const [[trades, total], summaryRaw] = await Promise.all([
      qb.getManyAndCount(),
      summaryQb.getRawOne<{
        totalPnl: string;
        winCount: string;
        closedCount: string;
      }>(),
    ]);

    const totalPnl = Math.round(this.toNumber(summaryRaw?.totalPnl) * 100) / 100;
    const winCount = this.toNumber(summaryRaw?.winCount);
    const closedCount = this.toNumber(summaryRaw?.closedCount);
    const winRate =
      closedCount > 0 ? Math.round((winCount / closedCount) * 100) : 0;

    const normalizedTrades = trades.map((trade) => ({
      ...trade,
      openPrice: this.toNumber(trade.openPrice),
      closePrice: this.toNullableNumber(trade.closePrice),
      profitOrLoss: this.toNullableNumber(trade.profitOrLoss),
    }));

    return {
      data: normalizedTrades,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: { totalPnl, winRate, winCount, closedCount },
    };
  }

  async getAccounts(page: number = 1, limit: number = 50, userId?: string) {
    const qb = this.accountRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.user', 'user')
      .orderBy('account.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (userId) qb.andWhere('user.id = :userId', { userId });

    const balanceQb = this.accountRepository
      .createQueryBuilder('account')
      .select('COALESCE(SUM(COALESCE(account.balance, 0)), 0)', 'totalBalance');
    if (userId) {
      balanceQb.where('account.userId = :userId', { userId });
    }

    const [[accounts, total], balanceRaw] = await Promise.all([
      qb.getManyAndCount(),
      balanceQb.getRawOne<{ totalBalance: string }>(),
    ]);
    const totalBalance = Math.round(this.toNumber(balanceRaw?.totalBalance) * 100) / 100;

    const normalizedAccounts = accounts.map((account) => ({
      ...account,
      balance: this.toNullableNumber(account.balance),
    }));

    return {
      data: normalizedAccounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: { totalBalance },
    };
  }

  async getSubscriptions(page: number = 1, limit: number = 50, status?: string, plan?: string) {
    const qb = this.subscriptionRepository
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.user', 'user')
      .orderBy('sub.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      qb.andWhere('LOWER(sub.status) = :status', {
        status: status.trim().toLowerCase(),
      });
    }
    if (plan) {
      const normalizedPlan = this.normalizePlanKey(plan);
      qb.andWhere(`${this.getSubscriptionPlanSql('sub')} = :plan`, {
        plan: normalizedPlan,
      });
    }

    const [subscriptions, total] = await qb.getManyAndCount();
    const data = subscriptions.map((subscription) => ({
      ...subscription,
      plan: this.toPlanLabel(subscription.plan, subscription.tier),
      planKey: this.normalizePlanKey(subscription.plan, subscription.tier),
      price: this.toNullableNumber(subscription.price),
    }));

    // Active count
    const activeCount = await this.subscriptionRepository.count({
      where: { status: SubscriptionStatus.ACTIVE },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: { activeCount },
    };
  }

  async getDatabaseTables(): Promise<string[]> {
    try {
      const query = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `;
      const result = await this.dataSource.query(query);
      return result.map((row: Record<string, string>) => row.table_name);
    } catch (error) {
      this.logger.error('Error fetching database tables', error);
      return [];
    }
  }

  async getDatabaseTable(tableName: string) {
    this.assertSafeTableName(tableName);
    try {
      const query = `SELECT * FROM "${tableName}" LIMIT 100;`;
      const result = await this.dataSource.query(query);
      return result;
    } catch (error) {
      this.logger.error(`Error fetching table ${tableName}`, error);
      return [];
    }
  }

  async getDatabaseColumns(tableName: string) {
    this.assertSafeTableName(tableName);
    try {
      const query = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      const result = await this.dataSource.query(query, [tableName]);
      return result;
    } catch (error) {
      this.logger.error(`Error fetching columns for ${tableName}`, error);
      return [];
    }
  }

  async getDatabaseRows(
    tableName: string,
    page: number = 1,
    limit: number = 20,
  ) {
    this.assertSafeTableName(tableName);
    try {
      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = `SELECT COUNT(*) as count FROM "${tableName}";`;
      const countResult = await this.dataSource.query(countQuery);
      const total = parseInt(countResult[0].count);

      // Get paginated data
      const dataQuery = `SELECT * FROM "${tableName}" LIMIT $1 OFFSET $2;`;
      const data = await this.dataSource.query(dataQuery, [limit, offset]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Error fetching rows from ${tableName}`, error);
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }

  private getDaysFromTimeRange(timeRange: string): number {
    switch (timeRange) {
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      case '1y':
        return 365;
      default:
        return 30;
    }
  }

  async seedSampleData() {
    try {
      // Create sample users
      const sampleUsers = [
        {
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          password: 'hashedpassword123',
          isEmailVerified: true,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
        {
          email: 'jane.smith@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          password: 'hashedpassword456',
          isEmailVerified: true,
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        },
        {
          email: 'mike.johnson@example.com',
          firstName: 'Mike',
          lastName: 'Johnson',
          password: 'hashedpassword789',
          isEmailVerified: true,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
        {
          email: 'sarah.wilson@example.com',
          firstName: 'Sarah',
          lastName: 'Wilson',
          password: 'hashedpassword101',
          isEmailVerified: true,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        },
        {
          email: 'alex.brown@example.com',
          firstName: 'Alex',
          lastName: 'Brown',
          password: 'hashedpassword202',
          isEmailVerified: false,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
      ];

      // Insert users
      const createdUsers: User[] = [];
      for (const userData of sampleUsers) {
        const existingUser = await this.userRepository.findOne({
          where: { email: userData.email },
        });
        if (!existingUser) {
          const user = this.userRepository.create(userData);
          const savedUser = await this.userRepository.save(user);
          createdUsers.push(savedUser);
        } else {
          createdUsers.push(existingUser);
        }
      }

      // Create sample trades
      const sampleTrades = [
        {
          user: createdUsers[0],
          symbol: 'EURUSD',
          side: TradeDirection.LONG,
          quantity: 1.5,
          openPrice: 1.085,
          closePrice: 1.092,
          status: TradeStatus.CLOSED,
          profitOrLoss: 105.0,
          assetType: AssetType.FOREX,
          openTime: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
          closeTime: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        },
        {
          user: createdUsers[0],
          symbol: 'GBPUSD',
          side: TradeDirection.SHORT,
          quantity: 2.0,
          openPrice: 1.265,
          closePrice: 1.258,
          status: TradeStatus.CLOSED,
          profitOrLoss: 140.0,
          assetType: AssetType.FOREX,
          openTime: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          closeTime: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        },
        {
          user: createdUsers[1],
          symbol: 'USDJPY',
          side: TradeDirection.LONG,
          quantity: 1.0,
          openPrice: 149.5,
          closePrice: 150.2,
          status: TradeStatus.CLOSED,
          profitOrLoss: 70.0,
          assetType: AssetType.FOREX,
          openTime: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
          closeTime: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        },
        {
          user: createdUsers[1],
          symbol: 'AUDUSD',
          side: TradeDirection.LONG,
          quantity: 1.8,
          openPrice: 0.675,
          status: TradeStatus.OPEN,
          assetType: AssetType.FOREX,
          openTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          user: createdUsers[2],
          symbol: 'USDCAD',
          side: TradeDirection.SHORT,
          quantity: 1.2,
          openPrice: 1.345,
          closePrice: 1.338,
          status: TradeStatus.CLOSED,
          profitOrLoss: 84.0,
          assetType: AssetType.FOREX,
          openTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          closeTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
        {
          user: createdUsers[3],
          symbol: 'EURJPY',
          side: TradeDirection.LONG,
          quantity: 0.8,
          openPrice: 162.3,
          status: TradeStatus.OPEN,
          assetType: AssetType.FOREX,
          openTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ];

      // Insert trades
      let createdTrades = 0;
      for (const tradeData of sampleTrades) {
        const existingTrade = await this.tradeRepository.findOne({
          where: {
            symbol: tradeData.symbol,
            user: { id: tradeData.user.id },
            createdAt: tradeData.createdAt,
          },
        });
        if (!existingTrade) {
          const trade = this.tradeRepository.create(tradeData);
          await this.tradeRepository.save(trade);
          createdTrades++;
        }
      }

      // Skip subscriptions for now due to schema mismatch
      // Sample subscriptions would be created here when schema is fixed
      const createdSubscriptions = 0;
      // TODO: Fix subscription entity/database schema mismatch
      this.logger.warn('Skipping subscription seeding due to schema mismatch');

      return {
        success: true,
        message: 'Sample data seeded successfully',
        data: {
          users: createdUsers.length,
          trades: createdTrades,
          subscriptions: createdSubscriptions,
        },
      };
    } catch (error) {
      this.logger.error('Error seeding sample data', error);
      return {
        success: false,
        message: 'Failed to seed sample data',
        error: error.message,
      };
    }
  }

  async clearTable(tableName: string): Promise<{ deletedCount: number }> {
    // Whitelist of tables that can be safely cleared
    const allowedTables = [
      'trades',
      'tags',
      'trade_tags',
      'mt5_accounts',
      'strategies',
      'subscriptions',
      'usage_tracking',
    ];

    if (!allowedTables.includes(tableName)) {
      throw new Error(
        `Table ${tableName} is not allowed to be cleared for safety reasons`,
      );
    }

    try {
      // Get count before deletion
      const countQuery = `SELECT COUNT(*) as count FROM "${tableName}";`;
      const countResult = await this.dataSource.query(countQuery);
      const deletedCount = parseInt(countResult[0].count);

      // Clear the table
      const deleteQuery = `DELETE FROM "${tableName}";`;
      await this.dataSource.query(deleteQuery);

      return { deletedCount };
    } catch (error) {
      this.logger.error(`Error clearing table ${tableName}`, error);
      throw new Error(`Failed to clear table ${tableName}: ${error.message}`);
    }
  }

  async clearAllTables(): Promise<{
    tablesCleared: string[];
    totalDeleted: number;
  }> {
    const allowedTables = [
      'trades',
      'tags',
      'trade_tags',
      'mt5_accounts',
      'strategies',
      'subscriptions',
      'usage_tracking',
    ];

    let totalDeleted = 0;
    const tablesCleared: string[] = [];

    try {
      // Clear tables in order to avoid foreign key constraints
      const clearOrder = [
        'trade_tags', // Junction table first
        'trades', // Then trades
        'tags', // Then tags
        'mt5_accounts', // MT5 accounts
        'strategies', // Strategies
        'usage_tracking', // Usage tracking
        'subscriptions', // Finally subscriptions
      ];

      for (const tableName of clearOrder) {
        if (allowedTables.includes(tableName)) {
          const result = await this.clearTable(tableName);
          totalDeleted += result.deletedCount;
          tablesCleared.push(tableName);
        }
      }

      return { tablesCleared, totalDeleted };
    } catch (error) {
      this.logger.error('Error clearing all tables', error);
      throw new Error(`Failed to clear all tables: ${error.message}`);
    }
  }

  async getTableStats() {
    try {
      const tablesQuery = `
        SELECT 
          schemaname as schema_name,
          tablename as table_name,
          attname as column_name,
          typname as data_type
        FROM pg_tables pt
        LEFT JOIN pg_attribute pa ON pa.attrelid = (pt.schemaname||'.'||pt.tablename)::regclass
        LEFT JOIN pg_type pt2 ON pa.atttypid = pt2.oid
        WHERE schemaname = 'public'
        AND pa.attnum > 0
        AND NOT pa.attisdropped
        ORDER BY table_name, pa.attnum;
      `;

      const result = await this.dataSource.query(tablesQuery);

      // Group by table
      const tableStats: Record<
        string,
        { name: string; columns: Array<{ name: string; type: string }> }
      > = {};
      result.forEach((row: Record<string, string>) => {
        if (!tableStats[row.table_name]) {
          tableStats[row.table_name] = {
            name: row.table_name,
            columns: [],
          };
        }
        if (row.column_name) {
          tableStats[row.table_name].columns.push({
            name: row.column_name,
            type: row.data_type,
          });
        }
      });

      return Object.values(tableStats);
    } catch (error) {
      this.logger.error('Error fetching table stats', error);
      return [];
    }
  }

  async runSql(
    sql: string,
  ): Promise<{ success: boolean; result?: unknown; error?: string }> {
    try {
      const normalized = sql.trim();
      if (!normalized) {
        throw new BadRequestException('SQL is required');
      }
      if (!/^select\b/i.test(normalized)) {
        throw new BadRequestException('Only SELECT queries are allowed');
      }
      if (normalized.includes(';')) {
        throw new BadRequestException(
          'Multiple statements are not allowed in admin SQL runner',
        );
      }

      this.logger.log('Executing admin SQL query');
      const result = await this.dataSource.query(normalized);
      return {
        success: true,
        result,
      };
    } catch (error) {
      this.logger.error('SQL execution error', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private assertSafeTableName(tableName: string): void {
    const isSafeIdentifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName);
    if (!isSafeIdentifier) {
      throw new BadRequestException('Invalid table name');
    }
  }
}
