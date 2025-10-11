import { safeToFixed } from './ict-utils';
import { Injectable, Logger } from '@nestjs/common';

export interface MarketStructure {
  symbol: string;
  trend: 'bullish' | 'bearish' | 'ranging';
  structureType: 'BOS' | 'CHoCH' | 'none';
  lastStructureShift: {
    type: 'BOS' | 'CHoCH';
    direction: 'bullish' | 'bearish';
    price: number;
    timestamp: Date;
    description: string;
  } | null;
  swingPoints: {
    highs: Array<{ price: number; index: number; timestamp: Date }>;
    lows: Array<{ price: number; index: number; timestamp: Date }>;
  };
  currentHigherHigh: number | null;
  currentHigherLow: number | null;
  currentLowerHigh: number | null;
  currentLowerLow: number | null;
  analysis: string[];
  tradingBias: 'long' | 'short' | 'neutral';
  timestamp: Date;
}

@Injectable()
export class MarketStructureService {
  private readonly logger = new Logger(MarketStructureService.name);

  /**
   * Analyze market structure (BOS/CHoCH)
   * BOS (Break of Structure) = continuation of trend
   * CHoCH (Change of Character) = potential trend reversal
   */
  analyzeMarketStructure(
    symbol: string,
    priceData: any[],
    timeframe: string = '1D'
  ): MarketStructure {
    this.logger.log(`Analyzing ICT market structure for ${symbol} on ${timeframe}`);

    // Identify swing points
    const swingPoints = this.identifySwingPoints(priceData);

    // Determine current trend
    const trend = this.determineTrend(swingPoints, priceData);

    // Detect structure shifts (BOS/CHoCH)
    const structureShift = this.detectStructureShift(swingPoints, priceData);

    // Find current structure levels
    const structureLevels = this.findStructureLevels(swingPoints);

    // Generate analysis
    const analysis = this.generateStructureAnalysis(
      trend,
      structureShift,
      structureLevels,
      swingPoints
    );

    // Determine trading bias
    const tradingBias = this.determineTradingBias(
      trend,
      structureShift,
      priceData
    );

    return {
      symbol,
      trend,
      structureType: structureShift.type,
      lastStructureShift: structureShift.shift,
      swingPoints,
      currentHigherHigh: structureLevels.higherHigh,
      currentHigherLow: structureLevels.higherLow,
      currentLowerHigh: structureLevels.lowerHigh,
      currentLowerLow: structureLevels.lowerLow,
      analysis,
      tradingBias,
      timestamp: new Date(),
    };
  }

  /**
   * Identify swing points (highs and lows)
   */
  private identifySwingPoints(priceData: any[]): {
    highs: Array<{ price: number; index: number; timestamp: Date }>;
    lows: Array<{ price: number; index: number; timestamp: Date }>;
  } {
    const highs: Array<{ price: number; index: number; timestamp: Date }> = [];
    const lows: Array<{ price: number; index: number; timestamp: Date }> = [];
    const lookback = 5;

    for (let i = lookback; i < priceData.length - lookback; i++) {
      // Check for swing high
      let isSwingHigh = true;
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && priceData[j].high >= priceData[i].high) {
          isSwingHigh = false;
          break;
        }
      }

      if (isSwingHigh) {
        highs.push({
          price: priceData[i].high,
          index: i,
          timestamp: new Date(priceData[i].timestamp),
        });
      }

      // Check for swing low
      let isSwingLow = true;
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && priceData[j].low <= priceData[i].low) {
          isSwingLow = false;
          break;
        }
      }

      if (isSwingLow) {
        lows.push({
          price: priceData[i].low,
          index: i,
          timestamp: new Date(priceData[i].timestamp),
        });
      }
    }

    return {
      highs: highs.slice(-10), // Last 10 swing highs
      lows: lows.slice(-10), // Last 10 swing lows
    };
  }

  /**
   * Determine current trend
   */
  private determineTrend(
    swingPoints: any,
    priceData: any[]
  ): 'bullish' | 'bearish' | 'ranging' {
    if (swingPoints.highs.length < 2 || swingPoints.lows.length < 2) {
      return 'ranging';
    }

    const recentHighs = swingPoints.highs.slice(-3);
    const recentLows = swingPoints.lows.slice(-3);

    // Check for higher highs and higher lows (bullish trend)
    let higherHighs = 0;
    let higherLows = 0;

    for (let i = 1; i < recentHighs.length; i++) {
      if (recentHighs[i].price > recentHighs[i - 1].price) higherHighs++;
    }

    for (let i = 1; i < recentLows.length; i++) {
      if (recentLows[i].price > recentLows[i - 1].price) higherLows++;
    }

    if (higherHighs >= 1 && higherLows >= 1) {
      return 'bullish';
    }

    // Check for lower highs and lower lows (bearish trend)
    let lowerHighs = 0;
    let lowerLows = 0;

    for (let i = 1; i < recentHighs.length; i++) {
      if (recentHighs[i].price < recentHighs[i - 1].price) lowerHighs++;
    }

    for (let i = 1; i < recentLows.length; i++) {
      if (recentLows[i].price < recentLows[i - 1].price) lowerLows++;
    }

    if (lowerHighs >= 1 && lowerLows >= 1) {
      return 'bearish';
    }

    return 'ranging';
  }

  /**
   * Detect structure shift (BOS or CHoCH)
   */
  private detectStructureShift(
    swingPoints: any,
    priceData: any[]
  ): {
    type: 'BOS' | 'CHoCH' | 'none';
    shift: any | null;
  } {
    if (swingPoints.highs.length < 2 || swingPoints.lows.length < 2) {
      return { type: 'none', shift: null };
    }

    const currentPrice = priceData[priceData.length - 1].close;
    const recentHighs = swingPoints.highs.slice(-3);
    const recentLows = swingPoints.lows.slice(-3);

    // Check for BOS (Break of Structure) - continuation
    // In uptrend: price breaks above recent high
    // In downtrend: price breaks below recent low

    // Check for bullish BOS
    const lastHigh = recentHighs[recentHighs.length - 1];
    if (currentPrice > lastHigh.price) {
      // Check if this is continuation or reversal
      const previousHigh = recentHighs[recentHighs.length - 2];
      if (lastHigh.price > previousHigh.price) {
        // Higher high = BOS (continuation)
        return {
          type: 'BOS',
          shift: {
            type: 'BOS',
            direction: 'bullish',
            price: lastHigh.price,
            timestamp: lastHigh.timestamp,
            description: `Bullish BOS: Price broke above ${safeToFixed(lastHigh.price, 2)} (continuation of uptrend)`,
          },
        };
      } else {
        // Lower high broken = CHoCH (reversal)
        return {
          type: 'CHoCH',
          shift: {
            type: 'CHoCH',
            direction: 'bullish',
            price: lastHigh.price,
            timestamp: lastHigh.timestamp,
            description: `Bullish CHoCH: Price broke above ${safeToFixed(lastHigh.price, 2)} (potential trend reversal)`,
          },
        };
      }
    }

    // Check for bearish BOS/CHoCH
    const lastLow = recentLows[recentLows.length - 1];
    if (currentPrice < lastLow.price) {
      const previousLow = recentLows[recentLows.length - 2];
      if (lastLow.price < previousLow.price) {
        // Lower low = BOS (continuation)
        return {
          type: 'BOS',
          shift: {
            type: 'BOS',
            direction: 'bearish',
            price: lastLow.price,
            timestamp: lastLow.timestamp,
            description: `Bearish BOS: Price broke below ${safeToFixed(lastLow.price, 2)} (continuation of downtrend)`,
          },
        };
      } else {
        // Higher low broken = CHoCH (reversal)
        return {
          type: 'CHoCH',
          shift: {
            type: 'CHoCH',
            direction: 'bearish',
            price: lastLow.price,
            timestamp: lastLow.timestamp,
            description: `Bearish CHoCH: Price broke below ${safeToFixed(lastLow.price, 2)} (potential trend reversal)`,
          },
        };
      }
    }

    return { type: 'none', shift: null };
  }

  /**
   * Find current structure levels
   */
  private findStructureLevels(swingPoints: any): {
    higherHigh: number | null;
    higherLow: number | null;
    lowerHigh: number | null;
    lowerLow: number | null;
  } {
    if (swingPoints.highs.length < 2 || swingPoints.lows.length < 2) {
      return {
        higherHigh: null,
        higherLow: null,
        lowerHigh: null,
        lowerLow: null,
      };
    }

    const recentHighs = swingPoints.highs.slice(-2);
    const recentLows = swingPoints.lows.slice(-2);

    return {
      higherHigh:
        recentHighs[1].price > recentHighs[0].price ? recentHighs[1].price : null,
      higherLow:
        recentLows[1].price > recentLows[0].price ? recentLows[1].price : null,
      lowerHigh:
        recentHighs[1].price < recentHighs[0].price ? recentHighs[1].price : null,
      lowerLow:
        recentLows[1].price < recentLows[0].price ? recentLows[1].price : null,
    };
  }

  /**
   * Generate structure analysis
   */
  private generateStructureAnalysis(
    trend: string,
    structureShift: any,
    structureLevels: any,
    swingPoints: any
  ): string[] {
    const analysis: string[] = [];

    analysis.push(`📐 ICT Market Structure Analysis`);
    analysis.push(`Current Trend: ${trend.toUpperCase()}`);

    // Structure shift info
    if (structureShift.shift) {
      analysis.push(`\n🎯 ${structureShift.shift.description}`);

      if (structureShift.type === 'BOS') {
        analysis.push(
          `   • BOS indicates CONTINUATION of ${structureShift.shift.direction} trend`
        );
        analysis.push(`   • Look for pullback entries in trend direction`);
      } else if (structureShift.type === 'CHoCH') {
        analysis.push(
          `   • CHoCH indicates potential REVERSAL to ${structureShift.shift.direction} trend`
        );
        analysis.push(`   • Wait for confirmation before entering`);
      }
    } else {
      analysis.push(`\n⏸️ No recent structure shift detected`);
    }

    // Structure levels
    analysis.push(`\n📊 Current Structure Levels:`);

    if (trend === 'bullish') {
      if (structureLevels.higherHigh) {
        analysis.push(
          `   • Higher High: ${safeToFixed(structureLevels.higherHigh, 2)} ✅`
        );
      }
      if (structureLevels.higherLow) {
        analysis.push(
          `   • Higher Low: ${safeToFixed(structureLevels.higherLow, 2)} ✅`
        );
      }
      analysis.push(`   • Bullish structure intact - look for LONG setups`);
    } else if (trend === 'bearish') {
      if (structureLevels.lowerHigh) {
        analysis.push(
          `   • Lower High: ${safeToFixed(structureLevels.lowerHigh, 2)} ✅`
        );
      }
      if (structureLevels.lowerLow) {
        analysis.push(
          `   • Lower Low: ${safeToFixed(structureLevels.lowerLow, 2)} ✅`
        );
      }
      analysis.push(`   • Bearish structure intact - look for SHORT setups`);
    } else {
      analysis.push(`   • Ranging market - wait for clear structure`);
    }

    // Swing point summary
    analysis.push(`\n🔍 Swing Points Identified:`);
    analysis.push(`   • Swing Highs: ${swingPoints.highs.length}`);
    analysis.push(`   • Swing Lows: ${swingPoints.lows.length}`);

    return analysis;
  }

  /**
   * Determine trading bias
   */
  private determineTradingBias(
    trend: string,
    structureShift: any,
    priceData: any[]
  ): 'long' | 'short' | 'neutral' {
    // If we have a recent CHoCH, bias changes
    if (structureShift.shift && structureShift.type === 'CHoCH') {
      return structureShift.shift.direction === 'bullish' ? 'long' : 'short';
    }

    // Otherwise, follow the trend
    if (trend === 'bullish') return 'long';
    if (trend === 'bearish') return 'short';
    return 'neutral';
  }
}

