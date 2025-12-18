import { Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';

export interface RSSNewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  publishedAt: Date;
  url: string;
  categories: string[];
  imageUrl?: string;
}

@Injectable()
export class RSSNewsService {
  private readonly logger = new Logger(RSSNewsService.name);
  private parser = new Parser({
    customFields: {
      item: [
        ['media:content', 'mediaContent'],
        ['media:thumbnail', 'mediaThumbnail'],
        ['description', 'description'],
        ['content:encoded', 'contentEncoded'],
      ],
    },
  });

  // FREE RSS feeds from major financial news sources
  private readonly feeds = {
    bloomberg: {
      markets: 'https://feeds.bloomberg.com/markets/news.rss',
      technology: 'https://feeds.bloomberg.com/technology/news.rss',
      politics: 'https://feeds.bloomberg.com/politics/news.rss',
    },
    reuters: {
      business: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best',
      markets: 'http://feeds.reuters.com/reuters/businessNews',
    },
    cnbc: {
      topNews: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
      markets: 'https://www.cnbc.com/id/20409666/device/rss/rss.html',
      technology: 'https://www.cnbc.com/id/19854910/device/rss/rss.html',
      finance: 'https://www.cnbc.com/id/10000664/device/rss/rss.html',
    },
    marketwatch: {
      topStories: 'https://www.marketwatch.com/rss/topstories',
      bulletins: 'https://www.marketwatch.com/rss/bulletins',
      realtimeheadlines: 'https://www.marketwatch.com/rss/realtimeheadlines',
    },
    seekingAlpha: {
      marketNews: 'https://seekingalpha.com/feed.xml',
    },
    yahoo: {
      finance: 'https://finance.yahoo.com/news/rssindex',
    },
  };

  /**
   * Fetch news from a single RSS feed
   */
  async fetchFeed(feedUrl: string, sourceName: string): Promise<RSSNewsItem[]> {
    try {
      this.logger.log(`Fetching RSS feed from ${sourceName}: ${feedUrl}`);

      const feed = await this.parser.parseURL(feedUrl);

      return feed.items.map((item, index) => ({
        id: `${sourceName}_${item.guid || item.link || index}`,
        title: item.title || '',
        summary: this.cleanHtml(item.contentSnippet || item.description || ''),
        content: this.cleanHtml(
          (item as any).contentEncoded || item.content || item.description || ''
        ),
        source: sourceName,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        url: item.link || '',
        categories: item.categories || [],
        imageUrl: this.extractImageUrl(item),
      }));
    } catch (error) {
      this.logger.error(
        `Error fetching RSS feed from ${sourceName}:`,
        error.message
      );
      return [];
    }
  }

  /**
   * Fetch all news from all sources
   */
  async fetchAllNews(limit: number = 100): Promise<RSSNewsItem[]> {
    this.logger.log('Fetching news from all RSS feeds');

    const allFeeds = [
      // Bloomberg
      ...Object.entries(this.feeds.bloomberg).map(([category, url]) => ({
        url,
        source: `Bloomberg-${category}`,
      })),
      // Reuters
      ...Object.entries(this.feeds.reuters).map(([category, url]) => ({
        url,
        source: `Reuters-${category}`,
      })),
      // CNBC
      ...Object.entries(this.feeds.cnbc).map(([category, url]) => ({
        url,
        source: `CNBC-${category}`,
      })),
      // MarketWatch
      ...Object.entries(this.feeds.marketwatch).map(([category, url]) => ({
        url,
        source: `MarketWatch-${category}`,
      })),
      // SeekingAlpha
      ...Object.entries(this.feeds.seekingAlpha).map(([category, url]) => ({
        url,
        source: `SeekingAlpha-${category}`,
      })),
      // Yahoo Finance
      ...Object.entries(this.feeds.yahoo).map(([category, url]) => ({
        url,
        source: `Yahoo-${category}`,
      })),
    ];

    const results = await Promise.allSettled(
      allFeeds.map((feed) => this.fetchFeed(feed.url, feed.source))
    );

    const allNews = results
      .filter(
        (result): result is PromiseFulfilledResult<RSSNewsItem[]> =>
          result.status === 'fulfilled'
      )
      .flatMap((result) => result.value);

    // Sort by publish date and limit
    return allNews
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Fetch news by category
   */
  async fetchNewsByCategory(
    category: 'markets' | 'technology' | 'business' | 'finance'
  ): Promise<RSSNewsItem[]> {
    this.logger.log(`Fetching RSS news for category: ${category}`);

    const categoryFeeds: { url: string; source: string }[] = [];

    switch (category) {
      case 'markets':
        categoryFeeds.push(
          { url: this.feeds.bloomberg.markets, source: 'Bloomberg-Markets' },
          { url: this.feeds.reuters.markets, source: 'Reuters-Markets' },
          { url: this.feeds.cnbc.markets, source: 'CNBC-Markets' }
        );
        break;
      case 'technology':
        categoryFeeds.push(
          { url: this.feeds.bloomberg.technology, source: 'Bloomberg-Technology' },
          { url: this.feeds.cnbc.technology, source: 'CNBC-Technology' }
        );
        break;
      case 'business':
        categoryFeeds.push(
          { url: this.feeds.reuters.business, source: 'Reuters-Business' },
          { url: this.feeds.cnbc.topNews, source: 'CNBC-TopNews' }
        );
        break;
      case 'finance':
        categoryFeeds.push(
          { url: this.feeds.cnbc.finance, source: 'CNBC-Finance' },
          { url: this.feeds.yahoo.finance, source: 'Yahoo-Finance' }
        );
        break;
    }

    const results = await Promise.allSettled(
      categoryFeeds.map((feed) => this.fetchFeed(feed.url, feed.source))
    );

    const news = results
      .filter(
        (result): result is PromiseFulfilledResult<RSSNewsItem[]> =>
          result.status === 'fulfilled'
      )
      .flatMap((result) => result.value);

    return news.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }

  /**
   * Search news by keyword
   */
  searchNews(news: RSSNewsItem[], keyword: string): RSSNewsItem[] {
    const lowerKeyword = keyword.toLowerCase();

    return news.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerKeyword) ||
        item.summary.toLowerCase().includes(lowerKeyword) ||
        item.content.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * Extract image URL from RSS item
   */
  private extractImageUrl(item: any): string | undefined {
    // Try media:content
    if (item.mediaContent && item.mediaContent.$) {
      return item.mediaContent.$.url;
    }

    // Try media:thumbnail
    if (item.mediaThumbnail && item.mediaThumbnail.$) {
      return item.mediaThumbnail.$.url;
    }

    // Try enclosure
    if (item.enclosure && item.enclosure.url) {
      return item.enclosure.url;
    }

    // Try to extract from content
    if (item.content || item.description) {
      const imgMatch = (item.content || item.description).match(
        /<img[^>]+src="([^">]+)"/i
      );
      if (imgMatch && imgMatch[1]) {
        return imgMatch[1];
      }
    }

    return undefined;
  }

  /**
   * Clean HTML from text
   */
  private cleanHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp;
      .replace(/&amp;/g, '&') // Replace &amp;
      .replace(/&lt;/g, '<') // Replace &lt;
      .replace(/&gt;/g, '>') // Replace &gt;
      .replace(/&quot;/g, '"') // Replace &quot;
      .replace(/&#39;/g, "'") // Replace &#39;
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Get unique sources from news items
   */
  getSources(news: RSSNewsItem[]): string[] {
    const sources = new Set(news.map((item) => item.source));
    return Array.from(sources);
  }

  /**
   * Get news by source
   */
  filterBySource(news: RSSNewsItem[], source: string): RSSNewsItem[] {
    return news.filter((item) => item.source === source);
  }

  /**
   * Get news from last N hours
   */
  getRecentNews(news: RSSNewsItem[], hours: number = 24): RSSNewsItem[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return news.filter((item) => item.publishedAt >= cutoffTime);
  }
}

