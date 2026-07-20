// src/taper-ai/market-data.service.ts
import { Injectable, Logger } from '@nestjs/common';

/**
 * Self-contained market data for the TaperAI Desk.
 *
 * Fetches real quotes + daily history from Yahoo Finance's public chart API
 * (no API key) and computes all indicators deterministically in code — the
 * LLM analysts interpret these numbers, they never compute them. Supports
 * stocks (AAPL), crypto (BTCUSD -> BTC-USD), and forex (EURUSD -> EURUSD=X).
 */

interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const CURRENCY_CODES = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'NZD', 'CAD', 'SGD', 'HKD',
  'SEK', 'NOK', 'MXN', 'ZAR', 'TRY', 'CNH', 'INR', 'PLN',
]);

const CRYPTO_BASES = new Set([
  'BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'AVAX', 'LINK', 'LTC',
  'BNB', 'MATIC', 'SHIB', 'UNI', 'ATOM', 'XLM', 'ETC', 'NEAR', 'APT', 'ARB',
]);

@Injectable()
export class TaperAiMarketDataService {
  private readonly logger = new Logger(TaperAiMarketDataService.name);

  /** Candidate Yahoo symbols for a user-entered instrument, in try-order. */
  private candidates(symbol: string): string[] {
    const s = symbol.toUpperCase().replace('/', '');
    const out: string[] = [];
    if (s.length === 6 && CURRENCY_CODES.has(s.slice(0, 3)) && CURRENCY_CODES.has(s.slice(3))) {
      out.push(`${s}=X`); // forex pair
    }
    if (s.endsWith('USD') && CRYPTO_BASES.has(s.slice(0, -3))) {
      out.push(`${s.slice(0, -3)}-USD`); // crypto pair
    }
    out.push(s); // plain ticker (stocks, indices, already-suffixed input)
    return [...new Set(out)];
  }

  private async fetchChart(yahooSymbol: string): Promise<{
    meta: any;
    candles: Candle[];
  } | null> {
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}` +
      `?range=6mo&interval=1d`;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (TradeTaper Desk)' },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return null;
      const body: any = await res.json();
      const result = body?.chart?.result?.[0];
      if (!result?.timestamp?.length) return null;
      const q = result.indicators?.quote?.[0];
      const candles: Candle[] = [];
      for (let i = 0; i < result.timestamp.length; i++) {
        const close = q?.close?.[i];
        if (close == null) continue;
        candles.push({
          date: new Date(result.timestamp[i] * 1000).toISOString().slice(0, 10),
          open: q.open?.[i] ?? close,
          high: q.high?.[i] ?? close,
          low: q.low?.[i] ?? close,
          close,
          volume: q.volume?.[i] ?? 0,
        });
      }
      if (candles.length < 10) return null;
      return { meta: result.meta ?? {}, candles };
    } catch (err: any) {
      this.logger.warn(`Yahoo fetch failed for ${yahooSymbol}: ${err.message}`);
      return null;
    }
  }

  // ---- Deterministic indicators -----------------------------------------

  private sma(closes: number[], period: number): number | null {
    if (closes.length < period) return null;
    const slice = closes.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  private rsi14(closes: number[]): number | null {
    const period = 14;
    if (closes.length < period + 1) return null;
    let gain = 0;
    let loss = 0;
    for (let i = 1; i <= period; i++) {
      const d = closes[i] - closes[i - 1];
      if (d >= 0) gain += d;
      else loss -= d;
    }
    let avgGain = gain / period;
    let avgLoss = loss / period;
    for (let i = period + 1; i < closes.length; i++) {
      const d = closes[i] - closes[i - 1];
      avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
    }
    if (avgLoss === 0) return 100;
    return 100 - 100 / (1 + avgGain / avgLoss);
  }

  private pctReturn(closes: number[], bars: number): number | null {
    if (closes.length <= bars) return null;
    const past = closes[closes.length - 1 - bars];
    return ((closes[closes.length - 1] - past) / past) * 100;
  }

  private annualizedVol(closes: number[], bars = 30): number | null {
    if (closes.length < bars + 1) return null;
    const rets: number[] = [];
    for (let i = closes.length - bars; i < closes.length; i++) {
      rets.push(Math.log(closes[i] / closes[i - 1]));
    }
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const variance =
      rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1);
    return Math.sqrt(variance) * Math.sqrt(252) * 100;
  }

  private fmt(n: number | null | undefined, digits = 2): string {
    return n == null || !Number.isFinite(n) ? 'n/a' : n.toFixed(digits);
  }

  /**
   * Build a rich, factual market-context block for the Desk's analysts.
   * Returns an explicit "no data" message when every source fails, so the
   * agents state data gaps instead of hallucinating.
   */
  async buildContext(symbol: string): Promise<string> {
    for (const candidate of this.candidates(symbol)) {
      const chart = await this.fetchChart(candidate);
      if (!chart) continue;

      const { meta, candles } = chart;
      const closes = candles.map((c) => c.close);
      const last = candles[candles.length - 1];
      const prev = candles[candles.length - 2];
      const price = meta.regularMarketPrice ?? last.close;
      const sma20 = this.sma(closes, 20);
      const sma50 = this.sma(closes, 50);
      const hi52 = meta.fiftyTwoWeekHigh ?? Math.max(...candles.map((c) => c.high));
      const lo52 = meta.fiftyTwoWeekLow ?? Math.min(...candles.map((c) => c.low));
      const avgVol20 =
        candles.slice(-20).reduce((a, c) => a + c.volume, 0) / Math.min(20, candles.length);

      const recent = candles
        .slice(-10)
        .map(
          (c) =>
            `${c.date}  O:${this.fmt(c.open, 4)} H:${this.fmt(c.high, 4)} L:${this.fmt(c.low, 4)} C:${this.fmt(c.close, 4)} V:${Math.round(c.volume)}`,
        )
        .join('\n');

      this.logger.log(`Market data resolved for ${symbol} via ${candidate}`);
      return [
        `SOURCE: Yahoo Finance (${candidate}) — daily data, all indicators computed programmatically.`,
        ``,
        `QUOTE:`,
        `- Last price: ${this.fmt(price, 4)} ${meta.currency ?? ''}`,
        `- Previous close: ${this.fmt(prev?.close, 4)}  |  1-day change: ${this.fmt(this.pctReturn(closes, 1))}%`,
        `- 52-week range: ${this.fmt(lo52, 4)} – ${this.fmt(hi52, 4)} (price is ${this.fmt(((price - lo52) / (hi52 - lo52)) * 100, 0)}% of the range)`,
        `- Exchange: ${meta.fullExchangeName ?? meta.exchangeName ?? 'n/a'}  |  Instrument type: ${meta.instrumentType ?? 'n/a'}`,
        ``,
        `COMPUTED INDICATORS (daily closes, ${closes.length} bars):`,
        `- SMA20: ${this.fmt(sma20, 4)} (price ${sma20 != null ? (price > sma20 ? 'ABOVE' : 'BELOW') : 'n/a'})`,
        `- SMA50: ${this.fmt(sma50, 4)} (price ${sma50 != null ? (price > sma50 ? 'ABOVE' : 'BELOW') : 'n/a'})`,
        `- RSI(14): ${this.fmt(this.rsi14(closes), 1)}`,
        `- Returns: 1w ${this.fmt(this.pctReturn(closes, 5))}%  |  1m ${this.fmt(this.pctReturn(closes, 21))}%  |  3m ${this.fmt(this.pctReturn(closes, 63))}%`,
        `- Annualized volatility (30d): ${this.fmt(this.annualizedVol(closes), 1)}%`,
        `- Avg daily volume (20d): ${Math.round(avgVol20).toLocaleString('en-US')}`,
        ``,
        `LAST 10 DAILY CANDLES:`,
        recent,
      ].join('\n');
    }

    this.logger.warn(`No market data source resolved for ${symbol}`);
    return (
      'No live market data could be retrieved for this instrument. ' +
      'State this data gap explicitly in your analysis; do not invent prices or levels.'
    );
  }
}
