import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MassiveService {
  private readonly logger = new Logger(MassiveService.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.polygon.io/v2/aggs/ticker';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('POLYGON_API_KEY') || '';
    if (this.apiKey) {
      this.logger.log('Massive (Polygon) Service initialized (HTTP Mode)');
    } else {
      this.logger.warn(
        'POLYGON_API_KEY not found. Massive integration disabled.',
      );
    }
  }

  // Map backend normalized timeframe to Polygon timeframe
  private readonly timeframeMap: Record<
    string,
    { multiplier: number; timespan: string }
  > = {
    '1m': { multiplier: 1, timespan: 'minute' },
    '5m': { multiplier: 5, timespan: 'minute' },
    '15m': { multiplier: 15, timespan: 'minute' },
    '30m': { multiplier: 30, timespan: 'minute' },
    '1h': { multiplier: 1, timespan: 'hour' },
    '4h': { multiplier: 4, timespan: 'hour' },
    '1d': { multiplier: 1, timespan: 'day' },
  };

  /**
   * Fetch candles from Massive (Polygon.io) via HTTP
   */
  async getCandles(
    symbol: string,
    timeframe: string,
    startTime: Date,
    endTime: Date,
  ): Promise<any[]> {
    if (!this.apiKey) return [];

    const ticker = this._resolveSymbol(symbol);
    const tf = this.timeframeMap[timeframe] || {
      multiplier: 1,
      timespan: 'day',
    };

    this.logger.log(
      `Fetching from Massive: ${ticker} (${tf.multiplier} ${tf.timespan}) [${startTime.toISOString()} - ${endTime.toISOString()}]`,
    );

    try {
      // Polygon API: /v2/aggs/ticker/{ticker}/range/{multiplier}/{timespan}/{from}/{to}
      // Times must be in Unix Msec
      const from = startTime.getTime();
      const to = endTime.getTime();

      const url = `${this.apiUrl}/${ticker}/range/${tf.multiplier}/${tf.timespan}/${from}/${to}`;

      const response = await axios.get(url, {
        params: {
          apiKey: this.apiKey,
          limit: 50000,
          adjusted: true,
          sort: 'asc',
        },
      });

      if (
        !response.data ||
        response.data.resultsCount === 0 ||
        !response.data.results
      ) {
        return [];
      }

      // Map to MetaApi format
      // Polygon: { t: unix_msec, o, h, l, c, v, vw, n }
      return response.data.results.map((candle: Record<string, any>) => ({
        time: new Date(candle.t),
        open: candle.o,
        high: candle.h,
        low: candle.l,
        close: candle.c,
        tickVolume: candle.v,
      }));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.warn(
          `Failed to fetch from Massive for ${ticker}: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`,
        );
      } else {
        this.logger.warn(
          `Failed to fetch from Massive for ${ticker}: ${error.message}`,
        );
      }
      return [];
    }
  }

  /**
   * Resolve generic symbols to Polygon tickers
   */
  private _resolveSymbol(symbol: string): string {
    const s = symbol.toUpperCase().trim();

    // Forex: C:EURUSD
    if (s.length === 6 && /^[A-Z]+$/.test(s)) {
      return `C:${s}`;
    }

    // Crypto: X:BTCUSD
    if (s === 'BTCUSD') return 'X:BTCUSD';
    if (s === 'ETHUSD') return 'X:ETHUSD';

    // Indices (Polygon uses specific tickers, often needing I:)
    if (s === 'SPX' || s === 'US500') return 'I:SPX';
    if (s === 'NDX' || s === 'NAS100') return 'I:NDX';
    if (s === 'DJI' || s === 'US30') return 'I:DJI';

    return s;
  }
}
