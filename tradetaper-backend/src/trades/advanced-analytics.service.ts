// src/trades/advanced-analytics.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Trade } from './entities/trade.entity';

export interface AdvancedMetrics {
  // Risk Metrics
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  maxDrawdownDuration: number;
  valueAtRisk: number; // VaR 95%
  conditionalVaR: number; // CVaR 95%

  // Performance Metrics
  annualizedReturn: number;
  volatility: number;
  beta: number;
  alpha: number;
  informationRatio: number;
  treynorRatio: number;

  // Trade Metrics
  winLossRatio: number;
  profitFactor: number;
  expectancy: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;

  // Time-based Metrics
  tradesPerDay: number;
  averageHoldingPeriod: number;
  dayOfWeekAnalysis: Record<string, any>;
  monthlyPerformance: Record<string, any>;

  // Advanced Analysis
  correlationMatrix: Record<string, Record<string, number>>;
  seasonalAnalysis: Record<string, any>;
  drawdownAnalysis: {
    start: number;
    end: number;
    duration: number;
    peak: number;
    trough: number;
  }[];
  tradingPatterns: { name: string; details: string }[];
}

@Injectable()
export class AdvancedAnalyticsService {
  private readonly logger = new Logger(AdvancedAnalyticsService.name);

  constructor(
    @InjectRepository(Trade)
    private readonly tradesRepository: Repository<Trade>,
  ) {}

  async calculateAdvancedMetrics(
    userId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<AdvancedMetrics> {
    this.logger.log(`Calculating advanced metrics for user ${userId}`);

    const trades = await this.getTradesForAnalysis(userId, fromDate, toDate);

    if (trades.length === 0) {
      return this.getEmptyMetrics();
    }

    const dailyReturns = this.calculateDailyReturns(trades);
    // const monthlyReturns = this.calculateMonthlyReturns(trades);
    const drawdowns = this.calculateDrawdowns(trades);

    return {
      // Risk Metrics
      sharpeRatio: this.calculateSharpeRatio(dailyReturns),
      sortinoRatio: this.calculateSortinoRatio(dailyReturns),
      calmarRatio: this.calculateCalmarRatio(dailyReturns, drawdowns),
      maxDrawdown: this.calculateMaxDrawdown(drawdowns),
      maxDrawdownDuration: this.calculateMaxDrawdownDuration(drawdowns),
      valueAtRisk: this.calculateVaR(dailyReturns, 0.05),
      conditionalVaR: this.calculateCVaR(dailyReturns, 0.05),

      // Performance Metrics
      annualizedReturn: this.calculateAnnualizedReturn(dailyReturns),
      volatility: this.calculateVolatility(dailyReturns),
      beta: 0,
      alpha: 0,
      informationRatio: 0,
      treynorRatio: 0,

      // Trade Metrics
      winLossRatio: this.calculateWinLossRatio(trades),
      profitFactor: this.calculateProfitFactor(trades),
      expectancy: this.calculateExpectancy(trades),
      averageWin: this.calculateAverageWin(trades),
      averageLoss: this.calculateAverageLoss(trades),
      largestWin: this.calculateLargestWin(trades),
      largestLoss: this.calculateLargestLoss(trades),
      consecutiveWins: this.calculateConsecutiveWins(trades),
      consecutiveLosses: this.calculateConsecutiveLosses(trades),

      // Time-based Metrics
      tradesPerDay: this.calculateTradesPerDay(trades),
      averageHoldingPeriod: this.calculateAverageHoldingPeriod(trades),
      dayOfWeekAnalysis: this.analyzeDayOfWeek(trades),
      monthlyPerformance: this.analyzeMonthlyPerformance(trades),

      // Advanced Analysis
      correlationMatrix: this.calculateCorrelationMatrix(trades),
      seasonalAnalysis: this.analyzeSeasonality(trades),
      drawdownAnalysis: this.analyzeDrawdowns(drawdowns),
      tradingPatterns: this.identifyTradingPatterns(trades),
    };
  }

  private async getTradesForAnalysis(
    userId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<Trade[]> {
    const whereClause: Record<string, unknown> = { userId };

    if (fromDate && toDate) {
      whereClause.openTime = Between(fromDate, toDate);
    }

    return this.tradesRepository.find({
      where: whereClause,
      order: { openTime: 'ASC' },
    });
  }

  private calculateDailyReturns(trades: Trade[]): number[] {
    const dailyPnL = new Map<string, number>();

    trades.forEach((trade) => {
      if (
        trade.closeTime &&
        trade.profitOrLoss !== null &&
        trade.profitOrLoss !== undefined
      ) {
        const date = trade.closeTime.toISOString().split('T')[0];
        const currentPnL = dailyPnL.get(date) || 0;
        dailyPnL.set(date, currentPnL + trade.profitOrLoss);
      }
    });

    return Array.from(dailyPnL.values());
  }

  private calculateMonthlyReturns(trades: Trade[]): number[] {
    const monthlyPnL = new Map<string, number>();

    trades.forEach((trade) => {
      if (
        trade.closeTime &&
        trade.profitOrLoss !== null &&
        trade.profitOrLoss !== undefined
      ) {
        const month = trade.closeTime.toISOString().substring(0, 7); // YYYY-MM
        const currentPnL = monthlyPnL.get(month) || 0;
        monthlyPnL.set(month, currentPnL + trade.profitOrLoss);
      }
    });

    return Array.from(monthlyPnL.values());
  }

  private calculateDrawdowns(trades: Trade[]): number[] {
    const cumulativePnL: number[] = [];
    let runningTotal = 0;

    trades.forEach((trade) => {
      if (trade.profitOrLoss !== null) {
        runningTotal += trade.profitOrLoss!;
        cumulativePnL.push(runningTotal);
      }
    });

    const drawdowns: number[] = [];
    let peak = cumulativePnL[0] || 0;

    cumulativePnL.forEach((value) => {
      if (value > peak) {
        peak = value;
      }
      const drawdown = ((value - peak) / Math.abs(peak)) * 100;
      drawdowns.push(drawdown);
    });

    return drawdowns;
  }

  private calculateSharpeRatio(returns: number[]): number {
    if (returns.length < 2) return 0;

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
      (returns.length - 1);
    const stdDev = Math.sqrt(variance);

    const riskFreeRate = 0.02 / 252; // Assuming 2% annual risk-free rate
    const excessReturn = mean - riskFreeRate;

    return stdDev === 0 ? 0 : excessReturn / stdDev;
  }

  private calculateSortinoRatio(returns: number[]): number {
    if (returns.length < 2) return 0;

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const downsideReturns = returns.filter((r) => r < 0);
    const downsideVariance =
      downsideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) /
      (returns.length - 1);
    const downsideDeviation = Math.sqrt(downsideVariance);

    const riskFreeRate = 0.02 / 252;
    const excessReturn = mean - riskFreeRate;

    return downsideDeviation === 0 ? 0 : excessReturn / downsideDeviation;
  }

  private calculateCalmarRatio(returns: number[], drawdowns: number[]): number {
    const annualizedReturn = this.calculateAnnualizedReturn(returns);
    const maxDrawdown = Math.max(...drawdowns);

    return maxDrawdown === 0 ? 0 : annualizedReturn / maxDrawdown;
  }

  private calculateMaxDrawdown(drawdowns: number[]): number {
    return Math.max(...drawdowns);
  }

  private calculateMaxDrawdownDuration(drawdowns: number[]): number {
    let maxDuration = 0;
    let currentDuration = 0;

    drawdowns.forEach((d) => {
      if (d < 0) {
        currentDuration++;
      } else {
        if (currentDuration > maxDuration) {
          maxDuration = currentDuration;
        }
        currentDuration = 0;
      }
    });

    return maxDuration;
  }

  private calculateVaR(returns: number[], confidence: number): number {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor(returns.length * confidence);
    return sortedReturns[index] || 0;
  }

  private calculateCVaR(returns: number[], confidence: number): number {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor(returns.length * confidence);
    const tail = sortedReturns.slice(0, index);

    return tail.length > 0
      ? tail.reduce((sum, r) => sum + r, 0) / tail.length
      : 0;
  }

  private calculateAnnualizedReturn(returns: number[]): number {
    if (returns.length === 0) return 0;

    const meanDailyReturn =
      returns.reduce((sum, r) => sum + r, 0) / returns.length;
    return Math.pow(1 + meanDailyReturn, 252) - 1; // Assuming 252 trading days
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length < 2) return 0;

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
      (returns.length - 1);
    return Math.sqrt(variance) * Math.sqrt(252); // Annualized
  }

  /*
  private calculateBeta(returns: number[]): number {
    // Placeholder - requires market returns data
    return 1.0;
  }

  private calculateAlpha(returns: number[]): number {
    // Placeholder - requires market returns and beta
    const annualizedReturn = this.calculateAnnualizedReturn(returns);
    const riskFreeRate = 0.02;
    const marketReturn = 0.1; // Assuming 10% annual market return
    const beta = this.calculateBeta(returns);

    return (
      annualizedReturn - (riskFreeRate + beta * (marketReturn - riskFreeRate))
    );
  }

  private calculateInformationRatio(returns: number[]): number {
    // Placeholder - requires benchmark returns
    const benchmarkReturns = returns.map(() => Math.random() * 0.001 - 0.0005); // Dummy benchmark
    const activeReturns = returns.map((r, i) => r - benchmarkReturns[i]);
    const meanActiveReturn =
      activeReturns.reduce((sum, r) => sum + r, 0) / activeReturns.length;
    const trackingError = Math.sqrt(
      activeReturns.reduce(
        (sum, r) => sum + Math.pow(r - meanActiveReturn, 2),
        0,
      ) /
        (activeReturns.length - 1),
    );

    return trackingError === 0 ? 0 : meanActiveReturn / trackingError;
  }

  private calculateTreynorRatio(returns: number[]): number {
    const annualizedReturn = this.calculateAnnualizedReturn(returns);
    const beta = this.calculateBeta(returns);
    const riskFreeRate = 0.02;

    return beta === 0 ? 0 : (annualizedReturn - riskFreeRate) / beta;
  }
  */

  private calculateWinLossRatio(trades: Trade[]): number {
    const wins = trades.filter((t) => (t.profitOrLoss || 0) > 0).length;
    const losses = trades.filter((t) => (t.profitOrLoss || 0) < 0).length;

    return losses === 0 ? wins : wins / losses;
  }

  private calculateProfitFactor(trades: Trade[]): number {
    const grossProfit = trades
      .filter((t) => (t.profitOrLoss || 0) > 0)
      .reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
    const grossLoss = Math.abs(
      trades
        .filter((t) => (t.profitOrLoss || 0) < 0)
        .reduce((sum, t) => sum + (t.profitOrLoss || 0), 0),
    );

    return grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
  }

  private calculateExpectancy(trades: Trade[]): number {
    const winRate =
      trades.filter((t) => (t.profitOrLoss || 0) > 0).length / trades.length;
    const lossRate =
      trades.filter((t) => (t.profitOrLoss || 0) < 0).length / trades.length;
    const avgWin = this.calculateAverageWin(trades);
    const avgLoss = this.calculateAverageLoss(trades);

    if (lossRate === 0) {
      return avgWin;
    }
    if (winRate === 0) {
      return -avgLoss;
    }

    return winRate * avgWin - lossRate * avgLoss;
  }

  private calculateAverageWin(trades: Trade[]): number {
    const winningTrades = trades.filter((t) => (t.profitOrLoss || 0) > 0);
    return winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0) /
          winningTrades.length
      : 0;
  }

  private calculateAverageLoss(trades: Trade[]): number {
    const losingTrades = trades.filter((t) => (t.profitOrLoss || 0) < 0);
    return losingTrades.length > 0
      ? Math.abs(
          losingTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0) /
            losingTrades.length,
        )
      : 0;
  }

  private calculateLargestWin(trades: Trade[]): number {
    return Math.max(0, ...trades.map((t) => t.profitOrLoss || 0));
  }

  private calculateLargestLoss(trades: Trade[]): number {
    return Math.min(0, ...trades.map((t) => t.profitOrLoss || 0));
  }

  private calculateConsecutiveWins(trades: Trade[]): number {
    let maxWins = 0;
    let currentWins = 0;
    trades.forEach((t) => {
      if ((t.profitOrLoss || 0) > 0) {
        currentWins++;
      } else {
        if (currentWins > maxWins) {
          maxWins = currentWins;
        }
        currentWins = 0;
      }
    });
    return maxWins;
  }

  private calculateConsecutiveLosses(trades: Trade[]): number {
    let maxLosses = 0;
    let currentLosses = 0;
    trades.forEach((t) => {
      if ((t.profitOrLoss || 0) < 0) {
        currentLosses++;
      } else {
        if (currentLosses > maxLosses) {
          maxLosses = currentLosses;
        }
        currentLosses = 0;
      }
    });
    return maxLosses;
  }

  private calculateTradesPerDay(trades: Trade[]): number {
    if (trades.length === 0) return 0;
    const firstDay = trades[0].openTime.getTime();
    const lastDay = trades[trades.length - 1].closeTime?.getTime();

    if (!lastDay) return 0;

    const durationInDays = (lastDay - firstDay) / (1000 * 60 * 60 * 24);
    return durationInDays > 0 ? trades.length / durationInDays : trades.length;
  }

  private calculateAverageHoldingPeriod(trades: Trade[]): number {
    if (trades.length === 0) return 0;
    const totalHoldingPeriod = trades.reduce((sum, t) => {
      if (t.openTime && t.closeTime) {
        return sum + (t.closeTime.getTime() - t.openTime.getTime());
      }
      return sum;
    }, 0);
    return totalHoldingPeriod / trades.length / (1000 * 60); // In minutes
  }

  private analyzeDayOfWeek(
    trades: Trade[],
  ): Record<string, { pnl: number; count: number }> {
    const analysis: Record<string, { pnl: number; count: number }> = {};
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    trades.forEach((trade) => {
      const day = days[trade.openTime.getDay()];
      if (!analysis[day]) {
        analysis[day] = { pnl: 0, count: 0 };
      }
      analysis[day].pnl += trade.profitOrLoss || 0;
      analysis[day].count++;
    });

    return analysis;
  }

  private analyzeMonthlyPerformance(
    trades: Trade[],
  ): Record<string, { pnl: number; count: number }> {
    const analysis: Record<string, { pnl: number; count: number }> = {};

    trades.forEach((trade) => {
      const month = trade.openTime.toISOString().substring(0, 7);
      if (!analysis[month]) {
        analysis[month] = { pnl: 0, count: 0 };
      }
      analysis[month].pnl += trade.profitOrLoss || 0;
      analysis[month].count++;
    });

    return analysis;
  }

  private calculateCorrelationMatrix(
    trades: Trade[],
  ): Record<string, Record<string, number>> {
    // Placeholder for correlation logic
    // This would require grouping trades by asset/symbol
    const assets = [...new Set(trades.map((t) => t.symbol))];
    const matrix: Record<string, Record<string, number>> = {};

    assets.forEach((asset1) => {
      matrix[asset1] = {};
      assets.forEach((asset2) => {
        if (asset1 === asset2) {
          matrix[asset1][asset2] = 1;
        } else {
          const trades1 = trades.filter((t) => t.symbol === asset1);
          const trades2 = trades.filter((t) => t.symbol === asset2);
          matrix[asset1][asset2] = this.calculateCorrelation(trades1, trades2);
        }
      });
    });

    return matrix;
  }

  private calculateCorrelation(trades1: Trade[], trades2: Trade[]): number {
    // Simplified correlation based on daily returns
    const returns1 = this.calculateDailyReturns(trades1);
    const returns2 = this.calculateDailyReturns(
      trades2.slice(0, returns1.length),
    ); // Align lengths

    if (returns1.length !== returns2.length || returns1.length === 0) return 0;

    const mean1 = returns1.reduce((s, r) => s + r, 0) / returns1.length;
    const mean2 = returns2.reduce((s, r) => s + r, 0) / returns2.length;
    const cov =
      returns1
        .map((r, i) => (r - mean1) * (returns2[i] - mean2))
        .reduce((s, v) => s + v, 0) /
      (returns1.length - 1);
    const stdDev1 = Math.sqrt(
      returns1.reduce((s, r) => s + Math.pow(r - mean1, 2), 0) /
        (returns1.length - 1),
    );
    const stdDev2 = Math.sqrt(
      returns2.reduce((s, r) => s + Math.pow(r - mean2, 2), 0) /
        (returns2.length - 1),
    );

    if (stdDev1 === 0 || stdDev2 === 0) return 0;

    return cov / (stdDev1 * stdDev2);
  }

  private analyzeSeasonality(
    trades: Trade[],
  ): Record<string, Record<number, { pnl: number; count: number }>> {
    const hourlyAnalysis: Record<number, { pnl: number; count: number }> = {};
    const monthlyAnalysis: Record<number, { pnl: number; count: number }> = {};

    trades.forEach((trade) => {
      const hour = trade.openTime.getHours();
      const month = trade.openTime.getMonth();

      if (!hourlyAnalysis[hour]) {
        hourlyAnalysis[hour] = { pnl: 0, count: 0 };
      }
      hourlyAnalysis[hour].pnl += trade.profitOrLoss || 0;
      hourlyAnalysis[hour].count++;

      if (!monthlyAnalysis[month]) {
        monthlyAnalysis[month] = { pnl: 0, count: 0 };
      }
      monthlyAnalysis[month].pnl += trade.profitOrLoss || 0;
      monthlyAnalysis[month].count++;
    });

    return {
      hourly: hourlyAnalysis,
      monthly: monthlyAnalysis,
    };
  }

  private analyzeDrawdowns(drawdowns: number[]): {
    start: number;
    end: number;
    duration: number;
    peak: number;
    trough: number;
  }[] {
    const drawdownPeriods: {
      start: number;
      end: number;
      duration: number;
      peak: number;
      trough: number;
    }[] = [];
    let inDrawdown = false;
    let start = 0;
    let peak = 0;
    let trough = 0;
    let recovery = 0;

    drawdowns.forEach((d, i) => {
      if (d < 0 && !inDrawdown) {
        inDrawdown = true;
        start = i;
        peak = d;
        trough = d;
      } else if (d < 0 && inDrawdown) {
        if (d < trough) trough = d;
      } else if (d >= 0 && inDrawdown) {
        inDrawdown = false;
        recovery = i;
        drawdownPeriods.push({
          start,
          end: recovery,
          duration: recovery - start,
          peak,
          trough,
        });
      }
    });

    return drawdownPeriods;
  }

  private identifyTradingPatterns(
    trades: Trade[],
  ): { name: string; details: string }[] {
    if (trades.length < 2) {
      return [];
    }
    const patterns: { name: string; details: string }[] = [];

    // 1. Revenge Trading
    const revengeTrading = this.detectRevengeTradingPattern(trades);
    if (revengeTrading.detected) {
      patterns.push({
        name: 'Revenge Trading',
        details: `Detected ${revengeTrading.count} instances of large trades after a loss.`,
      });
    }

    const overtrading = this.detectOvertradingPattern(trades);
    if (overtrading.detected) {
      patterns.push({
        name: 'Overtrading',
        details: `Detected ${overtrading.count} days with an unusually high number of trades.`,
      });
    }

    return patterns;
  }

  private detectRevengeTradingPattern(trades: Trade[]): {
    detected: boolean;
    count: number;
  } {
    let count = 0;
    for (let i = 1; i < trades.length; i++) {
      if (
        trades[i - 1].profitOrLoss! < 0 &&
        (trades[i].profitOrLoss || 0) > (trades[i - 1].profitOrLoss || 0) * 1.5
      ) {
        count++;
      }
    }
    return { detected: count > 0, count };
  }

  private detectOvertradingPattern(trades: Trade[]): {
    detected: boolean;
    count: number;
  } {
    const tradesByDay = new Map<string, number>();
    trades.forEach((t) => {
      const day = t.openTime.toISOString().split('T')[0];
      tradesByDay.set(day, (tradesByDay.get(day) || 0) + 1);
    });

    const averageTradesPerDay =
      Array.from(tradesByDay.values()).reduce((sum, count) => sum + count, 0) /
      tradesByDay.size;
    const overtradingDays = Array.from(tradesByDay.values()).filter(
      (count) => count > averageTradesPerDay * 2,
    ).length;

    return { detected: overtradingDays > 0, count: overtradingDays };
  }

  private getEmptyMetrics(): AdvancedMetrics {
    return {
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0,
      maxDrawdown: 0,
      maxDrawdownDuration: 0,
      valueAtRisk: 0,
      conditionalVaR: 0,
      annualizedReturn: 0,
      volatility: 0,
      beta: 0,
      alpha: 0,
      informationRatio: 0,
      treynorRatio: 0,
      winLossRatio: 0,
      profitFactor: 0,
      expectancy: 0,
      averageWin: 0,
      averageLoss: 0,
      largestWin: 0,
      largestLoss: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      tradesPerDay: 0,
      averageHoldingPeriod: 0,
      dayOfWeekAnalysis: {},
      monthlyPerformance: {},
      correlationMatrix: {},
      seasonalAnalysis: {},
      drawdownAnalysis: [],
      tradingPatterns: [],
    };
  }
}
