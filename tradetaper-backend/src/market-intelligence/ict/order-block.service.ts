import { safeToFixed } from './ict-utils';
import { Injectable, Logger } from '@nestjs/common';

export interface OrderBlock {
  type: 'bullish' | 'bearish';
  high: number;
  low: number;
  open: number;
  close: number;
  timestamp: Date;
  index: number;
  strength: 'strong' | 'moderate' | 'weak';
  volume: number;
  tested: boolean;
  testCount: number;
  holdingStrength: number; // 0-100
  description: string;
  isBreaker: boolean; // Breaker block (failed order block)
}

export interface OrderBlockAnalysis {
  symbol: string;
  bullishOrderBlocks: OrderBlock[];
  bearishOrderBlocks: OrderBlock[];
  activeOrderBlocks: OrderBlock[];
  nearestOrderBlock: OrderBlock | null;
  currentPrice: number;
  analysis: string[];
  tradingSetups: string[];
  timestamp: Date;
}

@Injectable()
export class OrderBlockService {
  private readonly logger = new Logger(OrderBlockService.name);

  /**
   * Identify Order Blocks (ICT Concept)
   * Order Block = Last down candle before strong up move (bullish OB)
   *            or Last up candle before strong down move (bearish OB)
   * These represent where institutions placed large orders
   */
  identifyOrderBlocks(
    symbol: string,
    priceData: any[],
    timeframe: string = '1D',
  ): OrderBlockAnalysis {
    this.logger.log(
      `Identifying ICT Order Blocks for ${symbol} on ${timeframe}`,
    );

    const bullishOrderBlocks: OrderBlock[] = [];
    const bearishOrderBlocks: OrderBlock[] = [];

    // Scan for order blocks
    for (let i = 5; i < priceData.length - 1; i++) {
      // Check for Bullish Order Block
      // Last down candle before strong up move
      const bullishOB = this.identifyBullishOrderBlock(priceData, i);
      if (bullishOB) {
        // Check if OB has been tested/held
        this.checkOrderBlockTest(bullishOB, priceData, i);
        bullishOrderBlocks.push(bullishOB);
      }

      // Check for Bearish Order Block
      // Last up candle before strong down move
      const bearishOB = this.identifyBearishOrderBlock(priceData, i);
      if (bearishOB) {
        this.checkOrderBlockTest(bearishOB, priceData, i);
        bearishOrderBlocks.push(bearishOB);
      }
    }

    // Filter active (untested or holding) order blocks
    const activeOrderBlocks = [
      ...bullishOrderBlocks,
      ...bearishOrderBlocks,
    ].filter((ob) => !ob.isBreaker && ob.holdingStrength > 50);

    // Find nearest order block
    const currentPrice = priceData[priceData.length - 1].close;
    const nearestOrderBlock = this.findNearestOrderBlock(
      activeOrderBlocks,
      currentPrice,
    );

    // Generate analysis
    const analysis = this.generateOrderBlockAnalysis(
      bullishOrderBlocks,
      bearishOrderBlocks,
      activeOrderBlocks,
      nearestOrderBlock,
      currentPrice,
    );

    // Generate trading setups
    const tradingSetups = this.generateTradingSetups(
      nearestOrderBlock,
      currentPrice,
    );

    return {
      symbol,
      bullishOrderBlocks,
      bearishOrderBlocks,
      activeOrderBlocks,
      nearestOrderBlock,
      currentPrice,
      analysis,
      tradingSetups,
      timestamp: new Date(),
    };
  }

  /**
   * Identify Bullish Order Block
   */
  private identifyBullishOrderBlock(
    priceData: any[],
    index: number,
  ): OrderBlock | null {
    const candle = priceData[index];

    // Must be a down candle (close < open)
    if (candle.close >= candle.open) return null;

    // Check for strong up move after this candle
    const nextCandles = priceData.slice(index + 1, index + 4);
    if (nextCandles.length < 3) return null;

    // Look for strong bullish momentum (at least 2 up candles)
    let upCandles = 0;
    let priceMove = 0;

    for (const next of nextCandles) {
      if (next.close > next.open) upCandles++;
      priceMove += next.close - next.open;
    }

    // Require at least 2 up candles and significant move
    const movePercent = (priceMove / candle.close) * 100;
    if (upCandles < 2 || movePercent < 0.5) return null;

    // This is a Bullish Order Block
    const strength = this.calculateOrderBlockStrength(
      candle,
      nextCandles,
      'bullish',
    );

    return {
      type: 'bullish',
      high: candle.high,
      low: candle.low,
      open: candle.open,
      close: candle.close,
      timestamp: new Date(candle.timestamp),
      index,
      strength,
      volume: candle.volume || 0,
      tested: false,
      testCount: 0,
      holdingStrength: 100,
      description: `Bullish OB at ${safeToFixed(candle.low, 2)} - ${safeToFixed(candle.high, 2)} (${strength})`,
      isBreaker: false,
    };
  }

  /**
   * Identify Bearish Order Block
   */
  private identifyBearishOrderBlock(
    priceData: any[],
    index: number,
  ): OrderBlock | null {
    const candle = priceData[index];

    // Must be an up candle (close > open)
    if (candle.close <= candle.open) return null;

    // Check for strong down move after this candle
    const nextCandles = priceData.slice(index + 1, index + 4);
    if (nextCandles.length < 3) return null;

    // Look for strong bearish momentum
    let downCandles = 0;
    let priceMove = 0;

    for (const next of nextCandles) {
      if (next.close < next.open) downCandles++;
      priceMove += next.open - next.close;
    }

    const movePercent = (priceMove / candle.close) * 100;
    if (downCandles < 2 || movePercent < 0.5) return null;

    const strength = this.calculateOrderBlockStrength(
      candle,
      nextCandles,
      'bearish',
    );

    return {
      type: 'bearish',
      high: candle.high,
      low: candle.low,
      open: candle.open,
      close: candle.close,
      timestamp: new Date(candle.timestamp),
      index,
      strength,
      volume: candle.volume || 0,
      tested: false,
      testCount: 0,
      holdingStrength: 100,
      description: `Bearish OB at ${safeToFixed(candle.low, 2)} - ${safeToFixed(candle.high, 2)} (${strength})`,
      isBreaker: false,
    };
  }

  /**
   * Calculate Order Block strength
   */
  private calculateOrderBlockStrength(
    obCandle: any,
    reactionCandles: any[],
    type: 'bullish' | 'bearish',
  ): 'strong' | 'moderate' | 'weak' {
    // Factors:
    // 1. Volume of OB candle
    // 2. Strength of subsequent move
    // 3. Size of OB candle body

    const volumes = reactionCandles.map((c) => c.volume || 0);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const obVolume = obCandle.volume || 0;

    const obBody = Math.abs(obCandle.close - obCandle.open);
    const obRange = obCandle.high - obCandle.low;
    const bodyRatio = obBody / obRange;

    // Calculate reaction strength
    let totalMove = 0;
    for (const candle of reactionCandles) {
      totalMove += Math.abs(candle.close - candle.open);
    }
    const avgCandleSize = totalMove / reactionCandles.length;

    // Strong OB: High volume, good body ratio, strong reaction
    if (
      obVolume > avgVolume * 1.5 &&
      bodyRatio > 0.6 &&
      avgCandleSize > obBody
    ) {
      return 'strong';
    }

    // Weak OB: Low volume, small body, weak reaction
    if (
      obVolume < avgVolume ||
      bodyRatio < 0.3 ||
      avgCandleSize < obBody * 0.5
    ) {
      return 'weak';
    }

    return 'moderate';
  }

  /**
   * Check if Order Block has been tested and how it held
   */
  private checkOrderBlockTest(
    ob: OrderBlock,
    priceData: any[],
    startIndex: number,
  ): void {
    for (let i = startIndex + 1; i < priceData.length; i++) {
      const candle = priceData[i];

      if (ob.type === 'bullish') {
        // Check if price came back to test bullish OB
        if (candle.low <= ob.high && candle.low >= ob.low) {
          ob.tested = true;
          ob.testCount++;

          // Check if OB held (price bounced up)
          const nextCandles = priceData.slice(i + 1, i + 3);
          let bounced = false;

          for (const next of nextCandles) {
            if (next.close > candle.close) {
              bounced = true;
              break;
            }
          }

          if (!bounced) {
            // OB failed to hold
            ob.holdingStrength -= 30;
            if (ob.holdingStrength < 30) {
              ob.isBreaker = true; // Became a breaker block
            }
          }
        }

        // If price broke below OB, it's invalidated
        if (candle.close < ob.low) {
          ob.isBreaker = true;
          ob.holdingStrength = 0;
        }
      } else {
        // Bearish OB
        if (candle.high >= ob.low && candle.high <= ob.high) {
          ob.tested = true;
          ob.testCount++;

          const nextCandles = priceData.slice(i + 1, i + 3);
          let bounced = false;

          for (const next of nextCandles) {
            if (next.close < candle.close) {
              bounced = true;
              break;
            }
          }

          if (!bounced) {
            ob.holdingStrength -= 30;
            if (ob.holdingStrength < 30) {
              ob.isBreaker = true;
            }
          }
        }

        if (candle.close > ob.high) {
          ob.isBreaker = true;
          ob.holdingStrength = 0;
        }
      }

      if (ob.isBreaker) break;
    }
  }

  /**
   * Find nearest active order block
   */
  private findNearestOrderBlock(
    activeOrderBlocks: OrderBlock[],
    currentPrice: number,
  ): OrderBlock | null {
    if (activeOrderBlocks.length === 0) return null;

    let nearest: OrderBlock | null = null;
    let minDistance = Infinity;

    for (const ob of activeOrderBlocks) {
      const obMidpoint = (ob.high + ob.low) / 2;
      const distance = Math.abs(currentPrice - obMidpoint);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = ob;
      }
    }

    return nearest;
  }

  /**
   * Generate Order Block analysis
   */
  private generateOrderBlockAnalysis(
    bullishOBs: OrderBlock[],
    bearishOBs: OrderBlock[],
    activeOBs: OrderBlock[],
    nearestOB: OrderBlock | null,
    currentPrice: number,
  ): string[] {
    const analysis: string[] = [];

    analysis.push(`🏛️ ICT Order Block Analysis`);
    analysis.push(
      `Total Order Blocks: ${bullishOBs.length + bearishOBs.length}`,
    );
    analysis.push(`   • Bullish OBs: ${bullishOBs.length}`);
    analysis.push(`   • Bearish OBs: ${bearishOBs.length}`);
    analysis.push(`   • Active OBs: ${activeOBs.length} ⭐`);

    // Breaker blocks
    const breakerBlocks = [...bullishOBs, ...bearishOBs].filter(
      (ob) => ob.isBreaker,
    );
    if (breakerBlocks.length > 0) {
      analysis.push(
        `   • Breaker Blocks: ${breakerBlocks.length} (failed OBs that became resistance/support)`,
      );
    }

    if (nearestOB) {
      const distance = Math.abs(
        currentPrice - (nearestOB.high + nearestOB.low) / 2,
      );
      const distancePercent = (distance / currentPrice) * 100;

      analysis.push(`\n🎯 Nearest Active Order Block:`);
      analysis.push(`   Type: ${nearestOB.type.toUpperCase()}`);
      analysis.push(
        `   Range: ${safeToFixed(nearestOB.low, 2)} - ${safeToFixed(nearestOB.high, 2)}`,
      );
      analysis.push(`   Strength: ${nearestOB.strength.toUpperCase()}`);
      analysis.push(`   Tested: ${nearestOB.testCount} time(s)`);
      analysis.push(`   Holding Strength: ${nearestOB.holdingStrength}%`);
      analysis.push(
        `   Distance: ${safeToFixed(distancePercent, 2)}% from current price`,
      );

      if (nearestOB.isBreaker) {
        analysis.push(
          `   ⚠️ BREAKER BLOCK - OB was broken, now acts as opposite level`,
        );
      }
    }

    // Strong active OBs
    const strongActiveOBs = activeOBs.filter((ob) => ob.strength === 'strong');
    if (strongActiveOBs.length > 0) {
      analysis.push(
        `\n⚡ ${strongActiveOBs.length} STRONG active Order Blocks`,
      );
      analysis.push(`   These are HIGH-PROBABILITY support/resistance zones`);
    }

    return analysis;
  }

  /**
   * Generate trading setups based on Order Blocks
   */
  private generateTradingSetups(
    nearestOB: OrderBlock | null,
    currentPrice: number,
  ): string[] {
    const setups: string[] = [];

    if (!nearestOB) {
      setups.push('⏸️ No active Order Block trading setups');
      return setups;
    }

    const obMidpoint = (nearestOB.high + nearestOB.low) / 2;
    const distancePercent = ((currentPrice - obMidpoint) / currentPrice) * 100;

    if (nearestOB.type === 'bullish') {
      if (currentPrice > nearestOB.high) {
        // Price above bullish OB - wait for retest
        setups.push(`📉 BULLISH ORDER BLOCK RETEST SETUP:`);
        setups.push(
          `   • Bullish OB below at ${safeToFixed(nearestOB.low, 2)} - ${safeToFixed(nearestOB.high, 2)}`,
        );
        setups.push(
          `   • Distance: ${safeToFixed(Math.abs(distancePercent), 2)}% below current price`,
        );
        setups.push(`   • Strategy: Wait for price to retrace to OB`);
        setups.push(
          `   • Entry: Within OB range, preferably at ${safeToFixed(obMidpoint, 2)}`,
        );
        setups.push(
          `   • Stop Loss: Below OB at ${(nearestOB.low * 0.998, 2)}`,
        );
        setups.push(`   • Target: Recent swing high`);
        setups.push(
          `   • Holding Strength: ${nearestOB.holdingStrength}% (${nearestOB.testCount} previous tests)`,
        );

        if (nearestOB.strength === 'strong') {
          setups.push(`   ⭐ STRONG OB - Institutional demand zone`);
        }
      } else if (
        currentPrice >= nearestOB.low &&
        currentPrice <= nearestOB.high
      ) {
        // Price in bullish OB
        setups.push(`🎯 PRICE IN BULLISH ORDER BLOCK - BUY ZONE!`);
        setups.push(`   • Current price: ${safeToFixed(currentPrice, 2)}`);
        setups.push(
          `   • OB range: ${safeToFixed(nearestOB.low, 2)} - ${safeToFixed(nearestOB.high, 2)}`,
        );
        setups.push(`   • Action: Consider LONG entry NOW`);
        setups.push(
          `   • Stop Loss: Below OB at ${(nearestOB.low * 0.998, 2)}`,
        );
        setups.push(`   • Target 1: Recent swing high`);
        setups.push(`   • Target 2: Next resistance level`);

        if (nearestOB.testCount > 0) {
          setups.push(
            `   ✅ OB has held ${nearestOB.testCount} time(s) - proven demand zone`,
          );
        }
      }
    } else {
      // Bearish OB
      if (currentPrice < nearestOB.low) {
        setups.push(`📈 BEARISH ORDER BLOCK RETEST SETUP:`);
        setups.push(
          `   • Bearish OB above at ${safeToFixed(nearestOB.low, 2)} - ${safeToFixed(nearestOB.high, 2)}`,
        );
        setups.push(
          `   • Distance: ${safeToFixed(Math.abs(distancePercent), 2)}% above current price`,
        );
        setups.push(`   • Strategy: Wait for price to retrace to OB`);
        setups.push(
          `   • Entry: Within OB range, preferably at ${safeToFixed(obMidpoint, 2)}`,
        );
        setups.push(
          `   • Stop Loss: Above OB at ${(nearestOB.high * 1.002, 2)}`,
        );
        setups.push(`   • Target: Recent swing low`);
        setups.push(`   • Holding Strength: ${nearestOB.holdingStrength}%`);

        if (nearestOB.strength === 'strong') {
          setups.push(`   ⭐ STRONG OB - Institutional supply zone`);
        }
      } else if (
        currentPrice >= nearestOB.low &&
        currentPrice <= nearestOB.high
      ) {
        setups.push(`🎯 PRICE IN BEARISH ORDER BLOCK - SELL ZONE!`);
        setups.push(`   • Current price: ${safeToFixed(currentPrice, 2)}`);
        setups.push(
          `   • OB range: ${safeToFixed(nearestOB.low, 2)} - ${safeToFixed(nearestOB.high, 2)}`,
        );
        setups.push(`   • Action: Consider SHORT entry NOW`);
        setups.push(
          `   • Stop Loss: Above OB at ${(nearestOB.high * 1.002, 2)}`,
        );
        setups.push(`   • Target 1: Recent swing low`);
        setups.push(`   • Target 2: Next support level`);

        if (nearestOB.testCount > 0) {
          setups.push(
            `   ✅ OB has held ${nearestOB.testCount} time(s) - proven supply zone`,
          );
        }
      }
    }

    return setups;
  }
}
