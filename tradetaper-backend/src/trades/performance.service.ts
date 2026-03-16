import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trade } from './entities/trade.entity';
import { TradeStatus } from '../types/enums';
import { UserResponseDto } from '../users/dto/user-response.dto';

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  totalCommissions: number;
  netPnL: number;
  totalTradedValue: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  averageRMultiple: number;
  expectancy: number;
  sharpeRatio: number;
  maxDrawdown: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  tradingDays: number;
  averageTradesPerDay: number;
}

export interface DailyPerformance {
  date: string;
  trades: number;
  pnl: number;
  winRate: number;
  cumulativePnL: number;
}

export interface MonthlyPerformance {
  month: string;
  trades: number;
  pnl: number;
  winRate: number;
  bestDay: number;
  worstDay: number;
}

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);

  constructor(
    @InjectRepository(Trade)
    private readonly tradesRepository: Repository<Trade>,
  ) {}

  async getPerformanceMetrics(
    userContext: UserResponseDto,
    accountId?: string,
    dateFrom?: string,
    dateTo?: string,
    filters?: {
      status?: string;
      direction?: string;
      assetType?: string;
      symbol?: string;
      search?: string;
      isStarred?: boolean;
      minPnl?: number;
      maxPnl?: number;
      minDuration?: number;
      maxDuration?: number;
    },
  ): Promise<PerformanceMetrics> {
    this.logger.log(
      `Calculating performance metrics for user ${userContext.id}`,
    );

    const queryBuilder = this.tradesRepository
      .createQueryBuilder('trade')
      .where('trade.userId = :userId', { userId: userContext.id })
      .andWhere('trade.status = :status', { status: TradeStatus.CLOSED });

    if (accountId) {
      queryBuilder.andWhere('trade.accountId = :accountId', { accountId });
    }

    if (dateFrom) {
      queryBuilder.andWhere('trade.openTime >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('trade.openTime <= :dateTo', { dateTo });
    }

    if (filters?.status) {
      queryBuilder.andWhere('trade.status = :statusFilter', {
        statusFilter: filters.status,
      });
    }

    if (filters?.direction) {
      queryBuilder.andWhere('trade.side = :side', {
        side: filters.direction,
      });
    }

    if (filters?.assetType) {
      queryBuilder.andWhere('trade.assetType = :assetType', {
        assetType: filters.assetType,
      });
    }

    if (filters?.symbol) {
      queryBuilder.andWhere('trade.symbol ILIKE :symbol', {
        symbol: `%${filters.symbol}%`,
      });
    }

    if (filters?.isStarred) {
      queryBuilder.andWhere('trade.isStarred = :isStarred', {
        isStarred: true,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(trade.symbol ILIKE :search OR trade.notes ILIKE :search OR trade.setupDetails ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (Number.isFinite(filters?.minPnl)) {
      queryBuilder.andWhere('trade.profitOrLoss >= :minPnl', {
        minPnl: filters?.minPnl,
      });
    }

    if (Number.isFinite(filters?.maxPnl)) {
      queryBuilder.andWhere('trade.profitOrLoss <= :maxPnl', {
        maxPnl: filters?.maxPnl,
      });
    }

    if (Number.isFinite(filters?.minDuration)) {
      queryBuilder.andWhere(
        'trade.closeTime IS NOT NULL AND EXTRACT(EPOCH FROM (trade.closeTime - trade.openTime)) >= :minDuration',
        { minDuration: filters?.minDuration },
      );
    }
    if (Number.isFinite(filters?.maxDuration)) {
      queryBuilder.andWhere(
        'trade.closeTime IS NOT NULL AND EXTRACT(EPOCH FROM (trade.closeTime - trade.openTime)) <= :maxDuration',
        { maxDuration: filters?.maxDuration },
      );
    }

    const trades = await queryBuilder.getMany();

    return this.calculateMetrics(trades);
  }

  async getDailyPerformance(
    userContext: UserResponseDto,
    accountId?: string,
    days: number = 30,
  ): Promise<DailyPerformance[]> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const queryBuilder = this.tradesRepository
      .createQueryBuilder('trade')
      .where('trade.userId = :userId', { userId: userContext.id })
      .andWhere('trade.status = :status', { status: TradeStatus.CLOSED })
      .andWhere('trade.closeTime >= :dateFrom', {
        dateFrom: dateFrom.toISOString(),
      });

    if (accountId) {
      queryBuilder.andWhere('trade.accountId = :accountId', { accountId });
    }

    const trades = await queryBuilder.getMany();

    return this.groupTradesByDay(trades);
  }

  async getMonthlyPerformance(
    userContext: UserResponseDto,
    accountId?: string,
    months: number = 12,
  ): Promise<MonthlyPerformance[]> {
    const dateFrom = new Date();
    dateFrom.setMonth(dateFrom.getMonth() - months);

    const queryBuilder = this.tradesRepository
      .createQueryBuilder('trade')
      .where('trade.userId = :userId', { userId: userContext.id })
      .andWhere('trade.status = :status', { status: TradeStatus.CLOSED })
      .andWhere('trade.closeTime >= :dateFrom', {
        dateFrom: dateFrom.toISOString(),
      });

    if (accountId) {
      queryBuilder.andWhere('trade.accountId = :accountId', { accountId });
    }

    const trades = await queryBuilder.getMany();

    return this.groupTradesByMonth(trades);
  }

  private calculateMetrics(trades: Trade[]): PerformanceMetrics {
    const toNumber = (value: unknown): number => {
      if (value === null || value === undefined) return 0;
      const parsed = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const toNumberOrNull = (value: unknown): number | null => {
      if (value === null || value === undefined || value === '') return null;
      const parsed = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const resolveRMultiple = (trade: Trade): number | null => {
      const stored = toNumberOrNull(trade.rMultiple);
      if (stored !== null) return stored;

      const openPrice = toNumberOrNull(trade.openPrice);
      const closePrice = toNumberOrNull(trade.closePrice);
      const stopLoss = toNumberOrNull(trade.stopLoss);
      if (openPrice === null || closePrice === null || stopLoss === null) {
        return null;
      }

      const riskPerUnit = Math.abs(openPrice - stopLoss);
      if (riskPerUnit <= 0) return null;

      const side = String(trade.side || '').toLowerCase();
      const rewardPerUnit =
        side === 'long'
          ? closePrice - openPrice
          : side === 'short'
            ? openPrice - closePrice
            : null;

      if (rewardPerUnit === null || !Number.isFinite(rewardPerUnit)) {
        return null;
      }

      const derived = rewardPerUnit / riskPerUnit;
      return Number.isFinite(derived) ? derived : null;
    };

    const totalTrades = trades.length;
    const winningTrades = trades.filter((t) => toNumber(t.profitOrLoss) > 0);
    const losingTrades = trades.filter((t) => toNumber(t.profitOrLoss) < 0);

    const totalPnL = trades.reduce((sum, t) => sum + toNumber(t.profitOrLoss), 0);
    const totalCommissions = trades.reduce(
      (sum, t) => sum + Math.abs(toNumber(t.commission)),
      0,
    );
    const netPnL = totalPnL - totalCommissions;
    const totalTradedValue = trades.reduce((sum, t) => {
      const openPrice = toNumber(t.openPrice);
      const quantity = toNumber(t.quantity);
      if (openPrice && quantity) {
        return sum + Math.abs(openPrice * quantity);
      }
      return sum;
    }, 0);

    const winRate =
      totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

    const averageWin =
      winningTrades.length > 0
        ? winningTrades.reduce((sum, t) => sum + toNumber(t.profitOrLoss), 0) /
          winningTrades.length
        : 0;

    const averageLoss =
      losingTrades.length > 0
        ? Math.abs(
            losingTrades.reduce((sum, t) => sum + toNumber(t.profitOrLoss), 0) /
              losingTrades.length,
          )
        : 0;

    const profitFactor = averageLoss > 0 ? averageWin / averageLoss : 0;

    const largestWin =
      winningTrades.length > 0
        ? Math.max(...winningTrades.map((t) => toNumber(t.profitOrLoss)))
        : 0;

    const largestLoss =
      losingTrades.length > 0
        ? Math.min(...losingTrades.map((t) => toNumber(t.profitOrLoss)))
        : 0;

    const achievedRMultiples = trades
      .map((trade) => resolveRMultiple(trade))
      .filter((value): value is number => value !== null);
    const averageRMultiple =
      achievedRMultiples.length > 0
        ? achievedRMultiples.reduce((sum, value) => sum + value, 0) /
          achievedRMultiples.length
        : 0;

    const expectancy = totalTrades > 0 ? totalPnL / totalTrades : 0;

    // Calculate Sharpe ratio (simplified)
    const returns = trades.map((t) => toNumber(t.profitOrLoss));
    const avgReturn =
      returns.length > 0
        ? returns.reduce((a, b) => a + b, 0) / returns.length
        : 0;
    const variance =
      returns.length > 0
        ? returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) /
          returns.length
        : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

    // Calculate max drawdown
    const maxDrawdown = this.calculateMaxDrawdown(trades, toNumber);

    // Calculate consecutive wins/losses
    const { consecutiveWins, consecutiveLosses } =
      this.calculateConsecutiveStreaks(trades, toNumber);

    // Calculate trading days
    const tradingDays = this.calculateTradingDays(trades);
    const averageTradesPerDay = tradingDays > 0 ? totalTrades / tradingDays : 0;

    return {
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      totalPnL,
      totalCommissions,
      netPnL,
      totalTradedValue,
      averageWin,
      averageLoss,
      profitFactor,
      largestWin,
      largestLoss,
      averageRMultiple,
      expectancy,
      sharpeRatio,
      maxDrawdown,
      consecutiveWins,
      consecutiveLosses,
      tradingDays,
      averageTradesPerDay,
    };
  }

  private calculateMaxDrawdown(
    trades: Trade[],
    toNumber: (value: unknown) => number,
  ): number {
    const sortedTrades = trades
      .filter((t) => t.closeTime)
      .sort(
        (a, b) =>
          new Date(a.closeTime!).getTime() - new Date(b.closeTime!).getTime(),
      );

    let peak = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;

    for (const trade of sortedTrades) {
      runningPnL += toNumber(trade.profitOrLoss);
      if (runningPnL > peak) {
        peak = runningPnL;
      }
      const drawdown = peak - runningPnL;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  private calculateConsecutiveStreaks(
    trades: Trade[],
    toNumber: (value: unknown) => number,
  ): {
    consecutiveWins: number;
    consecutiveLosses: number;
  } {
    const sortedTrades = trades
      .filter((t) => t.closeTime)
      .sort(
        (a, b) =>
          new Date(a.closeTime!).getTime() - new Date(b.closeTime!).getTime(),
      );

    let maxWins = 0;
    let maxLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;

    for (const trade of sortedTrades) {
      const pnl = toNumber(trade.profitOrLoss);
      if (pnl > 0) {
        currentWins++;
        currentLosses = 0;
        maxWins = Math.max(maxWins, currentWins);
      } else if (pnl < 0) {
        currentLosses++;
        currentWins = 0;
        maxLosses = Math.max(maxLosses, currentLosses);
      }
    }

    return { consecutiveWins: maxWins, consecutiveLosses: maxLosses };
  }

  private calculateTradingDays(trades: Trade[]): number {
    const uniqueDays = new Set(
      trades
        .filter((t) => t.closeTime)
        .map((t) => new Date(t.closeTime!).toDateString()),
    );
    return uniqueDays.size;
  }

  private groupTradesByDay(trades: Trade[]): DailyPerformance[] {
    const toNumber = (value: unknown): number => {
      if (value === null || value === undefined) return 0;
      const parsed = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const dailyGroups: { [key: string]: Trade[] } = {};

    trades.forEach((trade) => {
      if (trade.closeTime) {
        const dateKey = new Date(trade.closeTime).toISOString().split('T')[0];
        if (!dailyGroups[dateKey]) {
          dailyGroups[dateKey] = [];
        }
        dailyGroups[dateKey].push(trade);
      }
    });

    let cumulativePnL = 0;
    return Object.entries(dailyGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayTrades]) => {
        const dayPnL = dayTrades.reduce(
          (sum, t) => sum + toNumber(t.profitOrLoss),
          0,
        );
        const wins = dayTrades.filter((t) => toNumber(t.profitOrLoss) > 0).length;
        const winRate =
          dayTrades.length > 0 ? (wins / dayTrades.length) * 100 : 0;

        cumulativePnL += dayPnL;

        return {
          date,
          trades: dayTrades.length,
          pnl: dayPnL,
          winRate,
          cumulativePnL,
        };
      });
  }

  private groupTradesByMonth(trades: Trade[]): MonthlyPerformance[] {
    const toNumber = (value: unknown): number => {
      if (value === null || value === undefined) return 0;
      const parsed = typeof value === 'number' ? value : Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const monthlyGroups: { [key: string]: Trade[] } = {};

    trades.forEach((trade) => {
      if (trade.closeTime) {
        const date = new Date(trade.closeTime);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyGroups[monthKey]) {
          monthlyGroups[monthKey] = [];
        }
        monthlyGroups[monthKey].push(trade);
      }
    });

    return Object.entries(monthlyGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, monthTrades]) => {
        const monthPnL = monthTrades.reduce(
          (sum, t) => sum + toNumber(t.profitOrLoss),
          0,
        );
        const wins = monthTrades.filter(
          (t) => toNumber(t.profitOrLoss) > 0,
        ).length;
        const winRate =
          monthTrades.length > 0 ? (wins / monthTrades.length) * 100 : 0;

        // Calculate daily performance for best/worst day
        const dailyPerformance = this.groupTradesByDay(monthTrades);
        const bestDay =
          dailyPerformance.length > 0
            ? Math.max(...dailyPerformance.map((d) => d.pnl))
            : 0;
        const worstDay =
          dailyPerformance.length > 0
            ? Math.min(...dailyPerformance.map((d) => d.pnl))
            : 0;

        return {
          month,
          trades: monthTrades.length,
          pnl: monthPnL,
          winRate,
          bestDay,
          worstDay,
        };
      });
  }
}
