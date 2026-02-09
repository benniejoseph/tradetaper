import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MultiModelOrchestratorService } from '../agents/llm/multi-model-orchestrator.service';
import { MarketDataAggregatorService } from './market-data-aggregator.service';
import { EconomicCalendarService } from './economic-calendar.service';
import { NewsAnalysisService } from './news-analysis.service';

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
    private readonly configService: ConfigService,
    private readonly orchestrator: MultiModelOrchestratorService,
    private readonly marketDataService: MarketDataAggregatorService,
    private readonly economicCalendarService: EconomicCalendarService,
    private readonly newsService: NewsAnalysisService,
  ) {}

  async generateMarketPrediction(symbol: string): Promise<AIMarketPrediction> {
    this.logger.log(`Generating Real-Time AI market prediction for ${symbol}`);

    try {
      // 1. Aggregate Real-Time Data
      const [quote, sentiment, news, economicEvents] = await Promise.all([
        this.marketDataService.getLiveQuote(symbol),
        this.marketDataService.getMarketSentiment(),
        this.newsService.getMarketNews(),
        this.economicCalendarService.getTodaysEvents(),
      ]);

      if (!quote) {
        throw new Error(`Could not fetch live quote for ${symbol}`);
      }

      // 2. Filter data for relevance
      const relevantNews = news.news
        .filter(
          (n) =>
            n.title.includes(symbol) ||
            n.summary.includes(symbol) ||
            (symbol.includes('USD') &&
              (n.category === 'fed' || n.category === 'economy')),
        )
        .slice(0, 5);

      const relevantEvents = economicEvents.filter(
        (e) =>
          e.impact.affectedSymbols.includes(symbol) || e.currency === 'USD',
      );

      // 3. Construct LLM Context
      const context = {
        symbol,
        currentPrice: quote.bid,
        marketData: {
          changePercent: quote.changePercent,
          high: quote.high,
          low: quote.low,
          spread: quote.spread,
        },
        marketSentiment: sentiment,
        relevantNews: relevantNews.map((n) => ({
          title: n.title,
          sentiment: n.sentiment,
        })),
        upcomingEvents: relevantEvents.map((e) => ({
          title: e.title,
          impact: e.impact.expected,
        })),
        timestamp: new Date().toISOString(),
      };

      // 4. Prompt Engineering
      const prompt = `
        Act as a Senior Hedge Fund Analyst and ICT Specialist.
        Analyze the following market data for ${symbol} and provide a comprehensive prediction.

        DATA CONTEXT:
        ${JSON.stringify(context, null, 2)}

        ANALYSIS GUIDELINES:
        1. **Technical**: Use the current price action and standard ICT concepts (assume H4 timeframe context).
        2. **Fundamental**: Weigh the impact of recent news and upcoming economic events.
        3. **Sentiment**: Factor in the News Sentiment and Fear & Greed Index.

        OUTPUT REQUIREMENTS (JSON Only):
        - precise target price
        - logical direction (bullish/bearish/neutral)
        - confidence score based on data convergence
        - 3 key support levels and 3 key resistance levels near current price
        - risk factors specific to current environment

        Return strictly valid JSON matching this structure:
        {
          "prediction": { "direction": "enum", "confidence": number, "targetPrice": number, "timeToTarget": number, "probability": number },
          "technicalAnalysis": { "trend": "enum", "momentum": number, "volatility": "enum", "keyLevels": { "support": [], "resistance": [] } },
          "fundamentalFactors": { "economic": number, "geopolitical": number, "sentiment": number },
          "riskFactors": ["string"],
          "rationale": "detailed string (max 300 chars)"
        }
      `;

      // 5. Call Gemini
      const response = await this.orchestrator.complete({
        prompt,
        modelPreference: 'gemini-2.0-flash',
        taskComplexity: 'complex',
        requireJson: true,
        optimizeFor: 'quality',
      });

      const result = JSON.parse(
        response.content
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim(),
      );

      return {
        symbol,
        timeframe: '4H',
        ...result,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to generate prediction for ${symbol}`, error);
      // Fallback or rethrow
      throw error;
    }
  }

  async generateMultiSymbolPredictions(
    symbols: string[],
  ): Promise<AIMarketPrediction[]> {
    this.logger.log(`Generating predictions for ${symbols.length} symbols`);
    try {
      // Process sequentially or with concurrency limit to avoid rate limits
      const predictions: AIMarketPrediction[] = [];
      for (const sym of symbols) {
        try {
          const pred = await this.generateMarketPrediction(sym);
          predictions.push(pred);
        } catch (e) {
          this.logger.warn(`Skipping ${sym} due to error`);
        }
      }
      return predictions.sort(
        (a, b) => b.prediction.confidence - a.prediction.confidence,
      );
    } catch (error) {
      this.logger.error('Failed to generate multi-symbol predictions', error);
      return [];
    }
  }
}
