import { safeToFixed } from './ict-utils';
import { Injectable, Logger } from '@nestjs/common';
import { Candle } from './market-data-provider.service';

export interface PowerOfThreeAnalysis {
  symbol: string;
  currentPhase: 'accumulation' | 'manipulation' | 'distribution' | 'unknown';
  phaseConfidence: number; // 0-100
  phaseDescription: string;
  expectedNextMove: string;
  timeInPhase: number; // Number of candles in current phase
  phaseLevels: {
    accumulation?: { low: number; high: number };
    manipulation?: { fakeoutLevel: number; reversalPoint: number };
    distribution?: { targetLow: number; targetHigh: number };
  };
  tradingStrategy: string[];
  warnings: string[];
  timestamp: Date;
}

@Injectable()
export class PowerOfThreeService {
  private readonly logger = new Logger(PowerOfThreeService.name);

  /**
   * Analyze Power of Three (AMD model)
   * Accumulation → Manipulation → Distribution
   */
  analyzePowerOfThree(
    symbol: string,
    priceData: Candle[],
    timeframe: string = '1D',
  ): PowerOfThreeAnalysis {
    this.logger.log(
      `Analyzing ICT Power of Three for ${symbol} on ${timeframe}`,
    );

    // Identify current phase
    const { phase, confidence, timeInPhase } = this.identifyPhase(priceData);

    // Get phase-specific levels
    const phaseLevels = this.calculatePhaseLevels(priceData, phase);

    // Generate phase description
    const phaseDescription = this.describePhase(phase, phaseLevels);

    // Predict next move
    const expectedNextMove = this.predictNextMove(
      phase,
      phaseLevels,
      priceData,
    );

    // Generate trading strategy
    const tradingStrategy = this.generateTradingStrategy(
      phase,
      phaseLevels,
      priceData,
    );

    // Generate warnings
    const warnings = this.generateWarnings(phase, confidence);

    return {
      symbol,
      currentPhase: phase,
      phaseConfidence: confidence,
      phaseDescription,
      expectedNextMove,
      timeInPhase,
      phaseLevels,
      tradingStrategy,
      warnings,
      timestamp: new Date(),
    };
  }

  /**
   * Identify current phase of Power of Three
   */
  private identifyPhase(priceData: Candle[]): {
    phase: 'accumulation' | 'manipulation' | 'distribution' | 'unknown';
    confidence: number;
    timeInPhase: number;
  } {
    if (priceData.length < 20) {
      return { phase: 'unknown', confidence: 0, timeInPhase: 0 };
    }

    const recent = priceData.slice(-20);

    // Calculate volatility and range
    const highs = recent.map((d) => d.high);
    const lows = recent.map((d) => d.low);
    const closes = recent.map((d) => d.close);

    const rangeHigh = Math.max(...highs);
    const rangeLow = Math.min(...lows);
    const range = rangeHigh - rangeLow;

    const avgClose = closes.reduce((a, b) => a + b, 0) / closes.length;

    // Calculate average true range (volatility)
    let totalATR = 0;
    for (let i = 1; i < recent.length; i++) {
      const tr = Math.max(
        recent[i].high - recent[i].low,
        Math.abs(recent[i].high - recent[i - 1].close),
        Math.abs(recent[i].low - recent[i - 1].close),
      );
      totalATR += tr;
    }
    const avgATR = totalATR / (recent.length - 1);
    const volatilityRatio = avgATR / avgClose;

    // ACCUMULATION: Low volatility, tight range, sideways movement
    const isAccumulation = volatilityRatio < 0.015; // Low volatility
    const isTightRange = range / avgClose < 0.03; // Tight range (3%)

    if (isAccumulation && isTightRange) {
      return {
        phase: 'accumulation',
        confidence: 75,
        timeInPhase: this.countPhaseCandles(recent, 'accumulation'),
      };
    }

    // MANIPULATION: Sudden spike (fake breakout), then reversal
    const hasRecentSpike = this.detectManipulationSpike(recent);
    if (hasRecentSpike) {
      return {
        phase: 'manipulation',
        confidence: 80,
        timeInPhase: this.countPhaseCandles(recent, 'manipulation'),
      };
    }

    // DISTRIBUTION: Strong directional move after manipulation
    const hasStrongTrend = this.detectStrongTrend(recent);
    if (hasStrongTrend) {
      return {
        phase: 'distribution',
        confidence: 70,
        timeInPhase: this.countPhaseCandles(recent, 'distribution'),
      };
    }

    return { phase: 'unknown', confidence: 40, timeInPhase: 0 };
  }

  /**
   * Detect manipulation spike (liquidity sweep)
   */
  private detectManipulationSpike(data: Candle[]): boolean {
    if (data.length < 5) return false;

    const recent5 = data.slice(-5);

    // Look for a spike that gets reversed
    for (let i = 1; i < recent5.length - 1; i++) {
      const prev = recent5[i - 1];
      const current = recent5[i];
      const next = recent5[i + 1];

      // Bullish spike then reversal
      if (
        current.high > prev.high * 1.01 && // Spike up
        next.close < current.open && // Reversal down
        Math.abs(current.close - current.open) >
          (current.high - current.low) * 0.3 // Wick
      ) {
        return true;
      }

      // Bearish spike then reversal
      if (
        current.low < prev.low * 0.99 && // Spike down
        next.close > current.open && // Reversal up
        Math.abs(current.close - current.open) >
          (current.high - current.low) * 0.3 // Wick
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect strong trend (distribution phase)
   */
  private detectStrongTrend(data: Candle[]): boolean {
    if (data.length < 5) return false;

    const recent5 = data.slice(-5);
    let bullishCandles = 0;
    let bearishCandles = 0;

    for (const candle of recent5) {
      if (candle.close > candle.open) bullishCandles++;
      if (candle.close < candle.open) bearishCandles++;
    }

    // Strong trend = 4 out of 5 candles in same direction
    return bullishCandles >= 4 || bearishCandles >= 4;
  }

  /**
   * Count candles in current phase
   */
  private countPhaseCandles(data: Candle[], phase: string): number {
    // Simplified - count recent candles fitting phase characteristics
    return Math.min(data.length, 10);
  }

  /**
   * Calculate phase-specific levels
   */
  private calculatePhaseLevels(
    priceData: Candle[],
    phase: string,
  ): {
    accumulation?: { low: number; high: number };
    manipulation?: { fakeoutLevel: number; reversalPoint: number };
    distribution?: { targetLow: number; targetHigh: number };
  } {
    const recent = priceData.slice(-20);
    const highs = recent.map((d) => d.high);
    const lows = recent.map((d) => d.low);

    const rangeHigh = Math.max(...highs);
    const rangeLow = Math.min(...lows);

    if (phase === 'accumulation') {
      return {
        accumulation: {
          low: rangeLow,
          high: rangeHigh,
        },
      };
    }

    if (phase === 'manipulation') {
      // Find the spike level
      const recentHigh = Math.max(...recent.slice(-5).map((d) => d.high));
      const recentLow = Math.min(...recent.slice(-5).map((d) => d.low));

      return {
        manipulation: {
          fakeoutLevel:
            recentHigh > rangeLow + (rangeHigh - rangeLow) * 0.5
              ? recentHigh
              : recentLow,
          reversalPoint: recent[recent.length - 1].close,
        },
      };
    }

    if (phase === 'distribution') {
      // Target is opposite side of range
      const currentPrice = recent[recent.length - 1].close;
      const isUptrend = currentPrice > rangeLow + (rangeHigh - rangeLow) * 0.5;

      return {
        distribution: {
          targetLow: isUptrend ? rangeHigh * 0.95 : rangeLow,
          targetHigh: isUptrend ? rangeHigh * 1.05 : rangeHigh,
        },
      };
    }

    return {};
  }

  /**
   * Describe current phase
   */
  private describePhase(
    phase: string,
    levels: PowerOfThreeAnalysis['phaseLevels'],
  ): string {
    switch (phase) {
      case 'accumulation':
        return `ACCUMULATION PHASE: Institutions are building positions quietly. Price is consolidating in a tight range (${safeToFixed(levels.accumulation?.low, 2)} - ${safeToFixed(levels.accumulation?.high, 2)}). Low volatility as smart money accumulates. This is the "basing" phase before a big move.`;

      case 'manipulation':
        return `MANIPULATION PHASE: Institutions are hunting stops! Price spiked to ${safeToFixed(levels.manipulation?.fakeoutLevel, 2)} to sweep liquidity, then reversed to ${safeToFixed(levels.manipulation?.reversalPoint, 2)}. This is the "fake-out" to trap retail traders before the real move. Watch for the reversal!`;

      case 'distribution':
        return `DISTRIBUTION PHASE: Institutions are delivering price to target! Strong directional move in progress. Price targeting ${safeToFixed(levels.distribution?.targetLow, 2)} - ${safeToFixed(levels.distribution?.targetHigh, 2)}. This is where the real money is made. Follow the institutional flow!`;

      default:
        return `PHASE UNKNOWN: Unable to clearly identify current Power of Three phase. Market may be transitioning between phases. Wait for clearer structure.`;
    }
  }

  /**
   * Predict next move based on phase
   */
  private predictNextMove(
    phase: string,
    levels: PowerOfThreeAnalysis['phaseLevels'],
    priceData: Candle[],
  ): string {
    const currentPrice = priceData[priceData.length - 1].close;

    switch (phase) {
      case 'accumulation':
        return `Expect MANIPULATION next → Watch for liquidity sweep above ${safeToFixed(levels.accumulation?.high, 2)} or below ${safeToFixed(levels.accumulation?.low, 2)}, then sharp reversal. Don't chase the spike!`;

      case 'manipulation':
        return `Expect DISTRIBUTION next → After liquidity sweep, price should reverse strongly in opposite direction. Entry zone is near ${safeToFixed(levels.manipulation?.reversalPoint, 2)}. This is the high-probability trade!`;

      case 'distribution':
        return `Distribution in progress → Continue following the trend until target reached at ${safeToFixed(levels.distribution?.targetHigh, 2)} or ${safeToFixed(levels.distribution?.targetLow, 2)}. Watch for exhaustion signals (divergence, wicks, slowing momentum).`;

      default:
        return `Wait for clear phase identification before entering trades.`;
    }
  }

  /**
   * Generate trading strategy for current phase
   */
  private generateTradingStrategy(
    phase: string,
    levels: PowerOfThreeAnalysis['phaseLevels'],
    priceData: Candle[],
  ): string[] {
    const strategy: string[] = [];

    strategy.push(`🎯 ICT Power of Three Trading Strategy`);
    strategy.push(`Current Phase: ${phase.toUpperCase()}`);

    switch (phase) {
      case 'accumulation':
        strategy.push(`\n📍 ACCUMULATION STRATEGY:`);
        strategy.push(`   • DO NOT trade the range`);
        strategy.push(
          `   • Mark the accumulation high (${safeToFixed(levels.accumulation?.high, 2)}) and low (${safeToFixed(levels.accumulation?.low, 2)})`,
        );
        strategy.push(`   • Wait for manipulation phase (liquidity sweep)`);
        strategy.push(`   • Prepare to enter AFTER the fake breakout reverses`);
        strategy.push(`   • Patience is key - this is the setup phase`);
        break;

      case 'manipulation':
        strategy.push(`\n⚡ MANIPULATION STRATEGY (HIGH PRIORITY!):`);
        strategy.push(
          `   • Liquidity has been swept at ${safeToFixed(levels.manipulation?.fakeoutLevel, 2)}`,
        );
        strategy.push(
          `   • Price reversed to ${safeToFixed(levels.manipulation?.reversalPoint, 2)}`,
        );
        strategy.push(`   • THIS IS YOUR ENTRY ZONE!`);
        strategy.push(
          `   • Entry: Near ${safeToFixed(levels.manipulation?.reversalPoint, 2)}`,
        );
        strategy.push(
          `   • Stop Loss: Beyond manipulation level (${safeToFixed(levels.manipulation?.fakeoutLevel, 2)})`,
        );
        strategy.push(`   • Target: Opposite side of accumulation range`);
        strategy.push(`   • Risk/Reward: Typically 1:3 to 1:5`);
        strategy.push(`   • Look for Order Block or FVG for precise entry`);
        break;

      case 'distribution':
        strategy.push(`\n📈 DISTRIBUTION STRATEGY:`);
        strategy.push(`   • Follow the institutional flow`);
        strategy.push(`   • Enter on pullbacks to Order Blocks or FVGs`);
        strategy.push(`   • Trail stops below/above swing points`);
        strategy.push(
          `   • Target: ${safeToFixed(levels.distribution?.targetHigh, 2) || safeToFixed(levels.distribution?.targetLow, 2)}`,
        );
        strategy.push(`   • Take partial profits along the way`);
        strategy.push(
          `   • Exit when distribution is complete (reversal signals)`,
        );
        break;

      default:
        strategy.push(`\n⏸️ WAIT FOR CLEAR PHASE:`);
        strategy.push(`   • Market is transitioning`);
        strategy.push(`   • Do not force trades`);
        strategy.push(`   • Wait for accumulation or manipulation to develop`);
    }

    return strategy;
  }

  /**
   * Generate warnings
   */
  private generateWarnings(phase: string, confidence: number): string[] {
    const warnings: string[] = [];

    if (confidence < 60) {
      warnings.push(
        `⚠️ Low confidence (${confidence}%) - phase identification uncertain`,
      );
    }

    if (phase === 'accumulation') {
      warnings.push(
        `⚠️ DO NOT trade during accumulation - wait for manipulation`,
      );
    }

    if (phase === 'unknown') {
      warnings.push(
        `⚠️ Phase unclear - avoid trading until structure develops`,
      );
    }

    return warnings;
  }

  /**
   * Get Power of Three summary for quick reference
   */
  getPowerOfThreeSummary(): {
    phases: string[];
    description: string;
  } {
    return {
      phases: ['Accumulation', 'Manipulation', 'Distribution'],
      description: `ICT Power of Three (AMD Model):
      
1. ACCUMULATION: Institutions quietly build positions in tight range
   → Low volatility, sideways movement
   → Do NOT trade this phase
   
2. MANIPULATION: Institutions hunt stops with fake breakout
   → Liquidity sweep above or below range
   → Sharp reversal (this is the trap!)
   → ENTRY ZONE: After manipulation reversal
   
3. DISTRIBUTION: Institutions deliver price to target
   → Strong directional move
   → Follow the flow with pullback entries
   → Take profits at targets
   
This cycle repeats on ALL timeframes!`,
    };
  }
}
