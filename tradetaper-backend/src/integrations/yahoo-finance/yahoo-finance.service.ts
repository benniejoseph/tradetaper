import { Injectable, Logger } from '@nestjs/common';
import yahooFinance from 'yahoo-finance2';

/**
 * Circuit breaker state for Yahoo Finance (unofficial API).
 * After 3 consecutive failures the circuit OPENS and all calls return [] immediately.
 * Auto-resets after 5 minutes so we retry periodically.
 */
interface CircuitBreaker {
  failures: number;
  openedAt: Date | null;
  isOpen: boolean;
}

@Injectable()
export class YahooFinanceService {
  private readonly logger = new Logger(YahooFinanceService.name);
  private readonly cb: CircuitBreaker = { failures: 0, openedAt: null, isOpen: false };
  private readonly CB_THRESHOLD = 3;          // trip after 3 consecutive failures
  private readonly CB_RESET_MS = 5 * 60_000; // auto-reset after 5 minutes

  // Map frontend timeframes to Yahoo Finance intervals
  private readonly timeframeMap: Record<string, string> = {
    '1m': '1m',
    '2m': '2m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '60m': '60m',
    '90m': '90m',
    '1h': '1h',
    '1d': '1d',
    '5d': '5d',
    '1wk': '1wk',
    '1mo': '1mo',
    '3mo': '3mo',
  };

  /**
   * Fetch historical candles from Yahoo Finance
   */
  async getCandles(
    symbol: string,
    timeframe: string,
    startTime: Date,
    endTime: Date,
  ): Promise<any[]> {
    // Circuit breaker check — if open, skip network call
    if (this.circuitIsOpen()) {
      this.logger.warn(
        `[UNOFFICIAL API ALERT] Yahoo Finance circuit breaker OPEN — skipping request for ${symbol}. ` +
        `Will retry after ${new Date(this.cb.openedAt!.getTime() + this.CB_RESET_MS).toISOString()}`,
      );
      return [];
    }

    const yahooSymbol = this._resolveSymbol(symbol);
    const interval = this.timeframeMap[timeframe] || '1d';

    this.logger.log(
      `Fetching from Yahoo Finance: ${yahooSymbol} (${interval}) [${startTime.toISOString()} - ${endTime.toISOString()}]`,
    );

    try {
      const queryOptions = {
        period1: startTime,
        period2: endTime,
        interval: interval as any,
      };

      const result = await yahooFinance.historical(yahooSymbol, queryOptions);

      // Success — reset circuit breaker
      this.cb.failures = 0;
      this.cb.isOpen = false;
      this.cb.openedAt = null;

      return (result as any[]).map((candle) => ({
        time: candle.date,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        tickVolume: candle.volume,
      }));
    } catch (error) {
      this.cb.failures++;

      if (this.cb.failures >= this.CB_THRESHOLD) {
        this.cb.isOpen = true;
        this.cb.openedAt = new Date();
        this.logger.error(
          `[UNOFFICIAL API ALERT] Yahoo Finance circuit breaker TRIPPED after ${this.cb.failures} consecutive failures. ` +
          `Last error: ${error.message}. Service will be suspended for ${this.CB_RESET_MS / 60_000} minutes. ` +
          `ACTION: Consider replacing yahoo-finance2 with a stable alternative (Twelve Data, Polygon.io).`,
        );
      } else {
        this.logger.warn(
          `[UNOFFICIAL API] Yahoo Finance request failed (attempt ${this.cb.failures}/${this.CB_THRESHOLD}): ` +
          `symbol=${yahooSymbol}, error=${error.message}`,
        );
      }

      return [];
    }
  }

  /**
   * Resolve generic symbols to Yahoo Finance tickers
   */
  private _resolveSymbol(symbol: string): string {
    const s = symbol.toUpperCase().trim();

    // Custom Mappings
    if (s === 'XAUUSD' || s === 'GOLD') return 'GC=F'; // Gold Futures
    if (s === 'BTCUSD' || s === 'BITCOIN') return 'BTC-USD';
    if (s === 'ETHUSD' || s === 'ETHEREUM') return 'ETH-USD';
    if (s === 'US30' || s === 'DJI') return '^DJI';
    if (s === 'US500' || s === 'SPX' || s === 'S&P500') return '^GSPC';
    if (s === 'NAS100' || s === 'NDX' || s === 'USTEC') return '^NDX';
    if (s === 'DAX' || s === 'DE30' || s === 'GER30') return '^GDAXI';

    // Forex Heuristic: 6 chars (e.g. EURUSD) -> EURUSD=X
    if (s.length === 6 && /^[A-Z]+$/.test(s)) {
      // Exclude common tickers that might be 6 chars but not forex if needed,
      // but generally EURUSD=X is safe for forex pairs.
      return `${s}=X`;
    }

    return s;
  }

  /**
   * Returns true if the circuit breaker is open (too many consecutive failures).
   * Auto-resets after CB_RESET_MS milliseconds.
   */
  private circuitIsOpen(): boolean {
    if (!this.cb.isOpen) return false;
    // Check if cooldown period has passed → auto-reset
    if (this.cb.openedAt && Date.now() - this.cb.openedAt.getTime() >= this.CB_RESET_MS) {
      this.logger.log('[UNOFFICIAL API] Yahoo Finance circuit breaker RESET — retrying requests');
      this.cb.failures = 0;
      this.cb.isOpen = false;
      this.cb.openedAt = null;
      return false;
    }
    return true;
  }
}
