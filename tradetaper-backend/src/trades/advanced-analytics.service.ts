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
  drawdownAnalysis: any[];
  tradingPatterns: any[];
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
    const monthlyReturns = this.calculateMonthlyReturns(trades);
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
      beta: this.calculateBeta(dailyReturns),
      alpha: this.calculateAlpha(dailyReturns),
      informationRatio: this.calculateInformationRatio(dailyReturns),
      treynorRatio: this.calculateTreynorRatio(dailyReturns),

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
    const whereClause: any = { userId };

    if (fromDate && toDate) {
      whereClause.entryDate = Between(fromDate, toDate);
    }

    return this.tradesRepository.find({
      where: whereClause,
      order: { entryDate: 'ASC' },
    });
  }

  private calculateDailyReturns(trades: Trade[]): number[] {
    const dailyPnL = new Map<string, number>();

    trades.forEach((trade) => {
      if (
        trade.exitDate &&
        trade.profitOrLoss !== null &&
        trade.profitOrLoss !== undefined
      ) {
        const date = trade.exitDate.toISOString().split('T')[0];
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
        trade.exitDate &&
        trade.profitOrLoss !== null &&
        trade.profitOrLoss !== undefined
      ) {
        const month = trade.exitDate.toISOString().substring(0, 7); // YYYY-MM
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

    return stdDev === 0 ? 0 : ((mean - riskFreeRate) / stdDev) * Math.sqrt(252);
  }

  private calculateSortinoRatio(returns: number[]): number {
    if (returns.length < 2) return 0;

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const downside = returns.filter((r) => r < 0);

    if (downside.length === 0) return 0;

    const downsideVariance =
      downside.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downside.length;
    const downsideDeviation = Math.sqrt(downsideVariance);

    const riskFreeRate = 0.02 / 252;

    return downsideDeviation === 0
      ? 0
      : ((mean - riskFreeRate) / downsideDeviation) * Math.sqrt(252);
  }

  private calculateCalmarRatio(returns: number[], drawdowns: number[]): number {
    const annualizedReturn = this.calculateAnnualizedReturn(returns);
    const maxDrawdown = Math.abs(Math.min(...drawdowns, 0));

    return maxDrawdown === 0 ? 0 : annualizedReturn / maxDrawdown;
  }

  private calculateMaxDrawdown(drawdowns: number[]): number {
    return Math.abs(Math.min(...drawdowns, 0));
  }

  private calculateMaxDrawdownDuration(drawdowns: number[]): number {
    let maxDuration = 0;
    let currentDuration = 0;

    drawdowns.forEach((dd) => {
      if (dd < 0) {
        currentDuration++;
        maxDuration = Math.max(maxDuration, currentDuration);
      } else {
        currentDuration = 0;
      }
    });

    return maxDuration;
  }

  private calculateVaR(returns: number[], confidence: number): number {
    const sorted = [...returns].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * confidence);
    return sorted[index] || 0;
  }

  private calculateCVaR(returns: number[], confidence: number): number {
    const sorted = [...returns].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * confidence);
    const tailReturns = sorted.slice(0, index);

    return tailReturns.length > 0
      ? tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length
      : 0;
  }

  private calculateAnnualizedReturn(returns: number[]): number {
    if (returns.length === 0) return 0;

    const totalReturn = returns.reduce((sum, r) => sum + r, 0);
    const periods = returns.length;
    const periodsPerYear = 252; // Trading days

    return (totalReturn / periods) * periodsPerYear;
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length < 2) return 0;

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
      (returns.length - 1);

    return Math.sqrt(variance * 252); // Annualized
  }

  private calculateBeta(returns: number[]): number {
    // For now, return 1 as we don't have market benchmark data
    // In a real implementation, you would compare against a market index
    return 1;
  }

  private calculateAlpha(returns: number[]): number {
    // Simplified alpha calculation
    const annualizedReturn = this.calculateAnnualizedReturn(returns);
    const riskFreeRate = 0.02;
    const marketReturn = 0.1; // Assumed market return
    const beta = this.calculateBeta(returns);

    return (
      annualizedReturn - (riskFreeRate + beta * (marketReturn - riskFreeRate))
    );
  }

  private calculateInformationRatio(returns: number[]): number {
    // Simplified information ratio
    const excessReturns = returns.map((r) => r - 0.02 / 252); // vs risk-free rate
    const mean =
      excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;

    if (excessReturns.length < 2) return 0;

    const variance =
      excessReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
      (excessReturns.length - 1);
    const trackingError = Math.sqrt(variance);

    return trackingError === 0 ? 0 : (mean / trackingError) * Math.sqrt(252);
  }

  private calculateTreynorRatio(returns: number[]): number {
    const annualizedReturn = this.calculateAnnualizedReturn(returns);
    const riskFreeRate = 0.02;
    const beta = this.calculateBeta(returns);

    return beta === 0 ? 0 : (annualizedReturn - riskFreeRate) / beta;
  }

  private calculateWinLossRatio(trades: Trade[]): number {
    const winningTrades = trades.filter(
      (t) => t.profitOrLoss && t.profitOrLoss > 0,
    ).length;
    const losingTrades = trades.filter(
      (t) => t.profitOrLoss && t.profitOrLoss < 0,
    ).length;

    return losingTrades === 0 ? winningTrades : winningTrades / losingTrades;
  }

  private calculateProfitFactor(trades: Trade[]): number {
    const grossProfit = trades
      .filter((t) => t.profitOrLoss && t.profitOrLoss > 0)
      .reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);

    const grossLoss = Math.abs(
      trades
        .filter((t) => t.profitOrLoss && t.profitOrLoss < 0)
        .reduce((sum, t) => sum + (t.profitOrLoss || 0), 0),
    );

    return grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
  }

  private calculateExpectancy(trades: Trade[]): number {
    const wins = trades.filter((t) => t.profitOrLoss && t.profitOrLoss > 0);
    const losses = trades.filter((t) => t.profitOrLoss && t.profitOrLoss < 0);

    const winRate = wins.length / trades.length;
    const lossRate = losses.length / trades.length;

    const avgWin =
      wins.length > 0
        ? wins.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0) / wins.length
        : 0;
    const avgLoss =
      losses.length > 0
        ? losses.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0) /
          losses.length
        : 0;

    return winRate * avgWin + lossRate * avgLoss;
  }

  private calculateAverageWin(trades: Trade[]): number {
    const wins = trades.filter((t) => t.profitOrLoss && t.profitOrLoss > 0);
    return wins.length > 0
      ? wins.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0) / wins.length
      : 0;
  }

  private calculateAverageLoss(trades: Trade[]): number {
    const losses = trades.filter((t) => t.profitOrLoss && t.profitOrLoss < 0);
    return losses.length > 0
      ? losses.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0) /
          losses.length
      : 0;
  }

  private calculateLargestWin(trades: Trade[]): number {
    const profits = trades
      .filter((t) => t.profitOrLoss && t.profitOrLoss > 0)
      .map((t) => t.profitOrLoss!);
    return profits.length > 0 ? Math.max(...profits) : 0;
  }

  private calculateLargestLoss(trades: Trade[]): number {
    const losses = trades
      .filter((t) => t.profitOrLoss && t.profitOrLoss < 0)
      .map((t) => t.profitOrLoss!);
    return losses.length > 0 ? Math.min(...losses) : 0;
  }

  private calculateConsecutiveWins(trades: Trade[]): number {
    let maxConsecutive = 0;
    let current = 0;

    trades.forEach((trade) => {
      if (trade.profitOrLoss && trade.profitOrLoss > 0) {
        current++;
        maxConsecutive = Math.max(maxConsecutive, current);
      } else {
        current = 0;
      }
    });

    return maxConsecutive;
  }

  private calculateConsecutiveLosses(trades: Trade[]): number {
    let maxConsecutive = 0;
    let current = 0;

    trades.forEach((trade) => {
      if (trade.profitOrLoss && trade.profitOrLoss < 0) {
        current++;
        maxConsecutive = Math.max(maxConsecutive, current);
      } else {
        current = 0;
      }
    });

    return maxConsecutive;
  }

  private calculateTradesPerDay(trades: Trade[]): number {
    if (trades.length === 0) return 0;

    const firstTrade = trades[0].entryDate;
    const lastTrade =
      trades[trades.length - 1].exitDate || trades[trades.length - 1].entryDate;
    const daysDiff = Math.ceil(
      (lastTrade.getTime() - firstTrade.getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysDiff === 0 ? trades.length : trades.length / daysDiff;
  }

  private calculateAverageHoldingPeriod(trades: Trade[]): number {
    const closedTrades = trades.filter((t) => t.exitDate);
    if (closedTrades.length === 0) return 0;

    const totalHours = closedTrades.reduce((sum, trade) => {
      const hours =
        (trade.exitDate!.getTime() - trade.entryDate.getTime()) /
        (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return totalHours / closedTrades.length;
  }

  private analyzeDayOfWeek(trades: Trade[]): Record<string, any> {
    const dayStats = new Map<string, { trades: number; profit: number }>();
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
      const day = days[trade.entryDate.getDay()];
      const current = dayStats.get(day) || { trades: 0, profit: 0 };
      dayStats.set(day, {
        trades: current.trades + 1,
        profit: current.profit + (trade.profitOrLoss || 0),
      });
    });

    return Object.fromEntries(dayStats);
  }

  private analyzeMonthlyPerformance(trades: Trade[]): Record<string, any> {
    const monthStats = new Map<string, { trades: number; profit: number }>();

    trades.forEach((trade) => {
      const month = trade.entryDate.toISOString().substring(0, 7);
      const current = monthStats.get(month) || { trades: 0, profit: 0 };
      monthStats.set(month, {
        trades: current.trades + 1,
        profit: current.profit + (trade.profitOrLoss || 0),
      });
    });

    return Object.fromEntries(monthStats);
  }

  private calculateCorrelationMatrix(
    trades: Trade[],
  ): Record<string, Record<string, number>> {
    // Group trades by symbol
    const symbolGroups = new Map<string, Trade[]>();

    trades.forEach((trade) => {
      const symbol = trade.symbol;
      if (!symbolGroups.has(symbol)) {
        symbolGroups.set(symbol, []);
      }
      symbolGroups.get(symbol)!.push(trade);
    });

    const symbols = Array.from(symbolGroups.keys());
    const correlationMatrix: Record<string, Record<string, number>> = {};

    symbols.forEach((symbol1) => {
      correlationMatrix[symbol1] = {};
      symbols.forEach((symbol2) => {
        correlationMatrix[symbol1][symbol2] = this.calculateCorrelation(
          symbolGroups.get(symbol1)!,
          symbolGroups.get(symbol2)!,
        );
      });
    });

    return correlationMatrix;
  }

  private calculateCorrelation(trades1: Trade[], trades2: Trade[]): number {
    // Simplified correlation calculation
    if (trades1.length < 2 || trades2.length < 2) return 0;

    const returns1 = trades1.map((t) => t.profitOrLoss || 0);
    const returns2 = trades2.map((t) => t.profitOrLoss || 0);

    const mean1 = returns1.reduce((sum, r) => sum + r, 0) / returns1.length;
    const mean2 = returns2.reduce((sum, r) => sum + r, 0) / returns2.length;

    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;

    const minLength = Math.min(returns1.length, returns2.length);

    for (let i = 0; i < minLength; i++) {
      const diff1 = returns1[i] - mean1;
      const diff2 = returns2[i] - mean2;

      numerator += diff1 * diff2;
      denominator1 += diff1 * diff1;
      denominator2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(denominator1 * denominator2);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private analyzeSeasonality(trades: Trade[]): Record<string, any> {
    const monthlyStats = new Array(12)
      .fill(0)
      .map(() => ({ trades: 0, profit: 0 }));

    trades.forEach((trade) => {
      const month = trade.entryDate.getMonth();
      monthlyStats[month].trades++;
      monthlyStats[month].profit += trade.profitOrLoss || 0;
    });

    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    return monthlyStats.reduce(
      (acc, stats, index) => {
        acc[months[index]] = stats;
        return acc;
      },
      {} as Record<string, any>,
    );
  }

  private analyzeDrawdowns(drawdowns: number[]): any[] {
    const analysis: any[] = [];
    let inDrawdown = false;
    let start = 0;
    let maxDD = 0;

    drawdowns.forEach((dd, index) => {
      if (!inDrawdown && dd < 0) {
        inDrawdown = true;
        start = index;
        maxDD = dd;
      } else if (inDrawdown && dd < maxDD) {
        maxDD = dd;
      } else if (inDrawdown && dd >= 0) {
        analysis.push({
          start,
          end: index,
          duration: index - start,
          maxDrawdown: Math.abs(maxDD),
        });
        inDrawdown = false;
      }
    });

    return analysis;
  }

  private identifyTradingPatterns(trades: Trade[]): any[] {
    // Identify common trading patterns
    const patterns: any[] = [];

    // Pattern 1: Revenge trading (increasing position size after losses)
    const revengeTrading = this.detectRevengeTradingPattern(trades);
    if (revengeTrading.detected) {
      patterns.push({
        type: 'Revenge Trading',
        description: 'Increasing position size after losses',
        severity: 'High',
        occurrences: revengeTrading.count,
      });
    }

    // Pattern 2: Overtrading
    const overtrading = this.detectOvertradingPattern(trades);
    if (overtrading.detected) {
      patterns.push({
        type: 'Overtrading',
        description: 'Excessive number of trades in short periods',
        severity: 'Medium',
        occurrences: overtrading.count,
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
      const prevTrade = trades[i - 1];
      const currentTrade = trades[i];

      if (
        prevTrade.profitOrLoss &&
        prevTrade.profitOrLoss < 0 &&
        currentTrade.quantity > prevTrade.quantity * 1.5
      ) {
        count++;
      }
    }

    return { detected: count > 3, count };
  }

  private detectOvertradingPattern(trades: Trade[]): {
    detected: boolean;
    count: number;
  } {
    const dailyTradeCounts = new Map<string, number>();

    trades.forEach((trade) => {
      const date = trade.entryDate.toISOString().split('T')[0];
      dailyTradeCounts.set(date, (dailyTradeCounts.get(date) || 0) + 1);
    });

    const excessiveDays = Array.from(dailyTradeCounts.values()).filter(
      (count) => count > 10,
    ).length;

    return { detected: excessiveDays > 5, count: excessiveDays };
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
