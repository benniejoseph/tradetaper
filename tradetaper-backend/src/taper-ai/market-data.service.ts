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

export interface SwingPoint {
  date: string;
  price: number;
  type: 'high' | 'low';
}

export interface FairValueGap {
  /** Date of the third (displacement) candle that created the gap. */
  date: string;
  type: 'bullish' | 'bearish';
  top: number;
  bottom: number;
  /** True if price has since closed back through the gap (no longer a valid PD array). */
  mitigated: boolean;
}

export interface EqualLevel {
  price: number;
  count: number;
}

export interface KillZoneStatus {
  nowNy: string;
  activeZone: string | null;
  activeZoneIsNoTrade: boolean;
  nextZone: string;
  minutesToNextZone: number;
}

/**
 * ICT (Inner Circle Trader) structural context — computed deterministically
 * in code from raw OHLC so the LLM never has to eyeball swing points or gaps
 * off a text dump. The LLM's job is to interpret this scaffolding (which PD
 * array matters, what the draw on liquidity implies), not to detect it.
 */
export interface ICTContext {
  /** Previous COMPLETE daily bar's high/low — the default DOL target. */
  pdh: number | null;
  pdl: number | null;
  /** Previous complete week's high/low — escalate here only if PDH/PDL is too close. */
  pwh: number | null;
  pwl: number | null;
  /** IPDA 20-trading-day equilibrium: only buy below it, only sell above it. */
  ipda20Eq: number | null;
  ipda20High: number | null;
  ipda20Low: number | null;
  premiumDiscount: 'premium' | 'discount' | 'equilibrium' | null;
  /** Average daily range over the last 14 sessions, in price units. */
  adr14: number | null;
  /** HH/HL (bullish) or LH/LL (bearish) read from the last few daily swing points. */
  dailyStructure: 'bullish' | 'bearish' | 'choppy' | null;
  dailySwings: SwingPoint[];
  intradaySwings: SwingPoint[];
  dailyFvgs: FairValueGap[];
  intradayFvgs: FairValueGap[];
  /** Equal highs/lows = engineered retail liquidity (resting stops). */
  equalHighs: EqualLevel[];
  equalLows: EqualLevel[];
  killZone: KillZoneStatus;
  /** Compact recent candles kept specifically for ICT judgment calls (order blocks, CISD, Judas). */
  dailyCandles: Candle[];
  intradayCandles: Candle[];
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
  ict: ICTContext | null;
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

  // ---- ICT structural analysis -------------------------------------------
  // Every function below is deterministic — same rule as the rest of this
  // file: the code detects structure, the LLM interprets it. Definitions are
  // ICT's own (fractal swings, 3-candle FVGs, tolerance-clustered equal
  // highs/lows), synthesized from the desk's ICT reference material.

  /** Fractal swing points: a bar whose high/low is the extreme within a ±lookback window. */
  private detectSwings(bars: Candle[], lookback = 2): SwingPoint[] {
    const swings: SwingPoint[] = [];
    for (let i = lookback; i < bars.length - lookback; i++) {
      const window = bars.slice(i - lookback, i + lookback + 1);
      const b = bars[i];
      if (b.high === Math.max(...window.map((w) => w.high))) {
        swings.push({ date: b.date, price: b.high, type: 'high' });
      } else if (b.low === Math.min(...window.map((w) => w.low))) {
        swings.push({ date: b.date, price: b.low, type: 'low' });
      }
    }
    return swings;
  }

  /** Reads HH/HL vs LH/LL off the last few swing points. */
  private structureFromSwings(swings: SwingPoint[]): 'bullish' | 'bearish' | 'choppy' | null {
    const highs = swings.filter((s) => s.type === 'high').slice(-2);
    const lows = swings.filter((s) => s.type === 'low').slice(-2);
    if (highs.length < 2 || lows.length < 2) return null;
    const higherHigh = highs[1].price > highs[0].price;
    const higherLow = lows[1].price > lows[0].price;
    if (higherHigh && higherLow) return 'bullish';
    if (!higherHigh && !higherLow) return 'bearish';
    return 'choppy';
  }

  /**
   * 3-candle Fair Value Gaps: bullish when candle[i].low > candle[i-2].high,
   * bearish when candle[i].high < candle[i-2].low. Mitigated once a later
   * candle CLOSES back through the far boundary (ICT's invalidation rule).
   */
  private detectFVGs(bars: Candle[], maxResults = 6): FairValueGap[] {
    const gaps: FairValueGap[] = [];
    for (let i = 2; i < bars.length; i++) {
      const a = bars[i - 2];
      const c = bars[i];
      if (c.low > a.high) {
        gaps.push({ date: c.date, type: 'bullish', top: c.low, bottom: a.high, mitigated: false });
      } else if (c.high < a.low) {
        gaps.push({ date: c.date, type: 'bearish', top: a.low, bottom: c.high, mitigated: false });
      }
    }
    for (const gap of gaps) {
      const createdIdx = bars.findIndex((b) => b.date === gap.date);
      for (let j = createdIdx + 1; j < bars.length; j++) {
        const closed = bars[j].close;
        if (gap.type === 'bullish' && closed < gap.bottom) { gap.mitigated = true; break; }
        if (gap.type === 'bearish' && closed > gap.top) { gap.mitigated = true; break; }
      }
    }
    return gaps.filter((g) => !g.mitigated).slice(-maxResults);
  }

  /** Clusters swing highs/lows within tolerancePct of each other — ICT's "equal highs/lows" (resting liquidity). */
  private detectEqualLevels(
    swings: SwingPoint[],
    type: 'high' | 'low',
    tolerancePct = 0.08,
  ): EqualLevel[] {
    const prices = swings.filter((s) => s.type === type).map((s) => s.price);
    const clusters: EqualLevel[] = [];
    for (const p of prices) {
      const cluster = clusters.find((c) => Math.abs(c.price - p) / p <= tolerancePct / 100);
      if (cluster) { cluster.count++; cluster.price = (cluster.price + p) / 2; }
      else clusters.push({ price: p, count: 1 });
    }
    return clusters.filter((c) => c.count >= 2).sort((a, b) => b.count - a.count).slice(0, 4);
  }

  /**
   * ICT kill zones in NY time (handles DST via Intl, not manual UTC offsets).
   * NY Lunch is flagged explicitly — ICT's absolute no-trade window.
   */
  private killZoneStatus(now: Date): KillZoneStatus {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(now);
    const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    const mins = h * 60 + m;

    const zones: { name: string; start: number; end: number; noTrade?: boolean }[] = [
      { name: 'Asian', start: 20 * 60, end: 24 * 60 },
      { name: 'London', start: 2 * 60, end: 5 * 60 },
      { name: 'NY AM', start: 8 * 60 + 30, end: 11 * 60 },
      { name: 'NY Lunch (no-trade)', start: 12 * 60, end: 13 * 60, noTrade: true },
      { name: 'NY PM', start: 13 * 60 + 30, end: 16 * 60 },
    ];
    const active = zones.find((z) => mins >= z.start && mins < z.end) ?? null;
    const upcoming = zones
      .map((z) => ({ z, delta: z.start > mins ? z.start - mins : z.start + 1440 - mins }))
      .sort((a, b) => a.delta - b.delta)[0];

    return {
      nowNy: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      activeZone: active?.name ?? null,
      activeZoneIsNoTrade: active?.noTrade ?? false,
      nextZone: upcoming.z.name,
      minutesToNextZone: upcoming.delta,
    };
  }

  private buildICTContext(
    daily: Candle[] | null,
    intraday: Candle[] | null,
    weekly: Candle[] | null,
  ): ICTContext | null {
    if (!daily || daily.length < 5) return null;

    // Previous COMPLETE bar only — the live/forming bar is excluded so PDH/PDL
    // never silently updates mid-session (ICT: PDH/PDL is fixed at the open).
    const priorDaily = daily.slice(0, -1);
    const pdh = priorDaily.length ? priorDaily[priorDaily.length - 1].high : null;
    const pdl = priorDaily.length ? priorDaily[priorDaily.length - 1].low : null;

    const priorWeekly = weekly && weekly.length > 1 ? weekly[weekly.length - 2] : null;
    const pwh = priorWeekly?.high ?? null;
    const pwl = priorWeekly?.low ?? null;

    const last20 = daily.slice(-20);
    const ipda20High = last20.length ? Math.max(...last20.map((b) => b.high)) : null;
    const ipda20Low = last20.length ? Math.min(...last20.map((b) => b.low)) : null;
    const ipda20Eq = ipda20High != null && ipda20Low != null ? (ipda20High + ipda20Low) / 2 : null;
    const lastPrice = daily[daily.length - 1].close;
    const premiumDiscount: ICTContext['premiumDiscount'] =
      ipda20Eq == null ? null
      : Math.abs(lastPrice - ipda20Eq) / ipda20Eq < 0.001 ? 'equilibrium'
      : lastPrice > ipda20Eq ? 'premium' : 'discount';

    const last14 = daily.slice(-14);
    const adr14 = last14.length
      ? last14.reduce((sum, b) => sum + (b.high - b.low), 0) / last14.length
      : null;

    const dailySwings = this.detectSwings(daily.slice(-60), 2);
    const intradaySwings = intraday ? this.detectSwings(intraday.slice(-80), 2) : [];

    return {
      pdh, pdl, pwh, pwl,
      ipda20Eq, ipda20High, ipda20Low, premiumDiscount,
      adr14,
      dailyStructure: this.structureFromSwings(dailySwings),
      dailySwings: dailySwings.slice(-8),
      intradaySwings: intradaySwings.slice(-8),
      dailyFvgs: this.detectFVGs(daily.slice(-60)),
      intradayFvgs: intraday ? this.detectFVGs(intraday.slice(-80)) : [],
      equalHighs: this.detectEqualLevels(dailySwings, 'high'),
      equalLows: this.detectEqualLevels(dailySwings, 'low'),
      killZone: this.killZoneStatus(new Date()),
      dailyCandles: daily.slice(-15),
      intradayCandles: intraday ? intraday.slice(-30) : [],
    };
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
      // 150 bars ≈ 6 trading days of 1h candles — the minimum for the ICT
      // analyst to read Asian/London/NY session structure across more than
      // one session. Same single API call as before; no extra rate-limit cost.
      this.twelveData(symbol, '1h', 150),
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

    const ict = this.buildICTContext(daily, intradayBars, weeklyBars);
    if (!ict) errors.push('Insufficient daily history for ICT structural analysis (need 5+ bars).');

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
      ict,
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

  private renderCandles(candles: Candle[], digits: number): string {
    return candles
      .map(
        (b) =>
          `    ${b.date}  O${this.f(b.open, digits)} H${this.f(b.high, digits)} L${this.f(b.low, digits)} C${this.f(b.close, digits)}`,
      )
      .join('\n');
  }

  /** Deterministically-computed ICT structural context, formatted for the ICT analyst. */
  private renderICT(s: MarketSnapshot): string {
    const ict = s.ict;
    if (!ict) {
      return 'ICT STRUCTURE: unavailable — insufficient daily price history for this instrument.';
    }
    const d = s.assetClass === 'forex' ? 5 : 2;
    const kz = ict.killZone;
    const swingLine = (sw: SwingPoint) => `${sw.date} ${sw.type.toUpperCase()} ${this.f(sw.price, d)}`;
    const fvgLine = (g: FairValueGap) =>
      `${g.date} ${g.type.toUpperCase()} FVG  ${this.f(g.bottom, d)}–${this.f(g.top, d)} (unmitigated)`;

    return [
      `ICT STRUCTURE (all values computed deterministically — interpret, do not recompute):`,
      ``,
      `BIAS INPUTS:`,
      `  Daily structure (from swing points): ${ict.dailyStructure ?? 'insufficient swings to call'}`,
      `  Premium/Discount: price is in ${ict.premiumDiscount?.toUpperCase() ?? 'n/a'} relative to the IPDA 20-day equilibrium`,
      `    IPDA 20D range: ${this.f(ict.ipda20Low, d)} – ${this.f(ict.ipda20High, d)}, equilibrium ${this.f(ict.ipda20Eq, d)}`,
      `  ADR(14): ${this.f(ict.adr14, d)}`,
      ``,
      `DRAW ON LIQUIDITY (DOL) CANDIDATES, in ICT priority order:`,
      `  Priority 0 — Prior week H/L: ${this.f(ict.pwh, d)} / ${this.f(ict.pwl, d)}`,
      `  Priority 1 — Prior day H/L (PDH/PDL): ${this.f(ict.pdh, d)} / ${this.f(ict.pdl, d)}`,
      `  Equal highs (engineered BSL — resting buy stops): ${ict.equalHighs.length ? ict.equalHighs.map((e) => `${this.f(e.price, d)} (×${e.count})`).join(', ') : 'none detected'}`,
      `  Equal lows (engineered SSL — resting sell stops): ${ict.equalLows.length ? ict.equalLows.map((e) => `${this.f(e.price, d)} (×${e.count})`).join(', ') : 'none detected'}`,
      ``,
      `UNMITIGATED FAIR VALUE GAPS (highest-priority PD arrays; ranked by ICT as the primary entry zone):`,
      `  Daily: ${ict.dailyFvgs.length ? '' : 'none currently open'}`,
      ...ict.dailyFvgs.map((g) => `    ${fvgLine(g)}`),
      `  Intraday (1h): ${ict.intradayFvgs.length ? '' : 'none currently open'}`,
      ...ict.intradayFvgs.map((g) => `    ${fvgLine(g)}`),
      ``,
      `RECENT SWING POINTS (for identifying order blocks — the last opposing candle before the impulse into each swing):`,
      `  Daily: ${ict.dailySwings.length ? ict.dailySwings.map(swingLine).join(' | ') : 'none detected'}`,
      `  Intraday: ${ict.intradaySwings.length ? ict.intradaySwings.map(swingLine).join(' | ') : 'none detected'}`,
      ``,
      `KILL ZONE (NY time now: ${kz.nowNy}):`,
      kz.activeZoneIsNoTrade
        ? `  ⛔ Currently inside ${kz.activeZone} — ICT's absolute no-trade window. Any setup here should be flagged, not acted on.`
        : kz.activeZone
          ? `  ✅ Currently inside the ${kz.activeZone} kill zone.`
          : `  Currently OUTSIDE any kill zone. Next: ${kz.nextZone} in ${kz.minutesToNextZone} min.`,
      ``,
      `RECENT DAILY CANDLES (O/H/L/C, oldest first):`,
      this.renderCandles(ict.dailyCandles, d),
      ``,
      `RECENT INTRADAY CANDLES — 1h (O/H/L/C, oldest first):`,
      this.renderCandles(ict.intradayCandles, d),
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
      case 'ict':
        return `${header}\n\n${this.renderICT(s)}`;
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
        return `${header}\n\nMULTI-TIMEFRAME PRICE STRUCTURE:\n\n${tfs(['intraday', 'daily', 'weekly'])}\n\n${this.renderICT(s)}\n\n${this.renderNews(s)}`;
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
