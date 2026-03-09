import { Injectable, Logger, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';

export type NewsCategory =
  | 'economy'
  | 'earnings'
  | 'fed'
  | 'geopolitical'
  | 'crypto'
  | 'general';

export type NewsSentiment = 'bullish' | 'bearish' | 'neutral';
export type NewsImpact = 'low' | 'medium' | 'high';

export interface MarketNews {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: Date;
  url: string;
  sentiment: NewsSentiment;
  sentimentScore: number; // -1 to 1
  impact: NewsImpact;
  symbols: string[];
  category: NewsCategory;
  imageUrl?: string;
  hasVideo?: boolean;
  videoUrl?: string;
}

export interface NewsSourceStatus {
  source: string;
  configured: boolean;
  fetched: boolean;
  articleCount: number;
  error?: string;
  fetchedAt: string;
}

export interface NewsCategoryOption {
  value: string;
  label: string;
}

export interface NewsAnalysisResult {
  news: MarketNews[];
  overallSentiment: NewsSentiment;
  sentimentScore: number;
  totalArticles: number;
  lastUpdated: Date;
  topSources: string[];
  appliedCategory: string;
  availableCategories: NewsCategoryOption[];
  sourceStatus: NewsSourceStatus[];
}

interface SourceFetchResult {
  source: string;
  configured: boolean;
  fetched: boolean;
  articleCount: number;
  error?: string;
  fetchedAt: string;
  articles: MarketNews[];
}

@Injectable()
export class NewsAnalysisService {
  private readonly logger = new Logger(NewsAnalysisService.name);
  private readonly newsApiKey = process.env.NEWS_API_KEY;
  private readonly alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
  private readonly fmpKey = process.env.FMP_API_KEY;

  private readonly CACHE_DURATION = 300_000; // 5 minutes
  private readonly MAX_LIMIT = 100;
  private readonly DEFAULT_LIMIT = 50;

  private readonly categoryAliasMap: Record<string, NewsCategory[]> = {
    all: ['economy', 'earnings', 'fed', 'geopolitical', 'crypto', 'general'],
    market: ['economy', 'fed', 'earnings'],
    forex: ['economy', 'fed', 'geopolitical', 'general'],
    stocks: ['earnings', 'economy', 'fed', 'general'],
    economy: ['economy', 'fed'],
    economic: ['economy', 'fed'],
    fed: ['fed'],
    crypto: ['crypto'],
    geopolitical: ['geopolitical'],
    general: ['general'],
    earnings: ['earnings'],
  };

  private readonly categoryOptions: NewsCategoryOption[] = [
    { value: 'all', label: 'All' },
    { value: 'forex', label: 'Forex' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'stocks', label: 'Stocks' },
    { value: 'economy', label: 'Economy' },
    { value: 'fed', label: 'Fed' },
  ];

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  getAvailableCategories(): NewsCategoryOption[] {
    return [...this.categoryOptions];
  }

  async getMarketNews(
    categoryFilter?: string,
    limit = this.DEFAULT_LIMIT,
  ): Promise<NewsAnalysisResult> {
    const normalizedCategory = this.normalizeCategoryFilter(categoryFilter);
    const safeLimit = this.normalizeLimit(limit);
    const cacheKey = `news_${normalizedCategory}_${safeLimit}`;

    const cached = await this.cacheManager.get<NewsAnalysisResult>(cacheKey);
    if (cached) {
      return this.hydrateResult(cached, normalizedCategory);
    }

    this.logger.log(
      `Fetching market news (category=${normalizedCategory}, limit=${safeLimit})`,
    );

    try {
      const [newsApi, alphaVantage, fmp] = await Promise.all([
        this.fetchSourceNews('NewsAPI', Boolean(this.newsApiKey), () =>
          this.getNewsFromNewsAPI(),
        ),
        this.fetchSourceNews(
          'AlphaVantage',
          Boolean(this.alphaVantageKey),
          () => this.getNewsFromAlphaVantage(),
        ),
        this.fetchSourceNews('FMP', Boolean(this.fmpKey), () =>
          this.getNewsFromFMP(),
        ),
      ]);

      const allNews = [
        ...newsApi.articles,
        ...alphaVantage.articles,
        ...fmp.articles,
      ];

      const uniqueNews = this.deduplicateNews(allNews);
      const acceptedCategories =
        this.getAcceptedCategoriesForFilter(normalizedCategory);

      const filteredNews =
        normalizedCategory === 'all'
          ? uniqueNews
          : uniqueNews.filter((item) =>
              acceptedCategories.includes(item.category),
            );

      const rankedNews = filteredNews
        .sort((a, b) => {
          const scoreDiff =
            this.computeRankingScore(b, normalizedCategory) -
            this.computeRankingScore(a, normalizedCategory);

          if (scoreDiff !== 0) {
            return scoreDiff;
          }

          return b.publishedAt.getTime() - a.publishedAt.getTime();
        })
        .slice(0, safeLimit);

      const sentimentScores = rankedNews.map((item) => item.sentimentScore);
      const avgSentiment =
        sentimentScores.length > 0
          ? sentimentScores.reduce((sum, score) => sum + score, 0) /
            sentimentScores.length
          : 0;

      const result: NewsAnalysisResult = {
        news: rankedNews,
        overallSentiment: this.scoreToSentiment(avgSentiment),
        sentimentScore: Number(avgSentiment.toFixed(3)),
        totalArticles: rankedNews.length,
        lastUpdated: new Date(),
        topSources: this.getTopSources(rankedNews),
        appliedCategory: normalizedCategory,
        availableCategories: this.getAvailableCategories(),
        sourceStatus: [
          this.toSourceStatus(newsApi),
          this.toSourceStatus(alphaVantage),
          this.toSourceStatus(fmp),
        ],
      };

      const hydrated = this.hydrateResult(result, normalizedCategory);
      await this.cacheManager.set(cacheKey, hydrated, this.CACHE_DURATION);
      return hydrated;
    } catch (error) {
      this.logger.error('Error fetching market news:', error);
      return this.getFallbackNews(normalizedCategory);
    }
  }

  private normalizeCategoryFilter(categoryFilter?: string): string {
    const value = (categoryFilter || 'all').trim().toLowerCase();
    return this.categoryAliasMap[value] ? value : 'all';
  }

  private normalizeLimit(value: number): number {
    if (!Number.isFinite(value)) {
      return this.DEFAULT_LIMIT;
    }

    return Math.min(this.MAX_LIMIT, Math.max(1, Math.floor(value)));
  }

  private getAcceptedCategoriesForFilter(
    categoryFilter: string,
  ): NewsCategory[] {
    return this.categoryAliasMap[categoryFilter] || this.categoryAliasMap.all;
  }

  private async fetchSourceNews(
    source: string,
    configured: boolean,
    fetcher: () => Promise<MarketNews[]>,
  ): Promise<SourceFetchResult> {
    const fetchedAt = new Date().toISOString();

    if (!configured) {
      return {
        source,
        configured,
        fetched: false,
        articleCount: 0,
        error: 'API key not configured',
        fetchedAt,
        articles: [],
      };
    }

    try {
      const articles = await fetcher();
      return {
        source,
        configured,
        fetched: true,
        articleCount: articles.length,
        fetchedAt,
        articles,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown source fetch error';
      this.logger.warn(`${source} fetch failed: ${message}`);
      return {
        source,
        configured,
        fetched: false,
        articleCount: 0,
        error: message,
        fetchedAt,
        articles: [],
      };
    }
  }

  private toSourceStatus(result: SourceFetchResult): NewsSourceStatus {
    return {
      source: result.source,
      configured: result.configured,
      fetched: result.fetched,
      articleCount: result.articleCount,
      error: result.error,
      fetchedAt: result.fetchedAt,
    };
  }

  private async getNewsFromNewsAPI(): Promise<MarketNews[]> {
    const query =
      'markets OR stocks OR forex OR economy OR "federal reserve" OR inflation OR trading';

    try {
      const response = await firstValueFrom(
        this.httpService.get('https://newsapi.org/v2/everything', {
          params: {
            q: query,
            language: 'en',
            sortBy: 'publishedAt',
            pageSize: 25,
            apiKey: this.newsApiKey,
            sources:
              'bloomberg,reuters,cnbc,financial-times,the-wall-street-journal',
          },
          timeout: 10000,
        }),
      );

      const articles = Array.isArray(response.data?.articles)
        ? response.data.articles
        : [];

      return articles
        .map((article: Record<string, any>) =>
          this.buildArticle({
            source: article?.source?.name || 'NewsAPI',
            title: article?.title,
            summary: article?.description,
            url: article?.url,
            publishedAt: article?.publishedAt,
            imageUrl: article?.urlToImage,
          }),
        )
        .filter((item): item is MarketNews => item !== null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown NewsAPI error';
      this.logger.warn(`NewsAPI error: ${message}`);
      return [];
    }
  }

  private async getNewsFromAlphaVantage(): Promise<MarketNews[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get('https://www.alphavantage.co/query', {
          params: {
            function: 'NEWS_SENTIMENT',
            apikey: this.alphaVantageKey,
            topics: 'financial_markets,economy_fiscal,economy_monetary',
            limit: 20,
            sort: 'LATEST',
          },
          timeout: 10000,
        }),
      );

      const feed = Array.isArray(response.data?.feed) ? response.data.feed : [];

      return feed
        .map((item: Record<string, any>) =>
          this.buildArticle({
            source: item?.source || 'AlphaVantage',
            title: item?.title,
            summary: item?.summary,
            url: item?.url,
            publishedAt: this.parseAlphaVantageDate(item?.time_published),
            imageUrl: item?.banner_image,
            sentimentScore: Number.parseFloat(item?.overall_sentiment_score),
            symbols: this.extractTickerSymbols(item?.ticker_sentiment || []),
          }),
        )
        .filter((article): article is MarketNews => article !== null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown Alpha Vantage error';
      this.logger.warn(`Alpha Vantage news error: ${message}`);
      return [];
    }
  }

  private async getNewsFromFMP(): Promise<MarketNews[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          'https://financialmodelingprep.com/api/v3/stock_news',
          {
            params: {
              apikey: this.fmpKey,
              limit: 20,
            },
            timeout: 10000,
          },
        ),
      );

      const rows = Array.isArray(response.data) ? response.data : [];

      return rows
        .map((item: Record<string, any>) =>
          this.buildArticle({
            source: item?.site || 'FMP',
            title: item?.title,
            summary: item?.text,
            url: item?.url,
            publishedAt: item?.publishedDate,
            imageUrl: item?.image,
            symbols: item?.symbol ? [String(item.symbol).toUpperCase()] : [],
          }),
        )
        .filter((article): article is MarketNews => article !== null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown FMP error';
      this.logger.warn(`FMP news error: ${message}`);
      return [];
    }
  }

  private buildArticle(input: {
    source?: unknown;
    title?: unknown;
    summary?: unknown;
    url?: unknown;
    publishedAt?: unknown;
    imageUrl?: unknown;
    sentimentScore?: number;
    symbols?: string[];
  }): MarketNews | null {
    const title = this.cleanText(input.title);
    const summary = this.cleanText(input.summary);
    const source = this.cleanText(input.source) || 'Unknown Source';
    const url = this.normalizeUrl(input.url);
    const publishedAt = this.coerceDate(input.publishedAt);

    if (!title || !url || !publishedAt) {
      return null;
    }

    // Keep feed fresh and avoid stale long-tail items overshadowing current macro context.
    const ageMs = Date.now() - publishedAt.getTime();
    const maxAgeMs = 14 * 24 * 60 * 60 * 1000;
    if (ageMs > maxAgeMs) {
      return null;
    }

    const fullText = `${title} ${summary}`.trim();
    const sentimentScore = this.normalizeSentimentScore(
      input.sentimentScore,
      fullText,
    );
    const sentiment = this.scoreToSentiment(sentimentScore);
    const category = this.categorizeNews(fullText);
    const impact = this.determineImpact(fullText);
    const symbols =
      Array.isArray(input.symbols) && input.symbols.length > 0
        ? input.symbols
        : this.extractSymbols(fullText);
    const imageUrl = this.normalizeOptionalUrl(input.imageUrl);

    return {
      id: this.generateStableId(source, url, title, publishedAt),
      title,
      summary,
      source,
      publishedAt,
      url,
      sentiment,
      sentimentScore,
      impact,
      symbols,
      category,
      imageUrl,
      hasVideo: this.detectVideo(url),
      videoUrl: this.extractVideoUrl(url),
    };
  }

  private hydrateResult(
    raw: NewsAnalysisResult,
    requestedCategory: string,
  ): NewsAnalysisResult {
    const hydratedNews = (Array.isArray(raw.news) ? raw.news : [])
      .map((item) => this.hydrateArticle(item))
      .filter((item): item is MarketNews => item !== null);

    return {
      ...raw,
      news: hydratedNews,
      lastUpdated: this.coerceDate(raw.lastUpdated) || new Date(),
      appliedCategory: raw.appliedCategory || requestedCategory,
      availableCategories:
        Array.isArray(raw.availableCategories) &&
        raw.availableCategories.length > 0
          ? raw.availableCategories
          : this.getAvailableCategories(),
      sourceStatus: Array.isArray(raw.sourceStatus) ? raw.sourceStatus : [],
    };
  }

  private hydrateArticle(raw: MarketNews): MarketNews | null {
    const publishedAt = this.coerceDate((raw as any)?.publishedAt);
    const url = this.normalizeUrl((raw as any)?.url);
    const title = this.cleanText((raw as any)?.title);

    if (!publishedAt || !url || !title) {
      return null;
    }

    const summary = this.cleanText((raw as any)?.summary);
    const fullText = `${title} ${summary}`.trim();
    const category = this.categorizeNews(fullText);
    const sentimentScore = this.normalizeSentimentScore(
      Number((raw as any)?.sentimentScore),
      fullText,
    );

    return {
      id:
        this.cleanText((raw as any)?.id) ||
        this.generateStableId(
          this.cleanText((raw as any)?.source) || 'Unknown Source',
          url,
          title,
          publishedAt,
        ),
      title,
      summary,
      source: this.cleanText((raw as any)?.source) || 'Unknown Source',
      publishedAt,
      url,
      sentiment: this.scoreToSentiment(sentimentScore),
      sentimentScore,
      impact: this.determineImpact(fullText),
      symbols: this.normalizeSymbols((raw as any)?.symbols, fullText),
      category,
      imageUrl: this.normalizeOptionalUrl((raw as any)?.imageUrl),
      hasVideo: this.detectVideo(url),
      videoUrl: this.extractVideoUrl(url),
    };
  }

  private deduplicateNews(news: MarketNews[]): MarketNews[] {
    const byKey = new Map<string, MarketNews>();

    for (const item of news) {
      const key = this.getDeduplicationKey(item);
      const current = byKey.get(key);

      if (!current) {
        byKey.set(key, item);
        continue;
      }

      const currentScore = this.computeDedupPreference(current);
      const nextScore = this.computeDedupPreference(item);
      if (nextScore > currentScore) {
        byKey.set(key, item);
      }
    }

    return Array.from(byKey.values());
  }

  private getDeduplicationKey(item: MarketNews): string {
    const canonicalUrl = this.normalizeUrl(item.url);
    if (canonicalUrl) {
      return `url:${canonicalUrl}`;
    }

    const normalizedTitle = item.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 80);
    const day = item.publishedAt.toISOString().slice(0, 10);
    return `title:${normalizedTitle}:${day}`;
  }

  private computeDedupPreference(item: MarketNews): number {
    const impactWeight =
      item.impact === 'high' ? 3 : item.impact === 'medium' ? 2 : 1;
    return item.publishedAt.getTime() + impactWeight * 1_000;
  }

  private filterByCategory(news: MarketNews[], category: string): MarketNews[] {
    if (category === 'all') {
      return news;
    }

    const accepted = this.getAcceptedCategoriesForFilter(category);
    return news.filter((item) => accepted.includes(item.category));
  }

  private computeRankingScore(
    item: MarketNews,
    activeCategory: string,
  ): number {
    const now = Date.now();
    const ageHours = Math.max(
      0,
      (now - item.publishedAt.getTime()) / (60 * 60 * 1000),
    );
    const recencyScore = Math.max(0, 1 - ageHours / 72); // Favor last 72h.

    const impactScore =
      item.impact === 'high' ? 1 : item.impact === 'medium' ? 0.6 : 0.2;
    const sentimentIntensity = Math.min(1, Math.abs(item.sentimentScore));

    const economicFocus =
      activeCategory === 'economy' ||
      activeCategory === 'economic' ||
      activeCategory === 'fed';
    const economicBoost =
      economicFocus && (item.category === 'economy' || item.category === 'fed')
        ? 0.25
        : 0;

    const sourceReliability = this.getSourceReliabilityScore(item.source);

    return (
      recencyScore * 0.45 +
      impactScore * 0.3 +
      sentimentIntensity * 0.1 +
      sourceReliability * 0.15 +
      economicBoost
    );
  }

  private getSourceReliabilityScore(source: string): number {
    const normalized = source.toLowerCase();
    if (
      normalized.includes('reuters') ||
      normalized.includes('bloomberg') ||
      normalized.includes('financial times') ||
      normalized.includes('wall street journal')
    ) {
      return 1;
    }
    if (normalized.includes('cnbc') || normalized.includes('marketwatch')) {
      return 0.8;
    }
    return 0.55;
  }

  private analyzeSentiment(text: string): NewsSentiment {
    return this.scoreToSentiment(this.calculateSentimentScore(text));
  }

  private calculateSentimentScore(text: string): number {
    const lowerText = text.toLowerCase();

    const bullishWords = [
      'rise',
      'rises',
      'rising',
      'surge',
      'surges',
      'surging',
      'rally',
      'rallies',
      'rallying',
      'gain',
      'gains',
      'gaining',
      'higher',
      'boost',
      'boosting',
      'positive',
      'optimistic',
      'strong',
      'strength',
      'recovery',
      'growth',
      'expansion',
      'breakthrough',
      'success',
      'cooling inflation',
      'soft landing',
    ];

    const bearishWords = [
      'fall',
      'falls',
      'falling',
      'drop',
      'drops',
      'dropping',
      'decline',
      'declines',
      'declining',
      'crash',
      'crashes',
      'crashing',
      'plunge',
      'plunges',
      'plunging',
      'lower',
      'negative',
      'concern',
      'concerns',
      'worry',
      'worries',
      'risk',
      'risks',
      'crisis',
      'recession',
      'sticky inflation',
      'hard landing',
    ];

    let score = 0;

    for (const word of bullishWords) {
      const matches = this.countKeywordMatches(lowerText, word);
      score += matches * 0.08;
    }

    for (const word of bearishWords) {
      const matches = this.countKeywordMatches(lowerText, word);
      score -= matches * 0.08;
    }

    return Math.max(-1, Math.min(1, Number(score.toFixed(3))));
  }

  private countKeywordMatches(text: string, keyword: string): number {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'g');
    return (text.match(regex) || []).length;
  }

  private scoreToSentiment(score: number): NewsSentiment {
    if (score > 0.2) return 'bullish';
    if (score < -0.2) return 'bearish';
    return 'neutral';
  }

  private normalizeSentimentScore(
    candidate: number | undefined,
    textForFallback: string,
  ): number {
    const parsed = Number(candidate);
    if (Number.isFinite(parsed)) {
      return Math.max(-1, Math.min(1, Number(parsed.toFixed(3))));
    }
    return this.calculateSentimentScore(textForFallback);
  }

  private determineImpact(text: string): NewsImpact {
    const lowerText = text.toLowerCase();

    const highImpactKeywords = [
      'fed',
      'federal reserve',
      'interest rate',
      'rate decision',
      'fomc',
      'inflation',
      'cpi',
      'pce',
      'recession',
      'gdp',
      'employment',
      'unemployment',
      'nfp',
      'nonfarm payroll',
      'ecb',
      'boe',
      'boj',
    ];

    const mediumImpactKeywords = [
      'market',
      'trading',
      'stocks',
      'bonds',
      'forex',
      'commodity',
      'oil',
      'yield',
      'treasury',
    ];

    if (highImpactKeywords.some((keyword) => lowerText.includes(keyword))) {
      return 'high';
    }

    if (mediumImpactKeywords.some((keyword) => lowerText.includes(keyword))) {
      return 'medium';
    }

    return 'low';
  }

  private extractSymbols(text: string): string[] {
    const symbolPattern = /\b[A-Z]{3,8}\b/g;
    const matches = text.match(symbolPattern) || [];

    const blacklist = [
      'THE',
      'AND',
      'FOR',
      'ARE',
      'BUT',
      'NOT',
      'YOU',
      'ALL',
      'CAN',
      'HER',
      'WAS',
      'ONE',
      'OUR',
      'HAD',
      'SAID',
      'HIS',
      'NEW',
      'USD',
      'EUR',
      'GBP',
    ];

    return matches
      .map((token) => token.toUpperCase())
      .filter((token) => !blacklist.includes(token))
      .filter((value, index, self) => self.indexOf(value) === index)
      .slice(0, 8);
  }

  private extractTickerSymbols(
    tickerSentiment: Record<string, any>[],
  ): string[] {
    if (!Array.isArray(tickerSentiment)) {
      return [];
    }

    return tickerSentiment
      .map((entry) => String(entry?.ticker || '').toUpperCase())
      .filter((ticker) => ticker.length >= 1 && ticker.length <= 8)
      .filter((value, index, self) => self.indexOf(value) === index)
      .slice(0, 8);
  }

  private normalizeSymbols(candidate: unknown, fallbackText: string): string[] {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate
        .map((item) => String(item || '').toUpperCase())
        .filter((item) => item.length > 0)
        .slice(0, 8);
    }
    return this.extractSymbols(fallbackText);
  }

  private categorizeNews(text: string): NewsCategory {
    const lowerText = text.toLowerCase();

    if (
      lowerText.includes('fed') ||
      lowerText.includes('federal reserve') ||
      lowerText.includes('interest rate') ||
      lowerText.includes('fomc') ||
      lowerText.includes('powell')
    ) {
      return 'fed';
    }

    if (
      lowerText.includes('earnings') ||
      lowerText.includes('revenue') ||
      lowerText.includes('profit') ||
      lowerText.includes('guidance')
    ) {
      return 'earnings';
    }

    if (
      lowerText.includes('bitcoin') ||
      lowerText.includes('crypto') ||
      lowerText.includes('ethereum') ||
      lowerText.includes('solana')
    ) {
      return 'crypto';
    }

    if (
      lowerText.includes('gdp') ||
      lowerText.includes('inflation') ||
      lowerText.includes('cpi') ||
      lowerText.includes('pce') ||
      lowerText.includes('unemployment') ||
      lowerText.includes('nonfarm') ||
      lowerText.includes('payroll') ||
      lowerText.includes('retail sales')
    ) {
      return 'economy';
    }

    if (
      lowerText.includes('war') ||
      lowerText.includes('sanctions') ||
      lowerText.includes('trade deal') ||
      lowerText.includes('tariff') ||
      lowerText.includes('geopolitical')
    ) {
      return 'geopolitical';
    }

    return 'general';
  }

  private getTopSources(news: MarketNews[]): string[] {
    const sourceCounts = news.reduce(
      (acc, item) => {
        acc[item.source] = (acc[item.source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(sourceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([source]) => source);
  }

  private generateStableId(
    source: string,
    url: string,
    title: string,
    publishedAt: Date,
  ): string {
    const seed = `${source.toLowerCase()}|${url}|${title.toLowerCase()}|${publishedAt.toISOString()}`;
    return `news_${this.hash(seed)}`;
  }

  private hash(value: string): string {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash +=
        (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(36);
  }

  private getFallbackNews(category: string): NewsAnalysisResult {
    return {
      news: [
        {
          id: 'fallback-news',
          title: 'Market News Feed Temporarily Degraded',
          summary:
            'Live providers returned limited data. We are still monitoring economic headlines and will retry shortly.',
          source: 'TradeTaper System',
          publishedAt: new Date(),
          url: 'https://www.tradetaper.com/market-intelligence',
          sentiment: 'neutral',
          sentimentScore: 0,
          impact: 'medium',
          symbols: ['EURUSD', 'XAUUSD'],
          category: 'general',
          hasVideo: false,
        },
      ],
      overallSentiment: 'neutral',
      sentimentScore: 0,
      totalArticles: 1,
      lastUpdated: new Date(),
      topSources: ['TradeTaper System'],
      appliedCategory: category,
      availableCategories: this.getAvailableCategories(),
      sourceStatus: [
        {
          source: 'NewsAPI',
          configured: Boolean(this.newsApiKey),
          fetched: false,
          articleCount: 0,
          error: 'No data returned',
          fetchedAt: new Date().toISOString(),
        },
        {
          source: 'AlphaVantage',
          configured: Boolean(this.alphaVantageKey),
          fetched: false,
          articleCount: 0,
          error: 'No data returned',
          fetchedAt: new Date().toISOString(),
        },
        {
          source: 'FMP',
          configured: Boolean(this.fmpKey),
          fetched: false,
          articleCount: 0,
          error: 'No data returned',
          fetchedAt: new Date().toISOString(),
        },
      ],
    };
  }

  private detectVideo(url: string): boolean {
    const normalized = (url || '').toLowerCase();
    return (
      normalized.includes('youtube.com') ||
      normalized.includes('youtu.be') ||
      normalized.includes('/video/') ||
      normalized.includes('watch?v=')
    );
  }

  private extractVideoUrl(url: string): string | undefined {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();

      if (host.includes('youtube.com')) {
        const id = parsed.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : undefined;
      }

      if (host.includes('youtu.be')) {
        const id = parsed.pathname.replace('/', '').trim();
        return id ? `https://www.youtube.com/embed/${id}` : undefined;
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  private parseAlphaVantageDate(input: unknown): Date | null {
    if (typeof input !== 'string') {
      return null;
    }

    const trimmed = input.trim();
    const match = trimmed.match(
      /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/,
    );
    if (match) {
      const [, y, mo, d, h, mi, s] = match;
      return new Date(
        Date.UTC(
          Number(y),
          Number(mo) - 1,
          Number(d),
          Number(h),
          Number(mi),
          Number(s),
        ),
      );
    }

    return this.coerceDate(trimmed);
  }

  private coerceDate(value: unknown): Date | null {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      const candidate = new Date(value);
      return Number.isNaN(candidate.getTime()) ? null : candidate;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }

      const candidate = new Date(trimmed);
      if (!Number.isNaN(candidate.getTime())) {
        return candidate;
      }
    }

    return null;
  }

  private cleanText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private normalizeUrl(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const parsed = new URL(trimmed);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return null;
      }

      parsed.hash = '';
      parsed.searchParams.delete('utm_source');
      parsed.searchParams.delete('utm_medium');
      parsed.searchParams.delete('utm_campaign');
      parsed.searchParams.delete('utm_term');
      parsed.searchParams.delete('utm_content');
      return parsed.toString();
    } catch {
      return null;
    }
  }

  private normalizeOptionalUrl(value: unknown): string | undefined {
    const normalized = this.normalizeUrl(value);
    return normalized || undefined;
  }
}
