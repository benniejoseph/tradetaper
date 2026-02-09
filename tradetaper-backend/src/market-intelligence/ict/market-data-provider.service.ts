import { safeToFixed } from './ict-utils';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TradingViewRealtimeService } from './tradingview-realtime.service';

export interface Candle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketDataRequest {
  symbol: string;
  timeframe: string; // '1m', '5m', '15m', '1h', '4h', '1d', '1w'
  limit?: number; // Number of candles (default 100)
}

export interface MarketDataResponse {
  data: Candle[];
  source: 'tradingview' | 'twelvedata' | 'fallback';
  symbol: string;
  timestamp: Date;
}

@Injectable()
export class MarketDataProviderService {
  private readonly logger = new Logger(MarketDataProviderService.name);

  // Cache for market data (5 minutes)
  private cache = new Map<
    string,
    { data: Candle[]; source: string; timestamp: number }
  >();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly tradingViewService: TradingViewRealtimeService,
  ) {}

  /**
   * Get historical price data for any symbol
   * Returns both data and source information
   */
  async getPriceDataWithSource(
    request: MarketDataRequest,
  ): Promise<MarketDataResponse> {
    const { symbol, timeframe, limit = 100 } = request;

    const cacheKey = `${symbol}_${timeframe}_${limit}`;
    const cached = this.cache.get(cacheKey);

    // Return cached data if fresh
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.log(`Cache hit for ${cacheKey} (source: ${cached.source})`);
      return {
        data: cached.data,
        source: cached.source as 'tradingview' | 'twelvedata' | 'fallback',
        symbol,
        timestamp: new Date(cached.timestamp),
      };
    }

    this.logger.log(`Fetching real market data for ${symbol} on ${timeframe}`);

    let data: Candle[];
    let source: 'tradingview' | 'twelvedata' | 'fallback' = 'fallback';

    // Try TradingView first (PREMIUM - Real-time data)
    if (this.tradingViewService.isConnected()) {
      this.logger.log(`🔴 Using TradingView REAL-TIME data for ${symbol}`);
      try {
        data = await this.tradingViewService.getRealtimeCandles(
          symbol,
          timeframe,
          limit,
        );
        if (data && data.length > 0) {
          source = 'tradingview';
          this.cache.set(cacheKey, { data, source, timestamp: Date.now() });
          return { data, source, symbol, timestamp: new Date() };
        }
      } catch (error) {
        this.logger.warn(
          `TradingView failed, falling back to Twelve Data: ${error.message}`,
        );
      }
    }

    // Try Twelve Data for ALL assets (Forex, Commodities, Crypto, Stocks)
    this.logger.log(`📊 Using Twelve Data for ${symbol}`);
    try {
      data = await this.getTwelveData(symbol, timeframe, limit);
      if (data && data.length > 0) {
        source = 'twelvedata';
        this.cache.set(cacheKey, { data, source, timestamp: Date.now() });
        return { data, source, symbol, timestamp: new Date() };
      }
    } catch (error) {
      this.logger.warn(`Twelve Data failed: ${error.message}`);
    }

    // Final fallback - generated data
    this.logger.warn(
      `⚠️ All sources failed, using fallback data for ${symbol}`,
    );
    data = this.generateFallbackData(symbol, limit);
    source = 'fallback';
    this.cache.set(cacheKey, { data, source, timestamp: Date.now() });

    return { data, source, symbol, timestamp: new Date() };
  }

  /**
   * Legacy method - returns just the candles array
   */
  async getPriceData(request: MarketDataRequest): Promise<Candle[]> {
    const response = await this.getPriceDataWithSource(request);
    return response.data;
  }

  /**
   * Get data from Twelve Data API (supports Forex, Commodities, Crypto, Stocks)
   */
  private async getTwelveData(
    symbol: string,
    timeframe: string,
    limit: number,
  ): Promise<Candle[]> {
    const apiKey = this.configService.get<string>('TWELVE_DATA_API_KEY');

    if (!apiKey) {
      this.logger.warn('TWELVE_DATA_API_KEY not set');
      throw new Error('Twelve Data API key not configured');
    }

    // Convert symbol format for Twelve Data
    const twelveSymbol = this.toTwelveDataSymbol(symbol);
    const interval = this.toTwelveDataInterval(timeframe);

    this.logger.log(
      `Fetching from Twelve Data: ${twelveSymbol} (original: ${symbol})`,
    );

    const url = 'https://api.twelvedata.com/time_series';
    const response = await firstValueFrom(
      this.httpService.get(url, {
        params: {
          symbol: twelveSymbol,
          interval,
          outputsize: limit,
          apikey: apiKey,
        },
        timeout: 15000,
      }),
    );

    if (response.data.status === 'error') {
      throw new Error(response.data.message || 'Twelve Data API error');
    }

    const values = response.data.values || [];

    if (values.length === 0) {
      throw new Error('No data returned from Twelve Data');
    }

    return values
      .map((candle: any) => ({
        timestamp: new Date(candle.datetime),
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
        volume: parseFloat(candle.volume || 0),
      }))
      .reverse(); // Twelve Data returns newest first, reverse it
  }

  /**
   * Convert symbol to Twelve Data format
   */
  private toTwelveDataSymbol(symbol: string): string {
    // Commodities
    const commodityMapping: Record<string, string> = {
      XAUUSD: 'XAU/USD', // Gold
      XAGUSD: 'XAG/USD', // Silver
      XTIUSD: 'WTI/USD', // Oil WTI
      XBRUSD: 'BRENT/USD', // Brent Oil
    };

    if (commodityMapping[symbol]) {
      return commodityMapping[symbol];
    }

    // Forex pairs - add slash
    if (this.isForex(symbol) && !symbol.includes('/')) {
      return `${symbol.slice(0, 3)}/${symbol.slice(3, 6)}`;
    }

    // Crypto - add slash and adjust format
    if (this.isCrypto(symbol)) {
      const base = symbol.replace('USD', '').replace('USDT', '');
      return `${base}/USD`;
    }

    return symbol;
  }

  /**
   * Generate realistic fallback data when APIs fail
   * Uses current approximate market prices (updated Dec 2024)
   */
  private generateFallbackData(symbol: string, limit: number): Candle[] {
    this.logger.warn(`Generating fallback data for ${symbol}`);

    const basePrice = this.getBasePrice(symbol);
    const data: Candle[] = [];
    let currentPrice = basePrice;

    for (let i = 0; i < limit; i++) {
      const change = (Math.random() - 0.5) * (basePrice * 0.002); // 0.2% max change
      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) + Math.random() * (basePrice * 0.001);
      const low = Math.min(open, close) - Math.random() * (basePrice * 0.001);

      data.push({
        timestamp: new Date(Date.now() - (limit - i) * 3600000), // Hourly candles
        open,
        high,
        low,
        close,
        volume: Math.random() * 1000000 + 100000,
      });

      currentPrice = close;
    }

    return data;
  }

  /**
   * Helper methods
   */
  private isCrypto(symbol: string): boolean {
    return (
      symbol.includes('BTC') ||
      symbol.includes('ETH') ||
      symbol.includes('USDT') ||
      symbol.includes('BNB') ||
      symbol.includes('SOL') ||
      symbol.includes('XRP') ||
      symbol.includes('ADA') ||
      symbol.includes('DOGE')
    );
  }

  private isCommodity(symbol: string): boolean {
    const commodities = [
      'XAUUSD',
      'XAGUSD',
      'XTIUSD',
      'XBRUSD',
      'XPTUSD',
      'XPDUSD',
    ];
    return commodities.some((comm) => symbol.includes(comm));
  }

  private isForex(symbol: string): boolean {
    const forexPairs = [
      'EURUSD',
      'GBPUSD',
      'USDJPY',
      'AUDUSD',
      'USDCAD',
      'USDCHF',
      'NZDUSD',
      'EURGBP',
      'EURJPY',
      'GBPJPY',
    ];
    return forexPairs.some((pair) => symbol.includes(pair));
  }

  private toTwelveDataInterval(timeframe: string): string {
    const mapping: Record<string, string> = {
      '1m': '1min',
      '5m': '5min',
      '15m': '15min',
      '1h': '1h',
      '1H': '1h',
      '4h': '4h',
      '4H': '4h',
      '1d': '1day',
      '1D': '1day',
      '1w': '1week',
      '1W': '1week',
    };
    return mapping[timeframe] || '1h';
  }

  /**
   * Get approximate current base prices (Dec 2024 values)
   */
  private getBasePrice(symbol: string): number {
    const prices: Record<string, number> = {
      EURUSD: 1.042,
      GBPUSD: 1.255,
      USDJPY: 157.5,
      AUDUSD: 0.622,
      USDCAD: 1.438,
      USDCHF: 0.905,
      NZDUSD: 0.562,
      XAUUSD: 2630.0, // Gold - Updated Dec 2024
      XAGUSD: 29.5, // Silver
      BTCUSD: 94500.0, // Bitcoin - Updated Dec 2024
      ETHUSD: 3350.0, // Ethereum
      SPX500: 5880.0,
      NASDAQ100: 21200.0,
    };
    return prices[symbol] || 100.0;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log('Market data cache cleared');
  }
}
