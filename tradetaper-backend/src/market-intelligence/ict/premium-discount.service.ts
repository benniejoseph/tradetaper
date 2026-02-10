import { safeToFixed } from './ict-utils';
import { Injectable, Logger } from '@nestjs/common';
import { Candle } from './market-data-provider.service';

export interface PremiumDiscountAnalysis {
  symbol: string;
  currentPrice: number;
  rangeHigh: number;
  rangeLow: number;
  equilibrium: number; // 50% level
  currentZone: 'premium' | 'discount' | 'equilibrium';
  percentageInRange: number; // 0-100 (where in the range)
  fibLevels: {
    level_0: number; // Range low (100% discount)
    level_236: number;
    level_382: number;
    level_50: number; // Equilibrium
    level_618: number; // OTE level
    level_705: number; // OTE level
    level_786: number; // OTE level
    level_886: number;
    level_100: number; // Range high (100% premium)
  };
  optimalTradeEntry: {
    bullishOTE: { low: number; high: number }; // 0.618-0.786 from low
    bearishOTE: { low: number; high: number }; // 0.618-0.786 from high
  };
  currentPosition: string;
  tradingBias: 'buy_at_discount' | 'sell_at_premium' | 'wait_for_zone';
  reasoning: string[];
  timestamp: Date;
}

@Injectable()
export class PremiumDiscountService {
  private readonly logger = new Logger(PremiumDiscountService.name);

  /**
   * Analyze Premium/Discount Arrays (ICT Core Concept)
   * Premium = Upper 50% of range (expensive, look for sells)
   * Discount = Lower 50% of range (cheap, look for buys)
   * Equilibrium = 50% level (balance point)
   */
  analyzePremiumDiscount(
    symbol: string,
    priceData: Candle[],
    timeframe: string = '1D',
  ): PremiumDiscountAnalysis {
    this.logger.log(
      `Analyzing ICT Premium/Discount for ${symbol} on ${timeframe}`,
    );

    const currentPrice = priceData[priceData.length - 1].close;

    // Define range (typically last swing high to swing low)
    const { rangeHigh, rangeLow } = this.defineRange(priceData);

    // Calculate equilibrium (50% level)
    const equilibrium = (rangeHigh + rangeLow) / 2;

    // Calculate Fibonacci levels
    const fibLevels = this.calculateFibonacciLevels(rangeHigh, rangeLow);

    // Determine current zone
    const currentZone = this.determineCurrentZone(currentPrice, equilibrium);

    // Calculate percentage in range
    const percentageInRange =
      ((currentPrice - rangeLow) / (rangeHigh - rangeLow)) * 100;

    // Calculate Optimal Trade Entry zones
    const optimalTradeEntry = {
      bullishOTE: {
        low: fibLevels.level_618,
        high: fibLevels.level_786,
      },
      bearishOTE: {
        low: rangeHigh - (rangeHigh - rangeLow) * 0.786,
        high: rangeHigh - (rangeHigh - rangeLow) * 0.618,
      },
    };

    // Determine trading bias
    const { bias, reasoning } = this.determineTradingBias(
      currentPrice,
      currentZone,
      equilibrium,
      fibLevels,
      optimalTradeEntry,
      rangeHigh,
      rangeLow,
    );

    // Get current position description
    const currentPosition = this.describeCurrentPosition(
      currentPrice,
      fibLevels,
      percentageInRange,
    );

    return {
      symbol,
      currentPrice,
      rangeHigh,
      rangeLow,
      equilibrium,
      currentZone,
      percentageInRange,
      fibLevels,
      optimalTradeEntry,
      currentPosition,
      tradingBias: bias,
      reasoning,
      timestamp: new Date(),
    };
  }

  /**
   * Define trading range (swing high to swing low)
   */
  private defineRange(
    priceData: Candle[],
    lookback: number = 50,
  ): { rangeHigh: number; rangeLow: number } {
    const recentData = priceData.slice(-lookback);

    const rangeHigh = Math.max(...recentData.map((d) => d.high));
    const rangeLow = Math.min(...recentData.map((d) => d.low));

    return { rangeHigh, rangeLow };
  }

  /**
   * Calculate all Fibonacci retracement levels
   */
  private calculateFibonacciLevels(
    high: number,
    low: number,
  ): {
    level_0: number;
    level_236: number;
    level_382: number;
    level_50: number;
    level_618: number;
    level_705: number;
    level_786: number;
    level_886: number;
    level_100: number;
  } {
    const range = high - low;

    return {
      level_0: low, // 0% (full discount)
      level_236: low + range * 0.236,
      level_382: low + range * 0.382,
      level_50: low + range * 0.5, // Equilibrium
      level_618: low + range * 0.618, // OTE level
      level_705: low + range * 0.705, // OTE level
      level_786: low + range * 0.786, // OTE level
      level_886: low + range * 0.886,
      level_100: high, // 100% (full premium)
    };
  }

  /**
   * Determine if price is in premium, discount, or equilibrium
   */
  private determineCurrentZone(
    currentPrice: number,
    equilibrium: number,
  ): 'premium' | 'discount' | 'equilibrium' {
    const threshold = equilibrium * 0.02; // 2% threshold for equilibrium zone

    if (currentPrice > equilibrium + threshold) {
      return 'premium';
    } else if (currentPrice < equilibrium - threshold) {
      return 'discount';
    } else {
      return 'equilibrium';
    }
  }

  /**
   * Determine trading bias based on premium/discount position
   */
  private determineTradingBias(
    currentPrice: number,
    currentZone: string,
    equilibrium: number,
    fibLevels: PremiumDiscountAnalysis['fibLevels'],
    optimalTradeEntry: PremiumDiscountAnalysis['optimalTradeEntry'],
    rangeHigh: number,
    rangeLow: number,
  ): {
    bias: 'buy_at_discount' | 'sell_at_premium' | 'wait_for_zone';
    reasoning: string[];
  } {
    const reasoning: string[] = [];

    reasoning.push(`🎯 ICT Premium/Discount Analysis`);
    reasoning.push(
      `Current Price: ${safeToFixed(currentPrice, 2)} (${currentZone.toUpperCase()} zone)`,
    );
    reasoning.push(`Equilibrium: ${safeToFixed(equilibrium, 2)} (50% level)`);
    reasoning.push(
      `Range: ${safeToFixed(rangeLow, 2)} - ${safeToFixed(rangeHigh, 2)}`,
    );

    // Discount zone - look for LONGS
    if (currentZone === 'discount') {
      reasoning.push(`\n✅ DISCOUNT ZONE - Favorable for LONG entries`);

      // Check if in optimal trade entry (OTE) zone
      if (
        currentPrice >= optimalTradeEntry.bullishOTE.low &&
        currentPrice <= optimalTradeEntry.bullishOTE.high
      ) {
        reasoning.push(`🎯 PRICE IN BULLISH OTE ZONE (0.618-0.786)!`);
        reasoning.push(
          `   • OTE Range: ${safeToFixed(optimalTradeEntry.bullishOTE.low, 2)} - ${safeToFixed(optimalTradeEntry.bullishOTE.high, 2)}`,
        );
        reasoning.push(`   • This is a PREMIUM entry point for longs`);
        reasoning.push(`   • Wait for bullish Order Block or FVG in this zone`);
        reasoning.push(
          `   • Target: Equilibrium (${safeToFixed(equilibrium, 2)}) or Premium zone`,
        );

        return { bias: 'buy_at_discount', reasoning };
      }

      // Below OTE - wait for retracement
      if (currentPrice < optimalTradeEntry.bullishOTE.low) {
        reasoning.push(`💡 Price below OTE zone`);
        reasoning.push(
          `   • Wait for pullback to OTE (${safeToFixed(optimalTradeEntry.bullishOTE.low, 2)} - ${safeToFixed(optimalTradeEntry.bullishOTE.high, 2)})`,
        );
        reasoning.push(`   • Or look for bullish structure shift`);
      } else {
        reasoning.push(`⚠️ Price above OTE but still in discount`);
        reasoning.push(`   • Consider entries at OB/FVG levels`);
        reasoning.push(`   • Target equilibrium or higher`);
      }

      return { bias: 'buy_at_discount', reasoning };
    }

    // Premium zone - look for SHORTS
    if (currentZone === 'premium') {
      reasoning.push(`\n✅ PREMIUM ZONE - Favorable for SHORT entries`);

      // Check if in optimal trade entry (OTE) zone for shorts
      if (
        currentPrice >= optimalTradeEntry.bearishOTE.low &&
        currentPrice <= optimalTradeEntry.bearishOTE.high
      ) {
        reasoning.push(`🎯 PRICE IN BEARISH OTE ZONE (0.618-0.786 from high)!`);
        reasoning.push(
          `   • OTE Range: ${safeToFixed(optimalTradeEntry.bearishOTE.low, 2)} - ${safeToFixed(optimalTradeEntry.bearishOTE.high, 2)}`,
        );
        reasoning.push(`   • This is a PREMIUM entry point for shorts`);
        reasoning.push(`   • Wait for bearish Order Block or FVG in this zone`);
        reasoning.push(
          `   • Target: Equilibrium (${safeToFixed(equilibrium, 2)}) or Discount zone`,
        );

        return { bias: 'sell_at_premium', reasoning };
      }

      // Above OTE - wait for retracement
      if (currentPrice > optimalTradeEntry.bearishOTE.high) {
        reasoning.push(`💡 Price above bearish OTE zone`);
        reasoning.push(
          `   • Wait for pullback to OTE (${safeToFixed(optimalTradeEntry.bearishOTE.low, 2)} - ${safeToFixed(optimalTradeEntry.bearishOTE.high, 2)})`,
        );
        reasoning.push(`   • Or look for bearish structure shift`);
      } else {
        reasoning.push(`⚠️ Price below OTE but still in premium`);
        reasoning.push(`   • Consider short entries at OB/FVG levels`);
        reasoning.push(`   • Target equilibrium or lower`);
      }

      return { bias: 'sell_at_premium', reasoning };
    }

    // Equilibrium - wait for direction
    reasoning.push(`\n⚠️ EQUILIBRIUM ZONE - Wait for clear direction`);
    reasoning.push(`   • Price at balance point (50% level)`);
    reasoning.push(`   • Wait for price to move into premium or discount`);
    reasoning.push(`   • No clear edge at equilibrium`);
    reasoning.push(`\n💡 Strategy:`);
    reasoning.push(
      `   • If price moves to discount (${safeToFixed(fibLevels.level_382, 2)} or lower) → Look for LONGS`,
    );
    reasoning.push(
      `   • If price moves to premium (${safeToFixed(fibLevels.level_618, 2)} or higher) → Look for SHORTS`,
    );

    return { bias: 'wait_for_zone', reasoning };
  }

  /**
   * Describe current position relative to Fibonacci levels
   */
  private describeCurrentPosition(
    currentPrice: number,
    fibLevels: PremiumDiscountAnalysis['fibLevels'],
    percentage: number,
  ): string {
    if (currentPrice <= fibLevels.level_236) {
      return `Deep Discount (0-23.6%) - Extreme low, strong buy zone`;
    } else if (currentPrice <= fibLevels.level_382) {
      return `Discount (23.6-38.2%) - Below equilibrium, favorable for longs`;
    } else if (currentPrice <= fibLevels.level_50) {
      return `Lower Discount (38.2-50%) - Approaching equilibrium from below`;
    } else if (currentPrice <= fibLevels.level_618) {
      return `Lower Premium (50-61.8%) - Approaching equilibrium from above`;
    } else if (currentPrice <= fibLevels.level_786) {
      return `Premium (61.8-78.6%) - OTE zone for shorts`;
    } else if (currentPrice <= fibLevels.level_886) {
      return `High Premium (78.6-88.6%) - Strong sell zone`;
    } else {
      return `Extreme Premium (88.6-100%) - Extreme high, very strong sell zone`;
    }
  }

  /**
   * Get nearest Fibonacci level
   */
  getNearestFibLevel(
    currentPrice: number,
    fibLevels: PremiumDiscountAnalysis['fibLevels'],
  ): { level: string; price: number; distance: number } {
    const levels = [
      { level: '0%', price: fibLevels.level_0 },
      { level: '23.6%', price: fibLevels.level_236 },
      { level: '38.2%', price: fibLevels.level_382 },
      { level: '50%', price: fibLevels.level_50 },
      { level: '61.8%', price: fibLevels.level_618 },
      { level: '70.5%', price: fibLevels.level_705 },
      { level: '78.6%', price: fibLevels.level_786 },
      { level: '88.6%', price: fibLevels.level_886 },
      { level: '100%', price: fibLevels.level_100 },
    ];

    let nearest = levels[0];
    let minDistance = Math.abs(currentPrice - nearest.price);

    for (const lvl of levels) {
      const distance = Math.abs(currentPrice - lvl.price);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = lvl;
      }
    }

    return {
      level: nearest.level,
      price: nearest.price,
      distance: minDistance,
    };
  }
}
