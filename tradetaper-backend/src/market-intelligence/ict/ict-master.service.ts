import { safeToFixed } from './ict-utils';
import { Injectable, Logger } from '@nestjs/common';
import { LiquidityAnalysisService } from './liquidity-analysis.service';
import { MarketStructureService } from './market-structure.service';
import { FairValueGapService } from './fair-value-gap.service';
import { OrderBlockService } from './order-block.service';
import { KillZoneService } from './kill-zone.service';

export interface ICTCompleteAnalysis {
  symbol: string;
  timeframe: string;
  currentPrice: number;
  killZone: {
    active: boolean;
    name: string | null;
    isOptimal: boolean;
  };
  liquidity: any;
  marketStructure: any;
  fairValueGaps: any;
  orderBlocks: any;
  overallBias: 'bullish' | 'bearish' | 'neutral';
  confidence: number; // 0-100
  ictScore: number; // 0-100 (how aligned all ICT concepts are)
  primarySetup: string | null;
  entryZones: Array<{
    type: 'FVG' | 'OrderBlock' | 'Liquidity';
    direction: 'long' | 'short';
    price: number;
    range: { high: number; low: number };
    strength: string;
    description: string;
  }>;
  analysis: string[];
  tradingPlan: string[];
  timestamp: Date;
}

@Injectable()
export class ICTMasterService {
  private readonly logger = new Logger(ICTMasterService.name);

  constructor(
    private readonly liquidityAnalysis: LiquidityAnalysisService,
    private readonly marketStructure: MarketStructureService,
    private readonly fairValueGap: FairValueGapService,
    private readonly orderBlock: OrderBlockService,
    private readonly killZone: KillZoneService,
  ) {}

  /**
   * Complete ICT Analysis (all concepts combined)
   */
  async analyzeComplete(
    symbol: string,
    priceData: any[],
    timeframe: string = '1D',
  ): Promise<ICTCompleteAnalysis> {
    this.logger.log(
      `Running complete ICT analysis for ${symbol} on ${timeframe}`,
    );

    if (!priceData || priceData.length === 0) {
      throw new Error('Price data is empty');
    }

    const lastCandle = priceData[priceData.length - 1];
    if (!lastCandle || lastCandle.close === undefined) {
      throw new Error('Invalid price data: missing close price');
    }

    const currentPrice = lastCandle.close;
    this.logger.log(`Current price extracted: ${currentPrice}`);

    // Run all ICT analyses in parallel with error handling
    const results = await Promise.allSettled([
      this.liquidityAnalysis.analyzeLiquidity(symbol, priceData, timeframe),
      this.marketStructure.analyzeMarketStructure(symbol, priceData, timeframe),
      this.fairValueGap.identifyFairValueGaps(symbol, priceData, timeframe),
      this.orderBlock.identifyOrderBlocks(symbol, priceData, timeframe),
      this.killZone.analyzeKillZones(),
    ]);

    // Extract results with fallbacks
    const liquidity =
      results[0].status === 'fulfilled'
        ? results[0].value
        : { nearestLiquidity: { above: null, below: null } };
    const structure =
      results[1].status === 'fulfilled'
        ? results[1].value
        : { trend: 'unknown', tradingBias: 'neutral' };
    const fvgs =
      results[2].status === 'fulfilled'
        ? results[2].value
        : { unfilledFVGs: [], nearestFVG: null };
    const obs =
      results[3].status === 'fulfilled'
        ? results[3].value
        : { activeOrderBlocks: [], nearestOrderBlock: null };
    const killZoneAnalysis =
      results[4].status === 'fulfilled'
        ? results[4].value
        : { isOptimalTradingTime: false, activeKillZone: null };

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const serviceName = [
          'Liquidity',
          'Structure',
          'FVG',
          'OrderBlock',
          'KillZone',
        ][index];
        this.logger.error(
          `${serviceName} analysis failed: ${result.reason?.message}`,
        );
      }
    });

    // Determine overall bias
    let overallBias: 'neutral' | 'bullish' | 'bearish';
    try {
      overallBias = this.calculateOverallBias(structure, liquidity, fvgs, obs);
    } catch (error) {
      this.logger.error(`Error calculating overall bias: ${error.message}`);
      overallBias = 'neutral';
    }

    // Calculate ICT score (alignment of all concepts)
    let ictScore: number;
    try {
      ictScore = this.calculateICTScore(
        structure,
        liquidity,
        fvgs,
        obs,
        killZoneAnalysis,
      );
    } catch (error) {
      this.logger.error(`Error calculating ICT score: ${error.message}`);
      ictScore = 50;
    }

    // Calculate confidence
    let confidence: number;
    try {
      confidence = this.calculateConfidence(
        ictScore,
        killZoneAnalysis.isOptimalTradingTime,
      );
    } catch (error) {
      this.logger.error(`Error calculating confidence: ${error.message}`);
      confidence = 50;
    }

    // Identify primary setup
    let primarySetup: string | null;
    try {
      primarySetup = this.identifyPrimarySetup(
        structure,
        fvgs,
        obs,
        overallBias,
      );
    } catch (error) {
      this.logger.error(`Error identifying primary setup: ${error.message}`);
      primarySetup = null;
    }

    // Identify entry zones
    let entryZones: any[];
    try {
      entryZones = this.identifyEntryZones(fvgs, obs, liquidity, overallBias);
    } catch (error) {
      this.logger.error(`Error identifying entry zones: ${error.message}`);
      entryZones = [];
    }

    // Generate comprehensive analysis
    let analysis: string[];
    try {
      analysis = this.generateComprehensiveAnalysis(
        liquidity,
        structure,
        fvgs,
        obs,
        killZoneAnalysis,
        overallBias,
        ictScore,
        currentPrice,
      );
    } catch (error) {
      this.logger.error(
        `Error generating comprehensive analysis: ${error.message}`,
      );
      analysis = [
        'Error generating analysis - some ICT values may be undefined',
      ];
    }

    // Generate trading plan
    let tradingPlan: string[];
    try {
      tradingPlan = this.generateTradingPlan(
        overallBias,
        primarySetup,
        entryZones,
        killZoneAnalysis,
        structure,
        confidence,
      );
    } catch (error) {
      this.logger.error(`Error generating trading plan: ${error.message}`);
      tradingPlan = [
        'Error generating trading plan - some ICT values may be undefined',
      ];
    }

    return {
      symbol,
      timeframe,
      currentPrice,
      killZone: {
        active: killZoneAnalysis.activeKillZone !== null,
        name: killZoneAnalysis.activeKillZone?.name || null,
        isOptimal: killZoneAnalysis.isOptimalTradingTime,
      },
      liquidity,
      marketStructure: structure,
      fairValueGaps: fvgs,
      orderBlocks: obs,
      overallBias,
      confidence,
      ictScore,
      primarySetup,
      entryZones,
      analysis,
      tradingPlan,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate overall bias from all ICT concepts
   */
  private calculateOverallBias(
    structure: any,
    liquidity: any,
    fvgs: any,
    obs: any,
  ): 'bullish' | 'bearish' | 'neutral' {
    let bullishSignals = 0;
    let bearishSignals = 0;

    // Market structure
    if (structure.trend === 'bullish') bullishSignals += 2;
    else if (structure.trend === 'bearish') bearishSignals += 2;

    if (structure.tradingBias === 'long') bullishSignals += 1;
    else if (structure.tradingBias === 'short') bearishSignals += 1;

    // Liquidity (which side is being targeted)
    if (liquidity.nearestLiquidity.above) {
      const distance =
        liquidity.nearestLiquidity.above.price - liquidity.currentPrice;
      if (distance / liquidity.currentPrice < 0.02) {
        // Close to buy-side liquidity = likely sweep then reverse bearish
        bearishSignals += 1;
      }
    }

    if (liquidity.nearestLiquidity.below) {
      const distance =
        liquidity.currentPrice - liquidity.nearestLiquidity.below.price;
      if (distance / liquidity.currentPrice < 0.02) {
        // Close to sell-side liquidity = likely sweep then reverse bullish
        bullishSignals += 1;
      }
    }

    // FVGs
    const bullishFVGs = fvgs.bullishFVGs.filter(
      (fvg: any) => !fvg.filled,
    ).length;
    const bearishFVGs = fvgs.bearishFVGs.filter(
      (fvg: any) => !fvg.filled,
    ).length;

    if (bullishFVGs > bearishFVGs) bullishSignals += 1;
    else if (bearishFVGs > bullishFVGs) bearishSignals += 1;

    // Order Blocks
    const activeBullishOBs = obs.bullishOrderBlocks.filter(
      (ob: any) => !ob.isBreaker,
    ).length;
    const activeBearishOBs = obs.bearishOrderBlocks.filter(
      (ob: any) => !ob.isBreaker,
    ).length;

    if (activeBullishOBs > activeBearishOBs) bullishSignals += 1;
    else if (activeBearishOBs > activeBullishOBs) bearishSignals += 1;

    // Determine final bias
    if (bullishSignals > bearishSignals + 1) return 'bullish';
    if (bearishSignals > bullishSignals + 1) return 'bearish';
    return 'neutral';
  }

  /**
   * Calculate ICT Score (how well all concepts align)
   */
  private calculateICTScore(
    structure: any,
    liquidity: any,
    fvgs: any,
    obs: any,
    killZoneAnalysis: any,
  ): number {
    let score = 0;

    // Market structure clarity (max 25 points)
    if (structure.structureType === 'BOS')
      score += 15; // Clear continuation
    else if (structure.structureType === 'CHoCH') score += 10; // Potential reversal

    if (structure.trend !== 'ranging') score += 10; // Clear trend

    // Liquidity zones identified (max 20 points)
    const totalLiquidity =
      liquidity.buySideLiquidity.length + liquidity.sellSideLiquidity.length;
    score += Math.min(20, totalLiquidity * 2);

    // FVGs identified (max 20 points)
    score += Math.min(20, fvgs.unfilledFVGs.length * 4);

    // Order Blocks identified (max 20 points)
    score += Math.min(20, obs.activeOrderBlocks.length * 5);

    // Kill Zone timing (max 15 points)
    if (killZoneAnalysis.isOptimalTradingTime) score += 15;
    else if (killZoneAnalysis.activeKillZone) score += 7;

    return Math.min(100, score);
  }

  /**
   * Calculate confidence based on ICT score and timing
   */
  private calculateConfidence(
    ictScore: number,
    isOptimalTime: boolean,
  ): number {
    let confidence = ictScore * 0.7; // Base confidence from ICT score

    if (isOptimalTime) {
      confidence += 20; // Boost for optimal kill zone
    }

    return Math.min(95, Math.max(20, confidence));
  }

  /**
   * Identify primary trading setup
   */
  private identifyPrimarySetup(
    structure: any,
    fvgs: any,
    obs: any,
    bias: string,
  ): string | null {
    // Priority: Order Block > FVG > Structure Break

    if (
      obs.nearestOrderBlock?.type === bias &&
      obs.nearestOrderBlock?.low !== undefined &&
      obs.nearestOrderBlock?.high !== undefined
    ) {
      return `${bias.toUpperCase()} Order Block Retest at ${safeToFixed(obs.nearestOrderBlock.low, 2)} - ${safeToFixed(obs.nearestOrderBlock.high, 2)}`;
    }

    if (
      fvgs.nearestFVG?.type === bias &&
      fvgs.nearestFVG?.low !== undefined &&
      fvgs.nearestFVG?.high !== undefined
    ) {
      return `${bias.toUpperCase()} Fair Value Gap Fill at ${safeToFixed(fvgs.nearestFVG.low, 2)} - ${safeToFixed(fvgs.nearestFVG.high, 2)}`;
    }

    if (
      structure.structureType === 'BOS' &&
      structure.tradingBias === bias.replace('ish', '')
    ) {
      return `${bias.toUpperCase()} Break of Structure (Trend Continuation)`;
    }

    if (structure.structureType === 'CHoCH') {
      return `Change of Character Detected (Potential ${bias.toUpperCase()} Reversal)`;
    }

    return null;
  }

  /**
   * Identify all entry zones
   */
  private identifyEntryZones(
    fvgs: any,
    obs: any,
    liquidity: any,
    bias: string,
  ): Array<any> {
    const zones: Array<any> = [];

    // Add FVG entry zones
    if (fvgs.nearestFVG) {
      zones.push({
        type: 'FVG',
        direction: fvgs.nearestFVG.type === 'bullish' ? 'long' : 'short',
        price: (fvgs.nearestFVG.high + fvgs.nearestFVG.low) / 2,
        range: { high: fvgs.nearestFVG.high, low: fvgs.nearestFVG.low },
        strength: fvgs.nearestFVG.strength,
        description: fvgs.nearestFVG.description,
      });
    }

    // Add Order Block entry zones
    if (obs.nearestOrderBlock) {
      zones.push({
        type: 'OrderBlock',
        direction: obs.nearestOrderBlock.type === 'bullish' ? 'long' : 'short',
        price: (obs.nearestOrderBlock.high + obs.nearestOrderBlock.low) / 2,
        range: {
          high: obs.nearestOrderBlock.high,
          low: obs.nearestOrderBlock.low,
        },
        strength: obs.nearestOrderBlock.strength,
        description: obs.nearestOrderBlock.description,
      });
    }

    // Add liquidity zones (for post-sweep entries)
    if (liquidity.nearestLiquidity?.above?.price) {
      zones.push({
        type: 'Liquidity',
        direction: 'short', // After buy-side sweep, go short
        price: liquidity.nearestLiquidity.above.price,
        range: {
          high: liquidity.nearestLiquidity.above.price * 1.002,
          low: liquidity.nearestLiquidity.above.price * 0.998,
        },
        strength: liquidity.nearestLiquidity.above.strength,
        description: `Buy-side liquidity sweep target at ${safeToFixed(liquidity.nearestLiquidity.above.price, 2)}`,
      });
    }

    if (liquidity.nearestLiquidity?.below?.price) {
      zones.push({
        type: 'Liquidity',
        direction: 'long', // After sell-side sweep, go long
        price: liquidity.nearestLiquidity.below.price,
        range: {
          high: liquidity.nearestLiquidity.below.price * 1.002,
          low: liquidity.nearestLiquidity.below.price * 0.998,
        },
        strength: liquidity.nearestLiquidity.below.strength,
        description: `Sell-side liquidity sweep target at ${safeToFixed(liquidity.nearestLiquidity.below.price, 2)}`,
      });
    }

    return zones;
  }

  /**
   * Generate comprehensive analysis
   */
  private generateComprehensiveAnalysis(
    liquidity: any,
    structure: any,
    fvgs: any,
    obs: any,
    killZone: any,
    bias: string,
    ictScore: number,
    currentPrice: number,
  ): string[] {
    const analysis: string[] = [];

    analysis.push(
      `╔═══════════════════════════════════════════════════════════╗`,
    );
    analysis.push(
      `║        ICT (INNER CIRCLE TRADER) COMPLETE ANALYSIS         ║`,
    );
    analysis.push(
      `╚═══════════════════════════════════════════════════════════╝`,
    );

    analysis.push(`\n📊 Overall Assessment:`);
    analysis.push(`   • ICT Score: ${ictScore}/100`);
    analysis.push(`   • Overall Bias: ${bias.toUpperCase()}`);
    analysis.push(
      `   • Current Price: ${currentPrice !== undefined && currentPrice !== null ? safeToFixed(currentPrice, 2) : 'N/A'}`,
    );

    // Kill Zone info
    analysis.push(`\n🕐 Kill Zone Status:`);
    if (killZone.activeKillZone) {
      analysis.push(`   • Active: ${killZone.activeKillZone.name}`);
      analysis.push(
        `   • Time Remaining: ${Math.floor((killZone.activeKillZone.timeUntilEnd || 0) / 60)}h ${(killZone.activeKillZone.timeUntilEnd || 0) % 60}m`,
      );
      if (killZone.isOptimalTradingTime) {
        analysis.push(`   ⭐ OPTIMAL TRADING WINDOW - High probability setups`);
      }
    } else {
      analysis.push(`   • No active Kill Zone`);
      analysis.push(`   • Wait for next optimal window`);
    }

    // Market Structure summary
    analysis.push(`\n📐 Market Structure:`);
    analysis.push(`   • Trend: ${structure.trend.toUpperCase()}`);
    analysis.push(`   • Structure Type: ${structure.structureType || 'NONE'}`);
    analysis.push(`   • Trading Bias: ${structure.tradingBias.toUpperCase()}`);

    // Liquidity summary
    analysis.push(`\n💧 Liquidity Zones:`);
    analysis.push(
      `   • Buy-Side Liquidity: ${liquidity.buySideLiquidity.length} zones`,
    );
    analysis.push(
      `   • Sell-Side Liquidity: ${liquidity.sellSideLiquidity.length} zones`,
    );
    if (liquidity.liquidityVoid.hasVoid) {
      analysis.push(
        `   ⚠️ LIQUIDITY VOID DETECTED - expect fast price movement`,
      );
    }

    // FVG summary
    analysis.push(`\n📊 Fair Value Gaps:`);
    analysis.push(`   • Unfilled FVGs: ${fvgs.unfilledFVGs.length}`);
    if (
      fvgs.nearestFVG &&
      fvgs.nearestFVG.low !== undefined &&
      fvgs.nearestFVG.high !== undefined
    ) {
      analysis.push(
        `   • Nearest: ${fvgs.nearestFVG.type} FVG at ${safeToFixed(fvgs.nearestFVG.low, 2)} - ${safeToFixed(fvgs.nearestFVG.high, 2)}`,
      );
    }

    // Order Block summary
    analysis.push(`\n🏛️ Order Blocks:`);
    analysis.push(`   • Active OBs: ${obs.activeOrderBlocks.length}`);
    if (
      obs.nearestOrderBlock &&
      obs.nearestOrderBlock.low !== undefined &&
      obs.nearestOrderBlock.high !== undefined
    ) {
      analysis.push(
        `   • Nearest: ${obs.nearestOrderBlock.type} OB at ${safeToFixed(obs.nearestOrderBlock.low, 2)} - ${safeToFixed(obs.nearestOrderBlock.high, 2)}`,
      );
    }

    return analysis;
  }

  /**
   * Generate trading plan
   */
  private generateTradingPlan(
    bias: string,
    primarySetup: string | null,
    entryZones: any[],
    killZone: any,
    structure: any,
    confidence: number,
  ): string[] {
    const plan: string[] = [];

    plan.push(`╔═══════════════════════════════════════════════════════════╗`);
    plan.push(`║              ICT TRADING PLAN                              ║`);
    plan.push(`╚═══════════════════════════════════════════════════════════╝`);

    plan.push(`\n🎯 Primary Setup:`);
    if (primarySetup) {
      plan.push(`   ${primarySetup}`);
    } else {
      plan.push(`   No clear setup at this time - wait for structure`);
    }

    plan.push(`\n📍 Entry Zones (Priority Order):`);
    if (entryZones.length > 0) {
      entryZones.forEach((zone, index) => {
        plan.push(`\n   ${index + 1}. ${zone.type.toUpperCase()} Entry:`);
        plan.push(`      • Direction: ${zone.direction.toUpperCase()}`);
        plan.push(
          `      • Range: ${safeToFixed(zone.range.low, 2)} - ${safeToFixed(zone.range.high, 2)}`,
        );
        plan.push(`      • Strength: ${zone.strength.toUpperCase()}`);
        plan.push(`      • ${zone.description}`);
      });
    } else {
      plan.push(`   No immediate entry zones - wait for structure to develop`);
    }

    plan.push(`\n⚡ Execution Strategy:`);
    if (killZone.isOptimalTradingTime) {
      plan.push(`   ✅ Currently in optimal Kill Zone - READY TO TRADE`);
      plan.push(`   • Look for entries at identified zones`);
      plan.push(`   • Use tight stops (high volatility)`);
      plan.push(`   • Target nearby liquidity or structure`);
    } else if (killZone.activeKillZone) {
      plan.push(`   ⚠️ In ${killZone.activeKillZone.name}`);
      plan.push(`   • Can trade but lower probability than optimal windows`);
      plan.push(`   • Be more selective with entries`);
    } else {
      plan.push(`   ⏸️ Outside Kill Zones - WAIT`);
      plan.push(`   • Mark your levels and prepare`);
      plan.push(`   • Next optimal window: Check Kill Zone analysis`);
      plan.push(`   • Do NOT force trades outside Kill Zones`);
    }

    plan.push(`\n💰 Risk Management:`);
    plan.push(`   • Position Size: Based on stop distance (max 1-2% risk)`);
    plan.push(`   • Stop Loss: Below/Above entry zone (respect the structure)`);
    plan.push(`   • Take Profit: Nearest liquidity pool or structure level`);
    plan.push(`   • Risk/Reward: Minimum 1:2, ideally 1:3 or better`);

    plan.push(`\n📊 Confidence Level: ${safeToFixed(confidence, 0)}%`);
    if (confidence >= 75) {
      plan.push(`   ✅ HIGH CONFIDENCE - Strong ICT alignment`);
    } else if (confidence >= 50) {
      plan.push(`   ⚠️ MODERATE CONFIDENCE - Be selective`);
    } else {
      plan.push(`   ❌ LOW CONFIDENCE - Wait for better setup`);
    }

    return plan;
  }
}
