// src/taper-ai/market-data.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Multi-source, multi-timeframe market data for the TaperAI Desk.
 *
 * Design rules:
 * - Every number handed to an agent is fetched or computed in code. The LLM
 *   interprets; it never calculates and never invents a price.
 * - Multiple providers with fallback. A single unofficial source (Yahoo)
 *   rate-limits and then silently starves the analysts — the root cause of
 *   early runs all scoring ~30.
 * - Each analyst gets a ROLE-SPECIFIC context, so the news analyst actually
 *   receives news and the sentiment analyst actually receives sentiment.
 */

export type AssetClass = 'equity' | 'forex' | 'crypto';
export type Timeframe = 'intraday' | 'daily' | 'weekly';

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TimeframeStats {
  label: string;
  bars: number;
  last: number;
  sma20: number | null;
  sma50: number | null;
  rsi14: number | null;
  changePct1: number | null;
  changePct5: number | null;
  changePct20: number | null;
  atrPct: number | null;
  rangeHigh: number;
  rangeLow: number;
  recent: Candle[];
}

export interface NewsItem {
  title: string;
  publisher: string;
  publishedUtc: string;
  description?: string;
  sentiment?: string;
  sentimentReasoning?: string;
}

export interface MarketSnapshot {
  symbol: string;
  resolvedSymbol: string;
  assetClass: AssetClass;
  sources: string[];
  asOf: string;
  quote: {
    price: number | null;
    previousClose: number | null;
    changePct: number | null;
    dayHigh: number | null;
    dayLow: number | null;
    fiftyTwoWeekHigh: number | null;
    fiftyTwoWeekLow: number | null;
    currency?: string;
    volume?: number | null;
  };
  timeframes: Partial<Record<Timeframe, TimeframeStats>>;
  news: NewsItem[];
  newsWindowDays: number;
  errors: string[];
}

const CURRENCY_CODES = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'NZD', 'CAD', 'SGD', 'HKD',
  'SEK', 'NOK', 'MXN', 'ZAR', 'TRY', 'CNH', 'INR', 'PLN',
]);

/** Full names give far better news-search recall than bare tickers. */
const ASSET_NAMES: Record<string, string> = {
  BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', XRP: 'XRP', ADA: 'Cardano',
  DOGE: 'Dogecoin', DOT: 'Polkadot', AVAX: 'Avalanche', LINK: 'Chainlink',
  LTC: 'Litecoin', BNB: 'BNB', MATIC: 'Polygon crypto', SHIB: 'Shiba Inu',
  UNI: 'Uniswap', ATOM: 'Cosmos', XLM: 'Stellar', ETC: 'Ethereum Classic',
  NEAR: 'NEAR Protocol', APT: 'Aptos', ARB: 'Arbitrum',
};

const CRYPTO_BASES = new Set([
  'BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'AVAX', 'LINK', 'LTC',
  'BNB', 'MATIC', 'SHIB', 'UNI', 'ATOM', 'XLM', 'ETC', 'NEAR', 'APT', 'ARB',
]);

@Injectable()
export class TaperAiMarketDataService {
  private readonly logger = new Logger(TaperAiMarketDataService.name);

  constructor(private readonly config: ConfigService) {}

  private key(name: string): string | null {
    return this.config.get<string>(name) || null;
  }

  // ---- symbol classification -------------------------------------------

  classify(symbol: string): { assetClass: AssetClass; base: string; quote?: string } {
    const s = symbol.toUpperCase().replace('/', '').replace('-', '');
    if (s.length === 6 && CURRENCY_CODES.has(s.slice(0, 3)) && CURRENCY_CODES.has(s.slice(3))) {
      return { assetClass: 'forex', base: s.slice(0, 3), quote: s.slice(3) };
    }
    if (s.endsWith('USDT') && CRYPTO_BASES.has(s.slice(0, -4))) {
      return { assetClass: 'crypto', base: s.slice(0, -4), quote: 'USD' };
    }
    if (s.endsWith('USD') && CRYPTO_BASES.has(s.slice(0, -3))) {
      return { assetClass: 'crypto', base: s.slice(0, -3), quote: 'USD' };
    }
    return { assetClass: 'equity', base: s };
  }

  /** Symbol format Twelve Data expects (EUR/USD, BTC/USD, AAPL). */
  private tdSymbol(symbol: string): string {
    const c = this.classify(symbol);
    return c.quote ? `${c.base}/${c.quote}` : c.base;
  }

  private async getJson(url: string, timeoutMs = 12000): Promise<any | null> {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'TradeTaper-Desk/1.0' },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // ---- providers --------------------------------------------------------

  /** Twelve Data time series — covers equities, forex and crypto uniformly. */
  private async twelveData(
    symbol: string,
    interval: '1h' | '1day' | '1week',
    size: number,
  ): Promise<Candle[] | null> {
    const apikey = this.key('TWELVE_DATA_API_KEY');
    if (!apikey) return null;
    const url =
      `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(this.tdSymbol(symbol))}` +
      `&interval=${interval}&outputsize=${size}&apikey=${apikey}`;
    const d = await this.getJson(url);
    if (!d || d.status !== 'ok' || !Array.isArray(d.values)) return null;
    // Twelve Data returns newest-first; indicators expect oldest-first.
    return d.values
      .map((v: any) => ({
        date: v.datetime,
        open: Number(v.open),
        high: Number(v.high),
        low: Number(v.low),
        close: Number(v.close),
        volume: Number(v.volume ?? 0),
      }))
      .filter((c: Candle) => Number.isFinite(c.close))
      .reverse();
  }

  private async twelveDataQuote(symbol: string): Promise<any | null> {
    const apikey = this.key('TWELVE_DATA_API_KEY');
    if (!apikey) return null;
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(this.tdSymbol(symbol))}&apikey=${apikey}`;
    const d = await this.getJson(url);
    return d && !d.code && d.close ? d : null;
  }

  /** Yahoo chart — fallback only (unofficial, rate-limits aggressively). */
  private async yahoo(symbol: string, range: string, interval: string): Promise<Candle[] | null> {
    const c = this.classify(symbol);
    const y =
      c.assetClass === 'forex' ? `${c.base}${c.quote}=X`
      : c.assetClass === 'crypto' ? `${c.base}-USD`
      : c.base;
    const d = await this.getJson(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(y)}?range=${range}&interval=${interval}`,
    );
    const r = d?.chart?.result?.[0];
    if (!r?.timestamp?.length) return null;
    const q = r.indicators?.quote?.[0] ?? {};
    const out: Candle[] = [];
    for (let i = 0; i < r.timestamp.length; i++) {
      const close = q.close?.[i];
      if (close == null) continue;
      out.push({
        date: new Date(r.timestamp[i] * 1000).toISOString().slice(0, 10),
        open: q.open?.[i] ?? close,
        high: q.high?.[i] ?? close,
        low: q.low?.[i] ?? close,
        close,
        volume: q.volume?.[i] ?? 0,
      });
    }
    return out.length ? out : null;
  }

  /** Polygon news — includes per-ticker sentiment with reasoning. */
  private async polygonNews(symbol: string, limit = 10): Promise<NewsItem[]> {
    const apiKey = this.key('POLYGON_API_KEY');
    const c = this.classify(symbol);
    if (!apiKey || c.assetClass !== 'equity') return [];
    const d = await this.getJson(
      `https://api.polygon.io/v2/reference/news?ticker=${encodeURIComponent(c.base)}&limit=${limit}&apiKey=${apiKey}`,
    );
    if (!Array.isArray(d?.results)) return [];
    return d.results.map((a: any) => {
      const insight = (a.insights ?? []).find(
        (i: any) => String(i.ticker).toUpperCase() === c.base,
      );
      return {
        title: a.title,
        publisher: a.publisher?.name ?? 'unknown',
        publishedUtc: a.published_utc,
        description: a.description?.slice(0, 400),
        sentiment: insight?.sentiment,
        sentimentReasoning: insight?.sentiment_reasoning?.slice(0, 300),
      };
    });
  }

  /** NewsAPI — broader coverage; the only news path for forex/crypto. */
  private async newsApi(symbol: string, limit = 10): Promise<NewsItem[]> {
    const apiKey = this.key('NEWS_API_KEY');
    if (!apiKey) return [];
    const c = this.classify(symbol);
    const query =
      c.assetClass === 'forex'
        ? `"${c.base}/${c.quote}" OR "${c.base} ${c.quote}" forex exchange rate`
        : c.assetClass === 'crypto'
          ? `"${ASSET_NAMES[c.base] ?? c.base}" price OR market`
          : `"${c.base}" stock earnings OR shares`;
    const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const d = await this.getJson(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&from=${from}` +
        `&language=en&sortBy=publishedAt&pageSize=${limit}&apiKey=${apiKey}`,
    );
    if (!Array.isArray(d?.articles)) return [];
    return d.articles.map((a: any) => ({
      title: a.title,
      publisher: a.source?.name ?? 'unknown',
      publishedUtc: a.publishedAt,
      description: a.description?.slice(0, 300),
    }));
  }

  // ---- indicators (all computed in code, never by the LLM) --------------

  private sma(v: number[], p: number): number | null {
    if (v.length < p) return null;
    return v.slice(-p).reduce((a, b) => a + b, 0) / p;
  }

  private rsi14(closes: number[]): number | null {
    const p = 14;
    if (closes.length < p + 1) return null;
    let gain = 0;
    let loss = 0;
    for (let i = 1; i <= p; i++) {
      const d = closes[i] - closes[i - 1];
      if (d >= 0) gain += d;
      else loss -= d;
    }
    let ag = gain / p;
    let al = loss / p;
    for (let i = p + 1; i < closes.length; i++) {
      const d = closes[i] - closes[i - 1];
      ag = (ag * (p - 1) + Math.max(d, 0)) / p;
      al = (al * (p - 1) + Math.max(-d, 0)) / p;
    }
    return al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }

  private pct(closes: number[], back: number): number | null {
    if (closes.length <= back) return null;
    const prev = closes[closes.length - 1 - back];
    return prev ? ((closes[closes.length - 1] - prev) / prev) * 100 : null;
  }

  /** Average true range as a % of price — volatility / stop-sizing input. */
  private atrPct(bars: Candle[], p = 14): number | null {
    if (bars.length < p + 1) return null;
    let sum = 0;
    for (let i = bars.length - p; i < bars.length; i++) {
      const prev = bars[i - 1].close;
      sum += Math.max(
        bars[i].high - bars[i].low,
        Math.abs(bars[i].high - prev),
        Math.abs(bars[i].low - prev),
      );
    }
    const atr = sum / p;
    const last = bars[bars.length - 1].close;
    return last ? (atr / last) * 100 : null;
  }

  /**
   * Resample daily bars into weekly (ISO week) bars in code. Cheaper and more
   * reliable than a separate provider call, and keeps the long-term read
   * available whenever daily data is.
   */
  private toWeekly(daily: Candle[]): Candle[] {
    const weeks = new Map<string, Candle[]>();
    for (const b of daily) {
      const d = new Date(b.date);
      if (Number.isNaN(d.getTime())) continue;
      // Key by the Monday of that week.
      const day = (d.getUTCDay() + 6) % 7;
      const monday = new Date(d);
      monday.setUTCDate(d.getUTCDate() - day);
      const key = monday.toISOString().slice(0, 10);
      const arr = weeks.get(key);
      if (arr) arr.push(b);
      else weeks.set(key, [b]);
    }
    return [...weeks.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, bars]) => ({
        date: key,
        open: bars[0].open,
        high: Math.max(...bars.map((x) => x.high)),
        low: Math.min(...bars.map((x) => x.low)),
        close: bars[bars.length - 1].close,
        volume: bars.reduce((a, x) => a + (x.volume || 0), 0),
      }));
  }

  private stats(label: string, bars: Candle[], recentCount: number): TimeframeStats {
    const closes = bars.map((b) => b.close);
    return {
      label,
      bars: bars.length,
      last: closes[closes.length - 1],
      sma20: this.sma(closes, 20),
      sma50: this.sma(closes, 50),
      rsi14: this.rsi14(closes),
      changePct1: this.pct(closes, 1),
      changePct5: this.pct(closes, 5),
      changePct20: this.pct(closes, 20),
      atrPct: this.atrPct(bars),
      rangeHigh: Math.max(...bars.map((b) => b.high)),
      rangeLow: Math.min(...bars.map((b) => b.low)),
      recent: bars.slice(-recentCount),
    };
  }

  // ---- snapshot ---------------------------------------------------------

  async buildSnapshot(symbol: string): Promise<MarketSnapshot> {
    const c = this.classify(symbol);
    const sources: string[] = [];
    const errors: string[] = [];

    const [intradayBars, dailyBars, quote, pNews, nNews] = await Promise.all([
      this.twelveData(symbol, '1h', 60),
      this.twelveData(symbol, '1day', 260),
      this.twelveDataQuote(symbol),
      this.polygonNews(symbol),
      this.newsApi(symbol),
    ]);

    if (dailyBars) sources.push('Twelve Data (OHLC)');
    if (quote) sources.push('Twelve Data (quote)');
    if (pNews.length) sources.push('Polygon (news + sentiment)');
    if (nNews.length) sources.push('NewsAPI (news)');

    // Fall back to Yahoo only if the primary daily series failed.
    let daily = dailyBars;
    if (!daily) {
      daily = await this.yahoo(symbol, '1y', '1d');
      if (daily) sources.push('Yahoo Finance (fallback)');
      else errors.push('No daily price data available from any provider.');
    }

    const timeframes: Partial<Record<Timeframe, TimeframeStats>> = {};
    if (intradayBars?.length) timeframes.intraday = this.stats('Intraday (1h bars)', intradayBars, 8);
    if (daily?.length) timeframes.daily = this.stats('Daily', daily, 10);
    const weeklyBars = daily?.length ? this.toWeekly(daily) : null;
    if (weeklyBars?.length) timeframes.weekly = this.stats('Weekly (resampled from daily)', weeklyBars, 8);
    else errors.push('Weekly data unavailable — long-term read is limited.');

    if (!intradayBars) errors.push('Intraday (1h) data unavailable — intraday read is limited.');

    // De-duplicate news by title, newest first.
    const seen = new Set<string>();
    const news = [...pNews, ...nNews]
      .filter((n) => n.title && !seen.has(n.title) && seen.add(n.title))
      .sort((a, b) => (b.publishedUtc || '').localeCompare(a.publishedUtc || ''))
      .slice(0, 12);
    if (!news.length) errors.push('No news articles retrieved for this instrument.');

    const lastClose = daily?.length ? daily[daily.length - 1].close : null;
    const prevClose = daily && daily.length > 1 ? daily[daily.length - 2].close : null;

    this.logger.log(
      `Snapshot ${symbol}: sources=[${sources.join('; ')}] tf=[${Object.keys(timeframes).join(',')}] news=${news.length}`,
    );

    return {
      symbol: symbol.toUpperCase(),
      resolvedSymbol: this.tdSymbol(symbol),
      assetClass: c.assetClass,
      sources,
      asOf: new Date().toISOString(),
      quote: {
        price: quote ? Number(quote.close) : lastClose,
        previousClose: quote ? Number(quote.previous_close) : prevClose,
        changePct: quote ? Number(quote.percent_change) : null,
        dayHigh: quote ? Number(quote.high) : null,
        dayLow: quote ? Number(quote.low) : null,
        fiftyTwoWeekHigh: quote?.fifty_two_week ? Number(quote.fifty_two_week.high) : null,
        fiftyTwoWeekLow: quote?.fifty_two_week ? Number(quote.fifty_two_week.low) : null,
        currency: quote?.currency,
        volume: quote?.volume ? Number(quote.volume) : null,
      },
      timeframes,
      news,
      newsWindowDays: 7,
      errors,
    };
  }

  // ---- rendering --------------------------------------------------------

  private f(n: number | null | undefined, d = 2): string {
    return n == null || !Number.isFinite(n) ? 'n/a' : n.toFixed(d);
  }

  private renderTimeframe(t: TimeframeStats, digits: number): string {
    const rel = (v: number | null) =>
      v == null ? 'n/a' : `${t.last > v ? 'ABOVE' : 'BELOW'} ${this.f(v, digits)}`;
    return [
      `${t.label} — ${t.bars} bars`,
      `  last=${this.f(t.last, digits)} | vs SMA20: ${rel(t.sma20)} | vs SMA50: ${rel(t.sma50)}`,
      `  RSI(14)=${this.f(t.rsi14, 1)} | ATR≈${this.f(t.atrPct, 2)}% of price`,
      `  change: 1 bar ${this.f(t.changePct1)}% · 5 bars ${this.f(t.changePct5)}% · 20 bars ${this.f(t.changePct20)}%`,
      `  window range: ${this.f(t.rangeLow, digits)} – ${this.f(t.rangeHigh, digits)}`,
      `  recent bars (O/H/L/C):`,
      ...t.recent.map(
        (b) =>
          `    ${b.date}  ${this.f(b.open, digits)}/${this.f(b.high, digits)}/${this.f(b.low, digits)}/${this.f(b.close, digits)}` +
          `${b.volume ? `  vol ${Math.round(b.volume).toLocaleString('en-US')}` : ''}`,
      ),
    ].join('\n');
  }

  private renderNews(s: MarketSnapshot): string {
    if (!s.news.length) {
      return 'NEWS: none retrieved. State this gap explicitly; do not invent headlines.';
    }
    return [
      `NEWS (last ~${s.newsWindowDays} days, ${s.news.length} items, newest first):`,
      ...s.news.map((n, i) =>
        [
          `  ${i + 1}. [${n.publishedUtc?.slice(0, 16) ?? '?'}] ${n.title} — ${n.publisher}`,
          n.description ? `     ${n.description}` : null,
          n.sentiment
            ? `     provider sentiment: ${n.sentiment}${n.sentimentReasoning ? ` — ${n.sentimentReasoning}` : ''}`
            : null,
        ]
          .filter(Boolean)
          .join('\n'),
      ),
    ].join('\n');
  }

  private renderHeader(s: MarketSnapshot): string {
    const d = s.assetClass === 'forex' ? 5 : 2;
    const q = s.quote;
    const pos =
      q.price != null && q.fiftyTwoWeekHigh != null && q.fiftyTwoWeekLow != null &&
      q.fiftyTwoWeekHigh !== q.fiftyTwoWeekLow
        ? `${this.f(((q.price - q.fiftyTwoWeekLow) / (q.fiftyTwoWeekHigh - q.fiftyTwoWeekLow)) * 100, 0)}% of 52w range`
        : 'n/a';
    return [
      `INSTRUMENT: ${s.symbol} (${s.assetClass}, resolved as ${s.resolvedSymbol})`,
      `AS OF: ${s.asOf}`,
      `DATA SOURCES: ${s.sources.length ? s.sources.join(', ') : 'NONE — treat all figures as unavailable'}`,
      ...(s.errors.length ? [`DATA GAPS: ${s.errors.join(' | ')}`] : []),
      ``,
      `QUOTE: last=${this.f(q.price, d)} ${q.currency ?? ''} | prev close=${this.f(q.previousClose, d)} | day change=${this.f(q.changePct)}%`,
      `  day range: ${this.f(q.dayLow, d)} – ${this.f(q.dayHigh, d)} | 52w: ${this.f(q.fiftyTwoWeekLow, d)} – ${this.f(q.fiftyTwoWeekHigh, d)} (${pos})`,
    ].join('\n');
  }

  /**
   * Role-specific context. Previously every analyst got the same price blob,
   * which left the news, sentiment and fundamentals analysts with nothing to
   * analyze — they either hallucinated or reported a data gap.
   */
  renderForRole(s: MarketSnapshot, role: string): string {
    const d = s.assetClass === 'forex' ? 5 : 2;
    const header = this.renderHeader(s);
    const tfs = (keys: Timeframe[]) =>
      keys
        .map((k) => (s.timeframes[k] ? this.renderTimeframe(s.timeframes[k]!, d) : null))
        .filter(Boolean)
        .join('\n\n');

    switch (role) {
      case 'technical':
        return `${header}\n\nMULTI-TIMEFRAME PRICE STRUCTURE:\n\n${tfs(['intraday', 'daily', 'weekly'])}`;
      case 'news':
        return `${header}\n\n${this.renderNews(s)}\n\nPRICE REACTION CONTEXT (to judge whether the news is already priced in):\n\n${tfs(['daily'])}`;
      case 'sentiment':
        return `${header}\n\n${this.renderNews(s)}\n\nPOSITIONING / MOMENTUM CONTEXT (crowding shows up as stretched momentum):\n\n${tfs(['daily', 'weekly'])}`;
      case 'fundamentals':
        return (
          `${header}\n\n` +
          `NOTE ON FUNDAMENTALS: no financial-statement feed is wired up for this instrument, so ` +
          `valuation, earnings and balance-sheet data are NOT available. Do not invent ratios or ` +
          `earnings figures. Assess what IS here — multi-timeframe trend, volatility, 52-week ` +
          `positioning and news flow — and state the missing-fundamentals gap explicitly in ` +
          `dataGaps.\n\n${this.renderNews(s)}\n\nLONGER-TERM PRICE CONTEXT:\n\n${tfs(['daily', 'weekly'])}`
        );
      default:
        return `${header}\n\nMULTI-TIMEFRAME PRICE STRUCTURE:\n\n${tfs(['intraday', 'daily', 'weekly'])}\n\n${this.renderNews(s)}`;
    }
  }

  /** Full context for the synthesis stages (trader / risk / PM). */
  renderFull(s: MarketSnapshot): string {
    return this.renderForRole(s, 'all');
  }

  /** Backwards-compatible single-string context. */
  async buildContext(symbol: string): Promise<string> {
    return this.renderFull(await this.buildSnapshot(symbol));
  }
}
