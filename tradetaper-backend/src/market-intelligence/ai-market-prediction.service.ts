import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

export interface AIMarketPrediction {
  symbol: string;
  timeframe: '1H' | '4H' | '1D' | '1W';
  prediction: {
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number; // 0-100
    targetPrice: number;
    timeToTarget: number; // hours
    probability: number; // 0-100
  };
  technicalAnalysis: {
    trend:
      | 'strong_bullish'
      | 'bullish'
      | 'neutral'
      | 'bearish'
      | 'strong_bearish';
    momentum: number; // -100 to 100
    volatility: 'low' | 'medium' | 'high';
    keyLevels: {
      support: number[];
      resistance: number[];
    };
  };
  fundamentalFactors: {
    economic: number; // -100 to 100
    geopolitical: number; // -100 to 100
    sentiment: number; // -100 to 100
  };
  riskFactors: string[];
  rationale: string;
  timestamp: Date;
}

@Injectable()
export class AIMarketPredictionService {
  private readonly logger = new Logger(AIMarketPredictionService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async generateMarketPrediction(symbol: string): Promise<AIMarketPrediction> {
    this.logger.log(`Generating AI market prediction for ${symbol}`);

    try {
      // In production, this would use sophisticated AI models:
      // - Machine Learning models trained on historical data
      // - Natural Language Processing for news sentiment
      // - Technical indicator analysis
      // - Pattern recognition algorithms

      return this.generateAdvancedPrediction(symbol);
    } catch (error) {
      this.logger.error(`Failed to generate prediction for ${symbol}`, error);
      throw error;
    }
  }

  async generateMultiSymbolPredictions(
    symbols: string[],
  ): Promise<AIMarketPrediction[]> {
    this.logger.log(`Generating predictions for ${symbols.length} symbols`);

    try {
      const predictions = await Promise.all(
        symbols.map((symbol) => this.generateMarketPrediction(symbol)),
      );

      return predictions.sort(
        (a, b) => b.prediction.confidence - a.prediction.confidence,
      );
    } catch (error) {
      this.logger.error('Failed to generate multi-symbol predictions', error);
      return [];
    }
  }

  private generateAdvancedPrediction(symbol: string): AIMarketPrediction {
    const basePrice = this.getBasePriceForSymbol(symbol);

    // Simulate AI analysis with sophisticated logic
    const technicalScore = this.calculateTechnicalScore(symbol);
    const fundamentalScore = this.calculateFundamentalScore(symbol);
    const sentimentScore = this.calculateSentimentScore(symbol);

    // Combine scores with weights
    const overallScore =
      technicalScore * 0.4 + fundamentalScore * 0.35 + sentimentScore * 0.25;

    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let confidence = 50;
    let targetPrice = basePrice;

    if (overallScore > 15) {
      direction = 'bullish';
      confidence = Math.min(95, 60 + overallScore);
      targetPrice = basePrice * (1 + overallScore / 1000);
    } else if (overallScore < -15) {
      direction = 'bearish';
      confidence = Math.min(95, 60 + Math.abs(overallScore));
      targetPrice = basePrice * (1 - Math.abs(overallScore) / 1000);
    } else {
      confidence = 40 + Math.random() * 20;
      targetPrice = basePrice * (1 + (Math.random() - 0.5) * 0.01);
    }

    const trend = this.determineTrend(overallScore);
    const momentum = Math.max(-100, Math.min(100, overallScore * 2));
    const volatility = this.calculateVolatility(symbol);

    return {
      symbol,
      timeframe: '1D',
      prediction: {
        direction,
        confidence: Math.round(confidence),
        targetPrice: Math.round(targetPrice * 100) / 100,
        timeToTarget: 24 + Math.random() * 48, // 1-3 days
        probability: Math.round(confidence * 0.9), // Slightly lower than confidence
      },
      technicalAnalysis: {
        trend,
        momentum: Math.round(momentum),
        volatility,
        keyLevels: {
          support: [basePrice * 0.995, basePrice * 0.99, basePrice * 0.985],
          resistance: [basePrice * 1.005, basePrice * 1.01, basePrice * 1.015],
        },
      },
      fundamentalFactors: {
        economic: Math.round(fundamentalScore),
        geopolitical: Math.round((Math.random() - 0.5) * 40),
        sentiment: Math.round(sentimentScore),
      },
      riskFactors: this.generateRiskFactors(symbol, direction),
      rationale: this.generateRationale(
        symbol,
        direction,
        confidence,
        technicalScore,
        fundamentalScore,
        sentimentScore,
      ),
      timestamp: new Date(),
    };
  }

  private calculateTechnicalScore(symbol: string): number {
    // Simulate technical analysis scoring
    const indicators = {
      rsi: 30 + Math.random() * 40, // 30-70 range
      macd: (Math.random() - 0.5) * 2, // -1 to 1
      stochastic: Math.random() * 100,
      bb: (Math.random() - 0.5) * 2, // -1 to 1 (position within bands)
      adx: 20 + Math.random() * 60, // 20-80 range
    };

    let score = 0;

    // RSI analysis
    if (indicators.rsi < 30)
      score += 15; // Oversold - bullish
    else if (indicators.rsi > 70)
      score -= 15; // Overbought - bearish
    else if (indicators.rsi > 50) score += 5; // Above midpoint - slightly bullish

    // MACD analysis
    if (indicators.macd > 0) score += 10;
    else score -= 10;

    // Stochastic analysis
    if (indicators.stochastic < 20) score += 8;
    else if (indicators.stochastic > 80) score -= 8;

    // Bollinger Bands
    if (indicators.bb < -0.5)
      score += 7; // Near lower band - bullish
    else if (indicators.bb > 0.5) score -= 7; // Near upper band - bearish

    // ADX (trend strength)
    if (indicators.adx > 50) {
      // Strong trend - enhance the signal
      score *= 1.2;
    }

    return score;
  }

  private calculateFundamentalScore(symbol: string): number {
    // Simulate fundamental analysis based on symbol type
    let score = 0;

    if (symbol.includes('USD')) {
      // USD pairs - consider Fed policy, economic data
      const fedSentiment = (Math.random() - 0.5) * 30; // -15 to 15
      const economicData = (Math.random() - 0.5) * 20; // -10 to 10
      score = fedSentiment + economicData;
    } else if (symbol === 'XAUUSD') {
      // Gold - inverse to USD strength, safe-haven demand
      const dollarStrength = (Math.random() - 0.5) * 20;
      const safeHavenDemand = Math.random() * 15;
      const inflationExpectations = (Math.random() - 0.5) * 10;
      score = -dollarStrength + safeHavenDemand + inflationExpectations;
    } else if (symbol.includes('SPX') || symbol.includes('NASDAQ')) {
      // Equity indices - consider earnings, economic growth
      const earningsGrowth = (Math.random() - 0.3) * 20; // Slightly bullish bias
      const economicGrowth = (Math.random() - 0.2) * 15;
      const riskAppetite = (Math.random() - 0.3) * 10;
      score = earningsGrowth + economicGrowth + riskAppetite;
    }

    return score;
  }

  private calculateSentimentScore(symbol: string): number {
    // Simulate sentiment analysis from news and social media
    const newssentiment = (Math.random() - 0.5) * 20;
    const socialSentiment = (Math.random() - 0.5) * 15;
    const institutionalFlow = (Math.random() - 0.5) * 25;

    return newssentiment + socialSentiment + institutionalFlow;
  }

  private determineTrend(
    score: number,
  ): 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish' {
    if (score > 30) return 'strong_bullish';
    if (score > 10) return 'bullish';
    if (score < -30) return 'strong_bearish';
    if (score < -10) return 'bearish';
    return 'neutral';
  }

  private calculateVolatility(symbol: string): 'low' | 'medium' | 'high' {
    // Simulate volatility calculation based on symbol characteristics
    const baseVolatility = Math.random();

    if (symbol.includes('JPY') || symbol === 'XAUUSD') {
      // These tend to be more volatile
      return baseVolatility > 0.4 ? 'high' : 'medium';
    } else if (symbol.includes('SPX') || symbol.includes('NASDAQ')) {
      // Equity indices can be quite volatile
      return baseVolatility > 0.5
        ? 'high'
        : baseVolatility > 0.2
          ? 'medium'
          : 'low';
    }

    return baseVolatility > 0.6
      ? 'high'
      : baseVolatility > 0.3
        ? 'medium'
        : 'low';
  }

  private generateRiskFactors(symbol: string, direction: string): string[] {
    const commonRisks = [
      'Unexpected central bank policy changes',
      'Major economic data surprises',
      'Geopolitical events and tensions',
    ];

    const symbolSpecificRisks: Record<string, string[]> = {
      XAUUSD: [
        'Federal Reserve policy shifts',
        'Dollar strength fluctuations',
        'Inflation expectations changes',
      ],
      EURUSD: [
        'ECB monetary policy divergence',
        'European economic data',
        'Brexit-related developments',
      ],
      SPX500: [
        'Corporate earnings disappointments',
        'Interest rate sensitivity',
        'Market liquidity conditions',
      ],
    };

    const risks = [...commonRisks];
    if (symbolSpecificRisks[symbol]) {
      risks.push(...symbolSpecificRisks[symbol]);
    }

    // Add direction-specific risks
    if (direction === 'bullish') {
      risks.push('Profit-taking at resistance levels', 'Overbought conditions');
    } else if (direction === 'bearish') {
      risks.push('Support level holds firm', 'Oversold bounce potential');
    }

    return risks.slice(0, 4); // Return top 4 risks
  }

  private generateRationale(
    symbol: string,
    direction: string,
    confidence: number,
    technicalScore: number,
    fundamentalScore: number,
    sentimentScore: number,
  ): string {
    let rationale = `AI analysis for ${symbol} indicates a ${direction} bias with ${confidence}% confidence. `;

    if (Math.abs(technicalScore) > Math.abs(fundamentalScore)) {
      rationale += `Technical indicators are the primary driver, showing `;
      if (technicalScore > 0) {
        rationale += `bullish momentum with oversold conditions and positive trend indicators. `;
      } else {
        rationale += `bearish pressure with overbought conditions and negative momentum. `;
      }
    } else {
      rationale += `Fundamental factors are dominating the analysis, with `;
      if (fundamentalScore > 0) {
        rationale += `positive economic outlook and supportive monetary policy. `;
      } else {
        rationale += `economic headwinds and policy uncertainty creating downward pressure. `;
      }
    }

    if (Math.abs(sentimentScore) > 10) {
      if (sentimentScore > 0) {
        rationale += `Market sentiment is notably positive, providing additional bullish support. `;
      } else {
        rationale += `Market sentiment remains pessimistic, adding to bearish pressure. `;
      }
    }

    rationale += `Risk management is essential given current market volatility.`;

    return rationale;
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
