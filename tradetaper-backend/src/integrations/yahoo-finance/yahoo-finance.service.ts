import { Injectable, Logger } from '@nestjs/common';
import yahooFinance from 'yahoo-finance2';

@Injectable()
export class YahooFinanceService {
  private readonly logger = new Logger(YahooFinanceService.name);

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
    const yahooSymbol = this._resolveSymbol(symbol);
    const interval = this.timeframeMap[timeframe] || '1d';

    // Yahoo Finance endpoints (like '1h') often only support limited history (e.g. last 730 days)
    // We'll try to fetch as requested, but catch errors gracefully.

    this.logger.log(
      `Fetching from Yahoo Finance: ${yahooSymbol} (${interval}) [${startTime.toISOString()} - ${endTime.toISOString()}]`,
    );

    try {
      const queryOptions = {
        period1: startTime,
        period2: endTime,
        interval: interval as any, // '1m' | '2m' | '5m' | '15m' | '30m' | '60m' | '90m' | '1h' | '1d' | '5d' | '1wk' | '1mo' | '3mo'
      };

      const result = await yahooFinance.historical(yahooSymbol, queryOptions);

      // Transform to match MetaApi format
      // Yahoo returns: { date, open, high, low, close, adjClose, volume }
      // MetaApi expects: { time, open, high, low, close, tickVolume, spread, etc. }

      return (result as any[]).map((candle) => ({
        time: candle.date,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        tickVolume: candle.volume,
      }));
    } catch (error) {
      this.logger.warn(
        `Failed to fetch from Yahoo Finance for ${yahooSymbol}: ${error.message}`,
      );
      // Return empty array instead of throwing to allow graceful degradation in the chain
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
}
