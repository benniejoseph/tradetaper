import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface LiveQuote {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  timestamp: Date;
  volume: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  averageVolume?: number;
  source: 'alpha_vantage' | 'tradermade' | 'fmp' | 'polygon';
}

export interface MarketSentiment {
  overall: 'bullish' | 'bearish' | 'neutral';
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  sources: string[];
  lastUpdated: Date;
}

@Injectable()
export class MarketDataAggregatorService {
  private readonly logger = new Logger(MarketDataAggregatorService.name);
  private readonly alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
  private readonly tradermadeKey = process.env.TRADERMADE_API_KEY;
  private readonly fmpKey = process.env.FMP_API_KEY;
  private readonly polygonKey = process.env.POLYGON_API_KEY;

  // Cache for rate limiting
  private priceCache = new Map<string, { data: LiveQuote; timestamp: Date }>();
  private sentimentCache: { data: MarketSentiment; timestamp: Date } | null =
    null;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  constructor(private readonly httpService: HttpService) {}

  async getLiveQuotes(symbols: string[]): Promise<LiveQuote[]> {
    this.logger.log(`Fetching live quotes for symbols: ${symbols.join(', ')}`);

    const quotes = await Promise.allSettled(
      symbols.map((symbol) => this.getLiveQuote(symbol)),
    );

    return quotes
      .filter(
        (result): result is PromiseFulfilledResult<LiveQuote> =>
          result.status === 'fulfilled' && result.value !== null,
      )
      .map((result) => result.value);
  }

  async getLiveQuote(symbol: string): Promise<LiveQuote | null> {
    // Check cache first
    const cached = this.priceCache.get(symbol);
    if (
      cached &&
      Date.now() - cached.timestamp.getTime() < this.CACHE_DURATION
    ) {
      return cached.data;
    }

    try {
      // Try multiple sources in order of preference
      let quote = await this.getAlphaVantageQuote(symbol);
      if (!quote) quote = await this.getTradermadeQuote(symbol);
      if (!quote) quote = await this.getFMPQuote(symbol);
      if (!quote) quote = await this.getPolygonQuote(symbol);

      if (quote) {
        this.priceCache.set(symbol, { data: quote, timestamp: new Date() });
        return quote;
      }

      this.logger.warn(`No live quote available for ${symbol} from any source`);
      return null;
    } catch (error) {
      this.logger.error(
        `Error fetching live quote for ${symbol}:`,
        error.message,
      );
      return null;
    }
  }

  private async getAlphaVantageQuote(
    symbol: string,
  ): Promise<LiveQuote | null> {
    if (!this.alphaVantageKey) return null;

    try {
      const response = await firstValueFrom(
        this.httpService.get('https://www.alphavantage.co/query', {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: this.mapToAlphaVantageSymbol(symbol),
            apikey: this.alphaVantageKey,
          },
          timeout: 5000,
        }),
      );

      const data = response.data['Global Quote'];
      if (!data || !data['05. price']) {
        return null;
      }

      const price = parseFloat(data['05. price']);
      const change = parseFloat(data['09. change']);
      const changePercent = parseFloat(
        data['10. change percent'].replace('%', ''),
      );

      return {
        symbol,
        bid: price - 0.0001, // Simulate bid/ask spread
        ask: price + 0.0001,
        spread: 0.0002,
        timestamp: new Date(),
        volume: parseFloat(data['06. volume']) || 50000, // Default volume if not available
        change,
        changePercent,
        high: parseFloat(data['03. high']) || price * 1.01,
        low: parseFloat(data['04. low']) || price * 0.99,
        averageVolume: parseFloat(data['06. volume']) || undefined,
        source: 'alpha_vantage',
      };
    } catch (error) {
      this.logger.debug(`Alpha Vantage failed for ${symbol}: ${error.message}`);
      return null;
    }
  }

  private async getTradermadeQuote(symbol: string): Promise<LiveQuote | null> {
    if (!this.tradermadeKey) return null;

    try {
      const tmSymbol = this.mapToTradermadeSymbol(symbol);
      const response = await firstValueFrom(
        this.httpService.get(`https://marketdata.tradermade.com/api/v1/live`, {
          params: {
            currency: tmSymbol,
            api_key: this.tradermadeKey,
          },
          timeout: 5000,
        }),
      );

      const quote = response.data.quotes?.[0];
      if (!quote) return null;

      return {
        symbol,
        bid: parseFloat(quote.bid),
        ask: parseFloat(quote.ask),
        spread: parseFloat(quote.ask) - parseFloat(quote.bid),
        timestamp: new Date(quote.timestamp * 1000),
        volume: 100000, // Tradermade doesn't provide volume, use default
        change: 0, // Tradermade doesn't provide change in live endpoint
        changePercent: 0,
        high: parseFloat(quote.ask) * 1.01, // Estimate high
        low: parseFloat(quote.bid) * 0.99, // Estimate low
        source: 'tradermade',
      };
    } catch (error) {
      this.logger.debug(`Tradermade failed for ${symbol}: ${error.message}`);
      return null;
    }
  }

  private async getFMPQuote(symbol: string): Promise<LiveQuote | null> {
    if (!this.fmpKey) return null;

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `https://financialmodelingprep.com/api/v3/quote/${symbol}`,
          {
            params: { apikey: this.fmpKey },
            timeout: 5000,
          },
        ),
      );

      const data = response.data[0];
      if (!data) return null;

      return {
        symbol,
        bid: data.price - data.price * 0.0001, // Simulate spread
        ask: data.price + data.price * 0.0001,
        spread: data.price * 0.0002,
        timestamp: new Date(),
        volume: data.volume,
        change: data.change,
        changePercent: data.changesPercentage,
        high: data.dayHigh || data.price * 1.02,
        low: data.dayLow || data.price * 0.98,
        averageVolume: data.avgVolume,
        source: 'fmp',
      };
    } catch (error) {
      this.logger.debug(`FMP failed for ${symbol}: ${error.message}`);
      return null;
    }
  }

  private async getPolygonQuote(symbol: string): Promise<LiveQuote | null> {
    if (!this.polygonKey) return null;

    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://api.polygon.io/v2/last/trade/${symbol}`, {
          params: { apiKey: this.polygonKey },
          timeout: 5000,
        }),
      );

      const data = response.data.results;
      if (!data) return null;

      return {
        symbol,
        bid: data.p - 0.01, // Simulate spread
        ask: data.p + 0.01,
        spread: 0.02,
        timestamp: new Date(data.t),
        volume: data.s,
        change: 0, // Would need additional call for change
        changePercent: 0,
        high: data.p * 1.01, // Estimate daily high
        low: data.p * 0.99, // Estimate daily low
        source: 'polygon',
      };
    } catch (error) {
      this.logger.debug(`Polygon failed for ${symbol}: ${error.message}`);
      return null;
    }
  }

  async getMarketSentiment(): Promise<MarketSentiment> {
    // Check cache
    if (
      this.sentimentCache &&
      Date.now() - this.sentimentCache.timestamp.getTime() <
        this.CACHE_DURATION * 4
    ) {
      return this.sentimentCache.data;
    }

    try {
      const [newsScore, fearGreedIndex, vixData] = await Promise.allSettled([
        this.getNewsSentiment(),
        this.getFearGreedIndex(),
        this.getVIXData(),
      ]);

      let totalScore = 0;
      let count = 0;
      const sources: string[] = [];

      if (newsScore.status === 'fulfilled') {
        totalScore += newsScore.value;
        count++;
        sources.push('news_sentiment');
      }

      if (fearGreedIndex.status === 'fulfilled') {
        totalScore += fearGreedIndex.value;
        count++;
        sources.push('fear_greed_index');
      }

      if (vixData.status === 'fulfilled') {
        totalScore += vixData.value;
        count++;
        sources.push('vix_volatility');
      }

      const avgScore = count > 0 ? totalScore / count : 0;

      const sentiment: MarketSentiment = {
        overall:
          avgScore > 0.2 ? 'bullish' : avgScore < -0.2 ? 'bearish' : 'neutral',
        score: avgScore,
        confidence: count / 3, // Confidence based on available sources
        sources,
        lastUpdated: new Date(),
      };

      this.sentimentCache = { data: sentiment, timestamp: new Date() };
      return sentiment;
    } catch (error) {
      this.logger.error('Error calculating market sentiment:', error);
      return this.getDefaultSentiment();
    }
  }

  private async getNewsSentiment(): Promise<number> {
    if (!this.alphaVantageKey)
      throw new Error('Alpha Vantage key not available');

    const response = await firstValueFrom(
      this.httpService.get('https://www.alphavantage.co/query', {
        params: {
          function: 'NEWS_SENTIMENT',
          apikey: this.alphaVantageKey,
          topics: 'financial_markets',
          limit: 10,
        },
      }),
    );

    if (!response.data.feed) throw new Error('No news data available');

    const sentiments = response.data.feed.map((item: any) =>
      parseFloat(item.overall_sentiment_score),
    );

    return (
      sentiments.reduce((a: number, b: number) => a + b, 0) / sentiments.length
    );
  }

  private async getFearGreedIndex(): Promise<number> {
    try {
      // CNN Fear & Greed Index (free API)
      const response = await firstValueFrom(
        this.httpService.get(
          'https://production.dataviz.cnn.io/index/fearandgreed/graphdata',
        ),
      );

      const latestData = response.data.fear_and_greed_historical.data[0];
      const fearGreedValue = latestData.y; // 0-100 scale

      // Convert to -1 to 1 scale (0-25: fear=-1, 75-100: greed=1)
      return (fearGreedValue - 50) / 50;
    } catch (error) {
      throw new Error('Fear & Greed Index unavailable');
    }
  }

  private async getVIXData(): Promise<number> {
    if (!this.alphaVantageKey)
      throw new Error('Alpha Vantage key not available');

    const response = await firstValueFrom(
      this.httpService.get('https://www.alphavantage.co/query', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: 'VIX',
          apikey: this.alphaVantageKey,
        },
      }),
    );

    const vixPrice = parseFloat(response.data['Global Quote']['05. price']);

    // VIX interpretation: <20 = low fear (bullish), >30 = high fear (bearish)
    if (vixPrice < 20) return 0.5; // Bullish
    if (vixPrice > 30) return -0.5; // Bearish
    return 0; // Neutral
  }

  private mapToAlphaVantageSymbol(symbol: string): string {
    const mapping: { [key: string]: string } = {
      EURUSD: 'EURUSD',
      GBPUSD: 'GBPUSD',
      USDJPY: 'USDJPY',
      XAUUSD: 'GOLD', // Gold
      SPY: 'SPY',
      QQQ: 'QQQ',
      AAPL: 'AAPL',
      MSFT: 'MSFT',
    };
    return mapping[symbol] || symbol;
  }

  private mapToTradermadeSymbol(symbol: string): string {
    const mapping: { [key: string]: string } = {
      EURUSD: 'EURUSD',
      GBPUSD: 'GBPUSD',
      USDJPY: 'USDJPY',
      XAUUSD: 'XAUUSD',
    };
    return mapping[symbol] || symbol;
  }

  private getDefaultSentiment(): MarketSentiment {
    return {
      overall: 'neutral',
      score: 0,
      confidence: 0,
      sources: [],
      lastUpdated: new Date(),
    };
  }
}
