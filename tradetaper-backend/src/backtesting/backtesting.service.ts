import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BacktestTrade, TradeOutcome } from './entities/backtest-trade.entity';
import { CreateBacktestTradeDto } from './dto/create-backtest-trade.dto';
import { UpdateBacktestTradeDto } from './dto/update-backtest-trade.dto';

export interface BacktestStats {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  totalPnlDollars: number;
  totalPnlPips: number;
  averagePnlDollars: number;
  averagePnlPips: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  expectancy: number;
  averageRMultiple: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  averageEntryQuality: number;
  ruleFollowingRate: number;
  averageChecklistScore: number;
}

export interface DimensionStats {
  dimension: string;
  value: string;
  trades: number;
  winRate: number;
  totalPnl: number;
  profitFactor: number;
  recommendation: 'TRADE' | 'CAUTION' | 'AVOID' | 'MORE_DATA';
}

export interface PerformanceMatrix {
  rows: string[];
  columns: string[];
  data: {
    row: string;
    column: string;
    trades: number;
    winRate: number;
    totalPnl: number;
    profitFactor: number;
  }[];
}

@Injectable()
export class BacktestingService {
  constructor(
    @InjectRepository(BacktestTrade)
    private backtestTradeRepository: Repository<BacktestTrade>,
  ) {}

  async create(
    createDto: CreateBacktestTradeDto,
    userId: string,
  ): Promise<BacktestTrade> {
    const trade = this.backtestTradeRepository.create({
      ...createDto,
      userId,
    });
    return await this.backtestTradeRepository.save(trade);
  }

  async findAll(
    userId: string,
    filters?: {
      strategyId?: string;
      symbol?: string;
      session?: string;
      timeframe?: string;
      outcome?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<BacktestTrade[]> {
    const query = this.backtestTradeRepository
      .createQueryBuilder('bt')
      .where('bt.userId = :userId', { userId })
      .orderBy('bt.tradeDate', 'DESC')
      .addOrderBy('bt.createdAt', 'DESC');

    if (filters?.strategyId) {
      query.andWhere('bt.strategyId = :strategyId', { strategyId: filters.strategyId });
    }
    if (filters?.symbol) {
      query.andWhere('bt.symbol = :symbol', { symbol: filters.symbol });
    }
    if (filters?.session) {
      query.andWhere('bt.session = :session', { session: filters.session });
    }
    if (filters?.timeframe) {
      query.andWhere('bt.timeframe = :timeframe', { timeframe: filters.timeframe });
    }
    if (filters?.outcome) {
      query.andWhere('bt.outcome = :outcome', { outcome: filters.outcome });
    }
    if (filters?.startDate) {
      query.andWhere('bt.tradeDate >= :startDate', { startDate: filters.startDate });
    }
    if (filters?.endDate) {
      query.andWhere('bt.tradeDate <= :endDate', { endDate: filters.endDate });
    }

    return await query.getMany();
  }

  async findOne(id: string, userId: string): Promise<BacktestTrade> {
    const trade = await this.backtestTradeRepository.findOne({
      where: { id, userId },
    });
    if (!trade) {
      throw new NotFoundException(`Backtest trade with ID ${id} not found`);
    }
    return trade;
  }

  async update(
    id: string,
    updateDto: UpdateBacktestTradeDto,
    userId: string,
  ): Promise<BacktestTrade> {
    const trade = await this.findOne(id, userId);
    Object.assign(trade, updateDto);
    return await this.backtestTradeRepository.save(trade);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.backtestTradeRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException(`Backtest trade with ID ${id} not found`);
    }
  }

  // ============ ANALYTICS ============

  async getStrategyStats(strategyId: string, userId: string): Promise<BacktestStats> {
    const trades = await this.backtestTradeRepository.find({
      where: { strategyId, userId },
    });

    return this.calculateStats(trades);
  }

  async getOverallStats(userId: string): Promise<BacktestStats> {
    const trades = await this.backtestTradeRepository.find({
      where: { userId },
    });

    return this.calculateStats(trades);
  }

  private calculateStats(trades: BacktestTrade[]): BacktestStats {
    if (trades.length === 0) {
      return this.getEmptyStats();
    }

    const wins = trades.filter(t => t.outcome === TradeOutcome.WIN);
    const losses = trades.filter(t => t.outcome === TradeOutcome.LOSS);
    const breakevens = trades.filter(t => t.outcome === TradeOutcome.BREAKEVEN);

    const totalPnlDollars = trades.reduce((sum, t) => sum + (Number(t.pnlDollars) || 0), 0);
    const totalPnlPips = trades.reduce((sum, t) => sum + (Number(t.pnlPips) || 0), 0);

    const winPnl = wins.reduce((sum, t) => sum + (Number(t.pnlDollars) || 0), 0);
    const lossPnl = Math.abs(losses.reduce((sum, t) => sum + (Number(t.pnlDollars) || 0), 0));

    const averageWin = wins.length > 0 ? winPnl / wins.length : 0;
    const averageLoss = losses.length > 0 ? lossPnl / losses.length : 0;

    const winRate = (wins.length / trades.length) * 100;
    const lossRate = losses.length / trades.length;
    const profitFactor = lossPnl > 0 ? winPnl / lossPnl : winPnl > 0 ? 999.99 : 0;
    const expectancy = (winRate / 100 * averageWin) - (lossRate * averageLoss);

    // R-Multiple calculations
    const tradesWithR = trades.filter(t => t.rMultiple !== null && t.rMultiple !== undefined);
    const averageRMultiple = tradesWithR.length > 0
      ? tradesWithR.reduce((sum, t) => sum + Number(t.rMultiple), 0) / tradesWithR.length
      : 0;

    // Consecutive wins/losses
    const { maxConsecutiveWins, maxConsecutiveLosses } = this.calculateConsecutive(trades);

    // Quality metrics
    const tradesWithQuality = trades.filter(t => t.entryQuality !== null);
    const averageEntryQuality = tradesWithQuality.length > 0
      ? tradesWithQuality.reduce((sum, t) => sum + t.entryQuality, 0) / tradesWithQuality.length
      : 0;

    const ruleFollowingRate = trades.length > 0
      ? (trades.filter(t => t.followedRules).length / trades.length) * 100
      : 0;

    const tradesWithChecklist = trades.filter(t => t.checklistScore !== null);
    const averageChecklistScore = tradesWithChecklist.length > 0
      ? tradesWithChecklist.reduce((sum, t) => sum + Number(t.checklistScore), 0) / tradesWithChecklist.length
      : 0;

    return {
      totalTrades: trades.length,
      wins: wins.length,
      losses: losses.length,
      breakevens: breakevens.length,
      winRate: parseFloat(winRate.toFixed(2)),
      totalPnlDollars: parseFloat(totalPnlDollars.toFixed(2)),
      totalPnlPips: parseFloat(totalPnlPips.toFixed(2)),
      averagePnlDollars: parseFloat((totalPnlDollars / trades.length).toFixed(2)),
      averagePnlPips: parseFloat((totalPnlPips / trades.length).toFixed(2)),
      averageWin: parseFloat(averageWin.toFixed(2)),
      averageLoss: parseFloat(averageLoss.toFixed(2)),
      profitFactor: parseFloat(profitFactor.toFixed(2)),
      expectancy: parseFloat(expectancy.toFixed(2)),
      averageRMultiple: parseFloat(averageRMultiple.toFixed(2)),
      maxConsecutiveWins,
      maxConsecutiveLosses,
      averageEntryQuality: parseFloat(averageEntryQuality.toFixed(2)),
      ruleFollowingRate: parseFloat(ruleFollowingRate.toFixed(2)),
      averageChecklistScore: parseFloat(averageChecklistScore.toFixed(2)),
    };
  }

  private calculateConsecutive(trades: BacktestTrade[]): { maxConsecutiveWins: number; maxConsecutiveLosses: number } {
    let maxWins = 0, maxLosses = 0;
    let currentWins = 0, currentLosses = 0;

    // Sort by date
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime()
    );

    for (const trade of sortedTrades) {
      if (trade.outcome === TradeOutcome.WIN) {
        currentWins++;
        currentLosses = 0;
        maxWins = Math.max(maxWins, currentWins);
      } else if (trade.outcome === TradeOutcome.LOSS) {
        currentLosses++;
        currentWins = 0;
        maxLosses = Math.max(maxLosses, currentLosses);
      } else {
        // Breakeven resets both
        currentWins = 0;
        currentLosses = 0;
      }
    }

    return { maxConsecutiveWins: maxWins, maxConsecutiveLosses: maxLosses };
  }

  private getEmptyStats(): BacktestStats {
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      breakevens: 0,
      winRate: 0,
      totalPnlDollars: 0,
      totalPnlPips: 0,
      averagePnlDollars: 0,
      averagePnlPips: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0,
      expectancy: 0,
      averageRMultiple: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      averageEntryQuality: 0,
      ruleFollowingRate: 0,
      averageChecklistScore: 0,
    };
  }

  // ============ DIMENSION ANALYSIS ============

  async getStatsByDimension(
    strategyId: string,
    userId: string,
    dimension: 'symbol' | 'session' | 'timeframe' | 'killZone' | 'dayOfWeek' | 'setupType',
  ): Promise<DimensionStats[]> {
    const trades = await this.backtestTradeRepository.find({
      where: { strategyId, userId },
    });

    // Group by dimension
    const groups = new Map<string, BacktestTrade[]>();
    for (const trade of trades) {
      const value = trade[dimension] || 'unknown';
      if (!groups.has(value)) {
        groups.set(value, []);
      }
      groups.get(value)!.push(trade);
    }

    // Calculate stats for each group
    const results: DimensionStats[] = [];
    for (const [value, groupTrades] of groups) {
      const stats = this.calculateStats(groupTrades);
      
      let recommendation: 'TRADE' | 'CAUTION' | 'AVOID' | 'MORE_DATA';
      if (groupTrades.length < 10) {
        recommendation = 'MORE_DATA';
      } else if (stats.winRate >= 60 && stats.profitFactor >= 1.5) {
        recommendation = 'TRADE';
      } else if (stats.winRate >= 50 || stats.profitFactor >= 1.0) {
        recommendation = 'CAUTION';
      } else {
        recommendation = 'AVOID';
      }

      results.push({
        dimension,
        value,
        trades: groupTrades.length,
        winRate: stats.winRate,
        totalPnl: stats.totalPnlDollars,
        profitFactor: stats.profitFactor,
        recommendation,
      });
    }

    // Sort by win rate descending
    return results.sort((a, b) => b.winRate - a.winRate);
  }

  // ============ PERFORMANCE MATRIX ============

  async getPerformanceMatrix(
    strategyId: string,
    userId: string,
    rowDimension: 'session' | 'timeframe' | 'killZone' | 'dayOfWeek',
    columnDimension: 'symbol' | 'session' | 'timeframe',
  ): Promise<PerformanceMatrix> {
    const trades = await this.backtestTradeRepository.find({
      where: { strategyId, userId },
    });

    // Get unique values for rows and columns
    const rows = [...new Set(trades.map(t => t[rowDimension] || 'unknown'))];
    const columns = [...new Set(trades.map(t => t[columnDimension] || 'unknown'))];

    // Calculate stats for each cell
    const data: PerformanceMatrix['data'] = [];
    
    for (const row of rows) {
      for (const col of columns) {
        const cellTrades = trades.filter(
          t => (t[rowDimension] || 'unknown') === row && 
               (t[columnDimension] || 'unknown') === col
        );

        if (cellTrades.length > 0) {
          const stats = this.calculateStats(cellTrades);
          data.push({
            row,
            column: col,
            trades: cellTrades.length,
            winRate: stats.winRate,
            totalPnl: stats.totalPnlDollars,
            profitFactor: stats.profitFactor,
          });
        }
      }
    }

    return { rows, columns, data };
  }

  // ============ AI ANALYSIS DATA ============

  async getAnalysisData(strategyId: string, userId: string) {
    const trades = await this.backtestTradeRepository.find({
      where: { strategyId, userId },
      order: { tradeDate: 'ASC' },
    });

    const overallStats = this.calculateStats(trades);
    
    const bySymbol = await this.getStatsByDimension(strategyId, userId, 'symbol');
    const bySession = await this.getStatsByDimension(strategyId, userId, 'session');
    const byTimeframe = await this.getStatsByDimension(strategyId, userId, 'timeframe');
    const byKillZone = await this.getStatsByDimension(strategyId, userId, 'killZone');
    const byDayOfWeek = await this.getStatsByDimension(strategyId, userId, 'dayOfWeek');
    const bySetup = await this.getStatsByDimension(strategyId, userId, 'setupType');

    // Identify best and worst conditions
    const bestConditions = {
      symbol: bySymbol.find(s => s.recommendation === 'TRADE'),
      session: bySession.find(s => s.recommendation === 'TRADE'),
      timeframe: byTimeframe.find(s => s.recommendation === 'TRADE'),
      killZone: byKillZone.find(s => s.recommendation === 'TRADE'),
      dayOfWeek: byDayOfWeek.find(s => s.recommendation === 'TRADE'),
    };

    const worstConditions = {
      symbol: bySymbol.find(s => s.recommendation === 'AVOID'),
      session: bySession.find(s => s.recommendation === 'AVOID'),
      timeframe: byTimeframe.find(s => s.recommendation === 'AVOID'),
      killZone: byKillZone.find(s => s.recommendation === 'AVOID'),
      dayOfWeek: byDayOfWeek.find(s => s.recommendation === 'AVOID'),
    };

    return {
      overallStats,
      bySymbol,
      bySession,
      byTimeframe,
      byKillZone,
      byDayOfWeek,
      bySetup,
      bestConditions,
      worstConditions,
      tradeCount: trades.length,
      dateRange: trades.length > 0 ? {
        start: trades[0].tradeDate,
        end: trades[trades.length - 1].tradeDate,
      } : null,
    };
  }

  // ============ SYMBOLS LIST ============

  async getDistinctSymbols(userId: string): Promise<string[]> {
    const result = await this.backtestTradeRepository
      .createQueryBuilder('bt')
      .select('DISTINCT bt.symbol', 'symbol')
      .where('bt.userId = :userId', { userId })
      .getRawMany();
    
    return result.map(r => r.symbol);
  }
}
