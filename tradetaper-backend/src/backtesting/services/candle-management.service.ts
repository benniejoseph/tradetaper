import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { MarketCandle } from '../entities/market-candle.entity';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CandleManagementService {
  private readonly logger = new Logger(CandleManagementService.name);
  private static readonly MIN_VALID_CANDLE_DATE = new Date('2000-01-01T00:00:00.000Z');
  private static readonly MAX_TWELVE_DATA_OUTPUTSIZE = 5000;
  private static readonly BACKTEST_PROVIDER_SOURCES = [
    'oanda',
    'twelvedata',
    'alphavantage',
  ] as const;
  private static readonly MAX_HISTORY_RANGE_DAYS_BY_TIMEFRAME: Record<string, number> = {
    '1m': 120,
    '5m': 365,
    '15m': 365 * 2,
    '30m': 365 * 3,
    '1h': 365 * 5,
    '4h': 365 * 8,
    '1d': 365 * 20,
  };

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
  // BACKTESTING ENTRY POINT: external provider-backed candles
  // ─────────────────────────────────────────────────────────────

  /**
   * Fetch and store candles for the backtesting module.
   *
   * Source priority (India-friendly, no geo-restricted services):
   *  1. TwelveData  — 800 req/day free, 30+ yr history, forex/metals/crypto ✅
   *  2. Alpha Vantage — 25 req/day free backup, same asset classes          ✅
   *
   * OANDA is kept as a utility method for non-Indian deployments but is NOT
   * in the active fetch pipeline.  Set OANDA_API_KEY in env to re-enable it
   * by inserting a fetchFromOanda() call above TwelveData if needed.
   */
  async fetchAndStoreCandles(
    symbol: string,
    timeframe: string,
    startDate: Date,
    endDate: Date,
  ): Promise<MarketCandle[]> {
    const symbolCode = (symbol || '').toUpperCase().trim();
    const timeframeCode = (timeframe || '1h').toLowerCase().trim();
    const { from: boundedStartDate, to: boundedEndDate } =
      this.clampHistoryRange(timeframeCode, startDate, endDate);

    const existing = await this.marketCandleRepo.find({
      where: {
        symbol: symbolCode,
        timeframe: timeframeCode,
        source: In([...CandleManagementService.BACKTEST_PROVIDER_SOURCES]),
        timestamp: Between(boundedStartDate, boundedEndDate),
      },
      order: { timestamp: 'ASC' },
    });

    const expectedCount = this.calculateExpectedCandles(
      timeframeCode,
      boundedStartDate,
      boundedEndDate,
    );
    if (existing.length >= expectedCount * 0.9) {
      this.logger.log(
        `Cache HIT: ${existing.length} candles for ${symbolCode} ${timeframeCode}`,
      );
      return existing;
    }

    let candles: any[] = [];
    let source = '';

    // ── Primary: OANDA (when configured, best quality for FX/metals) ────────
    if (this.canUseOandaForSymbol(symbolCode)) {
      this.logger.log(`Cache MISS: Fetching from OANDA (${symbolCode} ${timeframeCode})`);
      candles = await this.fetchFromOanda(
        symbolCode,
        timeframeCode,
        boundedStartDate,
        boundedEndDate,
      );
      if (candles.length > 0) {
        source = 'oanda';
      }
    }

    // ── Secondary: TwelveData with pagination ────────────────────────────────
    if (candles.length === 0) {
      this.logger.log(`Cache MISS: Fetching from TwelveData (${symbolCode} ${timeframeCode})`);
      candles = await this.fetchFromTwelveData(
        symbolCode,
        timeframeCode,
        boundedStartDate,
        boundedEndDate,
      );
      if (candles.length > 0) {
        source = 'twelvedata';
      }
    }

    // ── Secondary: Alpha Vantage (25 req/day free backup) ───────────────────
    if (candles.length === 0) {
      this.logger.warn(
        `Primary sources returned no data for ${symbolCode} ${timeframeCode} — trying Alpha Vantage`,
      );
      candles = await this.fetchFromAlphaVantage(
        symbolCode,
        timeframeCode,
        boundedStartDate,
        boundedEndDate,
      );
      if (candles.length > 0) {
        source = 'alphavantage';
      }
    }

    if (candles.length === 0) {
      this.logger.warn(`No candles returned from any source for ${symbolCode} ${timeframeCode}`);
      return existing;
    }

    const upsertRows: Omit<MarketCandle, 'id' | 'createdAt' | 'updatedAt'>[] =
      candles.map((c) => ({
        symbol: symbolCode,
        timeframe: timeframeCode,
        timestamp: new Date(c.time * 1000),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.tickVolume ?? 0,
        source,
      }))
      .filter((row) => this.isValidCandleRow(row));

    try {
      await this.upsertCandles(upsertRows);
      this.logger.log(
        `Upserted ${upsertRows.length} candles from ${source} for ${symbolCode} ${timeframeCode}`,
      );
    } catch (error) {
      this.logger.error(`Failed to store candles: ${error.message}`);
    }

    return this.marketCandleRepo.find({
      where: {
        symbol: symbolCode,
        timeframe: timeframeCode,
        source: In([...CandleManagementService.BACKTEST_PROVIDER_SOURCES]),
        timestamp: Between(boundedStartDate, boundedEndDate),
      },
      order: { timestamp: 'ASC' },
    });
  }

  async getCandles(
    symbol: string,
    timeframe: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    const symbolCode = (symbol || '').toUpperCase().trim();
    const timeframeCode = (timeframe || '1h').toLowerCase().trim();
    const { from: boundedStartDate, to: boundedEndDate } =
      this.clampHistoryRange(timeframeCode, startDate, endDate);
    let candles = await this.marketCandleRepo.find({
      where: {
        symbol: symbolCode,
        timeframe: timeframeCode,
        source: In([...CandleManagementService.BACKTEST_PROVIDER_SOURCES]),
        timestamp: Between(boundedStartDate, boundedEndDate),
      },
      order: { timestamp: 'ASC' },
    });

    const expectedCount = this.calculateExpectedCandles(timeframeCode, boundedStartDate, boundedEndDate);
    if (candles.length < expectedCount * 0.5) {
      this.logger.log(
        `Cache insufficient (${candles.length}/${expectedCount}), fetching from provider pipeline for ${symbolCode} ${timeframeCode}`,
      );
      candles = await this.fetchAndStoreCandles(symbolCode, timeframeCode, boundedStartDate, boundedEndDate);
    }

    if (candles.length === 0) {
      // Final fallback for nonstandard instruments where only terminal candles may exist.
      candles = await this.marketCandleRepo.find({
        where: {
          symbol: symbolCode,
          timeframe: timeframeCode,
          timestamp: Between(boundedStartDate, boundedEndDate),
        },
        order: { timestamp: 'ASC' },
      });
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
    const rawExpected = Math.floor(diffMin / interval);
    const intraday = ['1m', '5m', '15m', '30m', '1h', '4h'].includes(timeframe);
    const marketHoursAdjustment = intraday ? 0.72 : 1; // approx 24/5 sessions + holidays
    return Math.max(1, Math.floor(rawExpected * marketHoursAdjustment));
  }

  private clampHistoryRange(
    timeframe: string,
    requestedStart: Date,
    requestedEnd: Date,
  ): { from: Date; to: Date } {
    const safeStart = new Date(requestedStart);
    const safeEnd = new Date(requestedEnd);
    const minDateMs = CandleManagementService.MIN_VALID_CANDLE_DATE.getTime();

    const normalizedEndMs = Number.isFinite(safeEnd.getTime())
      ? safeEnd.getTime()
      : Date.now();
    const normalizedStartMs = Number.isFinite(safeStart.getTime())
      ? safeStart.getTime()
      : normalizedEndMs - 24 * 60 * 60 * 1000;

    let boundedFromMs = Math.max(normalizedStartMs, minDateMs);
    let boundedToMs = Math.max(normalizedEndMs, boundedFromMs + 1000);

    const maxDays =
      CandleManagementService.MAX_HISTORY_RANGE_DAYS_BY_TIMEFRAME[timeframe] ??
      CandleManagementService.MAX_HISTORY_RANGE_DAYS_BY_TIMEFRAME['1h'];
    const maxRangeMs = maxDays * 24 * 60 * 60 * 1000;
    const minAllowedFrom = boundedToMs - maxRangeMs;
    if (boundedFromMs < minAllowedFrom) {
      boundedFromMs = minAllowedFrom;
    }

    return {
      from: new Date(boundedFromMs),
      to: new Date(boundedToMs),
    };
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

  // ─────────────────────────────────────────────────────────────
  // OANDA v20 REST API
  // ─────────────────────────────────────────────────────────────

  /**
   * Fetch candles from OANDA v20 REST API.
   * Automatically paginates (max 5000 candles per request).
   * Uses mid prices (bid/ask average).
   */
  private async fetchFromOanda(
    symbol: string,
    timeframe: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    const apiKey = this.configService.get<string>('OANDA_API_KEY');
    const apiEnv = this.configService.get<string>('OANDA_API_ENV') ?? 'practice';

    if (!apiKey) {
      this.logger.warn('[OANDA] OANDA_API_KEY not configured — skipping');
      return [];
    }

    const baseUrl =
      apiEnv === 'live'
        ? 'https://api-fxtrade.oanda.com'
        : 'https://api-fxpractice.oanda.com';

    const instrument  = this.toOandaSymbol(symbol);
    const granularity = this.toOandaGranularity(timeframe);
    const stepMs      = this.oandaGranularityToMs(granularity);

    const allCandles: any[] = [];
    let from = new Date(startDate);

    while (from < endDate) {
      try {
        const response = await firstValueFrom(
          this.httpService.get(
            `${baseUrl}/v3/instruments/${instrument}/candles`,
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              params: {
                granularity,
                from:  from.toISOString(),
                to:    endDate.toISOString(),
                price: 'M',   // mid prices
                count: 5000,  // max per request
              },
              timeout: 30_000,
            },
          ),
        );

        const raw: any[] = response.data?.candles ?? [];
        if (raw.length === 0) break;

        for (const c of raw) {
          // skip in-progress (incomplete) candle
          if (!c.complete) continue;
          allCandles.push({
            time:      Math.floor(new Date(c.time).getTime() / 1000),
            open:      parseFloat(c.mid.o),
            high:      parseFloat(c.mid.h),
            low:       parseFloat(c.mid.l),
            close:     parseFloat(c.mid.c),
            tickVolume: c.volume ?? 0,
          });
        }

        // If fewer than 5000 rows returned we've hit the end of the range
        if (raw.length < 5000) break;

        // Advance to the candle after the last one received
        from = new Date(new Date(raw[raw.length - 1].time).getTime() + stepMs);
      } catch (error) {
        const msg = error?.response?.data?.errorMessage ?? error.message;
        this.logger.error(`[OANDA] Fetch failed for ${instrument} ${granularity}: ${msg}`);
        break;
      }
    }

    this.logger.log(
      `[OANDA] Fetched ${allCandles.length} candles for ${instrument} ${granularity}`,
    );
    return allCandles;
  }

  /** Map TradeTaper symbol → OANDA instrument name (e.g. EURUSD → EUR_USD) */
  private toOandaSymbol(symbol: string): string {
    const map: Record<string, string> = {
      XAUUSD: 'XAU_USD',
      XAGUSD: 'XAG_USD',
      XTIUSD: 'BCO_USD',
      XBRUSD: 'BCO_USD',
      BTCUSD: 'BTC_USD',
      ETHUSD: 'ETH_USD',
    };
    if (map[symbol]) return map[symbol];
    // Forex pairs: 6-char e.g. EURUSD → EUR_USD
    if (symbol.length === 6 && !symbol.includes('_'))
      return `${symbol.slice(0, 3)}_${symbol.slice(3, 6)}`;
    // Already formatted (XAU_USD) or unknown — return as-is
    return symbol.replace('/', '_');
  }

  /** Map TradeTaper timeframe string → OANDA granularity */
  private toOandaGranularity(timeframe: string): string {
    const map: Record<string, string> = {
      '1m': 'M1', '5m': 'M5', '15m': 'M15', '30m': 'M30',
      '1h': 'H1', '4h': 'H4', '1d': 'D',
    };
    return map[timeframe] ?? 'H1';
  }

  /** Milliseconds for one candle at a given OANDA granularity */
  private oandaGranularityToMs(granularity: string): number {
    const map: Record<string, number> = {
      M1: 60_000, M5: 300_000, M15: 900_000, M30: 1_800_000,
      H1: 3_600_000, H4: 14_400_000, D: 86_400_000,
    };
    return map[granularity] ?? 3_600_000;
  }

  // ─────────────────────────────────────────────────────────────
  // TWELVEDATA  (primary free source – 800 req/day)
  // ─────────────────────────────────────────────────────────────

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
    const intervalSeconds = this.timeframeToSeconds(timeframe);
    const expectedBars = this.calculateExpectedCandles(timeframe, startDate, endDate);
    const pagesNeeded = Math.max(
      1,
      Math.ceil(expectedBars / CandleManagementService.MAX_TWELVE_DATA_OUTPUTSIZE),
    );
    const maxPages = Math.min(pagesNeeded + 1, 20);

    const allByTime = new Map<number, any>();
    let cursorEnd = new Date(endDate);
    let fetchedPages = 0;

    while (cursorEnd > startDate && fetchedPages < maxPages) {
      try {
        const response = await firstValueFrom(
          this.httpService.get('https://api.twelvedata.com/time_series', {
            params: {
              symbol: twelveSymbol,
              interval,
              start_date: this.toTwelveDataDateTime(startDate),
              end_date: this.toTwelveDataDateTime(cursorEnd),
              apikey: apiKey,
              outputsize: CandleManagementService.MAX_TWELVE_DATA_OUTPUTSIZE,
              order: 'DESC',
              timezone: 'UTC',
            },
            timeout: 30000,
          }),
        );

        if (response.data?.status === 'error') {
          this.logger.error(`TwelveData API error: ${response.data.message}`);
          break;
        }

        const values = Array.isArray(response.data?.values)
          ? response.data.values
          : [];
        if (values.length === 0) {
          break;
        }

        let oldestTimeSec = Number.POSITIVE_INFINITY;
        for (const candle of values) {
          const timeSec = Math.floor(new Date(candle.datetime).getTime() / 1000);
          if (!Number.isFinite(timeSec)) continue;
          if (timeSec < Math.floor(startDate.getTime() / 1000)) continue;
          if (timeSec > Math.floor(endDate.getTime() / 1000)) continue;
          if (!this.isValidCandleTimestamp(timeSec)) continue;

          const parsed = {
            time: timeSec,
            open: parseFloat(candle.open),
            high: parseFloat(candle.high),
            low: parseFloat(candle.low),
            close: parseFloat(candle.close),
            tickVolume: parseFloat(candle.volume || 0),
          };

          if (
            !Number.isFinite(parsed.open) ||
            !Number.isFinite(parsed.high) ||
            !Number.isFinite(parsed.low) ||
            !Number.isFinite(parsed.close)
          ) {
            continue;
          }

          allByTime.set(timeSec, parsed);
          if (timeSec < oldestTimeSec) {
            oldestTimeSec = timeSec;
          }
        }

        fetchedPages += 1;
        if (!Number.isFinite(oldestTimeSec)) {
          break;
        }

        const nextEndSec = oldestTimeSec - intervalSeconds;
        if (nextEndSec <= Math.floor(startDate.getTime() / 1000)) {
          break;
        }
        cursorEnd = new Date(nextEndSec * 1000);
      } catch (error) {
        this.logger.error(`Failed to fetch from TwelveData: ${error.message}`);
        break;
      }
    }

    const candles = Array.from(allByTime.values()).sort((a, b) => a.time - b.time);
    this.logger.log(
      `[TwelveData] Fetched ${candles.length} candles for ${symbol} ${timeframe} across ${fetchedPages} page(s)`,
    );
    return candles;
  }

  private toTwelveDataSymbol(symbol: string): string {
    const map: Record<string, string> = {
      XAUUSD: 'XAU/USD',
      XAGUSD: 'XAG/USD',
      XTIUSD: 'WTI/USD',
      XBRUSD: 'BRENT/USD',
      US100: 'NDX',
      US500: 'SPX',
      US30: 'DJI',
      NAS100: 'NDX',
      SPX500: 'SPX',
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

  // ─────────────────────────────────────────────────────────────
  // ALPHA VANTAGE  (secondary free backup – 25 req/day)
  // Supports: forex pairs, gold (XAU/USD), crypto, stocks
  // ─────────────────────────────────────────────────────────────

  /**
   * Fetch candles from Alpha Vantage.
   * Uses FX_INTRADAY for intraday timeframes and FX_DAILY for daily.
   * Falls back gracefully when rate-limited.
   */
  private async fetchFromAlphaVantage(
    symbol: string,
    timeframe: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    const apiKey = this.configService.get<string>('ALPHA_VANTAGE_API_KEY');
    if (!apiKey) {
      this.logger.warn('[AV] ALPHA_VANTAGE_API_KEY not configured');
      return [];
    }

    const avPair = this.toAvSymbol(symbol);
    if (!avPair) {
      this.logger.warn(`[AV] Symbol ${symbol} is not supported by Alpha Vantage FX endpoints`);
      return [];
    }
    const { fromSym, toSym } = avPair;
    const isDaily = timeframe === '1d';

    try {
      let timeSeriesKey: string;
      let params: Record<string, string>;

      if (isDaily) {
        params = { function: 'FX_DAILY', from_symbol: fromSym, to_symbol: toSym, outputsize: 'full', apikey: apiKey };
        timeSeriesKey = 'Time Series FX (Daily)';
      } else {
        const interval = this.toAvInterval(timeframe);
        params = { function: 'FX_INTRADAY', from_symbol: fromSym, to_symbol: toSym, interval, outputsize: 'full', apikey: apiKey };
        timeSeriesKey = `Time Series FX (${interval})`;
      }

      const response = await firstValueFrom(
        this.httpService.get('https://www.alphavantage.co/query', { params, timeout: 30_000 }),
      );

      // Rate-limit guard
      if (response.data?.Note || response.data?.Information) {
        this.logger.warn(`[AV] Rate limit or plan restriction: ${response.data.Note ?? response.data.Information}`);
        return [];
      }

      const timeSeries: Record<string, any> = response.data?.[timeSeriesKey] ?? {};
      const startTs = Math.floor(startDate.getTime() / 1000);
      const endTs   = Math.floor(endDate.getTime()   / 1000);

      const candles: any[] = Object.entries(timeSeries)
        .map(([datetime, values]: [string, any]) => ({
          time:      Math.floor(new Date(datetime).getTime() / 1000),
          open:      parseFloat(values['1. open']),
          high:      parseFloat(values['2. high']),
          low:       parseFloat(values['3. low']),
          close:     parseFloat(values['4. close']),
          tickVolume: 0,
        }))
        .filter(c => c.time >= startTs && c.time <= endTs)
        .sort((a, b) => a.time - b.time);

      this.logger.log(`[AV] Fetched ${candles.length} candles for ${fromSym}/${toSym}`);
      return candles;
    } catch (error) {
      this.logger.error(`[AV] Fetch failed for ${symbol}: ${error.message}`);
      return [];
    }
  }

  /** Map TradeTaper symbol → Alpha Vantage from/to pair (e.g. XAUUSD → XAU/USD) */
  private toAvSymbol(symbol: string): { fromSym: string; toSym: string } | null {
    const map: Record<string, [string, string]> = {
      XAUUSD: ['XAU', 'USD'], XAGUSD: ['XAG', 'USD'],
      BTCUSD: ['BTC', 'USD'], ETHUSD: ['ETH', 'USD'],
    };
    if (map[symbol]) return { fromSym: map[symbol][0], toSym: map[symbol][1] };
    if (symbol.length === 6 && this.isForex(symbol)) {
      return { fromSym: symbol.slice(0, 3), toSym: symbol.slice(3, 6) };
    }
    return null;
  }

  /** Map TradeTaper timeframe → Alpha Vantage interval string */
  private toAvInterval(timeframe: string): string {
    const map: Record<string, string> = {
      '1m': '1min', '5m': '5min', '15m': '15min', '30m': '30min',
      '1h': '60min', '4h': '60min', // AV doesn't have 4h; use 60min
    };
    return map[timeframe] ?? '60min';
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

  private timeframeToSeconds(timeframe: string): number {
    const map: Record<string, number> = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '30m': 1800,
      '1h': 3600,
      '4h': 14400,
      '1d': 86400,
    };
    return map[timeframe] || 3600;
  }

  private isValidCandleTimestamp(timeSec: number): boolean {
    const date = new Date(timeSec * 1000);
    return (
      Number.isFinite(date.getTime()) &&
      date >= CandleManagementService.MIN_VALID_CANDLE_DATE
    );
  }

  private isValidCandleRow(
    row: Omit<MarketCandle, 'id' | 'createdAt' | 'updatedAt'>,
  ): boolean {
    if (!row?.timestamp || !Number.isFinite(row.timestamp.getTime())) return false;
    if (row.timestamp < CandleManagementService.MIN_VALID_CANDLE_DATE) return false;
    return (
      Number.isFinite(Number(row.open)) &&
      Number.isFinite(Number(row.high)) &&
      Number.isFinite(Number(row.low)) &&
      Number.isFinite(Number(row.close)) &&
      Number(row.open) > 0 &&
      Number(row.high) > 0 &&
      Number(row.low) > 0 &&
      Number(row.close) > 0
    );
  }

  private toTwelveDataDateTime(value: Date): string {
    return value.toISOString().replace('T', ' ').slice(0, 19);
  }

  private canUseOandaForSymbol(symbol: string): boolean {
    if (!this.configService.get<string>('OANDA_API_KEY')) return false;
    return this.isForex(symbol) || ['XAUUSD', 'XAGUSD'].includes(symbol);
  }
}
