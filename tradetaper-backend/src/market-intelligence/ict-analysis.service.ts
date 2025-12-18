import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

export interface ICTLiquidityLevel {
  type: 'buy-side' | 'sell-side';
  price: number;
  strength: 'high' | 'medium' | 'low';
  timeframe: string;
  description: string;
}

export interface ICTFairValueGap {
  type: 'bullish' | 'bearish';
  high: number;
  low: number;
  timeframe: string;
  probability: number;
  reasoning: string;
}

export interface ICTOrderBlock {
  type: 'bullish' | 'bearish';
  price: number;
  strength: number;
  timeframe: string;
  volume: number;
  description: string;
}

export interface ICTMarketStructure {
  trend: 'bullish' | 'bearish' | 'ranging';
  structureShift: boolean;
  keyLevels: number[];
  inducement: {
    present: boolean;
    level: number;
    description: string;
  };
  displacement: {
    present: boolean;
    direction: 'bullish' | 'bearish';
    strength: number;
  };
}

export interface ICTTradeOpportunity {
  symbol: string;
  setup: string;
  direction: 'long' | 'short';
  confidence: number;
  entry: number;
  stopLoss: number;
  takeProfit: number[];
  riskReward: number;
  reasoning: string;
  timeframe: string;
  ictConcepts: string[];
  marketConditions: string[];
}

@Injectable()
export class ICTAnalysisService {
  private readonly logger = new Logger(ICTAnalysisService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getComprehensiveICTAnalysis(symbol: string) {
    this.logger.log(`Getting comprehensive ICT analysis for ${symbol}`);

    try {
      const [
        marketStructure,
        liquidityLevels,
        fairValueGaps,
        orderBlocks,
        tradeSetups,
      ] = await Promise.all([
        this.getMarketStructureAnalysis(symbol),
        this.identifyLiquidityLevels(symbol),
        this.identifyFairValueGaps(symbol),
        this.identifyOrderBlocks(symbol),
        this.identifyTradeSetups(symbol),
      ]);

      return {
        symbol,
        timestamp: new Date(),
        marketStructure,
        liquidityLevels,
        fairValueGaps,
        orderBlocks,
        tradeSetups,
        summary: {
          overallBias: this.calculateOverallBias(
            marketStructure,
            liquidityLevels,
            fairValueGaps,
          ),
          keyLevelsToWatch: this.getKeyLevelsToWatch(
            liquidityLevels,
            orderBlocks,
          ),
          primarySetup:
            tradeSetups.length > 0 ? tradeSetups[0].setup : 'No clear setup',
          riskLevel: this.assessRiskLevel(marketStructure, tradeSetups),
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get ICT analysis for ${symbol}`, error);
      throw error;
    }
  }

  async getMarketStructureAnalysis(
    symbol: string,
  ): Promise<ICTMarketStructure> {
    this.logger.log(`Analyzing market structure for ${symbol}`);

    // In a real implementation, this would analyze price data from multiple timeframes
    // For now, we'll use sophisticated mock data based on ICT principles

    const structureTypes = [
      {
        trend: 'bullish' as const,
        structureShift: true,
        description: 'Break of Structure (BOS) to the upside confirmed',
        keyLevels: [2025.5, 2020.0, 2015.75],
        inducement: {
          present: true,
          level: 2018.5,
          description: 'Liquidity sweep below previous low before reversal',
        },
        displacement: {
          present: true,
          direction: 'bullish' as const,
          strength: 85,
        },
      },
      {
        trend: 'bearish' as const,
        structureShift: true,
        description: 'Change of Character (CHoCH) indicating bearish shift',
        keyLevels: [2030.0, 2025.5, 2020.0],
        inducement: {
          present: true,
          level: 2032.5,
          description: 'Fake breakout above highs before rejection',
        },
        displacement: {
          present: true,
          direction: 'bearish' as const,
          strength: 78,
        },
      },
      {
        trend: 'ranging' as const,
        structureShift: false,
        description: 'Consolidation between key levels',
        keyLevels: [2030.0, 2025.0, 2020.0],
        inducement: {
          present: false,
          level: 0,
          description: 'No clear inducement pattern',
        },
        displacement: {
          present: false,
          direction: 'bullish' as const,
          strength: 30,
        },
      },
    ];

    return structureTypes[Math.floor(Math.random() * structureTypes.length)];
  }

  async identifyLiquidityLevels(symbol: string): Promise<ICTLiquidityLevel[]> {
    this.logger.log(`Identifying liquidity levels for ${symbol}`);

    const basePrice = this.getBasePriceForSymbol(symbol);

    return [
      {
        type: 'sell-side',
        price: basePrice - basePrice * 0.005,
        strength: 'high',
        timeframe: '4H',
        description:
          'Equal lows with multiple rejections - high probability liquidity target',
      },
      {
        type: 'buy-side',
        price: basePrice + basePrice * 0.004,
        strength: 'medium',
        timeframe: '1H',
        description:
          'Previous day high with stop hunts - institutional liquidity zone',
      },
      {
        type: 'sell-side',
        price: basePrice - basePrice * 0.002,
        strength: 'medium',
        timeframe: '15M',
        description: 'Recent swing low - short-term liquidity resting',
      },
      {
        type: 'buy-side',
        price: basePrice + basePrice * 0.007,
        strength: 'high',
        timeframe: 'Daily',
        description:
          'Weekly high with algorithmic selling - major liquidity pool',
      },
    ];
  }

  async identifyFairValueGaps(symbol: string): Promise<ICTFairValueGap[]> {
    this.logger.log(`Identifying Fair Value Gaps for ${symbol}`);

    const basePrice = this.getBasePriceForSymbol(symbol);

    return [
      {
        type: 'bullish',
        high: basePrice + basePrice * 0.003,
        low: basePrice + basePrice * 0.001,
        timeframe: '15M',
        probability: 78,
        reasoning:
          'Unfilled gap created during institutional accumulation phase - price likely to revisit',
      },
      {
        type: 'bearish',
        high: basePrice - basePrice * 0.001,
        low: basePrice - basePrice * 0.003,
        timeframe: '1H',
        probability: 65,
        reasoning:
          'Gap formed during smart money distribution - potential target for retracement',
      },
    ];
  }

  async identifyOrderBlocks(symbol: string): Promise<ICTOrderBlock[]> {
    this.logger.log(`Identifying Order Blocks for ${symbol}`);

    const basePrice = this.getBasePriceForSymbol(symbol);

    return [
      {
        type: 'bullish',
        price: basePrice - basePrice * 0.002,
        strength: 85,
        timeframe: '1H',
        volume: 2500000,
        description:
          'Last down candle before strong bullish displacement - institutional demand zone',
      },
      {
        type: 'bearish',
        price: basePrice + basePrice * 0.0025,
        strength: 72,
        timeframe: '4H',
        volume: 1800000,
        description:
          'Last up candle before bearish displacement - smart money supply zone',
      },
    ];
  }

  async identifyTradeSetups(symbol: string): Promise<ICTTradeOpportunity[]> {
    this.logger.log(`Identifying ICT trade setups for ${symbol}`);

    const basePrice = this.getBasePriceForSymbol(symbol);

    // Sophisticated ICT-based trade setups
    const setups = [
      {
        symbol,
        setup: 'Liquidity Sweep and Reversal',
        direction: 'long' as const,
        confidence: 82,
        entry: basePrice - basePrice * 0.001,
        stopLoss: basePrice - basePrice * 0.003,
        takeProfit: [
          basePrice + basePrice * 0.002,
          basePrice + basePrice * 0.004,
          basePrice + basePrice * 0.006,
        ],
        riskReward: 3.0,
        reasoning:
          'Sell-side liquidity sweep below previous low followed by strong bullish displacement. Price showing signs of institutional accumulation with order block support.',
        timeframe: '15M/1H',
        ictConcepts: [
          'Liquidity Sweep',
          'Market Structure Shift',
          'Order Block',
          'Fair Value Gap',
          'Institutional Order Flow',
        ],
        marketConditions: [
          'Clear break of structure to upside',
          'Liquidity grabbed below lows',
          'Strong displacement candle',
          'Volume confirmation',
          'Daily bias bullish',
        ],
      },
      {
        symbol,
        setup: 'Order Block Rejection',
        direction: 'short' as const,
        confidence: 75,
        entry: basePrice + basePrice * 0.0015,
        stopLoss: basePrice + basePrice * 0.003,
        takeProfit: [
          basePrice - basePrice * 0.002,
          basePrice - basePrice * 0.004,
        ],
        riskReward: 2.5,
        reasoning:
          'Price approaching bearish order block with signs of institutional distribution. Looking for rejection at premium pricing with bearish displacement.',
        timeframe: '1H/4H',
        ictConcepts: [
          'Order Block',
          'Premium/Discount Pricing',
          'Smart Money Distribution',
          'Displacement',
        ],
        marketConditions: [
          'Price at premium levels',
          'Approaching key order block',
          'Bearish divergence',
          'Low volume on push up',
        ],
      },
      {
        symbol,
        setup: 'Fair Value Gap Fill',
        direction: 'long' as const,
        confidence: 68,
        entry: basePrice + basePrice * 0.0005,
        stopLoss: basePrice - basePrice * 0.001,
        takeProfit: [basePrice + basePrice * 0.003],
        riskReward: 2.0,
        reasoning:
          'Bullish FVG showing signs of being respected. Price action suggesting institutional interest in filling the gap before continuation higher.',
        timeframe: '15M',
        ictConcepts: ['Fair Value Gap', 'Mitigation', 'Continuation Pattern'],
        marketConditions: [
          'FVG holding as support',
          'Bullish market structure',
          'Volume increasing on dips',
        ],
      },
    ];

    // Return a random selection to simulate real analysis
    const selectedSetups = setups.slice(0, Math.floor(Math.random() * 3) + 1);
    return selectedSetups.sort((a, b) => b.confidence - a.confidence);
  }

  async getTradeOpportunities(
    symbols: string[],
  ): Promise<ICTTradeOpportunity[]> {
    this.logger.log(
      `Getting ICT trade opportunities for ${symbols.length} symbols`,
    );

    try {
      const opportunities: ICTTradeOpportunity[] = [];

      for (const symbol of symbols) {
        const setups = await this.identifyTradeSetups(symbol);
        opportunities.push(...setups);
      }

      // Sort by confidence and return top opportunities
      return opportunities
        .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
        .slice(0, 10); // Return top 10 opportunities
    } catch (error) {
      this.logger.error('Failed to get trade opportunities', error);
      return [];
    }
  }

  private calculateOverallBias(
    structure: ICTMarketStructure,
    liquidity: ICTLiquidityLevel[],
    gaps: ICTFairValueGap[],
  ): 'bullish' | 'bearish' | 'neutral' {
    let score = 0;

    // Structure bias
    if (structure.trend === 'bullish') score += 3;
    else if (structure.trend === 'bearish') score -= 3;

    // Structure shift
    if (structure.structureShift) {
      score += structure.displacement.direction === 'bullish' ? 2 : -2;
    }

    // Liquidity levels
    const buyLiquidity = liquidity.filter(
      (l) => l.type === 'buy-side' && l.strength === 'high',
    ).length;
    const sellLiquidity = liquidity.filter(
      (l) => l.type === 'sell-side' && l.strength === 'high',
    ).length;
    score += buyLiquidity - sellLiquidity;

    // Fair value gaps
    const bullishGaps = gaps.filter(
      (g) => g.type === 'bullish' && g.probability > 70,
    ).length;
    const bearishGaps = gaps.filter(
      (g) => g.type === 'bearish' && g.probability > 70,
    ).length;
    score += bullishGaps - bearishGaps;

    if (score > 2) return 'bullish';
    if (score < -2) return 'bearish';
    return 'neutral';
  }

  private getKeyLevelsToWatch(
    liquidity: ICTLiquidityLevel[],
    orderBlocks: ICTOrderBlock[],
  ): number[] {
    const levels = [
      ...liquidity.filter((l) => l.strength === 'high').map((l) => l.price),
      ...orderBlocks.filter((ob) => ob.strength > 75).map((ob) => ob.price),
    ];

    return levels
      .sort((a, b) => a - b)
      .filter(
        (level, index, arr) =>
          index === 0 || Math.abs(level - arr[index - 1]) > level * 0.001,
      )
      .slice(0, 5);
  }

  private assessRiskLevel(
    structure: ICTMarketStructure,
    setups: ICTTradeOpportunity[],
  ): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // Market structure risk
    if (structure.trend === 'ranging') riskScore += 2;
    if (!structure.structureShift) riskScore += 1;
    if (structure.displacement.strength < 50) riskScore += 2;

    // Setup risk
    if (setups.length === 0) riskScore += 3;
    else {
      const avgConfidence =
        setups.reduce((sum, s) => sum + s.confidence, 0) / setups.length;
      if (avgConfidence < 60) riskScore += 2;
      else if (avgConfidence < 70) riskScore += 1;
    }

    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }

  private getBasePriceForSymbol(symbol: string): number {
    const basePrices: Record<string, number> = {
      XAUUSD: 2030.5,
      EURUSD: 1.085,
      GBPUSD: 1.275,
      USDJPY: 149.5,
      SPX500: 4750.0,
      NASDAQ100: 16250.0,
    };
    return basePrices[symbol] || 1.0;
  }
}
