import { safeToFixed } from './ict-utils';
import { Injectable, Logger } from '@nestjs/common';

export interface FairValueGap {
  type: 'bullish' | 'bearish';
  high: number;
  low: number;
  size: number; // pip size of gap
  timestamp: Date;
  index: number;
  filled: boolean;
  partiallyFilled: boolean;
  fillPercentage: number;
  strength: 'strong' | 'moderate' | 'weak';
  description: string;
}

export interface FVGAnalysis {
  symbol: string;
  totalFVGs: number;
  bullishFVGs: FairValueGap[];
  bearishFVGs: FairValueGap[];
  unfilledFVGs: FairValueGap[];
  nearestFVG: FairValueGap | null;
  currentPrice: number;
  analysis: string[];
  tradingOpportunities: string[];
  timestamp: Date;
}

@Injectable()
export class FairValueGapService {
  private readonly logger = new Logger(FairValueGapService.name);

  /**
   * Identify Fair Value Gaps (FVGs)
   * FVG = 3-candle pattern with gap between candle 1 and candle 3
   * Bullish FVG: gap up (unfilled space where price moved up quickly)
   * Bearish FVG: gap down (unfilled space where price moved down quickly)
   */
  identifyFairValueGaps(
    symbol: string,
    priceData: any[],
    timeframe: string = '1D',
  ): FVGAnalysis {
    this.logger.log(
      `Identifying ICT Fair Value Gaps for ${symbol} on ${timeframe}`,
    );

    const bullishFVGs: FairValueGap[] = [];
    const bearishFVGs: FairValueGap[] = [];

    // Scan for 3-candle FVG patterns
    for (let i = 2; i < priceData.length; i++) {
      const candle1 = priceData[i - 2];
      const candle2 = priceData[i - 1];
      const candle3 = priceData[i];

      // Check for Bullish FVG
      // Gap between candle1 high and candle3 low
      if (candle1.high < candle3.low) {
        const fvg: FairValueGap = {
          type: 'bullish',
          high: candle3.low,
          low: candle1.high,
          size: candle3.low - candle1.high,
          timestamp: new Date(candle2.timestamp),
          index: i - 1,
          filled: false,
          partiallyFilled: false,
          fillPercentage: 0,
          strength: this.calculateFVGStrength(candle1, candle2, candle3),
          description: `Bullish FVG at ${safeToFixed(candle1.high, 2)} - ${safeToFixed(candle3.low, 2)}`,
        };

        // Check if FVG has been filled by subsequent price action
        this.checkFVGFill(fvg, priceData, i);
        bullishFVGs.push(fvg);
      }

      // Check for Bearish FVG
      // Gap between candle1 low and candle3 high
      if (candle1.low > candle3.high) {
        const fvg: FairValueGap = {
          type: 'bearish',
          high: candle1.low,
          low: candle3.high,
          size: candle1.low - candle3.high,
          timestamp: new Date(candle2.timestamp),
          index: i - 1,
          filled: false,
          partiallyFilled: false,
          fillPercentage: 0,
          strength: this.calculateFVGStrength(candle1, candle2, candle3),
          description: `Bearish FVG at ${safeToFixed(candle3.high, 2)} - ${safeToFixed(candle1.low, 2)}`,
        };

        this.checkFVGFill(fvg, priceData, i);
        bearishFVGs.push(fvg);
      }
    }

    // Find unfilled FVGs (prime trading opportunities)
    const unfilledFVGs = [...bullishFVGs, ...bearishFVGs].filter(
      (fvg) => !fvg.filled && fvg.fillPercentage < 50,
    );

    // Find nearest FVG to current price
    const currentPrice = priceData[priceData.length - 1].close;
    const nearestFVG = this.findNearestFVG(unfilledFVGs, currentPrice);

    // Generate analysis
    const analysis = this.generateFVGAnalysis(
      bullishFVGs,
      bearishFVGs,
      unfilledFVGs,
      nearestFVG,
      currentPrice,
    );

    // Generate trading opportunities
    const tradingOpportunities = this.generateTradingOpportunities(
      unfilledFVGs,
      nearestFVG,
      currentPrice,
    );

    return {
      symbol,
      totalFVGs: bullishFVGs.length + bearishFVGs.length,
      bullishFVGs,
      bearishFVGs,
      unfilledFVGs,
      nearestFVG,
      currentPrice,
      analysis,
      tradingOpportunities,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate FVG strength based on candle characteristics
   */
  private calculateFVGStrength(
    candle1: any,
    candle2: any,
    candle3: any,
  ): 'strong' | 'moderate' | 'weak' {
    // Strong FVG characteristics:
    // 1. Large middle candle (strong momentum)
    // 2. Small wicks on candle 2
    // 3. Large gap size

    const candle2Body = Math.abs(candle2.close - candle2.open);
    const candle2Range = candle2.high - candle2.low;
    const bodyToRangeRatio = candle2Body / candle2Range;

    const gapSize =
      candle1.high < candle3.low
        ? candle3.low - candle1.high
        : candle1.low - candle3.high;

    const avgCandleSize =
      (candle1.high -
        candle1.low +
        (candle2.high - candle2.low) +
        (candle3.high - candle3.low)) /
      3;

    const gapToAvgRatio = gapSize / avgCandleSize;

    // Strong: Big candle 2, small wicks, large gap
    if (bodyToRangeRatio > 0.7 && gapToAvgRatio > 0.5) {
      return 'strong';
    }

    // Weak: Small candle 2, large wicks, small gap
    if (bodyToRangeRatio < 0.3 || gapToAvgRatio < 0.2) {
      return 'weak';
    }

    return 'moderate';
  }

  /**
   * Check if FVG has been filled by subsequent price action
   */
  private checkFVGFill(
    fvg: FairValueGap,
    priceData: any[],
    startIndex: number,
  ): void {
    for (let i = startIndex; i < priceData.length; i++) {
      const candle = priceData[i];

      if (fvg.type === 'bullish') {
        // Check if price came back down into the FVG
        if (candle.low <= fvg.high) {
          const fillAmount = Math.min(candle.low, fvg.high) - fvg.low;
          fvg.fillPercentage = (fillAmount / fvg.size) * 100;

          if (candle.low <= fvg.low) {
            fvg.filled = true;
          } else {
            fvg.partiallyFilled = true;
          }
        }
      } else {
        // Bearish FVG
        if (candle.high >= fvg.low) {
          const fillAmount = fvg.high - Math.max(candle.high, fvg.low);
          fvg.fillPercentage = (fillAmount / fvg.size) * 100;

          if (candle.high >= fvg.high) {
            fvg.filled = true;
          } else {
            fvg.partiallyFilled = true;
          }
        }
      }

      if (fvg.filled) break;
    }
  }

  /**
   * Find nearest unfilled FVG to current price
   */
  private findNearestFVG(
    unfilledFVGs: FairValueGap[],
    currentPrice: number,
  ): FairValueGap | null {
    if (unfilledFVGs.length === 0) return null;

    let nearest: FairValueGap | null = null;
    let minDistance = Infinity;

    for (const fvg of unfilledFVGs) {
      const fvgMidpoint = (fvg.high + fvg.low) / 2;
      const distance = Math.abs(currentPrice - fvgMidpoint);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = fvg;
      }
    }

    return nearest;
  }

  /**
   * Generate FVG analysis
   */
  private generateFVGAnalysis(
    bullishFVGs: FairValueGap[],
    bearishFVGs: FairValueGap[],
    unfilledFVGs: FairValueGap[],
    nearestFVG: FairValueGap | null,
    currentPrice: number,
  ): string[] {
    const analysis: string[] = [];

    analysis.push(`📊 ICT Fair Value Gap (FVG) Analysis`);
    analysis.push(
      `Total FVGs Identified: ${bullishFVGs.length + bearishFVGs.length}`,
    );
    analysis.push(`   • Bullish FVGs: ${bullishFVGs.length}`);
    analysis.push(`   • Bearish FVGs: ${bearishFVGs.length}`);
    analysis.push(`   • Unfilled FVGs: ${unfilledFVGs.length} ⭐`);

    if (nearestFVG) {
      const distance = Math.abs(
        currentPrice - (nearestFVG.high + nearestFVG.low) / 2,
      );
      const distancePercent = (distance / currentPrice) * 100;

      analysis.push(`\n🎯 Nearest Unfilled FVG:`);
      analysis.push(`   Type: ${nearestFVG.type.toUpperCase()}`);
      analysis.push(
        `   Range: ${safeToFixed(nearestFVG.low, 2)} - ${safeToFixed(nearestFVG.high, 2)}`,
      );
      analysis.push(`   Size: ${safeToFixed(nearestFVG.size, 4)}`);
      analysis.push(`   Strength: ${nearestFVG.strength.toUpperCase()}`);
      analysis.push(
        `   Distance: ${safeToFixed(distancePercent, 2)}% from current price`,
      );
      analysis.push(
        `   Fill Status: ${safeToFixed(nearestFVG.fillPercentage, 1)}% filled`,
      );
    }

    // Strong unfilled FVGs
    const strongUnfilledFVGs = unfilledFVGs.filter(
      (fvg) => fvg.strength === 'strong',
    );
    if (strongUnfilledFVGs.length > 0) {
      analysis.push(
        `\n⚡ ${strongUnfilledFVGs.length} STRONG unfilled FVGs detected`,
      );
      analysis.push(`   These are HIGH-PROBABILITY retracement targets`);
    }

    return analysis;
  }

  /**
   * Generate trading opportunities based on FVGs
   */
  private generateTradingOpportunities(
    unfilledFVGs: FairValueGap[],
    nearestFVG: FairValueGap | null,
    currentPrice: number,
  ): string[] {
    const opportunities: string[] = [];

    if (!nearestFVG) {
      opportunities.push('⏸️ No immediate FVG trading opportunities');
      return opportunities;
    }

    const fvgMidpoint = (nearestFVG.high + nearestFVG.low) / 2;

    if (nearestFVG.type === 'bullish') {
      if (currentPrice > nearestFVG.high) {
        // Price above bullish FVG - expect pullback
        opportunities.push(`📉 RETRACEMENT OPPORTUNITY:`);
        opportunities.push(
          `   • Bullish FVG below at ${safeToFixed(nearestFVG.low, 2)} - ${safeToFixed(nearestFVG.high, 2)}`,
        );
        opportunities.push(`   • Expect price to retrace into FVG`);
        opportunities.push(
          `   • Strategy: Wait for price to enter FVG (${safeToFixed(nearestFVG.low, 2)})`,
        );
        opportunities.push(
          `   • Entry: FVG midpoint ~${safeToFixed(fvgMidpoint, 2)}`,
        );
        opportunities.push(
          `   • Stop Loss: Below FVG at ${safeToFixed(nearestFVG.low * 0.999, 2)}`,
        );
        opportunities.push(`   • Target: Recent high or next resistance level`);

        if (nearestFVG.strength === 'strong') {
          opportunities.push(`   ⭐ STRONG FVG - High probability setup`);
        }
      } else if (
        currentPrice >= nearestFVG.low &&
        currentPrice <= nearestFVG.high
      ) {
        // Price currently in bullish FVG
        opportunities.push(`🎯 PRICE IN BULLISH FVG - ENTRY ZONE!`);
        opportunities.push(
          `   • Current price: ${safeToFixed(currentPrice, 2)}`,
        );
        opportunities.push(
          `   • FVG range: ${safeToFixed(nearestFVG.low, 2)} - ${safeToFixed(nearestFVG.high, 2)}`,
        );
        opportunities.push(`   • Action: Consider LONG entry`);
        opportunities.push(
          `   • Stop Loss: Below FVG at ${safeToFixed(nearestFVG.low * 0.999, 2)}`,
        );
        opportunities.push(`   • Target: Recent swing high`);
      }
    } else {
      // Bearish FVG
      if (currentPrice < nearestFVG.low) {
        // Price below bearish FVG - expect rally
        opportunities.push(`📈 RETRACEMENT OPPORTUNITY:`);
        opportunities.push(
          `   • Bearish FVG above at ${safeToFixed(nearestFVG.low, 2)} - ${safeToFixed(nearestFVG.high, 2)}`,
        );
        opportunities.push(`   • Expect price to retrace into FVG`);
        opportunities.push(
          `   • Strategy: Wait for price to enter FVG (${safeToFixed(nearestFVG.high, 2)})`,
        );
        opportunities.push(
          `   • Entry: FVG midpoint ~${safeToFixed(fvgMidpoint, 2)}`,
        );
        opportunities.push(
          `   • Stop Loss: Above FVG at ${safeToFixed(nearestFVG.high * 1.001, 2)}`,
        );
        opportunities.push(`   • Target: Recent low or next support level`);

        if (nearestFVG.strength === 'strong') {
          opportunities.push(`   ⭐ STRONG FVG - High probability setup`);
        }
      } else if (
        currentPrice >= nearestFVG.low &&
        currentPrice <= nearestFVG.high
      ) {
        // Price currently in bearish FVG
        opportunities.push(`🎯 PRICE IN BEARISH FVG - ENTRY ZONE!`);
        opportunities.push(
          `   • Current price: ${safeToFixed(currentPrice, 2)}`,
        );
        opportunities.push(
          `   • FVG range: ${safeToFixed(nearestFVG.low, 2)} - ${safeToFixed(nearestFVG.high, 2)}`,
        );
        opportunities.push(`   • Action: Consider SHORT entry`);
        opportunities.push(
          `   • Stop Loss: Above FVG at ${safeToFixed(nearestFVG.high * 1.001, 2)}`,
        );
        opportunities.push(`   • Target: Recent swing low`);
      }
    }

    // Count other nearby FVGs
    const nearbyFVGs = unfilledFVGs.filter((fvg) => {
      const distance = Math.abs(currentPrice - (fvg.high + fvg.low) / 2);
      const distancePercent = (distance / currentPrice) * 100;
      return distancePercent < 5 && fvg !== nearestFVG; // Within 5%
    });

    if (nearbyFVGs.length > 0) {
      opportunities.push(
        `\n📍 ${nearbyFVGs.length} additional FVGs within 5% of current price`,
      );
    }

    return opportunities;
  }
}
