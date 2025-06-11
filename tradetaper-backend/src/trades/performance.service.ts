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
    const totalTrades = trades.length;
    const winningTrades = trades.filter((t) => (t.profitOrLoss || 0) > 0);
    const losingTrades = trades.filter((t) => (t.profitOrLoss || 0) < 0);

    const totalPnL = trades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
    const totalCommissions = trades.reduce(
      (sum, t) => sum + (t.commission || 0),
      0,
    );
    const netPnL = totalPnL - totalCommissions;

    const winRate =
      totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

    const averageWin =
      winningTrades.length > 0
        ? winningTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0) /
          winningTrades.length
        : 0;

    const averageLoss =
      losingTrades.length > 0
        ? Math.abs(
            losingTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0) /
              losingTrades.length,
          )
        : 0;

    const profitFactor = averageLoss > 0 ? averageWin / averageLoss : 0;

    const largestWin =
      winningTrades.length > 0
        ? Math.max(...winningTrades.map((t) => t.profitOrLoss || 0))
        : 0;

    const largestLoss =
      losingTrades.length > 0
        ? Math.min(...losingTrades.map((t) => t.profitOrLoss || 0))
        : 0;

    const averageRMultiple =
      trades.length > 0
        ? trades.reduce((sum, t) => sum + (t.rMultiple || 0), 0) / trades.length
        : 0;

    const expectancy = totalTrades > 0 ? totalPnL / totalTrades : 0;

    // Calculate Sharpe ratio (simplified)
    const returns = trades.map((t) => t.profitOrLoss || 0);
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
    const maxDrawdown = this.calculateMaxDrawdown(trades);

    // Calculate consecutive wins/losses
    const { consecutiveWins, consecutiveLosses } =
      this.calculateConsecutiveStreaks(trades);

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

  private calculateMaxDrawdown(trades: Trade[]): number {
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
      runningPnL += trade.profitOrLoss || 0;
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

  private calculateConsecutiveStreaks(trades: Trade[]): {
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
      const pnl = trade.profitOrLoss || 0;
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
          (sum, t) => sum + (t.profitOrLoss || 0),
          0,
        );
        const wins = dayTrades.filter((t) => (t.profitOrLoss || 0) > 0).length;
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
          (sum, t) => sum + (t.profitOrLoss || 0),
          0,
        );
        const wins = monthTrades.filter(
          (t) => (t.profitOrLoss || 0) > 0,
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
