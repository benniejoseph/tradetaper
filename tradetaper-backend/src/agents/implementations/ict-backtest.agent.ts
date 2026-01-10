import { Injectable, Logger, Optional } from '@nestjs/common';
import { BaseAgent } from '../base/base-agent';
import {
  AgentCapability,
  AgentMessage,
  AgentResponse,
} from '../interfaces/agent.interface';
import { AgentRegistryService } from '../agent-registry.service';
import { EventBusService } from '../event-bus.service';
import { ICTAIAgentService } from '../../market-intelligence/ict/ict-ai-agent.service';
import { ICTMasterService } from '../../market-intelligence/ict/ict-master.service';
import { TradingViewAdvancedService } from '../../market-intelligence/tradingview/tradingview-advanced.service';

export interface BacktestConfig {
  symbol: string;
  timeframe: string;
  startDate: Date;
  endDate: Date;
  strategy: ICTStrategyConfig;
  initialCapital: number;
  riskPerTrade: number; // percentage
}

export interface ICTStrategyConfig {
  name: string;
  entryConditions: EntryCondition[];
  exitConditions: ExitCondition[];
  filters?: StrategyFilter[];
}

export interface EntryCondition {
  type: 'fvg' | 'orderBlock' | 'killZone' | 'premiumDiscount' | 'powerOfThree' | 'structureBreak';
  direction?: 'bullish' | 'bearish' | 'any';
  minConfidence?: number;
  params?: Record<string, any>;
}

export interface ExitCondition {
  type: 'riskReward' | 'oppositeSignal' | 'timeExit' | 'trailingStop' | 'targetLevel';
  value?: number;
  params?: Record<string, any>;
}

export interface StrategyFilter {
  type: 'killZoneOnly' | 'trendAlignment' | 'minIctScore' | 'sessionFilter';
  value?: any;
}

export interface BacktestResult {
  config: BacktestConfig;
  trades: BacktestTrade[];
  metrics: BacktestMetrics;
  equity: EquityPoint[];
  analysis: string[];
}

export interface BacktestTrade {
  entryTime: Date;
  exitTime: Date;
  entryPrice: number;
  exitPrice: number;
  direction: 'long' | 'short';
  pnl: number;
  pnlPercent: number;
  setup: string;
  ictScore: number;
  exitReason: string;
}

export interface BacktestMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  totalPnL: number;
  totalPnLPercent: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  averageWin: number;
  averageLoss: number;
  averageRR: number;
  largestWin: number;
  largestLoss: number;
  averageHoldTime: number; // hours
  bestMonth: string;
  worstMonth: string;
}

export interface EquityPoint {
  time: Date;
  equity: number;
  drawdown: number;
}

@Injectable()
export class ICTBacktestAgent extends BaseAgent {
  readonly agentId = 'ict-backtest-agent';
  readonly name = 'ICT Backtest Agent';
  readonly priority = 80;
  readonly capabilities: AgentCapability[] = [
    {
      id: 'backtest-ict-strategy',
      description: 'Run ICT strategy backtests on historical data',
      keywords: ['backtest', 'ict', 'strategy', 'historical', 'test', 'simulate'],
    },
    {
      id: 'analyze-setup-performance',
      description: 'Analyze performance of specific ICT setups',
      keywords: ['setup', 'performance', 'fvg', 'orderblock', 'analyze'],
    },
    {
      id: 'optimize-ict-params',
      description: 'Find optimal parameters for ICT strategy',
      keywords: ['optimize', 'parameters', 'best', 'tune', 'improve'],
    },
    {
      id: 'compare-strategies',
      description: 'Compare multiple ICT strategies',
      keywords: ['compare', 'strategies', 'which', 'better', 'versus'],
    },
    {
      id: 'get-prebuilt-strategies',
      description: 'Get pre-built ICT trading strategies',
      keywords: ['prebuilt', 'template', 'power of three', 'turtle soup', 'ict strategies'],
    },
  ];

  private readonly logger2 = new Logger(ICTBacktestAgent.name);

  constructor(
    registry: AgentRegistryService,
    eventBus: EventBusService,
    private readonly ictAIAgent: ICTAIAgentService,
    private readonly ictMaster: ICTMasterService,
    @Optional() private readonly tradingView?: TradingViewAdvancedService,
  ) {
    super(registry, eventBus);
  }

  // Pre-built ICT Strategies
  private readonly PREBUILT_STRATEGIES: Record<string, ICTStrategyConfig> = {
    'power-of-three': {
      name: 'Power of Three',
      entryConditions: [
        { type: 'powerOfThree', direction: 'any' },
        { type: 'fvg', direction: 'any', minConfidence: 0.6 },
      ],
      exitConditions: [{ type: 'riskReward', value: 2.5 }],
      filters: [{ type: 'killZoneOnly' }, { type: 'minIctScore', value: 70 }],
    },
    'turtle-soup': {
      name: 'Turtle Soup (Liquidity Sweep)',
      entryConditions: [
        { type: 'structureBreak', direction: 'any' },
        { type: 'orderBlock', direction: 'any' },
      ],
      exitConditions: [{ type: 'riskReward', value: 3 }],
      filters: [{ type: 'killZoneOnly' }, { type: 'minIctScore', value: 65 }],
    },
    'fvg-rebalance': {
      name: 'FVG Rebalance',
      entryConditions: [
        { type: 'fvg', direction: 'any', minConfidence: 0.7 },
        { type: 'premiumDiscount', direction: 'any' },
      ],
      exitConditions: [{ type: 'riskReward', value: 2 }],
      filters: [{ type: 'trendAlignment' }, { type: 'minIctScore', value: 60 }],
    },
    'orderblock-entry': {
      name: 'Order Block Entry',
      entryConditions: [
        { type: 'orderBlock', direction: 'any' },
        { type: 'premiumDiscount', direction: 'any' },
      ],
      exitConditions: [{ type: 'riskReward', value: 2 }],
      filters: [{ type: 'killZoneOnly' }, { type: 'minIctScore', value: 65 }],
    },
    'london-killzone': {
      name: 'London Kill Zone Scalp',
      entryConditions: [
        { type: 'killZone', direction: 'any' },
        { type: 'fvg', direction: 'any' },
      ],
      exitConditions: [{ type: 'riskReward', value: 1.5 }],
      filters: [{ type: 'sessionFilter', value: 'london' }, { type: 'minIctScore', value: 55 }],
    },
    'ny-open-reversal': {
      name: 'NY Open Reversal',
      entryConditions: [
        { type: 'killZone', direction: 'any' },
        { type: 'structureBreak', direction: 'any' },
        { type: 'orderBlock', direction: 'any' },
      ],
      exitConditions: [{ type: 'riskReward', value: 2.5 }],
      filters: [{ type: 'sessionFilter', value: 'ny_open' }, { type: 'minIctScore', value: 70 }],
    },
  };

  protected async processMessage(message: AgentMessage): Promise<AgentResponse> {
    const { payload } = message;
    const action = payload?.action || payload?.capability;

    switch (action) {
      case 'backtest-ict-strategy':
      case 'backtest':
        return this.runBacktest(payload);
      case 'analyze-setup-performance':
      case 'analyze-setup':
        return this.analyzeSetupPerformance(payload);
      case 'optimize-ict-params':
      case 'optimize':
        return this.optimizeParameters(payload);
      case 'compare-strategies':
      case 'compare':
        return this.compareStrategies(payload);
      case 'get-prebuilt-strategies':
      case 'prebuilt':
      case 'strategies':
        return this.getPrebuiltStrategies(payload);
      default:
        // Default to backtest if symbol provided
        if (payload?.symbol) {
          return this.runBacktest(payload);
        }
        return {
          success: false,
          error: { 
            code: 'UNKNOWN_ACTION', 
            message: `Unknown action: ${action}. Supported: backtest, analyze-setup, optimize, compare, prebuilt` 
          },
        };
    }
  }

  private async getPrebuiltStrategies(payload: any): Promise<AgentResponse> {
    const { strategyId } = payload;

    if (strategyId && this.PREBUILT_STRATEGIES[strategyId]) {
      return {
        success: true,
        data: {
          strategy: this.PREBUILT_STRATEGIES[strategyId],
          id: strategyId,
        },
      };
    }

    return {
      success: true,
      data: {
        strategies: Object.entries(this.PREBUILT_STRATEGIES).map(([id, strategy]) => ({
          id,
          name: strategy.name,
          description: `${strategy.entryConditions.map(c => c.type).join(' + ')} entry`,
          entryConditions: strategy.entryConditions.length,
          filters: strategy.filters?.length || 0,
          riskReward: strategy.exitConditions.find(e => e.type === 'riskReward')?.value || 'N/A',
        })),
        usage: 'Use with backtest action: { action: "backtest", symbol: "XAUUSD", strategyId: "power-of-three" }',
      },
    };
  }

  private async runBacktest(payload: any): Promise<AgentResponse> {
    const { symbol, timeframe, days = 90, strategyId, initialCapital = 10000, riskPerTrade = 1 } = payload;
    
    // Use pre-built strategy if strategyId provided
    const strategy = strategyId && this.PREBUILT_STRATEGIES[strategyId] 
      ? this.PREBUILT_STRATEGIES[strategyId] 
      : payload.strategy;

    try {
      this.logger.log(`Starting backtest for ${symbol} - ${strategy?.name || 'Default ICT'}`);

      // Try to fetch real TradingView data, fallback to simulated
      let priceData: any[];
      
      if (this.tradingView?.isReady()) {
        try {
          this.logger.log('Fetching real data from TradingView...');
          const tvData = await this.tradingView.getHistoricalData(
            this.formatSymbol(symbol),
            this.formatTimeframe(timeframe),
            Math.min(days * this.getBarsPerDay(timeframe), 5000)
          );
          priceData = tvData.data;
          this.logger.log(`Received ${priceData.length} bars from TradingView`);
        } catch (tvError) {
          this.logger.warn(`TradingView fetch failed, using simulated data: ${tvError.message}`);
          priceData = this.generateHistoricalData(symbol, days, timeframe);
        }
      } else {
        this.logger.log('TradingView not available, using simulated data');
        priceData = this.generateHistoricalData(symbol, days, timeframe);
      }
      const trades: BacktestTrade[] = [];
      let equity = initialCapital;
      const equityHistory: EquityPoint[] = [{ time: new Date(priceData[0].time), equity, drawdown: 0 }];
      let peakEquity = equity;

      // Run through historical data
      for (let i = 50; i < priceData.length - 10; i++) {
        const windowData = priceData.slice(Math.max(0, i - 100), i + 1);
        
        // Run ICT analysis on this point
        const analysis = await this.ictAIAgent.analyze(symbol, windowData, timeframe);
        
        // Check if entry conditions are met
        if (this.shouldEnter(analysis, strategy)) {
          const entryPrice = priceData[i].close;
          const direction = analysis.signal.includes('buy') ? 'long' : 'short';
          
          // Find exit point
          const exitResult = this.findExit(priceData, i, direction, strategy, analysis);
          
          if (exitResult) {
            const slLevel = (analysis.stopLoss as any)?.price || (analysis.stopLoss as any)?.level || entryPrice * 0.99;
            const positionSize = (equity * riskPerTrade / 100) / Math.abs(entryPrice - slLevel);
            const pnl = direction === 'long' 
              ? (exitResult.price - entryPrice) * positionSize
              : (entryPrice - exitResult.price) * positionSize;
            
            equity += pnl;
            peakEquity = Math.max(peakEquity, equity);
            
            trades.push({
              entryTime: new Date(priceData[i].time),
              exitTime: new Date(priceData[exitResult.index].time),
              entryPrice,
              exitPrice: exitResult.price,
              direction,
              pnl,
              pnlPercent: (pnl / (equity - pnl)) * 100,
              setup: analysis.primarySetup,
              ictScore: analysis.ictScore,
              exitReason: exitResult.reason,
            });

            equityHistory.push({
              time: new Date(priceData[exitResult.index].time),
              equity,
              drawdown: ((peakEquity - equity) / peakEquity) * 100,
            });

            i = exitResult.index; // Skip to exit point
          }
        }
      }

      // Calculate metrics
      const metrics = this.calculateMetrics(trades, initialCapital, equityHistory);

      const result: BacktestResult = {
        config: {
          symbol,
          timeframe,
          startDate: new Date(priceData[0].time),
          endDate: new Date(priceData[priceData.length - 1].time),
          strategy: strategy || this.getDefaultStrategy(),
          initialCapital,
          riskPerTrade,
        },
        trades,
        metrics,
        equity: equityHistory,
        analysis: this.generateBacktestAnalysis(metrics, trades),
      };

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Backtest failed: ${error.message}`);
      return {
        success: false,
        error: { code: 'BACKTEST_ERROR', message: error.message },
      };
    }
  }

  private shouldEnter(analysis: any, strategy?: ICTStrategyConfig): boolean {
    // Minimum ICT score requirement
    if (analysis.ictScore < 60) return false;
    
    // Must have a clear signal
    if (analysis.signal === 'neutral') return false;
    
    // Confidence threshold
    if (analysis.confidence < 0.6) return false;

    // Check Kill Zone if required
    if (strategy?.filters?.some(f => f.type === 'killZoneOnly')) {
      if (!analysis.killZoneStatus.isOptimal) return false;
    }

    // Check minimum ICT score filter
    const minScoreFilter = strategy?.filters?.find(f => f.type === 'minIctScore');
    if (minScoreFilter && analysis.ictScore < (minScoreFilter.value || 70)) {
      return false;
    }

    return true;
  }

  private findExit(
    priceData: any[],
    entryIndex: number,
    direction: 'long' | 'short',
    strategy: ICTStrategyConfig | undefined,
    analysis: any,
  ): { index: number; price: number; reason: string } | null {
    const entryPrice = priceData[entryIndex].close;
    const stopLoss = analysis.stopLoss?.price || analysis.stopLoss?.level || (direction === 'long' 
      ? entryPrice * 0.99 
      : entryPrice * 1.01);
    const takeProfit = analysis.takeProfit?.[0]?.target || (direction === 'long'
      ? entryPrice * 1.02
      : entryPrice * 0.98);

    const rrRatio = strategy?.exitConditions?.find(e => e.type === 'riskReward')?.value || 2;
    const maxBars = 50; // Max holding period

    for (let i = entryIndex + 1; i < Math.min(entryIndex + maxBars, priceData.length); i++) {
      const candle = priceData[i];

      // Check stop loss
      if (direction === 'long' && candle.low <= stopLoss) {
        return { index: i, price: stopLoss, reason: 'Stop Loss' };
      }
      if (direction === 'short' && candle.high >= stopLoss) {
        return { index: i, price: stopLoss, reason: 'Stop Loss' };
      }

      // Check take profit
      if (direction === 'long' && candle.high >= takeProfit) {
        return { index: i, price: takeProfit, reason: 'Take Profit' };
      }
      if (direction === 'short' && candle.low <= takeProfit) {
        return { index: i, price: takeProfit, reason: 'Take Profit' };
      }
    }

    // Time exit
    const lastIndex = Math.min(entryIndex + maxBars, priceData.length - 1);
    return {
      index: lastIndex,
      price: priceData[lastIndex].close,
      reason: 'Time Exit',
    };
  }

  private calculateMetrics(
    trades: BacktestTrade[],
    initialCapital: number,
    equityHistory: EquityPoint[],
  ): BacktestMetrics {
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));

    const maxDrawdown = Math.max(...equityHistory.map(e => e.drawdown));

    // Calculate Sharpe Ratio (simplified)
    const returns = trades.map(t => t.pnlPercent);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length || 0;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    ) || 1;
    const sharpeRatio = (avgReturn / stdDev) * Math.sqrt(252); // Annualized

    return {
      totalTrades: trades.length,
      winningTrades: wins.length,
      losingTrades: losses.length,
      winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
      totalPnL,
      totalPnLPercent: (totalPnL / initialCapital) * 100,
      maxDrawdown: equityHistory.length > 0 ? Math.max(...equityHistory.map(e => 
        initialCapital + totalPnL - e.equity
      )) : 0,
      maxDrawdownPercent: maxDrawdown,
      sharpeRatio: isFinite(sharpeRatio) ? sharpeRatio : 0,
      averageWin: wins.length > 0 ? grossProfit / wins.length : 0,
      averageLoss: losses.length > 0 ? grossLoss / losses.length : 0,
      averageRR: losses.length > 0 && wins.length > 0 
        ? (grossProfit / wins.length) / (grossLoss / losses.length) 
        : 0,
      largestWin: wins.length > 0 ? Math.max(...wins.map(t => t.pnl)) : 0,
      largestLoss: losses.length > 0 ? Math.min(...losses.map(t => t.pnl)) : 0,
      averageHoldTime: trades.length > 0 
        ? trades.reduce((sum, t) => sum + (t.exitTime.getTime() - t.entryTime.getTime()) / 3600000, 0) / trades.length
        : 0,
      bestMonth: 'N/A',
      worstMonth: 'N/A',
    };
  }

  private generateBacktestAnalysis(metrics: BacktestMetrics, trades: BacktestTrade[]): string[] {
    const analysis: string[] = [];

    // Win rate assessment
    if (metrics.winRate >= 60) {
      analysis.push(`✅ Strong win rate of ${metrics.winRate.toFixed(1)}% - strategy shows consistency`);
    } else if (metrics.winRate >= 45) {
      analysis.push(`⚠️ Moderate win rate of ${metrics.winRate.toFixed(1)}% - acceptable with good R:R`);
    } else {
      analysis.push(`❌ Low win rate of ${metrics.winRate.toFixed(1)}% - strategy needs refinement`);
    }

    // Profit factor
    if (metrics.profitFactor >= 2) {
      analysis.push(`✅ Excellent profit factor of ${metrics.profitFactor.toFixed(2)}`);
    } else if (metrics.profitFactor >= 1.5) {
      analysis.push(`✅ Good profit factor of ${metrics.profitFactor.toFixed(2)}`);
    } else if (metrics.profitFactor >= 1) {
      analysis.push(`⚠️ Marginal profit factor of ${metrics.profitFactor.toFixed(2)} - room for improvement`);
    } else {
      analysis.push(`❌ Negative profit factor - strategy is losing money`);
    }

    // Drawdown
    if (metrics.maxDrawdownPercent <= 10) {
      analysis.push(`✅ Low max drawdown of ${metrics.maxDrawdownPercent.toFixed(1)}% - good risk control`);
    } else if (metrics.maxDrawdownPercent <= 20) {
      analysis.push(`⚠️ Moderate drawdown of ${metrics.maxDrawdownPercent.toFixed(1)}% - acceptable`);
    } else {
      analysis.push(`❌ High drawdown of ${metrics.maxDrawdownPercent.toFixed(1)}% - reduce position sizing`);
    }

    // Setup analysis
    const setups = trades.reduce((acc, t) => {
      acc[t.setup] = (acc[t.setup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topSetup = Object.entries(setups).sort((a, b) => b[1] - a[1])[0];
    if (topSetup) {
      analysis.push(`📊 Most common setup: ${topSetup[0]} (${topSetup[1]} trades)`);
    }

    return analysis;
  }

  private async analyzeSetupPerformance(payload: any): Promise<AgentResponse> {
    const { setup, symbol, days = 90 } = payload;

    // Run backtest focusing on specific setup
    const strategy: ICTStrategyConfig = {
      name: `${setup} Analysis`,
      entryConditions: [{ type: this.mapSetupToCondition(setup), direction: 'any' }],
      exitConditions: [{ type: 'riskReward', value: 2 }],
      filters: [{ type: 'minIctScore', value: 50 }],
    };

    return this.runBacktest({ symbol, timeframe: '4H', days, strategy });
  }

  private mapSetupToCondition(setup: string): any {
    const mapping: Record<string, string> = {
      'FVG': 'fvg',
      'OrderBlock': 'orderBlock',
      'KillZone': 'killZone',
      'PremiumDiscount': 'premiumDiscount',
      'PowerOfThree': 'powerOfThree',
      'BOS': 'structureBreak',
    };
    return mapping[setup] || 'fvg';
  }

  private async optimizeParameters(payload: any): Promise<AgentResponse> {
    const { symbol, paramRanges, days = 180 } = payload;

    const results: any[] = [];
    const ictScoreRange = paramRanges?.ictScore || [50, 60, 70, 80];
    const rrRange = paramRanges?.riskReward || [1.5, 2, 2.5, 3];

    for (const ictScore of ictScoreRange) {
      for (const rr of rrRange) {
        const strategy: ICTStrategyConfig = {
          name: `ICT Score ${ictScore}, RR ${rr}`,
          entryConditions: [{ type: 'fvg', direction: 'any' }],
          exitConditions: [{ type: 'riskReward', value: rr }],
          filters: [{ type: 'minIctScore', value: ictScore }],
        };

        const result = await this.runBacktest({ symbol, timeframe: '4H', days, strategy });
        if (result.success && result.data) {
          results.push({
            params: { ictScore, rr },
            metrics: result.data.metrics,
          });
        }
      }
    }

    // Sort by profit factor
    results.sort((a, b) => b.metrics.profitFactor - a.metrics.profitFactor);

    return {
      success: true,
      data: {
        optimal: results[0],
        allResults: results,
        recommendation: `Best parameters: ICT Score >= ${results[0]?.params.ictScore}, Risk:Reward ${results[0]?.params.rr}:1`,
      },
    };
  }

  private async compareStrategies(payload: any): Promise<AgentResponse> {
    const { strategies, symbol, days = 90 } = payload;

    const results = await Promise.all(
      strategies.map((strategy: ICTStrategyConfig) =>
        this.runBacktest({ symbol, timeframe: '4H', days, strategy })
      )
    );

    const comparison = results
      .filter(r => r.success)
      .map((r, i) => ({
        strategy: strategies[i].name,
        ...r.data.metrics,
      }))
      .sort((a, b) => b.profitFactor - a.profitFactor);

    return {
      success: true,
      data: {
        comparison,
        winner: comparison[0]?.strategy,
        analysis: `${comparison[0]?.strategy} performed best with ${comparison[0]?.winRate?.toFixed(1)}% win rate and ${comparison[0]?.profitFactor?.toFixed(2)} profit factor`,
      },
    };
  }

  private getDefaultStrategy(): ICTStrategyConfig {
    return {
      name: 'Default ICT Strategy',
      entryConditions: [
        { type: 'fvg', direction: 'any', minConfidence: 0.6 },
        { type: 'orderBlock', direction: 'any' },
      ],
      exitConditions: [
        { type: 'riskReward', value: 2 },
      ],
      filters: [
        { type: 'killZoneOnly' },
        { type: 'minIctScore', value: 65 },
      ],
    };
  }

  private generateHistoricalData(symbol: string, days: number, timeframe: string): any[] {
    const data: any[] = [];
    const barsPerDay = this.getBarsPerDay(timeframe);
    const totalBars = days * barsPerDay;
    
    let basePrice = symbol.includes('XAU') ? 2000 : symbol.includes('NAS') ? 15000 : 1.1;
    const volatility = symbol.includes('XAU') ? 0.005 : symbol.includes('NAS') ? 0.008 : 0.002;
    
    const startTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const barInterval = (24 * 60 * 60 * 1000) / barsPerDay;

    for (let i = 0; i < totalBars; i++) {
      const time = startTime + i * barInterval;
      const change = (Math.random() - 0.5) * 2 * volatility * basePrice;
      const open = basePrice;
      const close = basePrice + change;
      const high = Math.max(open, close) + Math.random() * volatility * basePrice * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * basePrice * 0.5;
      
      data.push({ time, open, high, low, close, volume: Math.random() * 10000 });
      basePrice = close;
    }

    return data;
  }

  private formatSymbol(symbol: string): string {
    // Format symbol for TradingView API
    // e.g., 'XAUUSD' -> 'OANDA:XAUUSD', 'NASDAQ' -> 'NASDAQ:NDX'
    const symbolMappings: Record<string, string> = {
      'XAUUSD': 'OANDA:XAUUSD',
      'GOLD': 'OANDA:XAUUSD',
      'NASDAQ': 'NASDAQ:NDX',
      'NAS100': 'NASDAQ:NDX',
      'NDX': 'NASDAQ:NDX',
      'SP500': 'SP:SPX',
      'SPX': 'SP:SPX',
      'EURUSD': 'FX:EURUSD',
      'GBPUSD': 'FX:GBPUSD',
      'USDJPY': 'FX:USDJPY',
      'BTCUSD': 'COINBASE:BTCUSD',
    };
    
    const upperSymbol = symbol.toUpperCase();
    return symbolMappings[upperSymbol] || (symbol.includes(':') ? symbol : `OANDA:${upperSymbol}`);
  }

  private formatTimeframe(timeframe: string): string {
    // Format timeframe for TradingView API
    const timeframeMappings: Record<string, string> = {
      '1m': '1',
      '5m': '5',
      '15m': '15',
      '1h': '60',
      '1H': '60',
      '4h': '240',
      '4H': '240',
      '1d': 'D',
      '1D': 'D',
      'D': 'D',
      'daily': 'D',
      '1w': 'W',
      '1W': 'W',
      'weekly': 'W',
    };
    
    return timeframeMappings[timeframe] || timeframe;
  }

  private getBarsPerDay(timeframe: string): number {
    const mapping: Record<string, number> = {
      '1': 1440,
      '5': 288,
      '15': 96,
      '60': 24,
      '240': 6,
      '1D': 1,
      '4H': 6,
      '1H': 24,
    };
    return mapping[timeframe] || 6;
  }

  async onEvent(event: AgentMessage): Promise<void> {
    if (event.type === 'event') {
      this.logger.debug(`Received event: ${JSON.stringify(event.payload)}`);
    }
  }
}
