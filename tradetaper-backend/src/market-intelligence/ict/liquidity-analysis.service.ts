import { safeToFixed } from './ict-utils';
import { Injectable, Logger } from '@nestjs/common';

export interface LiquidityZone {
  type: 'buy_side' | 'sell_side';
  price: number;
  strength: 'high' | 'medium' | 'low';
  timeframe: string;
  description: string;
  touched: boolean;
  sweptAt?: Date;
}

export interface LiquidityPool {
  symbol: string;
  buySideLiquidity: LiquidityZone[];
  sellSideLiquidity: LiquidityZone[];
  nearestLiquidity: {
    above: LiquidityZone | null;
    below: LiquidityZone | null;
  };
  liquidityVoid: {
    hasVoid: boolean;
    range?: { high: number; low: number };
  };
  analysis: string[];
  timestamp: Date;
}

@Injectable()
export class LiquidityAnalysisService {
  private readonly logger = new Logger(LiquidityAnalysisService.name);

  /**
   * Analyze liquidity zones (ICT Core Concept)
   * Buy-side liquidity = stops above swing highs
   * Sell-side liquidity = stops below swing lows
   */
  analyzeLiquidity(
    symbol: string,
    priceData: any[],
    timeframe: string = '1D'
  ): LiquidityPool {
    this.logger.log(`Analyzing ICT liquidity for ${symbol} on ${timeframe}`);

    const buySideLiquidity = this.identifyBuySideLiquidity(priceData);
    const sellSideLiquidity = this.identifySellSideLiquidity(priceData);
    const currentPrice = priceData[priceData.length - 1].close;

    // Find nearest liquidity zones
    const nearestAbove = this.findNearestLiquidityAbove(
      buySideLiquidity,
      currentPrice
    );
    const nearestBelow = this.findNearestLiquidityBelow(
      sellSideLiquidity,
      currentPrice
    );

    // Detect liquidity voids
    const liquidityVoid = this.detectLiquidityVoid(priceData);

    // Generate analysis
    const analysis = this.generateLiquidityAnalysis(
      buySideLiquidity,
      sellSideLiquidity,
      nearestAbove,
      nearestBelow,
      liquidityVoid,
      currentPrice
    );

    return {
      symbol,
      buySideLiquidity,
      sellSideLiquidity,
      nearestLiquidity: {
        above: nearestAbove,
        below: nearestBelow,
      },
      liquidityVoid,
      analysis,
      timestamp: new Date(),
    };
  }

  /**
   * Identify buy-side liquidity (stops above swing highs)
   */
  private identifyBuySideLiquidity(priceData: any[]): LiquidityZone[] {
    const zones: LiquidityZone[] = [];
    const swingHighs = this.findSwingHighs(priceData);

    for (const swing of swingHighs) {
      // Buy-side liquidity sits above swing highs
      // Institutions hunt these stops before reversing
      zones.push({
        type: 'buy_side',
        price: swing.high,
        strength: this.calculateLiquidityStrength(swing, priceData),
        timeframe: '1D',
        description: `Buy-side liquidity at ${safeToFixed(swing.high, 2)} (swing high from ${swing.date})`,
        touched: false,
      });
    }

    return zones.sort((a, b) => b.price - a.price); // Highest first
  }

  /**
   * Identify sell-side liquidity (stops below swing lows)
   */
  private identifySellSideLiquidity(priceData: any[]): LiquidityZone[] {
    const zones: LiquidityZone[] = [];
    const swingLows = this.findSwingLows(priceData);

    for (const swing of swingLows) {
      // Sell-side liquidity sits below swing lows
      zones.push({
        type: 'sell_side',
        price: swing.low,
        strength: this.calculateLiquidityStrength(swing, priceData),
        timeframe: '1D',
        description: `Sell-side liquidity at ${safeToFixed(swing.low, 2)} (swing low from ${swing.date})`,
        touched: false,
      });
    }

    return zones.sort((a, b) => a.price - b.price); // Lowest first
  }

  /**
   * Find swing highs (local peaks)
   */
  private findSwingHighs(
    priceData: any[],
    lookback: number = 5
  ): Array<{ high: number; date: string; volume: number }> {
    const swings: Array<{ high: number; date: string; volume: number }> = [];

    for (let i = lookback; i < priceData.length - lookback; i++) {
      let isSwingHigh = true;

      // Check if current high is higher than surrounding candles
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && priceData[j].high >= priceData[i].high) {
          isSwingHigh = false;
          break;
        }
      }

      if (isSwingHigh) {
        swings.push({
          high: priceData[i].high,
          date: new Date(priceData[i].timestamp).toLocaleDateString(),
          volume: priceData[i].volume || 0,
        });
      }
    }

    // Return only recent swings (last 20)
    return swings.slice(-20);
  }

  /**
   * Find swing lows (local valleys)
   */
  private findSwingLows(
    priceData: any[],
    lookback: number = 5
  ): Array<{ low: number; date: string; volume: number }> {
    const swings: Array<{ low: number; date: string; volume: number }> = [];

    for (let i = lookback; i < priceData.length - lookback; i++) {
      let isSwingLow = true;

      // Check if current low is lower than surrounding candles
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && priceData[j].low <= priceData[i].low) {
          isSwingLow = false;
          break;
        }
      }

      if (isSwingLow) {
        swings.push({
          low: priceData[i].low,
          date: new Date(priceData[i].timestamp).toLocaleDateString(),
          volume: priceData[i].volume || 0,
        });
      }
    }

    return swings.slice(-20);
  }

  /**
   * Calculate strength of liquidity zone
   */
  private calculateLiquidityStrength(
    swing: any,
    priceData: any[]
  ): 'high' | 'medium' | 'low' {
    // Factors:
    // 1. How many times price tested this level
    // 2. Volume at this level
    // 3. How old this swing is

    const avgVolume =
      priceData.reduce((sum, d) => sum + (d.volume || 0), 0) / priceData.length;

    if (swing.volume > avgVolume * 2) {
      return 'high';
    } else if (swing.volume > avgVolume * 1.5) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Find nearest liquidity above current price
   */
  private findNearestLiquidityAbove(
    buySideLiquidity: LiquidityZone[],
    currentPrice: number
  ): LiquidityZone | null {
    const above = buySideLiquidity.filter((zone) => zone.price > currentPrice);
    return above.length > 0 ? above[above.length - 1] : null;
  }

  /**
   * Find nearest liquidity below current price
   */
  private findNearestLiquidityBelow(
    sellSideLiquidity: LiquidityZone[],
    currentPrice: number
  ): LiquidityZone | null {
    const below = sellSideLiquidity.filter((zone) => zone.price < currentPrice);
    return below.length > 0 ? below[0] : null;
  }

  /**
   * Detect liquidity voids (areas with no liquidity)
   */
  private detectLiquidityVoid(priceData: any[]): {
    hasVoid: boolean;
    range?: { high: number; low: number };
  } {
    // Look for large gaps in price with low volume
    for (let i = 1; i < priceData.length; i++) {
      const gap = Math.abs(priceData[i].open - priceData[i - 1].close);
      const avgPrice = (priceData[i].close + priceData[i - 1].close) / 2;
      const gapPercent = (gap / avgPrice) * 100;

      if (gapPercent > 2 && priceData[i].volume < priceData[i - 1].volume) {
        return {
          hasVoid: true,
          range: {
            high: Math.max(priceData[i].open, priceData[i - 1].close),
            low: Math.min(priceData[i].open, priceData[i - 1].close),
          },
        };
      }
    }

    return { hasVoid: false };
  }

  /**
   * Generate liquidity analysis
   */
  private generateLiquidityAnalysis(
    buySide: LiquidityZone[],
    sellSide: LiquidityZone[],
    nearestAbove: LiquidityZone | null,
    nearestBelow: LiquidityZone | null,
    liquidityVoid: any,
    currentPrice: number
  ): string[] {
    const analysis: string[] = [];

    // Overall liquidity context
    analysis.push(`📊 Liquidity Analysis (ICT Concept)`);
    analysis.push(
      `Buy-side liquidity zones: ${buySide.length} (stops above highs)`
    );
    analysis.push(
      `Sell-side liquidity zones: ${sellSide.length} (stops below lows)`
    );

    // Nearest targets
    if (nearestAbove) {
      const distance = ((nearestAbove.price - currentPrice) / currentPrice) * 100;
      analysis.push(
        `🎯 Nearest buy-side liquidity: ${safeToFixed(nearestAbove.price, 2)} (+${safeToFixed(distance, 2)}%)`
      );
      analysis.push(
        `   Strength: ${nearestAbove.strength.toUpperCase()} - Institutions likely to sweep this level`
      );
    }

    if (nearestBelow) {
      const distance = ((currentPrice - nearestBelow.price) / currentPrice) * 100;
      analysis.push(
        `🎯 Nearest sell-side liquidity: ${safeToFixed(nearestBelow.price, 2)} (-${safeToFixed(distance, 2)}%)`
      );
      analysis.push(
        `   Strength: ${nearestBelow.strength.toUpperCase()} - Potential stop hunt target`
      );
    }

    // Liquidity void
    if (liquidityVoid.hasVoid) {
      analysis.push(
        `⚠️ LIQUIDITY VOID DETECTED: ${safeToFixed(liquidityVoid.range.low, 2)} - ${safeToFixed(liquidityVoid.range.high, 2)}`
      );
      analysis.push(`   Price likely to move quickly through this area`);
    }

    // Trading implications
    analysis.push(`\n💡 ICT Trading Implications:`);

    if (nearestAbove && nearestBelow) {
      const aboveDistance = nearestAbove.price - currentPrice;
      const belowDistance = currentPrice - nearestBelow.price;

      if (aboveDistance < belowDistance) {
        analysis.push(
          `   • Price closer to buy-side liquidity - expect upward sweep before reversal`
        );
        analysis.push(
          `   • Strategy: Wait for liquidity grab above ${safeToFixed(nearestAbove.price, 2)}, then look for shorts`
        );
      } else {
        analysis.push(
          `   • Price closer to sell-side liquidity - expect downward sweep before reversal`
        );
        analysis.push(
          `   • Strategy: Wait for liquidity grab below ${safeToFixed(nearestBelow.price, 2)}, then look for longs`
        );
      }
    }

    // High-strength zones
    const highStrengthZones = [...buySide, ...sellSide].filter(
      (z) => z.strength === 'high'
    );
    if (highStrengthZones.length > 0) {
      analysis.push(
        `   • ${highStrengthZones.length} HIGH-STRENGTH liquidity zones identified`
      );
      analysis.push(`   • These are prime targets for institutional manipulation`);
    }

    return analysis;
  }

  /**
   * Check if liquidity has been swept
   */
  checkLiquiditySweep(
    liquidityPool: LiquidityPool,
    recentPrice: number,
    recentHigh: number,
    recentLow: number
  ): {
    swept: boolean;
    type: 'buy_side' | 'sell_side' | null;
    zone: LiquidityZone | null;
    analysis: string[];
  } {
    const analysis: string[] = [];

    // Check buy-side liquidity sweep (high taken out)
    for (const zone of liquidityPool.buySideLiquidity) {
      if (!zone.touched && recentHigh > zone.price) {
        zone.touched = true;
        zone.sweptAt = new Date();

        analysis.push(`🚨 BUY-SIDE LIQUIDITY SWEPT!`);
        analysis.push(`   Level: ${safeToFixed(zone.price, 2)}`);
        analysis.push(`   Strength: ${zone.strength.toUpperCase()}`);
        analysis.push(
          `   🎯 ICT SIGNAL: Stops above ${safeToFixed(zone.price, 2)} have been taken`
        );
        analysis.push(
          `   📉 Expect potential reversal (institutions now SHORT)`
        );

        return {
          swept: true,
          type: 'buy_side',
          zone,
          analysis,
        };
      }
    }

    // Check sell-side liquidity sweep (low taken out)
    for (const zone of liquidityPool.sellSideLiquidity) {
      if (!zone.touched && recentLow < zone.price) {
        zone.touched = true;
        zone.sweptAt = new Date();

        analysis.push(`🚨 SELL-SIDE LIQUIDITY SWEPT!`);
        analysis.push(`   Level: ${safeToFixed(zone.price, 2)}`);
        analysis.push(`   Strength: ${zone.strength.toUpperCase()}`);
        analysis.push(
          `   🎯 ICT SIGNAL: Stops below ${safeToFixed(zone.price, 2)} have been taken`
        );
        analysis.push(`   📈 Expect potential reversal (institutions now LONG)`);

        return {
          swept: true,
          type: 'sell_side',
          zone,
          analysis,
        };
      }
    }

    return {
      swept: false,
      type: null,
      zone: null,
      analysis: ['No liquidity sweeps detected'],
    };
  }
}

