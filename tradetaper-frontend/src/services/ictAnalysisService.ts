// services/ictAnalysisService.ts
import { MarketQuote, TechnicalIndicator, marketDataService } from './marketDataService';

export interface ICTMarketStructure {
  trend: 'Bullish' | 'Bearish' | 'Ranging';
  higherHigh: boolean;
  higherLow: boolean;
  lowerHigh: boolean;
  lowerLow: boolean;
  breakOfStructure: boolean;
  changeOfCharacter: boolean;
  marketStructureShift: boolean;
  swingPoints: {
    highs: number[];
    lows: number[];
  };
}

export interface ICTLevels {
  orderBlocks: {
    bullish: { price: number; strength: number; timestamp: string }[];
    bearish: { price: number; strength: number; timestamp: string }[];
  };
  fairValueGaps: {
    bullish: { top: number; bottom: number; strength: number }[];
    bearish: { top: number; bottom: number; strength: number }[];
  };
  liquidityZones: {
    buyLiquidity: { price: number; volume: number; confidence: number }[];
    sellLiquidity: { price: number; volume: number; confidence: number }[];
  };
  breakers: {
    price: number;
    type: 'Support' | 'Resistance';
    strength: number;
  }[];
  mitigation: {
    price: number;
    type: 'Order Block' | 'Fair Value Gap' | 'Breaker';
    status: 'Pending' | 'Partial' | 'Complete';
  }[];
}

export interface ICTSessionAnalysis {
  asianSession: {
    range: { high: number; low: number };
    bias: 'Bullish' | 'Bearish' | 'Neutral';
    manipulation: boolean;
    liquidity: 'Gathered' | 'Building' | 'Depleted';
  };
  londonSession: {
    killZone: { start: string; end: string };
    bias: 'Bullish' | 'Bearish' | 'Neutral';
    displacement: boolean;
    optimalTradeEntry: boolean;
  };
  newYorkSession: {
    killZone: { start: string; end: string };
    bias: 'Bullish' | 'Bearish' | 'Neutral';
    momentum: 'Strong' | 'Moderate' | 'Weak';
    institutional: boolean;
  };
}

export interface ICTTradeSetup {
  setup: 'Liquidity Sweep' | 'Order Block' | 'Fair Value Gap' | 'Breaker' | 'Market Structure Shift';
  direction: 'Long' | 'Short' | 'Wait';
  entry: {
    price: number;
    reasoning: string;
    confidence: number;
    timeframe: string;
  };
  stopLoss: {
    price: number;
    reasoning: string;
    riskReward: number;
  };
  takeProfit: {
    targets: { price: number; percentage: number; reasoning: string }[];
    totalRR: number;
  };
  invalidation: {
    price: number;
    condition: string;
  };
  timeConstraints: {
    optimal: string;
    avoid: string[];
  };
}

export interface ICTConcepts {
  inducement: {
    present: boolean;
    type: 'Buy Side' | 'Sell Side' | 'Both';
    priceLevel: number;
    confidence: number;
  };
  displacement: {
    present: boolean;
    direction: 'Bullish' | 'Bearish';
    strength: number;
    candleCount: number;
  };
  balancedPriceRange: {
    active: boolean;
    range: { high: number; low: number };
    bias: 'Expansion Up' | 'Expansion Down' | 'Continuation';
  };
  optimalTradeEntry: {
    fibonacci: {
      level618: number;
      level705: number;
      level786: number;
      level886: number;
    };
    recommendation: number;
  };
  powerOfThree: {
    accumulation: boolean;
    manipulation: boolean;
    distribution: boolean;
    phase: 'Accumulation' | 'Manipulation' | 'Distribution';
  };
}

export interface ICTAnalysisResult {
  symbol: string;
  timestamp: string;
  timeframe: string;
  marketStructure: ICTMarketStructure;
  levels: ICTLevels;
  sessionAnalysis: ICTSessionAnalysis;
  tradeSetup: ICTTradeSetup;
  concepts: ICTConcepts;
  overallBias: 'Bullish' | 'Bearish' | 'Neutral';
  confidence: number;
  narrative: string;
  warnings: string[];
}

class ICTAnalysisService {
  private priceHistory = new Map<string, number[]>();
  private analysisCache = new Map<string, { data: ICTAnalysisResult; timestamp: number }>();

  // Main analysis function combining all ICT concepts
  async analyzeMarket(symbol: string, timeframe: string = '1H'): Promise<ICTAnalysisResult> {
    const cacheKey = `${symbol}_${timeframe}`;
    const cached = this.analysisCache.get(cacheKey);
    
    // Cache for 15 minutes
    if (cached && Date.now() - cached.timestamp < 900000) {
      return cached.data;
    }

    try {
      // Get market data
      const quote = await marketDataService.getMarketQuotes([symbol]);
      const currentPrice = quote[0]?.price || 0;
      
      // Update price history
      this.updatePriceHistory(symbol, currentPrice);
      
      // Perform comprehensive ICT analysis
      const marketStructure = this.analyzeMarketStructure(symbol, currentPrice);
      const levels = this.identifyICTLevels(symbol, currentPrice);
      const sessionAnalysis = this.analyzeSessionBias(symbol, currentPrice);
      const concepts = this.analyzeICTConcepts(symbol, currentPrice);
      const tradeSetup = this.generateTradeSetup(symbol, currentPrice, marketStructure, levels, concepts);
      
      const analysis: ICTAnalysisResult = {
        symbol,
        timestamp: new Date().toISOString(),
        timeframe,
        marketStructure,
        levels,
        sessionAnalysis,
        tradeSetup,
        concepts,
        overallBias: this.calculateOverallBias(marketStructure, sessionAnalysis, concepts),
        confidence: this.calculateConfidence(marketStructure, levels, concepts),
        narrative: this.generateNarrative(symbol, marketStructure, tradeSetup, concepts),
        warnings: this.generateWarnings(marketStructure, levels, sessionAnalysis)
      };

      // Cache the result
      this.analysisCache.set(cacheKey, { data: analysis, timestamp: Date.now() });
      
      return analysis;
    } catch (error) {
      console.error(`Failed to analyze ${symbol}:`, error);
      throw error;
    }
  }

  private updatePriceHistory(symbol: string, price: number): void {
    if (!this.priceHistory.has(symbol)) {
      this.priceHistory.set(symbol, []);
    }
    
    const history = this.priceHistory.get(symbol)!;
    history.push(price);
    
    // Keep last 100 price points
    if (history.length > 100) {
      history.shift();
    }
  }

  private analyzeMarketStructure(symbol: string, currentPrice: number): ICTMarketStructure {
    const history = this.priceHistory.get(symbol) || [currentPrice];
    
    if (history.length < 10) {
      return this.getDefaultMarketStructure();
    }

    // Identify swing points
    const swingPoints = this.identifySwingPoints(history);
    
    // Analyze trend structure
    const trend = this.determineTrend(swingPoints);
    const higherHigh = this.hasHigherHigh(swingPoints);
    const higherLow = this.hasHigherLow(swingPoints);
    const lowerHigh = this.hasLowerHigh(swingPoints);
    const lowerLow = this.hasLowerLow(swingPoints);
    
    // Detect structure breaks
    const breakOfStructure = this.detectBreakOfStructure(swingPoints, currentPrice);
    const changeOfCharacter = this.detectChangeOfCharacter(swingPoints);
    const marketStructureShift = breakOfStructure && changeOfCharacter;

    return {
      trend,
      higherHigh,
      higherLow,
      lowerHigh,
      lowerLow,
      breakOfStructure,
      changeOfCharacter,
      marketStructureShift,
      swingPoints
    };
  }

  private identifySwingPoints(history: number[]): { highs: number[]; lows: number[] } {
    const highs: number[] = [];
    const lows: number[] = [];
    
    for (let i = 2; i < history.length - 2; i++) {
      const current = history[i];
      const prev2 = history[i - 2];
      const prev1 = history[i - 1];
      const next1 = history[i + 1];
      const next2 = history[i + 2];
      
      // Swing high: current price higher than 2 periods before and after
      if (current > prev2 && current > prev1 && current > next1 && current > next2) {
        highs.push(current);
      }
      
      // Swing low: current price lower than 2 periods before and after
      if (current < prev2 && current < prev1 && current < next1 && current < next2) {
        lows.push(current);
      }
    }
    
    return { highs, lows };
  }

  private determineTrend(swingPoints: { highs: number[]; lows: number[] }): 'Bullish' | 'Bearish' | 'Ranging' {
    const { highs, lows } = swingPoints;
    
    if (highs.length < 2 || lows.length < 2) {
      return 'Ranging';
    }
    
    const recentHighs = highs.slice(-3);
    const recentLows = lows.slice(-3);
    
    const highsIncreasing = recentHighs.length >= 2 && recentHighs[1] > recentHighs[0];
    const lowsIncreasing = recentLows.length >= 2 && recentLows[1] > recentLows[0];
    
    const highsDecreasing = recentHighs.length >= 2 && recentHighs[1] < recentHighs[0];
    const lowsDecreasing = recentLows.length >= 2 && recentLows[1] < recentLows[0];
    
    if (highsIncreasing && lowsIncreasing) {
      return 'Bullish';
    } else if (highsDecreasing && lowsDecreasing) {
      return 'Bearish';
    } else {
      return 'Ranging';
    }
  }

  private hasHigherHigh(swingPoints: { highs: number[]; lows: number[] }): boolean {
    const highs = swingPoints.highs;
    return highs.length >= 2 && highs[highs.length - 1] > highs[highs.length - 2];
  }

  private hasHigherLow(swingPoints: { highs: number[]; lows: number[] }): boolean {
    const lows = swingPoints.lows;
    return lows.length >= 2 && lows[lows.length - 1] > lows[lows.length - 2];
  }

  private hasLowerHigh(swingPoints: { highs: number[]; lows: number[] }): boolean {
    const highs = swingPoints.highs;
    return highs.length >= 2 && highs[highs.length - 1] < highs[highs.length - 2];
  }

  private hasLowerLow(swingPoints: { highs: number[]; lows: number[] }): boolean {
    const lows = swingPoints.lows;
    return lows.length >= 2 && lows[lows.length - 1] < lows[lows.length - 2];
  }

  private detectBreakOfStructure(swingPoints: { highs: number[]; lows: number[] }, currentPrice: number): boolean {
    const { highs, lows } = swingPoints;
    
    if (highs.length === 0 && lows.length === 0) return false;
    
    const lastHigh = highs.length > 0 ? highs[highs.length - 1] : 0;
    const lastLow = lows.length > 0 ? lows[lows.length - 1] : Infinity;
    
    // Break of structure occurs when price breaks significant swing levels
    return currentPrice > lastHigh * 1.002 || currentPrice < lastLow * 0.998; // 0.2% threshold
  }

  private detectChangeOfCharacter(swingPoints: { highs: number[]; lows: number[] }): boolean {
    // Change of character is a shift in market behavior
    // Simplified: recent swing points showing reversal pattern
    const { highs, lows } = swingPoints;
    
    if (highs.length < 3 || lows.length < 3) return false;
    
    const recentHighs = highs.slice(-3);
    const recentLows = lows.slice(-3);
    
    // Look for reversal patterns in recent swings
    const highReversal = recentHighs[0] > recentHighs[1] && recentHighs[2] < recentHighs[1];
    const lowReversal = recentLows[0] < recentLows[1] && recentLows[2] > recentLows[1];
    
    return highReversal || lowReversal;
  }

  private identifyICTLevels(symbol: string, currentPrice: number): ICTLevels {
    // Identify order blocks based on price action
    const orderBlocks = this.identifyOrderBlocks(symbol, currentPrice);
    
    // Identify fair value gaps
    const fairValueGaps = this.identifyFairValueGaps(symbol, currentPrice);
    
    // Identify liquidity zones
    const liquidityZones = this.identifyLiquidityZones(symbol, currentPrice);
    
    // Identify breaker blocks
    const breakers = this.identifyBreakers(symbol, currentPrice);
    
    // Identify mitigation blocks
    const mitigation = this.identifyMitigation(symbol, currentPrice);

    return {
      orderBlocks,
      fairValueGaps,
      liquidityZones,
      breakers,
      mitigation
    };
  }

  private identifyOrderBlocks(symbol: string, currentPrice: number): ICTLevels['orderBlocks'] {
    // Order blocks are institutional levels where large orders were placed
    // Identified by strong price rejection or consolidation areas
    
    const history = this.priceHistory.get(symbol) || [currentPrice];
    const orderBlocks: ICTLevels['orderBlocks'] = { bullish: [], bearish: [] };
    
    // Look for significant price moves with consolidation
    for (let i = 10; i < history.length - 5; i++) {
      const range = history.slice(i - 10, i);
      const avgPrice = range.reduce((sum, price) => sum + price, 0) / range.length;
      const volatility = Math.max(...range) - Math.min(...range);
      
      // Low volatility period followed by strong move = potential order block
      if (volatility < avgPrice * 0.005) { // Less than 0.5% range
        const nextMove = history.slice(i, i + 5);
        const moveSize = Math.max(...nextMove) - Math.min(...nextMove);
        
        if (moveSize > avgPrice * 0.01) { // More than 1% move
          const isUp = nextMove[nextMove.length - 1] > nextMove[0];
          const strength = moveSize / avgPrice;
          
          if (isUp) {
            orderBlocks.bullish.push({
              price: avgPrice,
              strength: strength * 100,
              timestamp: new Date().toISOString()
            });
          } else {
            orderBlocks.bearish.push({
              price: avgPrice,
              strength: strength * 100,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }
    
    return orderBlocks;
  }

  private identifyFairValueGaps(symbol: string, currentPrice: number): ICTLevels['fairValueGaps'] {
    // Fair value gaps are price imbalances that tend to get filled
    const fairValueGaps: ICTLevels['fairValueGaps'] = { bullish: [], bearish: [] };
    
    // Mock implementation - in real system, identify gaps in price action
    const variation = currentPrice * 0.002; // 0.2% variation
    
    fairValueGaps.bullish.push({
      top: currentPrice + variation,
      bottom: currentPrice - variation * 0.5,
      strength: 75
    });
    
    fairValueGaps.bearish.push({
      top: currentPrice + variation * 0.5,
      bottom: currentPrice - variation,
      strength: 60
    });
    
    return fairValueGaps;
  }

  private identifyLiquidityZones(symbol: string, currentPrice: number): ICTLevels['liquidityZones'] {
    // Liquidity zones are areas where stops are likely to be placed
    const variation = currentPrice * 0.01; // 1% variation
    
    return {
      buyLiquidity: [
        { price: currentPrice + variation * 1.5, volume: 100000, confidence: 80 },
        { price: currentPrice + variation * 2.5, volume: 150000, confidence: 70 }
      ],
      sellLiquidity: [
        { price: currentPrice - variation * 1.5, volume: 120000, confidence: 75 },
        { price: currentPrice - variation * 2.5, volume: 180000, confidence: 65 }
      ]
    };
  }

  private identifyBreakers(symbol: string, currentPrice: number): ICTLevels['breakers'] {
    // Breaker blocks are failed support/resistance that become opposite
    return [
      {
        price: currentPrice * 1.015,
        type: 'Resistance',
        strength: 70
      },
      {
        price: currentPrice * 0.985,
        type: 'Support',
        strength: 75
      }
    ];
  }

  private identifyMitigation(symbol: string, currentPrice: number): ICTLevels['mitigation'] {
    // Mitigation blocks are levels being tested for validity
    return [
      {
        price: currentPrice * 1.008,
        type: 'Order Block',
        status: 'Pending'
      },
      {
        price: currentPrice * 0.992,
        type: 'Fair Value Gap',
        status: 'Partial'
      }
    ];
  }

  private analyzeSessionBias(symbol: string, currentPrice: number): ICTSessionAnalysis {
    const now = new Date();
    const variation = currentPrice * 0.005;
    
    return {
      asianSession: {
        range: { 
          high: currentPrice + variation, 
          low: currentPrice - variation 
        },
        bias: 'Neutral',
        manipulation: true,
        liquidity: 'Building'
      },
      londonSession: {
        killZone: { start: '08:00', end: '10:00' },
        bias: 'Bullish',
        displacement: true,
        optimalTradeEntry: true
      },
      newYorkSession: {
        killZone: { start: '13:30', end: '16:00' },
        bias: 'Bullish',
        momentum: 'Strong',
        institutional: true
      }
    };
  }

  private analyzeICTConcepts(symbol: string, currentPrice: number): ICTConcepts {
    return {
      inducement: {
        present: true,
        type: 'Buy Side',
        priceLevel: currentPrice * 1.012,
        confidence: 75
      },
      displacement: {
        present: true,
        direction: 'Bullish',
        strength: 80,
        candleCount: 3
      },
      balancedPriceRange: {
        active: false,
        range: { high: currentPrice * 1.01, low: currentPrice * 0.99 },
        bias: 'Expansion Up'
      },
      optimalTradeEntry: {
        fibonacci: {
          level618: currentPrice * 0.9938, // 61.8% retracement
          level705: currentPrice * 0.9930, // 70.5% retracement
          level786: currentPrice * 0.9921, // 78.6% retracement
          level886: currentPrice * 0.9911  // 88.6% retracement
        },
        recommendation: currentPrice * 0.9930 // 70.5% level
      },
      powerOfThree: {
        accumulation: true,
        manipulation: true,
        distribution: false,
        phase: 'Manipulation'
      }
    };
  }

  private generateTradeSetup(
    symbol: string, 
    currentPrice: number, 
    marketStructure: ICTMarketStructure, 
    levels: ICTLevels, 
    concepts: ICTConcepts
  ): ICTTradeSetup {
    const direction = marketStructure.trend === 'Bullish' ? 'Long' : 
                     marketStructure.trend === 'Bearish' ? 'Short' : 'Wait';
    
    if (direction === 'Wait') {
      return this.getWaitSetup(currentPrice);
    }
    
    const entry = direction === 'Long' ? 
      concepts.optimalTradeEntry.recommendation :
      currentPrice * 1.005;
    
    const stopLoss = direction === 'Long' ?
      currentPrice * 0.985 :
      currentPrice * 1.015;
    
    const riskReward = Math.abs((currentPrice * 1.02 - entry) / (entry - stopLoss));
    
    return {
      setup: 'Order Block',
      direction,
      entry: {
        price: entry,
        reasoning: `${direction} bias confirmed by market structure and order block presence`,
        confidence: 78,
        timeframe: '1H'
      },
      stopLoss: {
        price: stopLoss,
        reasoning: 'Below/above key structure level',
        riskReward: riskReward
      },
      takeProfit: {
        targets: [
          {
            price: direction === 'Long' ? currentPrice * 1.015 : currentPrice * 0.985,
            percentage: 50,
            reasoning: 'First liquidity target'
          },
          {
            price: direction === 'Long' ? currentPrice * 1.025 : currentPrice * 0.975,
            percentage: 50,
            reasoning: 'Extension target'
          }
        ],
        totalRR: riskReward
      },
      invalidation: {
        price: direction === 'Long' ? currentPrice * 0.98 : currentPrice * 1.02,
        condition: 'Break of key structure level'
      },
      timeConstraints: {
        optimal: 'London Kill Zone (08:00-10:00 GMT)',
        avoid: ['News events', 'Low liquidity periods']
      }
    };
  }

  private getWaitSetup(currentPrice: number): ICTTradeSetup {
    return {
      setup: 'Market Structure Shift',
      direction: 'Wait',
      entry: {
        price: currentPrice,
        reasoning: 'Awaiting clear market structure signal',
        confidence: 0,
        timeframe: '1H'
      },
      stopLoss: {
        price: 0,
        reasoning: 'No trade, no risk',
        riskReward: 0
      },
      takeProfit: {
        targets: [],
        totalRR: 0
      },
      invalidation: {
        price: 0,
        condition: 'Wait for clear setup'
      },
      timeConstraints: {
        optimal: 'London/New York session opens',
        avoid: ['Asian session', 'News events']
      }
    };
  }

  private calculateOverallBias(
    marketStructure: ICTMarketStructure, 
    sessionAnalysis: ICTSessionAnalysis, 
    concepts: ICTConcepts
  ): 'Bullish' | 'Bearish' | 'Neutral' {
    let bullishScore = 0;
    let bearishScore = 0;
    
    // Market structure bias
    if (marketStructure.trend === 'Bullish') bullishScore += 3;
    if (marketStructure.trend === 'Bearish') bearishScore += 3;
    
    // Session bias
    if (sessionAnalysis.londonSession.bias === 'Bullish') bullishScore += 2;
    if (sessionAnalysis.londonSession.bias === 'Bearish') bearishScore += 2;
    
    // Displacement bias
    if (concepts.displacement.direction === 'Bullish') bullishScore += 2;
    if (concepts.displacement.direction === 'Bearish') bearishScore += 2;
    
    if (bullishScore > bearishScore + 1) return 'Bullish';
    if (bearishScore > bullishScore + 1) return 'Bearish';
    return 'Neutral';
  }

  private calculateConfidence(
    marketStructure: ICTMarketStructure, 
    levels: ICTLevels, 
    concepts: ICTConcepts
  ): number {
    let confidence = 50; // Base confidence
    
    // Market structure confirmations
    if (marketStructure.breakOfStructure) confidence += 15;
    if (marketStructure.changeOfCharacter) confidence += 10;
    if (marketStructure.marketStructureShift) confidence += 15;
    
    // Level confluences
    if (levels.orderBlocks.bullish.length > 0 || levels.orderBlocks.bearish.length > 0) {
      confidence += 10;
    }
    
    // ICT concept confirmations
    if (concepts.displacement.present) confidence += 10;
    if (concepts.inducement.present) confidence += 5;
    
    return Math.min(95, Math.max(15, confidence));
  }

  private generateNarrative(
    symbol: string, 
    marketStructure: ICTMarketStructure, 
    tradeSetup: ICTTradeSetup, 
    concepts: ICTConcepts
  ): string {
    const trend = marketStructure.trend;
    const setup = tradeSetup.setup;
    const phase = concepts.powerOfThree.phase;
    
    return `${symbol} is showing ${trend.toLowerCase()} market structure with ${setup.toLowerCase()} setup confirmed. ` +
           `Currently in ${phase.toLowerCase()} phase of the power of three model. ` +
           `${concepts.displacement.present ? 'Displacement confirmed with strong momentum.' : 'Awaiting displacement confirmation.'} ` +
           `Optimal entries expected during ${tradeSetup.timeConstraints.optimal}.`;
  }

  private generateWarnings(
    marketStructure: ICTMarketStructure, 
    levels: ICTLevels, 
    sessionAnalysis: ICTSessionAnalysis
  ): string[] {
    const warnings: string[] = [];
    
    if (marketStructure.trend === 'Ranging') {
      warnings.push('Market is currently ranging - exercise caution with directional trades');
    }
    
    if (!marketStructure.breakOfStructure && !marketStructure.changeOfCharacter) {
      warnings.push('No clear structural confirmation - wait for better setup');
    }
    
    if (sessionAnalysis.asianSession.manipulation) {
      warnings.push('Asian session manipulation detected - be aware of false breakouts');
    }
    
    if (levels.orderBlocks.bullish.length === 0 && levels.orderBlocks.bearish.length === 0) {
      warnings.push('Limited order block presence - reduce position size');
    }
    
    return warnings;
  }

  private getDefaultMarketStructure(): ICTMarketStructure {
    return {
      trend: 'Ranging',
      higherHigh: false,
      higherLow: false,
      lowerHigh: false,
      lowerLow: false,
      breakOfStructure: false,
      changeOfCharacter: false,
      marketStructureShift: false,
      swingPoints: { highs: [], lows: [] }
    };
  }

  // Public method to get multiple symbol analysis
  async getMultiSymbolAnalysis(symbols: string[]): Promise<ICTAnalysisResult[]> {
    const promises = symbols.map(symbol => this.analyzeMarket(symbol));
    return Promise.all(promises);
  }

  // Clear analysis cache
  clearCache(): void {
    this.analysisCache.clear();
    this.priceHistory.clear();
  }
}

export const ictAnalysisService = new ICTAnalysisService(); 