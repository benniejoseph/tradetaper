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

@Injectable()
export class MarketDataProviderService {
  private readonly logger = new Logger(MarketDataProviderService.name);
  
  // Cache for market data (5 minutes)
  private cache = new Map<string, { data: Candle[]; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly tradingViewService: TradingViewRealtimeService,
  ) {}

  /**
   * Get historical price data for any symbol
   */
  async getPriceData(request: MarketDataRequest): Promise<Candle[]> {
    const { symbol, timeframe, limit = 100 } = request;
    
    const cacheKey = `${symbol}_${timeframe}_${limit}`;
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if fresh
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.log(`Cache hit for ${cacheKey}`);
      return cached.data;
    }

    this.logger.log(`Fetching real market data for ${symbol} on ${timeframe}`);

    let data: Candle[];

    // Try TradingView first (PREMIUM - Real-time data)
    if (this.tradingViewService.isConnected()) {
      this.logger.log(`🔴 Using TradingView REAL-TIME data for ${symbol}`);
      try {
        data = await this.tradingViewService.getRealtimeCandles(symbol, timeframe, limit);
        if (data && data.length > 0) {
          this.cache.set(cacheKey, { data, timestamp: Date.now() });
          return data;
        }
      } catch (error) {
        this.logger.warn(`TradingView failed, falling back to free sources: ${error.message}`);
      }
    }

    // Fallback to free data sources
    this.logger.log(`Using free data sources for ${symbol}`);
    
    // Determine asset type and route to appropriate provider
    if (this.isCrypto(symbol)) {
      data = await this.getCryptoData(symbol, timeframe, limit);
    } else if (this.isCommodity(symbol)) {
      // Commodities (Gold, Silver, Oil) use Yahoo Finance
      data = await this.getStockData(symbol, timeframe, limit);
    } else if (this.isForex(symbol)) {
      data = await this.getForexData(symbol, timeframe, limit);
    } else {
      data = await this.getStockData(symbol, timeframe, limit);
    }

    // Cache the result
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }

  /**
   * Get crypto data from Binance (free, no API key needed for public data)
   */
  private async getCryptoData(
    symbol: string,
    timeframe: string,
    limit: number,
  ): Promise<Candle[]> {
    try {
      // Convert symbol format (BTCUSD -> BTCUSDT for Binance)
      const binanceSymbol = symbol.replace('USD', 'USDT').replace('/', '');
      const interval = this.toBinanceInterval(timeframe);

      const url = 'https://api.binance.com/api/v3/klines';
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            symbol: binanceSymbol,
            interval,
            limit,
          },
          timeout: 10000,
        }),
      );

      return response.data.map((candle: any[]) => ({
        timestamp: new Date(candle[0]),
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch crypto data from Binance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get forex data from Twelve Data (free tier: 8 API calls/minute)
   */
  private async getForexData(
    symbol: string,
    timeframe: string,
    limit: number,
  ): Promise<Candle[]> {
    try {
      const apiKey = this.configService.get<string>('TWELVE_DATA_API_KEY');
      
      if (!apiKey) {
        this.logger.warn('TWELVE_DATA_API_KEY not set, using fallback data');
        return this.generateFallbackData(symbol, limit);
      }

      // Convert symbol format (EURUSD -> EUR/USD for Twelve Data)
      const pair = `${symbol.slice(0, 3)}/${symbol.slice(3, 6)}`;
      const interval = this.toTwelveDataInterval(timeframe);

      const url = 'https://api.twelvedata.com/time_series';
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            symbol: pair,
            interval,
            outputsize: limit,
            apikey: apiKey,
          },
          timeout: 10000,
        }),
      );

      if (response.data.status === 'error') {
        throw new Error(response.data.message);
      }

      const values = response.data.values || [];
      return values.map((candle: any) => ({
        timestamp: new Date(candle.datetime),
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
        volume: parseFloat(candle.volume || 0),
      })).reverse(); // Twelve Data returns newest first, reverse it
    } catch (error) {
      this.logger.error(`Failed to fetch forex data from Twelve Data: ${error.message}`);
      return this.generateFallbackData(symbol, limit);
    }
  }

  /**
   * Get stock data from Yahoo Finance (via yfinance2 npm package)
   */
  private async getStockData(
    symbol: string,
    timeframe: string,
    limit: number,
  ): Promise<Candle[]> {
    try {
      // Convert symbol to Yahoo Finance format
      const yahooSymbol = this.toYahooSymbol(symbol);
      const interval = this.toYahooInterval(timeframe);
      const period = this.calculatePeriod(timeframe, limit);

      this.logger.log(`Fetching from Yahoo Finance: ${yahooSymbol} (original: ${symbol})`);

      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            interval,
            range: period,
          },
          timeout: 10000,
        }),
      );

      const result = response.data.chart.result[0];
      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];

      return timestamps.map((timestamp: number, index: number) => ({
        timestamp: new Date(timestamp * 1000),
        open: quotes.open[index],
        high: quotes.high[index],
        low: quotes.low[index],
        close: quotes.close[index],
        volume: quotes.volume[index],
      })).slice(-limit); // Take last 'limit' candles
    } catch (error) {
      this.logger.error(`Failed to fetch stock data from Yahoo Finance: ${error.message}`);
      return this.generateFallbackData(symbol, limit);
    }
  }

  /**
   * Convert symbol to Yahoo Finance format
   */
  private toYahooSymbol(symbol: string): string {
    const yahooMapping: Record<string, string> = {
      'XAUUSD': 'GC=F',     // Gold Futures
      'XAGUSD': 'SI=F',     // Silver Futures
      'BTCUSD': 'BTC-USD',  // Bitcoin
      'ETHUSD': 'ETH-USD',  // Ethereum
    };
    return yahooMapping[symbol] || symbol;
  }

  /**
   * Generate realistic fallback data when APIs fail
   */
  private generateFallbackData(symbol: string, limit: number): Candle[] {
    this.logger.warn(`Generating fallback data for ${symbol}`);
    
    const basePrice = this.getBasePrice(symbol);
    const data: Candle[] = [];
    let currentPrice = basePrice;

    for (let i = 0; i < limit; i++) {
      const change = (Math.random() - 0.5) * (basePrice * 0.02); // 2% max change
      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) + Math.random() * (basePrice * 0.005);
      const low = Math.min(open, close) - Math.random() * (basePrice * 0.005);
      
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
    const commodities = ['XAUUSD', 'XAGUSD', 'XTIUSD', 'XBRUSD', 'XPTUSD', 'XPDUSD'];
    return commodities.some(comm => symbol.includes(comm));
  }

  private isForex(symbol: string): boolean {
    // Forex pairs (excluding commodities)
    const forexPairs = [
      'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 
      'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY'
    ];
    return forexPairs.some(pair => symbol.includes(pair));
  }

  private toBinanceInterval(timeframe: string): string {
    const mapping: Record<string, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d',
      '1w': '1w',
    };
    return mapping[timeframe] || '1h';
  }

  private toTwelveDataInterval(timeframe: string): string {
    const mapping: Record<string, string> = {
      '1m': '1min',
      '5m': '5min',
      '15m': '15min',
      '1h': '1h',
      '4h': '4h',
      '1d': '1day',
      '1w': '1week',
    };
    return mapping[timeframe] || '1h';
  }

  private toYahooInterval(timeframe: string): string {
    const mapping: Record<string, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '4h': '1h', // Yahoo doesn't have 4h, use 1h and aggregate
      '1d': '1d',
      '1w': '1wk',
    };
    return mapping[timeframe] || '1h';
  }

  private calculatePeriod(timeframe: string, limit: number): string {
    const minutes = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '1h': 60,
      '4h': 240,
      '1d': 1440,
      '1w': 10080,
    }[timeframe] || 60;

    const totalMinutes = minutes * limit;
    const days = Math.ceil(totalMinutes / 1440);

    if (days <= 1) return '1d';
    if (days <= 5) return '5d';
    if (days <= 30) return '1mo';
    if (days <= 90) return '3mo';
    if (days <= 180) return '6mo';
    if (days <= 365) return '1y';
    return '2y';
  }

  private getBasePrice(symbol: string): number {
    const prices: Record<string, number> = {
      'EURUSD': 1.0850,
      'GBPUSD': 1.2750,
      'USDJPY': 149.50,
      'XAUUSD': 4107.00,  // Updated to current Gold price
      'XAGUSD': 31.50,    // Silver
      'BTCUSD': 43500.00,
      'ETHUSD': 2300.00,
      'SPX500': 4750.00,
      'NASDAQ100': 16250.00,
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

