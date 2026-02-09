import { safeToFixed } from './ict-utils';
import { Injectable, Logger } from '@nestjs/common';
import { LiquidityAnalysisService } from './liquidity-analysis.service';
import { MarketStructureService } from './market-structure.service';
import { FairValueGapService } from './fair-value-gap.service';
import { OrderBlockService } from './order-block.service';
import { KillZoneService } from './kill-zone.service';
import { PremiumDiscountService } from './premium-discount.service';
import { PowerOfThreeService } from './power-of-three.service';

export interface ICTAIAgentAnalysis {
  symbol: string;
  timeframe: string;
  signal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  confidence: number; // 0-100
  ictScore: number; // 0-100 (ICT concept alignment)
  reasoning: string[];
  ictNarrative: string[]; // The complete story
  primarySetup: string;
  entryZone: {
    type: 'FVG' | 'OrderBlock' | 'PremiumDiscount' | 'Liquidity';
    price: number;
    range: { low: number; high: number };
    description: string;
  } | null;
  stopLoss: {
    price: number;
    reasoning: string;
  };
  takeProfit: Array<{
    level: number;
    target: number;
    reasoning: string;
  }>;
  riskReward: number;
  killZoneStatus: {
    isOptimal: boolean;
    recommendation: string;
  };
  powerOfThreePhase: string;
  timestamp: Date;
}

@Injectable()
export class ICTAIAgentService {
  private readonly logger = new Logger(ICTAIAgentService.name);

  constructor(
    private readonly liquidityAnalysis: LiquidityAnalysisService,
    private readonly marketStructure: MarketStructureService,
    private readonly fairValueGap: FairValueGapService,
    private readonly orderBlock: OrderBlockService,
    private readonly killZone: KillZoneService,
    private readonly premiumDiscount: PremiumDiscountService,
    private readonly powerOfThree: PowerOfThreeService,
  ) {}

  /**
   * ICT AI Agent - Analyzes using ONLY ICT concepts
   * This replaces generic technical analysis with pure ICT methodology
   */
  async analyze(
    symbol: string,
    priceData: any[],
    timeframe: string = '1D',
  ): Promise<ICTAIAgentAnalysis> {
    this.logger.log(
      `ICT AI Agent analyzing ${symbol} on ${timeframe} using PURE ICT concepts`,
    );

    if (!priceData || priceData.length === 0) {
      throw new Error('Price data is empty');
    }

    const lastCandle = priceData[priceData.length - 1];
    if (!lastCandle || lastCandle.close === undefined) {
      throw new Error('Invalid price data: missing close price');
    }

    const currentPrice = lastCandle.close;

    // Run all ICT analyses
    const [
      liquidity,
      structure,
      fvgs,
      obs,
      killZoneAnalysis,
      premiumDiscount,
      powerOfThree,
    ] = await Promise.all([
      Promise.resolve(
        this.liquidityAnalysis.analyzeLiquidity(symbol, priceData, timeframe),
      ),
      Promise.resolve(
        this.marketStructure.analyzeMarketStructure(
          symbol,
          priceData,
          timeframe,
        ),
      ),
      Promise.resolve(
        this.fairValueGap.identifyFairValueGaps(symbol, priceData, timeframe),
      ),
      Promise.resolve(
        this.orderBlock.identifyOrderBlocks(symbol, priceData, timeframe),
      ),
      Promise.resolve(this.killZone.analyzeKillZones()),
      Promise.resolve(
        this.premiumDiscount.analyzePremiumDiscount(
          symbol,
          priceData,
          timeframe,
        ),
      ),
      Promise.resolve(
        this.powerOfThree.analyzePowerOfThree(symbol, priceData, timeframe),
      ),
    ]);

    // Calculate ICT Score (concept alignment)
    const ictScore = this.calculateICTScore(
      structure,
      premiumDiscount,
      fvgs,
      obs,
      liquidity,
      killZoneAnalysis,
      powerOfThree,
    );

    // Build ICT Narrative (the story)
    const ictNarrative = this.buildICTNarrative(
      structure,
      premiumDiscount,
      fvgs,
      obs,
      liquidity,
      powerOfThree,
      currentPrice,
    );

    // Determine signal based on ICT concepts
    const { signal, confidence } = this.determineICTSignal(
      structure,
      premiumDiscount,
      fvgs,
      obs,
      liquidity,
      killZoneAnalysis,
      powerOfThree,
      ictScore,
    );

    // Identify primary setup
    const primarySetup = this.identifyPrimarySetup(
      structure,
      premiumDiscount,
      fvgs,
      obs,
      powerOfThree,
    );

    // Identify entry zone
    const entryZone = this.identifyEntryZone(
      premiumDiscount,
      fvgs,
      obs,
      signal,
      currentPrice,
    );

    // Calculate stop loss
    const stopLoss = this.calculateStopLoss(entryZone, obs, fvgs, signal);

    // Calculate take profit levels
    const takeProfit = this.calculateTakeProfitLevels(
      entryZone,
      premiumDiscount,
      liquidity,
      signal,
    );

    // Calculate risk/reward
    const riskReward = this.calculateRiskReward(
      entryZone,
      stopLoss,
      takeProfit,
    );

    // Generate reasoning
    const reasoning = this.generateReasoning(
      signal,
      primarySetup,
      ictScore,
      confidence,
      structure,
      premiumDiscount,
      powerOfThree,
    );

    return {
      symbol,
      timeframe,
      signal,
      confidence,
      ictScore,
      reasoning,
      ictNarrative,
      primarySetup,
      entryZone,
      stopLoss,
      takeProfit,
      riskReward,
      killZoneStatus: {
        isOptimal: killZoneAnalysis.isOptimalTradingTime,
        recommendation:
          killZoneAnalysis.activeKillZone?.name || 'Outside Kill Zones',
      },
      powerOfThreePhase: powerOfThree.currentPhase,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate ICT Score (how well concepts align)
   */
  private calculateICTScore(
    structure: any,
    premiumDiscount: any,
    fvgs: any,
    obs: any,
    liquidity: any,
    killZone: any,
    powerOfThree: any,
  ): number {
    let score = 0;

    // Market structure clarity (20 points)
    if (structure.structureType === 'BOS') score += 15;
    if (structure.structureType === 'CHoCH') score += 10;
    if (structure.trend !== 'ranging') score += 5;

    // Premium/Discount alignment (20 points)
    if (
      premiumDiscount.currentZone === 'premium' ||
      premiumDiscount.currentZone === 'discount'
    ) {
      score += 15;
    }
    if (premiumDiscount.tradingBias !== 'wait_for_zone') score += 5;

    // FVG presence (15 points)
    score += Math.min(15, fvgs.unfilledFVGs.length * 3);

    // Order Block presence (15 points)
    score += Math.min(15, obs.activeOrderBlocks.length * 4);

    // Liquidity zones (10 points)
    const totalLiquidity =
      liquidity.buySideLiquidity.length + liquidity.sellSideLiquidity.length;
    score += Math.min(10, totalLiquidity * 2);

    // Kill Zone timing (10 points)
    if (killZone.isOptimalTradingTime) score += 10;
    else if (killZone.activeKillZone) score += 5;

    // Power of Three phase (10 points)
    if (powerOfThree.currentPhase === 'manipulation') score += 10;
    else if (powerOfThree.currentPhase === 'distribution') score += 7;

    return Math.min(100, score);
  }

  /**
   * Build ICT Narrative (tell the story)
   */
  private buildICTNarrative(
    structure: any,
    premiumDiscount: any,
    fvgs: any,
    obs: any,
    liquidity: any,
    powerOfThree: any,
    currentPrice: number,
  ): string[] {
    const narrative: string[] = [];

    narrative.push(
      `╔═══════════════════════════════════════════════════════════╗`,
    );
    narrative.push(
      `║          ICT AI AGENT - THE INSTITUTIONAL STORY           ║`,
    );
    narrative.push(
      `╚═══════════════════════════════════════════════════════════╝`,
    );

    // Power of Three context
    narrative.push(`\n📖 THE ICT NARRATIVE:`);
    narrative.push(
      `\n1️⃣ POWER OF THREE - ${powerOfThree.currentPhase.toUpperCase()} PHASE`,
    );
    narrative.push(`   ${powerOfThree.phaseDescription}`);

    // Market Structure
    narrative.push(
      `\n2️⃣ MARKET STRUCTURE - ${structure.trend.toUpperCase()} TREND`,
    );
    if (structure.structureType) {
      narrative.push(
        `   Last Structure Shift: ${structure.lastStructureShift?.description || 'None'}`,
      );
    }
    narrative.push(`   Trading Bias: ${structure.tradingBias.toUpperCase()}`);

    // Premium/Discount
    narrative.push(
      `\n3️⃣ PREMIUM/DISCOUNT - ${premiumDiscount.currentZone.toUpperCase()} ZONE`,
    );
    narrative.push(`   Current Price: ${safeToFixed(currentPrice, 2)}`);
    narrative.push(
      `   Equilibrium: ${safeToFixed(premiumDiscount.equilibrium, 2)}`,
    );
    narrative.push(`   Position: ${premiumDiscount.currentPosition}`);

    // Liquidity
    narrative.push(`\n4️⃣ LIQUIDITY POOLS:`);
    if (liquidity.nearestLiquidity.above) {
      narrative.push(
        `   Buy-side Target: ${safeToFixed(liquidity.nearestLiquidity.above.price, 2)}`,
      );
    }
    if (liquidity.nearestLiquidity.below) {
      narrative.push(
        `   Sell-side Target: ${safeToFixed(liquidity.nearestLiquidity.below.price, 2)}`,
      );
    }

    // Entry Zones
    narrative.push(`\n5️⃣ PREMIUM ENTRY ZONES:`);
    if (fvgs.nearestFVG) {
      narrative.push(
        `   FVG: ${fvgs.nearestFVG.type} at ${safeToFixed(fvgs.nearestFVG.low, 2)} - ${safeToFixed(fvgs.nearestFVG.high, 2)}`,
      );
    }
    if (obs.nearestOrderBlock) {
      narrative.push(
        `   Order Block: ${obs.nearestOrderBlock.type} at ${safeToFixed(obs.nearestOrderBlock.low, 2)} - ${safeToFixed(obs.nearestOrderBlock.high, 2)}`,
      );
    }

    // The Story
    narrative.push(`\n🎯 THE INSTITUTIONAL GAME PLAN:`);
    narrative.push(powerOfThree.expectedNextMove);

    return narrative;
  }

  /**
   * Determine ICT-based signal
   */
  private determineICTSignal(
    structure: any,
    premiumDiscount: any,
    fvgs: any,
    obs: any,
    liquidity: any,
    killZone: any,
    powerOfThree: any,
    ictScore: number,
  ): {
    signal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
    confidence: number;
  } {
    let bullishPoints = 0;
    let bearishPoints = 0;

    // Market Structure
    if (structure.trend === 'bullish') bullishPoints += 2;
    if (structure.trend === 'bearish') bearishPoints += 2;
    if (structure.tradingBias === 'long') bullishPoints += 1;
    if (structure.tradingBias === 'short') bearishPoints += 1;

    // Premium/Discount (KEY!)
    if (premiumDiscount.currentZone === 'discount') bullishPoints += 3;
    if (premiumDiscount.currentZone === 'premium') bearishPoints += 3;

    // Power of Three
    if (powerOfThree.currentPhase === 'manipulation') {
      // After liquidity sweep, go opposite direction
      // This is complex, simplify to: manipulation = high probability setup
      bullishPoints += 1;
      bearishPoints += 1; // Could go either way
    }
    if (powerOfThree.currentPhase === 'distribution') {
      if (structure.trend === 'bullish') bullishPoints += 2;
      if (structure.trend === 'bearish') bearishPoints += 2;
    }

    // Kill Zone boost
    if (killZone.isOptimalTradingTime) {
      bullishPoints += 1;
      bearishPoints += 1; // Boosts both
    }

    // Determine signal
    let signal: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
    let baseConfidence = ictScore * 0.7;

    if (bullishPoints >= bearishPoints + 3) {
      signal = 'strong_buy';
      baseConfidence += 15;
    } else if (bullishPoints > bearishPoints) {
      signal = 'buy';
      baseConfidence += 10;
    } else if (bearishPoints >= bullishPoints + 3) {
      signal = 'strong_sell';
      baseConfidence += 15;
    } else if (bearishPoints > bullishPoints) {
      signal = 'sell';
      baseConfidence += 10;
    } else {
      signal = 'neutral';
    }

    const confidence = Math.min(95, Math.max(30, baseConfidence));

    return { signal, confidence };
  }

  /**
   * Identify primary ICT setup
   */
  private identifyPrimarySetup(
    structure: any,
    premiumDiscount: any,
    fvgs: any,
    obs: any,
    powerOfThree: any,
  ): string {
    // Power of Three drives the setup
    if (powerOfThree.currentPhase === 'manipulation') {
      return `MANIPULATION PHASE ENTRY - Liquidity swept, reversal expected. Entry at ${obs.nearestOrderBlock ? 'Order Block' : fvgs.nearestFVG ? 'FVG' : 'structure'}`;
    }

    if (powerOfThree.currentPhase === 'distribution') {
      return `DISTRIBUTION PHASE - Follow institutional flow ${structure.trend} with pullback entries`;
    }

    // Premium/Discount setups
    if (
      premiumDiscount.currentZone === 'discount' &&
      structure.trend === 'bullish'
    ) {
      return `DISCOUNT ZONE LONG - Buy at ${obs.nearestOrderBlock?.type === 'bullish' ? 'Bullish OB' : fvgs.nearestFVG?.type === 'bullish' ? 'Bullish FVG' : 'discount level'}`;
    }

    if (
      premiumDiscount.currentZone === 'premium' &&
      structure.trend === 'bearish'
    ) {
      return `PREMIUM ZONE SHORT - Sell at ${obs.nearestOrderBlock?.type === 'bearish' ? 'Bearish OB' : fvgs.nearestFVG?.type === 'bearish' ? 'Bearish FVG' : 'premium level'}`;
    }

    return `Wait for clear ICT setup`;
  }

  /**
   * Identify entry zone
   */
  private identifyEntryZone(
    premiumDiscount: any,
    fvgs: any,
    obs: any,
    signal: string,
    currentPrice: number,
  ): any {
    // Priority: Order Block > FVG > Premium/Discount level
    const isBullish = signal.includes('buy');

    // Order Block entry
    if (
      obs.nearestOrderBlock &&
      obs.nearestOrderBlock.type === (isBullish ? 'bullish' : 'bearish')
    ) {
      return {
        type: 'OrderBlock',
        price: (obs.nearestOrderBlock.high + obs.nearestOrderBlock.low) / 2,
        range: {
          low: obs.nearestOrderBlock.low,
          high: obs.nearestOrderBlock.high,
        },
        description: `${obs.nearestOrderBlock.type} Order Block at ${safeToFixed(obs.nearestOrderBlock.low, 2)} - ${safeToFixed(obs.nearestOrderBlock.high, 2)}`,
      };
    }

    // FVG entry
    if (
      fvgs.nearestFVG &&
      fvgs.nearestFVG.type === (isBullish ? 'bullish' : 'bearish')
    ) {
      return {
        type: 'FVG',
        price: (fvgs.nearestFVG.high + fvgs.nearestFVG.low) / 2,
        range: {
          low: fvgs.nearestFVG.low,
          high: fvgs.nearestFVG.high,
        },
        description: `${fvgs.nearestFVG.type} Fair Value Gap at ${safeToFixed(fvgs.nearestFVG.low, 2)} - ${safeToFixed(fvgs.nearestFVG.high, 2)}`,
      };
    }

    // Premium/Discount entry
    if (isBullish && premiumDiscount.optimalTradeEntry.bullishOTE) {
      return {
        type: 'PremiumDiscount',
        price:
          (premiumDiscount.optimalTradeEntry.bullishOTE.high +
            premiumDiscount.optimalTradeEntry.bullishOTE.low) /
          2,
        range: premiumDiscount.optimalTradeEntry.bullishOTE,
        description: `Bullish OTE (Optimal Trade Entry) at ${safeToFixed(premiumDiscount.optimalTradeEntry.bullishOTE.low, 2)} - ${safeToFixed(premiumDiscount.optimalTradeEntry.bullishOTE.high, 2)}`,
      };
    }

    if (!isBullish && premiumDiscount.optimalTradeEntry.bearishOTE) {
      return {
        type: 'PremiumDiscount',
        price:
          (premiumDiscount.optimalTradeEntry.bearishOTE.high +
            premiumDiscount.optimalTradeEntry.bearishOTE.low) /
          2,
        range: premiumDiscount.optimalTradeEntry.bearishOTE,
        description: `Bearish OTE (Optimal Trade Entry) at ${safeToFixed(premiumDiscount.optimalTradeEntry.bearishOTE.low, 2)} - ${safeToFixed(premiumDiscount.optimalTradeEntry.bearishOTE.high, 2)}`,
      };
    }

    return null;
  }

  /**
   * Calculate stop loss
   */
  private calculateStopLoss(
    entryZone: any,
    obs: any,
    fvgs: any,
    signal: string,
  ): any {
    if (!entryZone) {
      return { price: 0, reasoning: 'No entry zone identified' };
    }

    const isBullish = signal.includes('buy');

    // Stop below/above entry zone
    const stopPrice = isBullish
      ? entryZone.range.low * 0.998 // 0.2% below
      : entryZone.range.high * 1.002; // 0.2% above

    const reasoning = isBullish
      ? `Stop below ${entryZone.type} at ${safeToFixed(stopPrice, 2)} (invalidation level)`
      : `Stop above ${entryZone.type} at ${safeToFixed(stopPrice, 2)} (invalidation level)`;

    return { price: stopPrice, reasoning };
  }

  /**
   * Calculate take profit levels
   */
  private calculateTakeProfitLevels(
    entryZone: any,
    premiumDiscount: any,
    liquidity: any,
    signal: string,
  ): any[] {
    if (!entryZone) return [];

    const targets: any[] = [];
    const isBullish = signal.includes('buy');

    // TP1: Equilibrium
    targets.push({
      level: 1,
      target: premiumDiscount.equilibrium,
      reasoning: `Equilibrium (50% level) at ${safeToFixed(premiumDiscount.equilibrium, 2)}`,
    });

    // TP2: Opposite premium/discount zone or liquidity
    if (isBullish && liquidity.nearestLiquidity.above) {
      targets.push({
        level: 2,
        target: liquidity.nearestLiquidity.above.price,
        reasoning: `Buy-side liquidity at ${safeToFixed(liquidity.nearestLiquidity.above.price, 2)}`,
      });
    }

    if (!isBullish && liquidity.nearestLiquidity.below) {
      targets.push({
        level: 2,
        target: liquidity.nearestLiquidity.below.price,
        reasoning: `Sell-side liquidity at ${safeToFixed(liquidity.nearestLiquidity.below.price, 2)}`,
      });
    }

    return targets;
  }

  /**
   * Calculate risk/reward
   */
  private calculateRiskReward(
    entryZone: any,
    stopLoss: any,
    takeProfit: any[],
  ): number {
    if (!entryZone || !stopLoss.price || takeProfit.length === 0) return 0;

    const risk = Math.abs(entryZone.price - stopLoss.price);
    const reward = Math.abs(takeProfit[0].target - entryZone.price);

    return reward / risk;
  }

  /**
   * Generate reasoning
   */
  private generateReasoning(
    signal: string,
    setup: string,
    ictScore: number,
    confidence: number,
    structure: any,
    premiumDiscount: any,
    powerOfThree: any,
  ): string[] {
    const reasoning: string[] = [];

    reasoning.push(`🎯 ICT AI AGENT DECISION: ${signal.toUpperCase()}`);
    reasoning.push(`ICT Score: ${ictScore}/100`);
    reasoning.push(`Confidence: ${confidence}%`);
    reasoning.push(`\n📍 Primary Setup: ${setup}`);

    reasoning.push(`\n🔍 ICT Concept Alignment:`);
    reasoning.push(
      `   • Market Structure: ${structure.trend} (${structure.tradingBias})`,
    );
    reasoning.push(`   • Premium/Discount: ${premiumDiscount.currentZone}`);
    reasoning.push(`   • Power of Three: ${powerOfThree.currentPhase}`);

    if (confidence >= 75) {
      reasoning.push(`\n✅ HIGH CONFIDENCE - Strong ICT alignment`);
    } else if (confidence >= 50) {
      reasoning.push(`\n⚠️ MODERATE CONFIDENCE - Acceptable setup`);
    } else {
      reasoning.push(`\n❌ LOW CONFIDENCE - Wait for better alignment`);
    }

    return reasoning;
  }
}
