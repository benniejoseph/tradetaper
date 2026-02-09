import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { NewsAnalysisService } from './news-analysis.service';
import { ICTAnalysisService } from './ict-analysis.service';
import { EconomicCalendarService } from './economic-calendar.service';
import { AIMarketPredictionService } from './ai-market-prediction.service';
import { MarketDataAggregatorService } from './market-data-aggregator.service';

export interface MarketQuote {
  symbol: string;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  timestamp: Date;
}

export interface MarketSentiment {
  overall: 'bullish' | 'bearish' | 'neutral';
  score: number;
  confidence: number;
  factors: string[];
  symbols: Record<
    string,
    {
      sentiment: 'bullish' | 'bearish' | 'neutral';
      score: number;
      volume: number;
    }
  >;
}

@Injectable()
export class MarketIntelligenceService {
  private readonly logger = new Logger(MarketIntelligenceService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly newsAnalysisService: NewsAnalysisService,
    private readonly ictAnalysisService: ICTAnalysisService,
    private readonly economicCalendarService: EconomicCalendarService,
    private readonly aiPredictionService: AIMarketPredictionService,
    private readonly marketDataAggregator: MarketDataAggregatorService,
  ) {}

  async getComprehensiveMarketIntelligence() {
    this.logger.log('Gathering comprehensive market intelligence');

    try {
      const majorSymbols = [
        'XAUUSD',
        'EURUSD',
        'GBPUSD',
        'USDJPY',
        'SPX500',
        'NASDAQ100',
      ];

      // Gather all data in parallel for speed
      const [
        marketQuotes,
        marketNews,
        marketSentiment,
        economicEvents,
        ictOpportunities,
        aiPredictions,
      ] = await Promise.all([
        this.getLiveQuotes(majorSymbols),
        this.newsAnalysisService
          .getMarketNews()
          .then((result) => result.news.slice(0, 20)),
        this.getMarketSentiment(majorSymbols),
        this.economicCalendarService.getTodaysEvents(),
        this.ictAnalysisService.getTradeOpportunities(majorSymbols),
        this.aiPredictionService.generateMultiSymbolPredictions(majorSymbols),
      ]);

      return {
        timestamp: new Date(),
        marketQuotes,
        marketNews,
        marketSentiment,
        economicEvents,
        ictOpportunities,
        aiPredictions,
        summary: {
          totalOpportunities: ictOpportunities.length,
          highImpactEvents: economicEvents.filter(
            (e) => e.importance === 'high',
          ).length,
          averageSentimentScore: marketSentiment.score,
          topMovers: this.getTopMovers(marketQuotes),
        },
      };
    } catch (error) {
      this.logger.error(
        'Failed to gather comprehensive market intelligence',
        error,
      );
      throw error;
    }
  }

  async getLiveQuotes(symbols: string[]): Promise<MarketQuote[]> {
    this.logger.log(`Getting live quotes for ${symbols.length} symbols`);

    try {
      return await this.marketDataAggregator.getLiveQuotes(symbols);
    } catch (error) {
      this.logger.error('Failed to get live quotes', error);
      // Return mock data as fallback
      return symbols.map((symbol) => this.generateMockQuote(symbol));
    }
  }

  async getMarketSentiment(symbols: string[]): Promise<MarketSentiment> {
    this.logger.log('Calculating market sentiment');

    try {
      // Get news sentiment
      const newsResult = await this.newsAnalysisService.getMarketNews();
      const news = newsResult.news.slice(0, 100);

      // Calculate sentiment based on news, price movements, and volume
      const sentimentData = await Promise.all(
        symbols.map(async (symbol) => {
          const quote = await this.marketDataAggregator.getLiveQuote(symbol);
          const symbolNews = news.filter(
            (n) =>
              n.symbols.includes(symbol) ||
              n.title.toLowerCase().includes(symbol.toLowerCase()),
          );

          // Calculate sentiment score based on multiple factors
          let sentimentScore = 0;
          const sentimentReasons: string[] = [];

          // Price change factor
          if (quote && quote.changePercent > 1) {
            sentimentScore += 0.3;
            sentimentReasons.push('Strong positive price movement');
          } else if (quote && quote.changePercent < -1) {
            sentimentScore -= 0.3;
            sentimentReasons.push('Strong negative price movement');
          }

          // News sentiment factor
          const newsSentiment = this.calculateNewsSentiment(symbolNews);
          sentimentScore += newsSentiment * 0.4;

          // Volume factor
          if (
            quote &&
            quote.volume &&
            quote.averageVolume &&
            quote.volume > quote.averageVolume * 1.5
          ) {
            sentimentScore += 0.2;
            sentimentReasons.push('Above average volume');
          }

          // Technical factor (RSI-like calculation)
          const technicalSentiment = quote
            ? this.calculateTechnicalSentiment(quote)
            : 0;
          sentimentScore += technicalSentiment * 0.3;

          const sentiment =
            sentimentScore > 0.2
              ? 'bullish'
              : sentimentScore < -0.2
                ? 'bearish'
                : 'neutral';

          return {
            symbol,
            sentiment,
            score: Math.round(sentimentScore * 100) / 100,
            volume: quote?.volume || 0,
            reasons: sentimentReasons,
          };
        }),
      );

      // Calculate overall market sentiment
      const overallScore =
        sentimentData.reduce((sum, data) => sum + data.score, 0) /
        sentimentData.length;
      const overallSentiment =
        overallScore > 0.2
          ? 'bullish'
          : overallScore < -0.2
            ? 'bearish'
            : 'neutral';

      const symbolsData = sentimentData.reduce((acc, data) => {
        acc[data.symbol] = {
          sentiment: data.sentiment,
          score: data.score,
          volume: data.volume,
        };
        return acc;
      }, {} as any);

      return {
        overall: overallSentiment,
        score: Math.round(overallScore * 100) / 100,
        confidence: Math.min(100, Math.abs(overallScore * 100) + 50),
        factors: sentimentData.flatMap((d) => d.reasons),
        symbols: symbolsData,
      };
    } catch (error) {
      this.logger.error('Failed to calculate market sentiment', error);
      return this.generateMockSentiment(symbols);
    }
  }

  private calculateNewsSentiment(news: any[]): number {
    if (news.length === 0) return 0;

    let score = 0;
    news.forEach((article) => {
      // Simple sentiment analysis based on keywords
      const title = article.title.toLowerCase();
      const content = (article.content || '').toLowerCase();
      const text = title + ' ' + content;

      // Positive indicators
      if (
        text.match(
          /\b(gain|rise|surge|rally|bullish|positive|growth|strong|up|increase)\b/g,
        )
      ) {
        score += 0.1;
      }

      // Negative indicators
      if (
        text.match(
          /\b(fall|drop|decline|crash|bearish|negative|weak|down|decrease|loss)\b/g,
        )
      ) {
        score -= 0.1;
      }

      // High impact words
      if (
        text.match(/\b(breakout|breakthrough|record|historic|significant)\b/g)
      ) {
        score += 0.05;
      }

      if (text.match(/\b(crisis|collapse|panic|emergency|warning)\b/g)) {
        score -= 0.05;
      }
    });

    return Math.max(-1, Math.min(1, score / news.length));
  }

  private calculateTechnicalSentiment(quote: MarketQuote): number {
    // Simple RSI-like calculation
    const pricePosition = (quote.bid - quote.low) / (quote.high - quote.low);

    if (pricePosition > 0.7) return 0.3; // Overbought but bullish
    if (pricePosition < 0.3) return -0.3; // Oversold but bearish
    if (pricePosition > 0.5) return 0.1; // Above midpoint
    return -0.1; // Below midpoint
  }

  private getTopMovers(
    quotes: MarketQuote[],
  ): Array<{ symbol: string; changePercent: number }> {
    return quotes
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 3)
      .map((q) => ({ symbol: q.symbol, changePercent: q.changePercent }));
  }

  private generateMockQuote(symbol: string): MarketQuote {
    const basePrice = this.getBasePriceForSymbol(symbol);
    const changePercent = (Math.random() - 0.5) * 4; // -2% to +2%
    const change = basePrice * (changePercent / 100);

    return {
      symbol,
      bid: basePrice + change - 0.0001,
      ask: basePrice + change + 0.0001,
      change,
      changePercent: Math.round(changePercent * 100) / 100,
      high: basePrice + Math.abs(change) * 1.5,
      low: basePrice - Math.abs(change) * 1.5,
      volume: Math.floor(Math.random() * 1000000) + 100000,
      timestamp: new Date(),
    };
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

  private generateMockSentiment(symbols: string[]): MarketSentiment {
    const symbolsData = symbols.reduce((acc, symbol) => {
      const sentiment = ['bullish', 'bearish', 'neutral'][
        Math.floor(Math.random() * 3)
      ] as any;
      acc[symbol] = {
        sentiment,
        score: (Math.random() - 0.5) * 2,
        volume: Math.floor(Math.random() * 1000000) + 100000,
      };
      return acc;
    }, {} as any);

    return {
      overall: 'neutral',
      score: 0.1,
      confidence: 75,
      factors: ['Market consolidation', 'Mixed economic signals'],
      symbols: symbolsData,
    };
  }
}
