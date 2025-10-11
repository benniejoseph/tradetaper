import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface StockTwitsMessage {
  id: number;
  body: string;
  createdAt: Date;
  user: {
    username: string;
    followers: number;
    following: number;
    official: boolean;
  };
  symbols: string[];
  sentiment?: 'bullish' | 'bearish';
  likes: number;
  reshares: number;
}

export interface StockTwitsSentiment {
  symbol: string;
  totalMessages: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  bullishPercentage: number;
  bearishPercentage: number;
  neutralPercentage: number;
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number; // -100 to 100
  volumeScore: number; // Message volume vs average
  messages: StockTwitsMessage[];
  timestamp: Date;
}

@Injectable()
export class StockTwitsService {
  private readonly logger = new Logger(StockTwitsService.name);
  private readonly BASE_URL = 'https://api.stocktwits.com/api/2';

  // Cache to reduce API calls
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private readonly httpService: HttpService) {
    this.logger.log('StockTwits Service initialized (FREE public API)');
  }

  /**
   * Get sentiment analysis for a symbol
   */
  async getSymbolSentiment(symbol: string): Promise<StockTwitsSentiment> {
    const cacheKey = `sentiment_${symbol}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for ${symbol} sentiment`);
      return cached;
    }

    try {
      // Fetch recent messages for symbol (public API, no key needed)
      const messages = await this.getSymbolStream(symbol);

      // Analyze sentiment
      let bullishCount = 0;
      let bearishCount = 0;
      let neutralCount = 0;

      messages.forEach((msg) => {
        if (msg.sentiment === 'bullish') bullishCount++;
        else if (msg.sentiment === 'bearish') bearishCount++;
        else neutralCount++;
      });

      const totalMessages = messages.length;
      const bullishPercentage = (bullishCount / totalMessages) * 100;
      const bearishPercentage = (bearishCount / totalMessages) * 100;
      const neutralPercentage = (neutralCount / totalMessages) * 100;

      // Calculate overall sentiment
      let overallSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      let sentimentScore = 0;

      if (bullishCount > bearishCount * 1.5) {
        overallSentiment = 'bullish';
        sentimentScore = ((bullishCount - bearishCount) / totalMessages) * 100;
      } else if (bearishCount > bullishCount * 1.5) {
        overallSentiment = 'bearish';
        sentimentScore = ((bearishCount - bullishCount) / totalMessages) * 100;
      }

      // Calculate volume score (compared to typical volume)
      const volumeScore = this.calculateVolumeScore(totalMessages);

      const result: StockTwitsSentiment = {
        symbol,
        totalMessages,
        bullishCount,
        bearishCount,
        neutralCount,
        bullishPercentage,
        bearishPercentage,
        neutralPercentage,
        overallSentiment,
        sentimentScore,
        volumeScore,
        messages,
        timestamp: new Date(),
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error(`Error fetching StockTwits data for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Get trending symbols
   */
  async getTrendingSymbols(limit: number = 30): Promise<string[]> {
    const cacheKey = 'trending';
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.BASE_URL}/trending/symbols.json`, {
          timeout: 10000,
        })
      );

      const symbols = response.data.symbols
        .slice(0, limit)
        .map((s: any) => s.symbol);

      this.setCache(cacheKey, symbols);
      return symbols;
    } catch (error) {
      this.logger.error('Error fetching trending symbols:', error.message);
      return [];
    }
  }

  /**
   * Get symbol stream (recent messages)
   */
  private async getSymbolStream(
    symbol: string,
    limit: number = 30
  ): Promise<StockTwitsMessage[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.BASE_URL}/streams/symbol/${symbol}.json`,
          {
            params: { limit },
            timeout: 10000,
          }
        )
      );

      return response.data.messages.map((msg: any) => ({
        id: msg.id,
        body: msg.body,
        createdAt: new Date(msg.created_at),
        user: {
          username: msg.user.username,
          followers: msg.user.followers,
          following: msg.user.following,
          official: msg.user.official || false,
        },
        symbols: msg.symbols.map((s: any) => s.symbol),
        sentiment: msg.entities?.sentiment?.basic,
        likes: msg.likes?.total || 0,
        reshares: msg.reshares?.reshared_count || 0,
      }));
    } catch (error) {
      this.logger.warn(`Failed to fetch stream for ${symbol}:`, error.message);
      return [];
    }
  }

  /**
   * Get multiple symbol sentiments
   */
  async getMultipleSymbolSentiments(
    symbols: string[]
  ): Promise<StockTwitsSentiment[]> {
    this.logger.log(`Fetching sentiment for ${symbols.length} symbols`);

    const results: StockTwitsSentiment[] = [];

    // Process in batches to respect rate limits
    for (const symbol of symbols) {
      try {
        const sentiment = await this.getSymbolSentiment(symbol);
        results.push(sentiment);

        // Rate limiting: wait between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        this.logger.warn(`Skipping ${symbol} due to error`);
      }
    }

    return results;
  }

  /**
   * Get watchlist sentiment (aggregate multiple symbols)
   */
  async getWatchlistSentiment(symbols: string[]): Promise<{
    overall: 'bullish' | 'bearish' | 'neutral';
    score: number;
    symbolSentiments: { symbol: string; sentiment: string; score: number }[];
  }> {
    const sentiments = await this.getMultipleSymbolSentiments(symbols);

    let totalBullish = 0;
    let totalBearish = 0;
    let totalNeutral = 0;

    const symbolSentiments = sentiments.map((s) => {
      if (s.overallSentiment === 'bullish') totalBullish++;
      else if (s.overallSentiment === 'bearish') totalBearish++;
      else totalNeutral++;

      return {
        symbol: s.symbol,
        sentiment: s.overallSentiment,
        score: s.sentimentScore,
      };
    });

    let overall: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let score = 0;

    if (totalBullish > totalBearish * 1.5) {
      overall = 'bullish';
      score = ((totalBullish - totalBearish) / sentiments.length) * 100;
    } else if (totalBearish > totalBullish * 1.5) {
      overall = 'bearish';
      score = ((totalBearish - totalBullish) / sentiments.length) * 100;
    }

    return {
      overall,
      score,
      symbolSentiments,
    };
  }

  /**
   * Calculate volume score (how active is discussion)
   */
  private calculateVolumeScore(messageCount: number): number {
    // Typical StockTwits activity baseline
    const typicalVolume = 20;

    if (messageCount > typicalVolume * 3) return 100; // Very high
    if (messageCount > typicalVolume * 2) return 80; // High
    if (messageCount > typicalVolume * 1.5) return 60; // Above average
    if (messageCount > typicalVolume) return 50; // Average
    if (messageCount > typicalVolume * 0.5) return 30; // Below average
    return 10; // Low
  }

  /**
   * Get top influencers discussing a symbol
   */
  async getTopInfluencers(
    symbol: string,
    minFollowers: number = 1000
  ): Promise<{ username: string; followers: number; message: string }[]> {
    const messages = await this.getSymbolStream(symbol, 50);

    const influencers = messages
      .filter((msg) => msg.user.followers >= minFollowers)
      .sort((a, b) => b.user.followers - a.user.followers)
      .slice(0, 10)
      .map((msg) => ({
        username: msg.user.username,
        followers: msg.user.followers,
        message: msg.body,
      }));

    return influencers;
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });

    // Clean old cache entries
    if (this.cache.size > 100) {
      const now = Date.now();
      for (const [k, v] of this.cache.entries()) {
        if (now - v.timestamp > this.CACHE_TTL) {
          this.cache.delete(k);
        }
      }
    }
  }
}

