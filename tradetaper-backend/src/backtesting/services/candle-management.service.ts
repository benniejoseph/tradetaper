import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { MarketCandle } from '../entities/market-candle.entity';
import { YahooFinanceService } from '../../integrations/yahoo-finance/yahoo-finance.service';

@Injectable()
export class CandleManagementService {
  private readonly logger = new Logger(CandleManagementService.name);

  constructor(
    @InjectRepository(MarketCandle)
    private marketCandleRepo: Repository<MarketCandle>,
    private yahooFinanceService: YahooFinanceService,
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

    // 2. Fetch from Yahoo Finance
    this.logger.log(
      `Cache MISS: Fetching from Yahoo Finance (${symbol} ${timeframe})`,
    );
    const candles = await this.yahooFinanceService.getCandles(
      symbol,
      timeframe,
      startDate,
      endDate,
    );

    if (candles.length === 0) {
      this.logger.warn(
        `No candles returned from Yahoo Finance for ${symbol} ${timeframe}`,
      );
      return existing; // Return whatever we have cached
    }

    // 3. Save to database
    const entities = candles.map((c) => {
      return this.marketCandleRepo.create({
        symbol,
        timeframe,
        timestamp: new Date(c.time),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.tickVolume,
        source: 'yahoo',
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
}
