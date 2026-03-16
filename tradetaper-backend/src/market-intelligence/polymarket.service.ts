import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

type PolymarketAssetClass = 'all' | 'forex' | 'metals' | 'commodities' | 'indices';

interface RawPolymarketMarket {
  id?: string;
  conditionId?: string;
  question?: string;
  slug?: string;
  endDate?: string;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  volume?: number | string;
  volumeNum?: number | string;
  liquidity?: number | string;
  liquidityNum?: number | string;
  outcomes?: string | string[];
  outcomePrices?: string | string[];
  tags?: Array<{ name?: string } | string>;
  category?: string;
  [key: string]: unknown;
}

export interface PolymarketMarketView {
  id: string;
  question: string;
  slug: string;
  probability: number;
  endDate: string | null;
  volume: number;
  liquidity: number;
  outcomes: string[];
  outcomePrices: number[];
  tags: string[];
  category: string;
  url: string;
  assetClasses: PolymarketAssetClass[];
}

export interface PolymarketResponse {
  markets: PolymarketMarketView[];
  assetClass: PolymarketAssetClass;
  generatedAt: string;
  count: number;
  source: string;
}

@Injectable()
export class PolymarketService {
  private readonly logger = new Logger(PolymarketService.name);
  private readonly gammaUrl =
    process.env.POLYMARKET_GAMMA_URL || 'https://gamma-api.polymarket.com';

  private readonly keywordMap: Record<Exclude<PolymarketAssetClass, 'all'>, string[]> = {
    forex: [
      'forex',
      'fx',
      'eurusd',
      'gbpusd',
      'usdjpy',
      'audusd',
      'usdcad',
      'us dollar',
      'usd',
      'dollar',
      'euro',
      'yen',
      'ecb',
      'fed',
      'boe',
      'boj',
      'nfp',
      'cpi',
      'fomc',
      'interest rate',
      'rate cut',
      'rate hike',
      'inflation',
      'cpi',
      'pce',
      'nfp',
      'payrolls',
      'unemployment',
      'gdp',
      'pmi',
      'boj',
      'boe',
    ],
    metals: ['gold', 'silver', 'xau', 'xag', 'metals'],
    commodities: ['commodity', 'crude', 'oil', 'wti', 'brent', 'natural gas', 'copper'],
    indices: [
      'index',
      'indices',
      'nasdaq',
      's&p',
      'spx',
      'dow',
      'russell',
      'dax',
      'nikkei',
      'equity market',
      's&p 500',
      'sp500',
      'nas100',
      'us100',
      'us30',
      'dow jones',
      'hang seng',
      'stoxx',
      'vix',
    ],
  };

  private readonly tradingInclusionKeywords: string[] = [
    'forex',
    'fx',
    'eurusd',
    'gbpusd',
    'usdjpy',
    'xau',
    'gold',
    'silver',
    'crude',
    'oil',
    'wti',
    'brent',
    'natural gas',
    'commodity',
    's&p',
    'spx',
    'nasdaq',
    'dow',
    'index',
    'indices',
    'fed',
    'fomc',
    'ecb',
    'boj',
    'boe',
    'interest rate',
    'rate cut',
    'rate hike',
    'inflation',
    'cpi',
    'nfp',
    'payroll',
    'unemployment',
    'gdp',
    'pmi',
    'recession',
    'yield',
    'treasury',
  ];

  private readonly excludedKeywords: string[] = [
    'nba',
    'nfl',
    'mlb',
    'nhl',
    'fifa',
    'ufc',
    'oscar',
    'grammy',
    'celebrity',
    'movie',
    'tv show',
    'box office',
    'crypto',
    'bitcoin',
    'ethereum',
    'solana',
    'memecoin',
  ];

  constructor(private readonly httpService: HttpService) {}

  async getMarkets(assetClass: string, limit = 40): Promise<PolymarketResponse> {
    const normalizedAssetClass = this.normalizeAssetClass(assetClass);
    const safeLimit = Math.min(Math.max(Math.trunc(limit || 40), 5), 100);

    const rawMarkets = await this.fetchActiveMarkets(Math.max(safeLimit * 4, 80));

    const mapped = rawMarkets
      .map((market) => this.toMarketView(market))
      .filter((market): market is PolymarketMarketView => market !== null)
      .filter((market) => this.isTradingRelevantMarket(market))
      .filter((market) => this.matchesAssetClass(market, normalizedAssetClass))
      .sort((a, b) => b.liquidity - a.liquidity || b.volume - a.volume)
      .slice(0, safeLimit);

    return {
      markets: mapped,
      assetClass: normalizedAssetClass,
      generatedAt: new Date().toISOString(),
      count: mapped.length,
      source: 'polymarket-gamma',
    };
  }

  private normalizeAssetClass(assetClass?: string): PolymarketAssetClass {
    const value = (assetClass || 'all').trim().toLowerCase();
    if (['forex', 'metals', 'commodities', 'indices'].includes(value)) {
      return value as PolymarketAssetClass;
    }
    return 'all';
  }

  private async fetchActiveMarkets(limit: number): Promise<RawPolymarketMarket[]> {
    const url = `${this.gammaUrl.replace(/\/$/, '')}/markets`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            limit,
            archived: false,
            closed: false,
          },
          timeout: 10000,
          headers: {
            Accept: 'application/json',
          },
        }),
      );

      if (!Array.isArray(response.data)) {
        this.logger.warn('Polymarket response is not an array; returning empty list');
        return [];
      }

      return response.data as RawPolymarketMarket[];
    } catch (error) {
      this.logger.error('Failed to fetch markets from Polymarket Gamma API', error as any);
      return [];
    }
  }

  private toMarketView(raw: RawPolymarketMarket): PolymarketMarketView | null {
    const id = String(raw.id || raw.conditionId || '').trim();
    const question = String(raw.question || '').trim();
    if (!id || !question) {
      return null;
    }

    const slug = String(raw.slug || '').trim();
    const outcomes = this.parseStringArray(raw.outcomes);
    const outcomePrices = this.parseNumberArray(raw.outcomePrices);
    const probability = this.pickPrimaryProbability(outcomes, outcomePrices);
    const volume = this.toNumber(raw.volumeNum ?? raw.volume);
    const liquidity = this.toNumber(raw.liquidityNum ?? raw.liquidity);
    const tags = this.parseTags(raw.tags);
    const category = String(raw.category || '').trim();
    const assetClasses = this.deriveAssetClasses(question, category, tags);

    return {
      id,
      question,
      slug,
      probability,
      endDate: raw.endDate ? String(raw.endDate) : null,
      volume,
      liquidity,
      outcomes,
      outcomePrices,
      tags,
      category,
      url: slug ? `https://polymarket.com/event/${slug}` : 'https://polymarket.com/',
      assetClasses,
    };
  }

  private matchesAssetClass(
    market: PolymarketMarketView,
    assetClass: PolymarketAssetClass,
  ): boolean {
    if (assetClass === 'all') return true;
    return market.assetClasses.includes(assetClass);
  }

  private deriveAssetClasses(
    question: string,
    category: string,
    tags: string[],
  ): PolymarketAssetClass[] {
    const haystack = `${question} ${category} ${tags.join(' ')}`.toLowerCase();

    const classes = (Object.keys(this.keywordMap) as Array<Exclude<PolymarketAssetClass, 'all'>>)
      .filter((assetClass) =>
        this.keywordMap[assetClass].some((keyword) => haystack.includes(keyword)),
      );

    return classes.length > 0 ? classes : ['all'];
  }

  private isTradingRelevantMarket(market: PolymarketMarketView): boolean {
    const haystack =
      `${market.question} ${market.category} ${market.tags.join(' ')}`.toLowerCase();

    if (this.excludedKeywords.some((keyword) => haystack.includes(keyword))) {
      return false;
    }

    return this.tradingInclusionKeywords.some((keyword) =>
      haystack.includes(keyword),
    );
  }

  private parseStringArray(input: unknown): string[] {
    if (Array.isArray(input)) {
      return input.map((item) => String(item));
    }

    if (typeof input === 'string') {
      try {
        const parsed = JSON.parse(input) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item));
        }
      } catch {
        return [];
      }
    }

    return [];
  }

  private parseNumberArray(input: unknown): number[] {
    const parsed = this.parseStringArray(input);
    return parsed
      .map((value) => this.toNumber(value))
      .filter((value) => Number.isFinite(value));
  }

  private parseTags(input: unknown): string[] {
    if (!Array.isArray(input)) return [];

    return input
      .map((tag) => {
        if (typeof tag === 'string') return tag;
        if (tag && typeof tag === 'object' && 'name' in tag) {
          return String((tag as { name?: string }).name || '');
        }
        return '';
      })
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .slice(0, 8);
  }

  private pickPrimaryProbability(outcomes: string[], prices: number[]): number {
    if (!prices.length) return 0;

    const yesIndex = outcomes.findIndex((outcome) => outcome.toLowerCase() === 'yes');
    const candidate = yesIndex >= 0 ? prices[yesIndex] : prices[0];
    const bounded = Math.max(0, Math.min(1, candidate));
    return Number((bounded * 100).toFixed(2));
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
