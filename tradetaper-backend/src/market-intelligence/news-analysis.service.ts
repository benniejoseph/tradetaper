import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface MarketNews {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: Date;
  url: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number; // -1 to 1
  impact: 'low' | 'medium' | 'high';
  symbols: string[];
  category:
    | 'economy'
    | 'earnings'
    | 'fed'
    | 'geopolitical'
    | 'crypto'
    | 'general';
  imageUrl?: string;
  hasVideo?: boolean;
  videoUrl?: string; // YouTube/Embed
}

export interface NewsAnalysisResult {
  news: MarketNews[];
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  totalArticles: number;
  lastUpdated: Date;
  topSources: string[];
}

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class NewsAnalysisService {
  private readonly logger = new Logger(NewsAnalysisService.name);
  private readonly newsApiKey = process.env.NEWS_API_KEY;
  private readonly alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
  private readonly fmpKey = process.env.FMP_API_KEY;

  private readonly CACHE_DURATION = 300000; // 5 minutes

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getMarketNews(categoryFilter?: string): Promise<NewsAnalysisResult> {
    const cacheKey = categoryFilter ? `news_${categoryFilter}` : 'news_all';

    // Check cache
    const cached = await this.cacheManager.get<NewsAnalysisResult>(cacheKey);
    if (cached) return cached;

    this.logger.log(
      `Fetching market news (Filter: ${categoryFilter || 'All'})...`,
    );

    try {
      // Fetch from multiple sources in parallel
      const [newsApiResults, alphaVantageResults, fmpResults] =
        await Promise.allSettled([
          this.getNewsFromNewsAPI(),
          this.getNewsFromAlphaVantage(),
          this.getNewsFromFMP(), // FMP is often limited, keep it.
        ]);

      const allNews: MarketNews[] = [];

      if (newsApiResults.status === 'fulfilled')
        allNews.push(...newsApiResults.value);
      if (alphaVantageResults.status === 'fulfilled')
        allNews.push(...alphaVantageResults.value);
      if (fmpResults.status === 'fulfilled') allNews.push(...fmpResults.value);

      // Deduplicate
      let uniqueNews = this.deduplicateNews(allNews);

      // Filter
      if (categoryFilter && categoryFilter !== 'all') {
        uniqueNews = uniqueNews.filter(
          (n) =>
            n.category.toLowerCase() === categoryFilter.toLowerCase() ||
            (categoryFilter === 'market' &&
              ['economy', 'fed', 'earnings'].includes(n.category)),
        );
      }

      // Sort
      const sortedNews = uniqueNews
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        .slice(0, 50);

      // Calc Sentiment
      const sentimentScores = sortedNews.map((news) => news.sentimentScore);
      const avgSentiment =
        sentimentScores.length > 0
          ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
          : 0;

      const result: NewsAnalysisResult = {
        news: sortedNews,
        overallSentiment: this.scoreToSentiment(avgSentiment),
        sentimentScore: avgSentiment,
        totalArticles: sortedNews.length,
        lastUpdated: new Date(),
        topSources: this.getTopSources(sortedNews),
      };

      // Cache (5 mins)
      await this.cacheManager.set(cacheKey, result, this.CACHE_DURATION);
      return result;
    } catch (error) {
      this.logger.error('Error fetching market news:', error);
      return this.getFallbackNews();
    }
  }

  private async getNewsFromNewsAPI(): Promise<MarketNews[]> {
    if (!this.newsApiKey) {
      this.logger.warn('NewsAPI key not configured');
      return [];
    }

    try {
      const query =
        'markets OR stocks OR forex OR economy OR "federal reserve" OR inflation OR trading';
      const response = await firstValueFrom(
        this.httpService.get('https://newsapi.org/v2/everything', {
          params: {
            q: query,
            language: 'en',
            sortBy: 'publishedAt',
            pageSize: 20,
            apiKey: this.newsApiKey,
            sources:
              'bloomberg,reuters,cnbc,financial-times,the-wall-street-journal',
          },
          timeout: 10000,
        }),
      );

      return response.data.articles.map((article: Record<string, any>) => ({
        id: `newsapi_${this.generateId(article.title)}`,
        title: article.title,
        summary: article.description || '',
        source: article.source.name,
        publishedAt: new Date(article.publishedAt),
        url: article.url,
        sentiment: this.analyzeSentiment(
          article.title + ' ' + (article.description || ''),
        ),
        sentimentScore: this.calculateSentimentScore(
          article.title + ' ' + (article.description || ''),
        ),
        impact: this.determineImpact(article.title),
        symbols: this.extractSymbols(
          article.title + ' ' + (article.description || ''),
        ),
        category: this.categorizeNews(article.title),
        imageUrl: article.urlToImage,
        hasVideo: this.detectVideo(article.url),
        videoUrl: this.extractVideoUrl(article.url),
      }));
    } catch (error) {
      this.logger.error('NewsAPI error:', error.message);
      return [];
    }
  }

  private async getNewsFromAlphaVantage(): Promise<MarketNews[]> {
    if (!this.alphaVantageKey) {
      this.logger.warn('Alpha Vantage key not configured');
      return [];
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get('https://www.alphavantage.co/query', {
          params: {
            function: 'NEWS_SENTIMENT',
            apikey: this.alphaVantageKey,
            topics: 'financial_markets,economy_fiscal,economy_monetary',
            limit: 15,
            sort: 'LATEST',
          },
          timeout: 10000,
        }),
      );

      if (!response.data.feed) {
        return [];
      }

      return response.data.feed.map((item: Record<string, any>) => ({
        id: `av_${this.generateId(item.title)}`,
        title: item.title,
        summary: item.summary || '',
        source: item.source,
        publishedAt: new Date(item.time_published),
        url: item.url,
        sentiment: this.scoreToSentiment(
          parseFloat(item.overall_sentiment_score),
        ),
        sentimentScore: parseFloat(item.overall_sentiment_score),
        impact: this.determineImpact(item.title),
        symbols: this.extractTickerSymbols(item.ticker_sentiment || []),
        category: this.categorizeNews(item.title),
        imageUrl: item.banner_image,
      }));
    } catch (error) {
      this.logger.error('Alpha Vantage news error:', error.message);
      return [];
    }
  }

  private async getNewsFromFMP(): Promise<MarketNews[]> {
    if (!this.fmpKey) {
      this.logger.warn('FMP API key not configured');
      return [];
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          'https://financialmodelingprep.com/api/v3/stock_news',
          {
            params: {
              apikey: this.fmpKey,
              limit: 15,
            },
            timeout: 10000,
          },
        ),
      );

      return response.data.map((item: Record<string, any>) => ({
        id: `fmp_${this.generateId(item.title)}`,
        title: item.title,
        summary: item.text || '',
        source: item.site,
        publishedAt: new Date(item.publishedDate),
        url: item.url,
        sentiment: this.analyzeSentiment(item.title + ' ' + (item.text || '')),
        sentimentScore: this.calculateSentimentScore(
          item.title + ' ' + (item.text || ''),
        ),
        impact: this.determineImpact(item.title),
        symbols: item.symbol ? [item.symbol] : [],
        category: this.categorizeNews(item.title),
        imageUrl: item.image,
      }));
    } catch (error) {
      this.logger.error('FMP news error:', error.message);
      return [];
    }
  }

  private analyzeSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
    const score = this.calculateSentimentScore(text);
    return this.scoreToSentiment(score);
  }

  private calculateSentimentScore(text: string): number {
    const lowerText = text.toLowerCase();

    // Bullish keywords
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
      'up',
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
    ];

    // Bearish keywords
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
      'down',
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
      'inflation',
    ];

    let score = 0;

    bullishWords.forEach((word) => {
      const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
      score += matches * 0.1;
    });

    bearishWords.forEach((word) => {
      const matches = (lowerText.match(new RegExp(word, 'g')) || []).length;
      score -= matches * 0.1;
    });

    // Clamp between -1 and 1
    return Math.max(-1, Math.min(1, score));
  }

  private scoreToSentiment(score: number): 'bullish' | 'bearish' | 'neutral' {
    if (score > 0.2) return 'bullish';
    if (score < -0.2) return 'bearish';
    return 'neutral';
  }

  private determineImpact(title: string): 'low' | 'medium' | 'high' {
    const highImpactKeywords = [
      'fed',
      'federal reserve',
      'interest rate',
      'inflation',
      'recession',
      'gdp',
      'employment',
      'unemployment',
      'earnings',
      'guidance',
      'outlook',
    ];

    const mediumImpactKeywords = [
      'market',
      'trading',
      'stocks',
      'bonds',
      'forex',
      'commodity',
      'oil',
    ];

    const lowerTitle = title.toLowerCase();

    if (highImpactKeywords.some((keyword) => lowerTitle.includes(keyword))) {
      return 'high';
    }

    if (mediumImpactKeywords.some((keyword) => lowerTitle.includes(keyword))) {
      return 'medium';
    }

    return 'low';
  }

  private extractSymbols(text: string): string[] {
    const symbolPattern = /\b[A-Z]{3,5}\b/g;
    const matches = text.match(symbolPattern) || [];

    // Filter out common false positives
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
      'BUT',
      'SAID',
      'HIS',
      'NEW',
    ];

    return matches
      .filter((match) => !blacklist.includes(match))
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
      .slice(0, 5); // Limit to 5 symbols
  }

  private extractTickerSymbols(tickerSentiment: Record<string, any>[]): string[] {
    return tickerSentiment
      .map((ticker) => ticker.ticker)
      .filter((ticker) => ticker && ticker.length >= 1 && ticker.length <= 5)
      .slice(0, 5);
  }

  private categorizeNews(
    title: string,
  ): 'economy' | 'earnings' | 'fed' | 'geopolitical' | 'crypto' | 'general' {
    const lowerTitle = title.toLowerCase();

    if (
      lowerTitle.includes('fed') ||
      lowerTitle.includes('federal reserve') ||
      lowerTitle.includes('interest rate')
    ) {
      return 'fed';
    }

    if (
      lowerTitle.includes('earnings') ||
      lowerTitle.includes('revenue') ||
      lowerTitle.includes('profit')
    ) {
      return 'earnings';
    }

    if (
      lowerTitle.includes('bitcoin') ||
      lowerTitle.includes('crypto') ||
      lowerTitle.includes('ethereum')
    ) {
      return 'crypto';
    }

    if (
      lowerTitle.includes('gdp') ||
      lowerTitle.includes('inflation') ||
      lowerTitle.includes('unemployment')
    ) {
      return 'economy';
    }

    if (
      lowerTitle.includes('war') ||
      lowerTitle.includes('sanctions') ||
      lowerTitle.includes('trade deal')
    ) {
      return 'geopolitical';
    }

    return 'general';
  }

  private deduplicateNews(news: MarketNews[]): MarketNews[] {
    const seen = new Set<string>();
    return news.filter((item) => {
      const key = item.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 50);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
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

  private generateId(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20) +
      '_' +
      Date.now()
    );
  }

  private getFallbackNews(): NewsAnalysisResult {
    return {
      news: [
        {
          id: 'fallback_news',
          title: 'Live Market News Integration Active',
          summary:
            'Real-time market news analysis is running. API integrations are monitoring multiple sources.',
          source: 'TradeTaper System',
          publishedAt: new Date(),
          url: '#',
          sentiment: 'neutral',
          sentimentScore: 0,
          impact: 'medium',
          symbols: [],
          category: 'general',
          hasVideo: false,
        },
      ],
      overallSentiment: 'neutral',
      sentimentScore: 0,
      totalArticles: 1,
      lastUpdated: new Date(),
      topSources: ['TradeTaper System'],
    };
  }

  private detectVideo(url: string): boolean {
    return (
      url.includes('youtube.com') ||
      url.includes('video') ||
      url.includes('watch?v=')
    );
  }

  private extractVideoUrl(url: string): string | undefined {
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : undefined;
    }
    return undefined;
  }
}
