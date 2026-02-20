import { Injectable, Logger } from '@nestjs/common';
import { MultiModelOrchestratorService } from '../agents/llm/multi-model-orchestrator.service';
import { MarketDataAggregatorService } from './market-data-aggregator.service';
import { EconomicCalendarService, EconomicEvent } from './economic-calendar.service';
import { NewsAnalysisService } from './news-analysis.service';

export interface PairAnalysisReport {
  symbol: string;
  timestamp: string;
  bias: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  summary: string;
  keyDrivers: string[];
  keyRisks: string[];
  scenarios: {
    bullish: string;
    bearish: string;
    neutral: string;
  };
  keyLevels: number[];
  tradePlan: {
    intraday: string[];
    swing: string[];
  };
  economicEvents: EconomicEvent[];
  news: {
    title: string;
    source: string;
    publishedAt: string;
    sentiment: string;
    impact: string;
    url: string;
  }[];
  quote?: {
    bid: number;
    ask: number;
    change: number;
    changePercent: number;
    source: string;
  };
}

export interface AssetSentiment {
  symbol: string;
  sentimentScore: number; // 0-100 (0=Bearish, 100=Bullish)
  sentiment: 'bullish' | 'bearish' | 'neutral';
  rationale: string;
  keyLevels: number[];
  trend: 'up' | 'down' | 'ranging';
}

export interface MarketSentimentReport {
  timestamp: string;
  globalSentiment: {
    score: number;
    description: string; // "Risk-On", "Risk-Off", "Uncertain"
    summary: string;
  };
  assets: AssetSentiment[];
}

@Injectable()
export class MarketSentimentService {
  private readonly logger = new Logger(MarketSentimentService.name);

  constructor(
    private readonly orchestrator: MultiModelOrchestratorService,
    private readonly dataAggregator: MarketDataAggregatorService,
    private readonly economicCalendarService: EconomicCalendarService,
    private readonly newsService: NewsAnalysisService,
  ) {}

  async generateSentimentReport(): Promise<MarketSentimentReport> {
    const assets = [
      'XAUUSD',
      'EURUSD',
      'GBPUSD',
      'USDJPY',
      'USDCAD',
      'AUDUSD',
      'NAS100',
    ];

    // 1. Fetch Real Data Context (Price, recent change)
    // We can use dataAggregator to get prices if available.
    // For now, prompt LLM to use its internal knowledge + provided price (if we have it).
    // Or just ask LLM for "current sentiment based on recent news/events" (Agents have tools?).
    // If Orchestrator has tools, it can fetch search.

    // Simplification: We prompt LLM to act as analyst.

    const prompt = `
      You are an expert Chief Market Analyst. Provide a comprehensive sentiment report for the following assets:
      ${assets.join(', ')}.

      Analyze the current global macro environment (Interest rates, Geopolitics, Economic Data).
      For each asset, determine the sentiment/bias.

      Return a JSON object with this structure:
      {
        "globalSentiment": {
          "score": number (0-100, 100=Max Risk On),
          "description": string (e.g. "Risk-Off driven by inflation fears"),
          "summary": string (2 sentences)
        },
        "assets": [
           {
             "symbol": string,
             "sentimentScore": number (0-100),
             "sentiment": "bullish" | "bearish" | "neutral",
             "rationale": string (concise, max 20 words),
             "keyLevels": number[] (nearest support/resistance),
             "trend": "up" | "down" | "ranging"
           }
        ]
      }
    `;

    try {
      const response = await this.orchestrator.complete({
        prompt,
        taskComplexity: 'medium', // Use stronger model for analysis
        requireJson: true,
      });

      const jsonStr = response.content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      const data = JSON.parse(jsonStr);

      return {
        timestamp: new Date().toISOString(),
        globalSentiment: data.globalSentiment,
        assets: data.assets,
      };
    } catch (error) {
      this.logger.error('Failed to generate sentiment report', error);
      // Return Mock Fallback
      return this.getMockReport();
    }
  }

  private getMockReport(): MarketSentimentReport {
    return {
      timestamp: new Date().toISOString(),
      globalSentiment: {
        score: 50,
        description: 'Neutral',
        summary: 'Market awaits key data.',
      },
      assets: [
        {
          symbol: 'XAUUSD',
          sentimentScore: 55,
          sentiment: 'neutral',
          rationale: 'Consolidating below 2050',
          keyLevels: [2040, 2060],
          trend: 'ranging',
        },
        {
          symbol: 'EURUSD',
          sentimentScore: 40,
          sentiment: 'bearish',
          rationale: 'Strong dollar pressure',
          keyLevels: [1.08, 1.09],
          trend: 'down',
        },
        // ... extend if needed
      ],
    };
  }

  async generatePairAnalysis(symbol: string): Promise<PairAnalysisReport> {
    const normalizedSymbol = symbol.toUpperCase();
    try {
      const [quoteResult, eventsResult, newsResult] = await Promise.allSettled([
        this.dataAggregator.getLiveQuote(normalizedSymbol),
        this.economicCalendarService.getEconomicCalendar(),
        this.newsService.getMarketNews(),
      ]);

      const quote =
        quoteResult.status === 'fulfilled' ? quoteResult.value : null;
      const events =
        eventsResult.status === 'fulfilled' ? eventsResult.value.events : [];
      const news =
        newsResult.status === 'fulfilled' ? newsResult.value.news : [];

      const filteredEvents = this.filterEventsForSymbol(
        normalizedSymbol,
        events,
      ).slice(0, 8);
      const filteredNews = this.filterNewsForSymbol(
        normalizedSymbol,
        news,
      ).slice(0, 8);

      const context = {
        symbol: normalizedSymbol,
        quote: quote
          ? {
              bid: quote.bid,
              ask: quote.ask,
              change: quote.change,
              changePercent: quote.changePercent,
              source: quote.source,
            }
          : null,
        economicEvents: filteredEvents.map((event) => ({
          title: event.title,
          currency: event.currency,
          importance: event.importance,
          actual: event.actual,
          forecast: event.forecast,
          previous: event.previous,
          date: event.date,
        })),
        news: filteredNews.map((item) => ({
          title: item.title,
          source: item.source,
          sentiment: item.sentiment,
          impact: item.impact,
          publishedAt: item.publishedAt,
        })),
      };

      const prompt = `
You are a senior macro/FX strategist. Build a detailed analysis for ${normalizedSymbol} using the provided economic events and news.

Return JSON ONLY with this schema:
{
  "bias": "bullish|bearish|neutral",
  "confidence": number,
  "summary": "string",
  "keyDrivers": ["string"],
  "keyRisks": ["string"],
  "scenarios": { "bullish": "string", "bearish": "string", "neutral": "string" },
  "keyLevels": [number],
  "tradePlan": { "intraday": ["string"], "swing": ["string"] }
}

Context:
${JSON.stringify(context)}
`;

      const response = await this.orchestrator.complete({
        prompt,
        taskComplexity: 'complex',
        requireJson: true,
        optimizeFor: 'quality',
        modelPreference: 'gemini-2.0-flash',
      });

      const parsed = this.parseAiJson(response.content);

      return {
        symbol: normalizedSymbol,
        timestamp: new Date().toISOString(),
        bias: parsed.bias || 'neutral',
        confidence: parsed.confidence || 50,
        summary: parsed.summary || 'No summary provided.',
        keyDrivers: parsed.keyDrivers || [],
        keyRisks: parsed.keyRisks || [],
        scenarios: parsed.scenarios || {
          bullish: 'No bullish scenario provided.',
          bearish: 'No bearish scenario provided.',
          neutral: 'No neutral scenario provided.',
        },
        keyLevels: parsed.keyLevels || [],
        tradePlan: parsed.tradePlan || { intraday: [], swing: [] },
        economicEvents: filteredEvents,
        news: filteredNews.map((item) => ({
          title: item.title,
          source: item.source,
          publishedAt: this.safeIso(item.publishedAt),
          sentiment: item.sentiment,
          impact: item.impact,
          url: item.url,
        })),
        quote: quote
          ? {
              bid: quote.bid,
              ask: quote.ask,
              change: quote.change,
              changePercent: quote.changePercent,
              source: quote.source,
            }
          : undefined,
      };
    } catch (error) {
      this.logger.warn('Pair analysis failed, returning fallback', error);
      return {
        symbol: normalizedSymbol,
        timestamp: new Date().toISOString(),
        bias: 'neutral',
        confidence: 50,
        summary: 'Analysis unavailable. Please retry shortly.',
        keyDrivers: [],
        keyRisks: [],
        scenarios: {
          bullish: 'Awaiting data.',
          bearish: 'Awaiting data.',
          neutral: 'Awaiting data.',
        },
        keyLevels: [],
        tradePlan: { intraday: [], swing: [] },
        economicEvents: [],
        news: [],
      };
    }
  }

  private filterEventsForSymbol(
    symbol: string,
    events: EconomicEvent[],
  ): EconomicEvent[] {
    const currencies = [
      symbol.slice(0, 3),
      symbol.slice(3, 6),
    ].filter((c) => c.length === 3);
    return events.filter((event) => {
      if (event.impact?.affectedSymbols?.includes(symbol)) return true;
      if (currencies.includes(event.currency)) return true;
      return false;
    });
  }

  private filterNewsForSymbol(symbol: string, news: any[]): any[] {
    const currencies = [
      symbol.slice(0, 3),
      symbol.slice(3, 6),
    ].filter((c) => c.length === 3);
    return news.filter((item) => {
      if (item.symbols?.includes(symbol)) return true;
      if (currencies.some((c) => item.title?.includes(c))) return true;
      return ['economy', 'fed', 'geopolitical'].includes(item.category);
    });
  }

  private parseAiJson(content: string): Record<string, any> {
    const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const direct = this.tryParseJson(cleaned);
    if (direct) return direct;

    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = this.tryParseJson(match[0]);
      if (parsed) return parsed;
    }

    return {};
  }

  private tryParseJson(text: string): Record<string, any> | null {
    try {
      const normalized = text
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      return JSON.parse(normalized);
    } catch {
      return null;
    }
  }

  private safeIso(value: any): string {
    if (!value) return new Date().toISOString();
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    return date.toISOString();
  }
}
