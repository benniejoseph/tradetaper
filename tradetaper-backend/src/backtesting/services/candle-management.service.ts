import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { MarketCandle } from '../entities/market-candle.entity';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CandleManagementService {
  private readonly logger = new Logger(CandleManagementService.name);

  constructor(
    @InjectRepository(MarketCandle)
    private marketCandleRepo: Repository<MarketCandle>,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  /**
   * Fetch and store candles from Yahoo Finance
   * Uses database as cache layer
   */
  async fetchAndStoreCandles(
    symbol: string,
    timeframe: string,
    startDate: Date,
    endDate: Date,
  ): Promise<MarketCandle[]> {
    // 1. Check if candles already exist in database
    const existing = await this.marketCandleRepo.find({
      where: {
        symbol,
        timeframe,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'ASC' },
    });

    // If we have full coverage, return cached
    const expectedCount = this.calculateExpectedCandles(
      timeframe,
      startDate,
      endDate,
    );
    if (existing.length >= expectedCount * 0.9) {
      // 90% threshold to account for market closures
      this.logger.log(
        `Cache HIT: ${existing.length} candles for ${symbol} ${timeframe}`,
      );
      return existing;
    }

    // 2. Fetch from TwelveData
    this.logger.log(
      `Cache MISS: Fetching from TwelveData (${symbol} ${timeframe})`,
    );
    const candles = await this.fetchFromTwelveData(
      symbol,
      timeframe,
      startDate,
      endDate,
    );

    if (candles.length === 0) {
      this.logger.warn(
        `No candles returned from TwelveData for ${symbol} ${timeframe}`,
      );
      return existing; // Return whatever we have cached
    }

    // 3. Save to database
    const entities = candles.map((c) => {
      return this.marketCandleRepo.create({
        symbol,
        timeframe,
        timestamp: new Date(c.time * 1000), // c.time is in seconds, need milliseconds
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.tickVolume,
        source: 'twelvedata',
      });
    });

    // Upsert (insert or update on conflict)
    try {
      await this.marketCandleRepo.save(entities, { chunk: 100 });
      this.logger.log(`Stored ${entities.length} candles in database`);
    } catch (error) {
      this.logger.error(`Failed to store candles: ${error.message}`);
    }

    return entities;
  }

  /**
   * Get candles from database (cache)
   * Returns in lightweight-charts format
   * Automatically fetches from Yahoo Finance if cache is empty
   */
  async getCandles(
    symbol: string,
    timeframe: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    let candles = await this.marketCandleRepo.find({
      where: {
        symbol,
        timeframe,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'ASC' },
    });

    // If cache is empty or insufficient, fetch from Yahoo Finance
    const expectedCount = this.calculateExpectedCandles(
      timeframe,
      startDate,
      endDate,
    );
    if (candles.length < expectedCount * 0.5) {
      // Less than 50% of expected data
      this.logger.log(
        `Cache insufficient (${candles.length}/${expectedCount}), fetching from Yahoo Finance`,
      );
      candles = await this.fetchAndStoreCandles(
        symbol,
        timeframe,
        startDate,
        endDate,
      );
    }

    // Transform to lightweight-charts format
    return candles.map((c) => ({
      time: Math.floor(c.timestamp.getTime() / 1000),
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
    }));
  }

  /**
   * Calculate expected number of candles based on timeframe
   */
  private calculateExpectedCandles(
    timeframe: string,
    start: Date,
    end: Date,
  ): number {
    const diffMs = end.getTime() - start.getTime();
    const diffMin = diffMs / (1000 * 60);

    const intervalMap: Record<string, number> = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '30m': 30,
      '1h': 60,
      '4h': 240,
      '1d': 1440,
    };

    const interval = intervalMap[timeframe] || 1;
    return Math.floor(diffMin / interval);
  }

  /**
   * Delete old candles to manage database size
   */
  async cleanupOldCandles(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.marketCandleRepo
      .createQueryBuilder()
      .delete()
      .where('timestamp < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`Deleted ${result.affected} old candles`);
    return result.affected || 0;
  }

  /**
   * Fetch candles from TwelveData API
   */
  private async fetchFromTwelveData(
    symbol: string,
    timeframe: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    const apiKey = this.configService.get<string>('TWELVE_DATA_API_KEY');

    if (!apiKey) {
      this.logger.warn('TWELVE_DATA_API_KEY not configured');
      return [];
    }

    // Convert symbol to TwelveData format
    const twelveSymbol = this.toTwelveDataSymbol(symbol);
    const interval = this.toTwelveDataInterval(timeframe);

    const startStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const endStr = endDate.toISOString().split('T')[0];

    this.logger.log(
      `Fetching from TwelveData: ${twelveSymbol} ${interval} from ${startStr} to ${endStr}`,
    );

    try {
      const url = 'https://api.twelvedata.com/time_series';
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            symbol: twelveSymbol,
            interval,
            start_date: startStr,
            end_date: endStr,
            apikey: apiKey,
            outputsize: 5000, // Max allowed
          },
          timeout: 30000,
        }),
      );

      if (response.data.status === 'error') {
        this.logger.error(
          `TwelveData API error: ${response.data.message || 'Unknown error'}`,
        );
        return [];
      }

      const values = response.data.values || [];

      if (values.length === 0) {
        this.logger.warn('No data returned from TwelveData');
        return [];
      }

      // Transform to our candle format
      return values
        .map((candle: any) => ({
          time: Math.floor(new Date(candle.datetime).getTime() / 1000),
          open: parseFloat(candle.open),
          high: parseFloat(candle.high),
          low: parseFloat(candle.low),
          close: parseFloat(candle.close),
          tickVolume: parseFloat(candle.volume || 0),
        }))
        .reverse(); // TwelveData returns newest first
    } catch (error) {
      this.logger.error(
        `Failed to fetch from TwelveData: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Convert symbol to TwelveData format
   */
  private toTwelveDataSymbol(symbol: string): string {
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

    // Crypto - add slash
    if (this.isCrypto(symbol)) {
      const base = symbol.replace('USD', '').replace('USDT', '');
      return `${base}/USD`;
    }

    return symbol;
  }

  /**
   * Convert timeframe to TwelveData interval
   */
  private toTwelveDataInterval(timeframe: string): string {
    const mapping: Record<string, string> = {
      '1m': '1min',
      '5m': '5min',
      '15m': '15min',
      '30m': '30min',
      '1h': '1h',
      '4h': '4h',
      '1d': '1day',
    };
    return mapping[timeframe] || '1h';
  }

  /**
   * Check if symbol is forex
   */
  private isForex(symbol: string): boolean {
    const forexPairs = ['EUR', 'GBP', 'USD', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD'];
    return (
      symbol.length === 6 &&
      forexPairs.includes(symbol.slice(0, 3)) &&
      forexPairs.includes(symbol.slice(3, 6))
    );
  }

  /**
   * Check if symbol is crypto
   */
  private isCrypto(symbol: string): boolean {
    return (
      symbol.includes('BTC') ||
      symbol.includes('ETH') ||
      symbol.includes('USDT')
    );
  }
}
