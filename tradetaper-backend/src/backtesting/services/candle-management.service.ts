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

  // ─────────────────────────────────────────────────────────────
  // PRIMARY ENTRY POINT: MT5-sourced global 1m candle store
  // ─────────────────────────────────────────────────────────────

  /**
   * Fetch 1-minute OHLC candles for a trade's time window.
   *
   * Strategy:
   *  1. Query existing 1m rows for (symbol, start, end) from market_candles
   *  2. Detect gaps (missing minute buckets)
   *  3. If gaps exist → fetch missing ranges from MetaAPI or Terminal EA
   *  4. Upsert new rows
   *  5. Return all 1m rows in the window
   *
   * Data is shared across ALL users and ALL trades — stored once, reused always.
   */
  async fetchAndStoreMt5Candles(
    symbol: string,
    from: Date,
    to: Date,
    metaApiService?: any, // MetaApiService instance (has getHistoricalCandles)
    metaApiAccountId?: string, // MetaAPI account ID to fetch candles for
    terminalFarmService?: any, // TerminalFarmService or null
    accountId?: string,
  ): Promise<MarketCandle[]> {
    const normalFrom = this.floorToMinute(from);
    const normalTo = this.ceilToMinute(to);

    // 1. Load what we already have
    const existing = await this.marketCandleRepo.find({
      where: {
        symbol: symbol.toUpperCase(),
        timeframe: '1m',
        timestamp: Between(normalFrom, normalTo),
      },
      order: { timestamp: 'ASC' },
    });

    // 2. Detect gaps
    const gaps = this.detectGaps(existing, normalFrom, normalTo);
    if (gaps.length === 0) {
      this.logger.log(
        `[CandleStore] Cache HIT — ${existing.length} 1m candles for ${symbol} ${normalFrom.toISOString()} → ${normalTo.toISOString()}`,
      );
      return existing;
    }

    this.logger.log(
      `[CandleStore] Cache MISS — ${gaps.length} gap(s) detected for ${symbol}. Fetching…`,
    );

    // 3. Fetch missing ranges
    let fetched: Omit<MarketCandle, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    // Priority 1: MetaAPI service (correct SDK path: account.getHistoricalCandles)
    if (metaApiService && metaApiAccountId) {
      try {
        fetched = await this.fetchFromMetaApiService(symbol, gaps, metaApiService, metaApiAccountId);
      } catch (err) {
        this.logger.warn(`[CandleStore] MetaAPI fetch failed: ${err.message}`);
      }
    }

    // Priority 2: Terminal EA queue command (if MetaAPI unavailable)
    if (fetched.length === 0 && terminalFarmService && accountId) {
      await this.queueTerminalCandleFetch(
        symbol,
        gaps,
        terminalFarmService,
        accountId,
      );
      // Terminal fetch is async — return what we have for now
      return existing;
    }

    // 4. Upsert into market_candles
    if (fetched.length > 0) {
      await this.upsertCandles(fetched);
      this.logger.log(
        `[CandleStore] Stored ${fetched.length} new 1m candles for ${symbol}`,
      );
    }

    // 5. Return full refreshed set
    return this.marketCandleRepo.find({
      where: {
        symbol: symbol.toUpperCase(),
        timeframe: '1m',
        timestamp: Between(normalFrom, normalTo),
      },
      order: { timestamp: 'ASC' },
    });
  }

  /**
   * Get 1m candles for a trade — resolves the trade's time window,
   * applies ±buffer, fetches/fills gaps, and returns lightweight-charts format.
   */
  async getCandlesForTrade(
    tradeId: string,
    trade: {
      symbol: string;
      openTime?: string | Date;
      closeTime?: string | Date | null;
    },
    options?: {
      bufferHours?: number;       // default 1. use 4 for H4/D1 views
      metaApiService?: any;       // MetaApiService instance
      metaApiAccountId?: string;  // MetaAPI account ID
      terminalFarmService?: any;
      accountId?: string;
    },
  ): Promise<{ candles: any[]; source: 'cache' | 'metaapi' | 'terminal' | 'partial'; cached: boolean }> {
    const bufferMs = (options?.bufferHours ?? 1) * 60 * 60 * 1000;

    const openMs = trade.openTime
      ? new Date(trade.openTime).getTime()
      : Date.now();
    const closeMs = trade.closeTime
      ? new Date(trade.closeTime).getTime()
      : Date.now();

    const from = new Date(Math.min(openMs, closeMs) - bufferMs);
    const to   = new Date(Math.max(openMs, closeMs) + bufferMs);

    const beforeCount = await this.marketCandleRepo.count({
      where: {
        symbol: trade.symbol.toUpperCase(),
        timeframe: '1m',
        timestamp: Between(from, to),
      },
    });

    const rows = await this.fetchAndStoreMt5Candles(
      trade.symbol,
      from,
      to,
      options?.metaApiService,
      options?.metaApiAccountId,
      options?.terminalFarmService,
      options?.accountId,
    );

    const cached = rows.length === beforeCount && rows.length > 0;
    const source = cached
      ? 'cache'
      : options?.metaApiService
        ? 'metaapi'
        : options?.terminalFarmService
          ? 'terminal'
          : 'partial';

    return {
      candles: this.toChartFormat(rows),
      source,
      cached,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // OLDER ENTRY POINT: Yahoo Finance / TwelveData (unchanged)
  // ─────────────────────────────────────────────────────────────

  /**
   * Fetch and store candles from TwelveData (used by backtesting module)
   */
  async fetchAndStoreCandles(
    symbol: string,
    timeframe: string,
    startDate: Date,
    endDate: Date,
  ): Promise<MarketCandle[]> {
    const existing = await this.marketCandleRepo.find({
      where: {
        symbol,
        timeframe,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'ASC' },
    });

    const expectedCount = this.calculateExpectedCandles(
      timeframe,
      startDate,
      endDate,
    );
    if (existing.length >= expectedCount * 0.9) {
      this.logger.log(
        `Cache HIT: ${existing.length} candles for ${symbol} ${timeframe}`,
      );
      return existing;
    }

    this.logger.log(`Cache MISS: Fetching from TwelveData (${symbol} ${timeframe})`);
    const candles = await this.fetchFromTwelveData(symbol, timeframe, startDate, endDate);

    if (candles.length === 0) {
      this.logger.warn(`No candles returned from TwelveData for ${symbol} ${timeframe}`);
      return existing;
    }

    const entities = candles.map((c) =>
      this.marketCandleRepo.create({
        symbol,
        timeframe,
        timestamp: new Date(c.time * 1000),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.tickVolume,
        source: 'twelvedata',
      }),
    );

    try {
      await this.marketCandleRepo.save(entities, { chunk: 100 });
      this.logger.log(`Stored ${entities.length} candles in database`);
    } catch (error) {
      this.logger.error(`Failed to store candles: ${error.message}`);
    }

    return entities;
  }

  async getCandles(
    symbol: string,
    timeframe: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    let candles = await this.marketCandleRepo.find({
      where: { symbol, timeframe, timestamp: Between(startDate, endDate) },
      order: { timestamp: 'ASC' },
    });

    const expectedCount = this.calculateExpectedCandles(timeframe, startDate, endDate);
    if (candles.length < expectedCount * 0.5) {
      this.logger.log(
        `Cache insufficient (${candles.length}/${expectedCount}), fetching from Yahoo Finance`,
      );
      candles = await this.fetchAndStoreCandles(symbol, timeframe, startDate, endDate);
    }

    return this.toChartFormat(candles);
  }

  // ─────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Detect contiguous missing minute intervals in the existing data.
   * Returns an array of {from, to} gap ranges.
   */
  private detectGaps(
    existing: MarketCandle[],
    from: Date,
    to: Date,
  ): Array<{ from: Date; to: Date }> {
    if (existing.length === 0) {
      return [{ from, to }]; // Everything is missing
    }

    const gaps: Array<{ from: Date; to: Date }> = [];
    const ONE_MIN = 60_000;
    const timestamps = new Set(
      existing.map((c) => this.floorToMinute(c.timestamp).getTime()),
    );

    let gapStart: number | null = null;

    for (
      let t = from.getTime();
      t <= to.getTime();
      t += ONE_MIN
    ) {
      if (!timestamps.has(t)) {
        if (gapStart === null) gapStart = t;
      } else {
        if (gapStart !== null) {
          gaps.push({ from: new Date(gapStart), to: new Date(t - ONE_MIN) });
          gapStart = null;
        }
      }
    }
    if (gapStart !== null) {
      gaps.push({ from: new Date(gapStart), to });
    }

    // Merge small gaps (<= 5 min, e.g. weekend/session break) to avoid noisy fetches
    return this.mergeGaps(gaps, 5 * ONE_MIN);
  }

  /** Merge gaps that are closer than `thresholdMs` apart */
  private mergeGaps(
    gaps: Array<{ from: Date; to: Date }>,
    thresholdMs: number,
  ): Array<{ from: Date; to: Date }> {
    if (gaps.length <= 1) return gaps;
    const merged: Array<{ from: Date; to: Date }> = [gaps[0]];
    for (let i = 1; i < gaps.length; i++) {
      const last = merged[merged.length - 1];
      // Gaps spanning only weekends/sessions (<= threshold) → merge
      const spanMs = gaps[i].from.getTime() - last.to.getTime();
      const gapSizeMs = gaps[i].to.getTime() - gaps[i].from.getTime();
      if (spanMs <= thresholdMs || gapSizeMs <= thresholdMs) {
        last.to = new Date(Math.max(last.to.getTime(), gaps[i].to.getTime()));
      } else {
        merged.push(gaps[i]);
      }
    }
    return merged;
  }

  /** Fetch 1m candles from MetaAPI for each gap range using proper SDK account API */
  private async fetchFromMetaApiService(
    symbol: string,
    gaps: Array<{ from: Date; to: Date }>,
    metaApiService: any,
    metaApiAccountId: string,
  ): Promise<Omit<MarketCandle, 'id' | 'createdAt' | 'updatedAt'>[]> {
    const result: Omit<MarketCandle, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    for (const gap of gaps) {
      try {
        // Correct MetaAPI SDK path: account.getHistoricalCandles() NOT connection.getHistoricalCandles()
        const raw: any[] = await metaApiService.getHistoricalCandles(
          metaApiAccountId,
          symbol,
          '1m',
          gap.from,
          gap.to,
        );

        if (!Array.isArray(raw)) continue;

        for (const c of raw) {
          if (!c.time || !c.open) continue;
          const ts = c.time instanceof Date ? c.time : new Date(c.time);
          if (ts < gap.from || ts > gap.to) continue;
          result.push({
            symbol: symbol.toUpperCase(),
            timeframe: '1m',
            timestamp: this.floorToMinute(ts),
            open: parseFloat(c.open),
            high: parseFloat(c.high),
            low: parseFloat(c.low),
            close: parseFloat(c.close),
            volume: c.tickVolume ?? c.volume ?? 0,
            source: 'metaapi',
          });
        }
      } catch (err) {
        this.logger.warn(
          `[CandleStore] MetaAPI gap fetch failed for ${symbol} ${gap.from.toISOString()}: ${err.message}`,
        );
      }
    }

    return result;
  }

  /** Queue Terminal EA candle fetch command (async — client will poll) */
  private async queueTerminalCandleFetch(
    symbol: string,
    gaps: Array<{ from: Date; to: Date }>,
    terminalFarmService: any,
    accountId: string,
  ): Promise<void> {
    const terminal = await terminalFarmService.findTerminalForAccount(accountId);
    if (!terminal || terminal.status !== 'RUNNING') return;

    for (const gap of gaps) {
      const fmt = (d: Date) =>
        d.toISOString().replace('T', ' ').substring(0, 19).replace(/-/g, '.');
      const payload = `${symbol},1m,${fmt(gap.from)},${fmt(gap.to)},global`;
      terminalFarmService.queueCommand(terminal.id, 'FETCH_CANDLES', payload);
    }
    this.logger.log(
      `[CandleStore] Queued ${gaps.length} FETCH_CANDLES commands for ${symbol} via Terminal EA`,
    );
  }

  /** Upsert candles — insert or skip on conflict (symbol, timeframe, timestamp) */
  private async upsertCandles(
    candles: Omit<MarketCandle, 'id' | 'createdAt' | 'updatedAt'>[],
  ): Promise<void> {
    if (candles.length === 0) return;
    // Deduplicate before inserting
    const seen = new Set<string>();
    const unique = candles.filter((c) => {
      const key = `${c.symbol}|${c.timeframe}|${c.timestamp.getTime()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Chunk into batches of 500 to respect max parameters
    for (let i = 0; i < unique.length; i += 500) {
      const chunk = unique.slice(i, i + 500);
      await this.marketCandleRepo
        .createQueryBuilder()
        .insert()
        .into(MarketCandle)
        .values(chunk as any)
        .orIgnore() // ON CONFLICT DO NOTHING — preserves existing data
        .execute();
    }
  }

  /**
   * Save raw 1m candles coming from the Terminal EA webhook into the global store
   */
  async saveTerminalCandles(
    symbol: string,
    terminalCandles: {
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume?: number;
    }[],
  ): Promise<void> {
    if (terminalCandles.length === 0) return;

    this.logger.log(`Upserting ${terminalCandles.length} Terminal EA candles for ${symbol}`);

    const entities: Omit<MarketCandle, 'id' | 'createdAt' | 'updatedAt'>[] =
      terminalCandles.map((c) => ({
        symbol,
        timeframe: '1m', // Terminal always syncs 1m data for the chart cache
        timestamp: new Date(c.time * 1000),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume || 0,
        source: 'terminal',
      }));

    await this.upsertCandles(entities);
  }

  /** Convert MarketCandle rows to lightweight-charts compatible format */

  private toChartFormat(candles: MarketCandle[]): any[] {
    return candles.map((c) => ({
      time: Math.floor(c.timestamp.getTime() / 1000),
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
    }));
  }

  private floorToMinute(d: Date): Date {
    const ms = Math.floor(d.getTime() / 60_000) * 60_000;
    return new Date(ms);
  }

  private ceilToMinute(d: Date): Date {
    const ms = Math.ceil(d.getTime() / 60_000) * 60_000;
    return new Date(ms);
  }

  // ─────────────────────────────────────────────────────────────
  // UTILITY (used by both old and new code)
  // ─────────────────────────────────────────────────────────────

  private calculateExpectedCandles(
    timeframe: string,
    start: Date,
    end: Date,
  ): number {
    const diffMs = end.getTime() - start.getTime();
    const diffMin = diffMs / (1000 * 60);
    const intervalMap: Record<string, number> = {
      '1m': 1, '5m': 5, '15m': 15, '30m': 30, '1h': 60, '4h': 240, '1d': 1440,
    };
    const interval = intervalMap[timeframe] || 1;
    return Math.floor(diffMin / interval);
  }

  async cleanupOldCandles(daysToKeep = 90): Promise<number> {
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

    const twelveSymbol = this.toTwelveDataSymbol(symbol);
    const interval = this.toTwelveDataInterval(timeframe);
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    try {
      const url = 'https://api.twelvedata.com/time_series';
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { symbol: twelveSymbol, interval, start_date: startStr, end_date: endStr, apikey: apiKey, outputsize: 5000 },
          timeout: 30000,
        }),
      );

      if (response.data.status === 'error') {
        this.logger.error(`TwelveData API error: ${response.data.message}`);
        return [];
      }

      const values = response.data.values || [];
      return values
        .map((candle: any) => ({
          time: Math.floor(new Date(candle.datetime).getTime() / 1000),
          open: parseFloat(candle.open),
          high: parseFloat(candle.high),
          low: parseFloat(candle.low),
          close: parseFloat(candle.close),
          tickVolume: parseFloat(candle.volume || 0),
        }))
        .reverse();
    } catch (error) {
      this.logger.error(`Failed to fetch from TwelveData: ${error.message}`);
      return [];
    }
  }

  private toTwelveDataSymbol(symbol: string): string {
    const map: Record<string, string> = {
      XAUUSD: 'XAU/USD', XAGUSD: 'XAG/USD', XTIUSD: 'WTI/USD', XBRUSD: 'BRENT/USD',
    };
    if (map[symbol]) return map[symbol];
    if (this.isForex(symbol) && !symbol.includes('/'))
      return `${symbol.slice(0, 3)}/${symbol.slice(3, 6)}`;
    if (this.isCrypto(symbol)) {
      const base = symbol.replace('USD', '').replace('USDT', '');
      return `${base}/USD`;
    }
    return symbol;
  }

  private toTwelveDataInterval(timeframe: string): string {
    const mapping: Record<string, string> = {
      '1m': '1min', '5m': '5min', '15m': '15min', '30m': '30min',
      '1h': '1h', '4h': '4h', '1d': '1day',
    };
    return mapping[timeframe] || '1h';
  }

  private isForex(symbol: string): boolean {
    const forexPairs = ['EUR', 'GBP', 'USD', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD'];
    return (
      symbol.length === 6 &&
      forexPairs.includes(symbol.slice(0, 3)) &&
      forexPairs.includes(symbol.slice(3, 6))
    );
  }

  private isCrypto(symbol: string): boolean {
    return symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('USDT');
  }
}
