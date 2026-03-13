import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NewsAnalysisService } from './news-analysis.service';
import { XMLParser } from 'fast-xml-parser'; // Added
import { parse } from 'date-fns'; // Added for date parsing // Added
import { Cron, CronExpression } from '@nestjs/schedule';
import { MarketDataAggregatorService } from './market-data-aggregator.service';
import { MultiModelOrchestratorService } from '../agents/llm/multi-model-orchestrator.service';
import { EconomicEventAnalysis } from './entities/economic-event-analysis.entity';
import { EconomicEventRelease } from './entities/economic-event-release.entity';

type EconomicReleaseStatus = 'upcoming' | 'live' | 'released';

interface EconomicEventSurprise {
  direction: 'better' | 'worse' | 'in-line' | 'unknown';
  value?: number;
  percent?: number;
}

export interface EconomicEvent {
  id: string;
  calendarId?: string;
  title: string;
  country: string;
  currency: string;
  date: Date;
  time: string;
  importance: 'low' | 'medium' | 'high';
  importanceValue?: number;
  actual?: number | string;
  forecast?: number | string;
  previous?: number | string;
  revised?: number | string;
  teForecast?: number | string;
  unit?: string;
  frequency?: string;
  category?: string;
  reference?: string;
  referenceDate?: string;
  source?: string;
  sourceUrl?: string;
  url?: string;
  ticker?: string;
  symbol?: string;
  lastUpdate?: string;
  releaseStatus?: EconomicReleaseStatus;
  surprise?: EconomicEventSurprise;
  description: string;
  impact: {
    expected: 'bullish' | 'bearish' | 'neutral';
    explanation: string;
    affectedSymbols: string[];
    volatilityRating: number; // 1-10
  };
  isNewsDerived?: boolean; // New flag
}

export interface EconomicEventHistoryItem {
  date: string;
  actual?: number | string;
  forecast?: number | string;
  previous?: number | string;
  revised?: number | string;
  reference?: string;
  source?: string;
  surpriseDirection?: EconomicEventSurprise['direction'];
  surpriseValue?: number;
  surprisePercent?: number;
}

export interface EconomicEventAiSummary {
  scope: 'high_event_top_movers';
  headline: string;
  marketPulse: string;
  highImpactDrivers: string[];
  watchlist: {
    symbol: string;
    bias: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    drivers: string[];
  }[];
  topMovers: {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    direction: 'up' | 'down' | 'flat';
    source: string;
  }[];
  risks: string[];
  confidence?: number;
  sourceQuality?: {
    high?: number;
    medium?: number;
    low?: number;
    consensus?: string;
  };
}

export interface EconomicImpactAnalysis {
  eventId: string;
  event?: EconomicEvent;
  history?: EconomicEventHistoryItem[];
  aiSummary?: EconomicEventAiSummary;
  confidence?: number;
  sourceQuality?: {
    high?: number;
    medium?: number;
    low?: number;
    consensus?: string;
  };
  cachedAt?: string;
  eventMetrics?: {
    releaseStatus: EconomicReleaseStatus;
    minutesFromRelease: number;
    surpriseDirection: EconomicEventSurprise['direction'];
    surpriseValue?: number;
    surprisePercent?: number;
  };
  impactPlaybook?: {
    fx: string;
    indices: string;
    metals: string;
    rates: string;
    crypto: string;
  };
  preEventAnalysis: {
    marketExpectations: string;
    keyLevelsToWatch: number[];
    riskScenarios: string[];
  };
  detailedAnalysis?: {
    summary?: string;
    source: string;
    measures: string;
    usualEffect: string;
    frequency: string;
    whyTradersCare: string;
    nextRelease: string;
    sourceUrl?: string;
    reference?: string;
    referenceDate?: string;
    unit?: string;
    revised?: string | number;
    category?: string;
    ticker?: string;
    url?: string;
  };
  postEventAnalysis?: {
    marketReaction: string;
    priceMovement: {
      symbol: string;
      beforePrice: number;
      afterPrice: number;
      change: number;
      changePercent: number;
    }[];
    followUpEvents: string[];
  };
  tradingRecommendations: {
    preEvent: string[];
    duringEvent: string[];
    postEvent: string[];
  };
}

@Injectable()
export class EconomicCalendarService {
  private readonly logger = new Logger(EconomicCalendarService.name);
  private fredApiKey: string | undefined;
  private forexFactoryRateLimitedUntil = 0;
  private forexFactoryLastFetchAt = 0;
  private readonly FOREX_FACTORY_DEFAULT_COOLDOWN_MS = 10 * 60 * 1000;
  private readonly FOREX_FACTORY_MIN_FETCH_INTERVAL_MS = 5 * 60 * 1000;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly newsAnalysisService: NewsAnalysisService,
    private readonly marketDataService: MarketDataAggregatorService,
    private readonly orchestrator: MultiModelOrchestratorService,
    @InjectRepository(EconomicEventAnalysis)
    private readonly economicAnalysisRepository: Repository<EconomicEventAnalysis>,
    @InjectRepository(EconomicEventRelease)
    private readonly economicReleaseRepository: Repository<EconomicEventRelease>,
    private readonly marketDataAggregator: MarketDataAggregatorService,
  ) {}

  async getEconomicCalendar(
    from?: string,
    to?: string,
    importance?: string,
    forceRefresh = false,
  ): Promise<{
    events: EconomicEvent[];
    weeklyAnalysis: Record<string, unknown>;
  }> {
    this.logger.log('Getting economic calendar events');

    try {
      // In a real implementation, this would fetch from APIs like:
      // - ForexFactory calendar
      // - Economic Calendar APIs
      // - Central bank announcements

      const events = await this.fetchEconomicEvents(
        from,
        to,
        importance,
        forceRefresh,
      );
      const weeklyAnalysis = await this.generateWeeklyAnalysis(events);

      return {
        events: events.sort((a, b) => a.date.getTime() - b.date.getTime()),
        weeklyAnalysis,
      };
    } catch (error) {
      this.logger.error('Failed to get economic calendar', error);
      throw error;
    }
  }

  async getTodaysEvents(): Promise<EconomicEvent[]> {
    this.logger.log("Getting today's economic events");

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const { events } = await this.getEconomicCalendar(
      todayStr,
      todayStr,
      'medium',
    );
    return events;
  }

  async getEconomicImpactAnalysis(
    eventId: string,
  ): Promise<EconomicImpactAnalysis> {
    this.logger.log(`Getting economic impact analysis for event ${eventId}`);

    try {
      const cached = await this.getCachedAnalysis(eventId);
      if (cached) {
        return cached;
      }

      return this.generateEventImpactAnalysis(eventId);
    } catch (error) {
      this.logger.error(
        `Failed to get impact analysis for event ${eventId}`,
        error,
      );
      throw error;
    }
  }

  private async fetchEconomicEvents(
    from?: string,
    to?: string,
    importance?: string,
    forceRefresh = false,
  ): Promise<EconomicEvent[]> {
    const currentDate = new Date();
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    if (
      !forceRefresh &&
      this.eventCache &&
      Date.now() - this.eventCache.timestamp < this.CACHE_TTL
    ) {
      return this.applyEventFilters(
        this.eventCache.data,
        fromDate,
        toDate,
        importance,
      );
    }

    // Coalesce concurrent fetches even when one caller requests force refresh,
    // to avoid duplicate upstream requests from parallel HTTP/cron triggers.
    if (this.eventFetchInFlight) {
      const inflightEvents = await this.eventFetchInFlight;
      return this.applyEventFilters(inflightEvents, fromDate, toDate, importance);
    }

    this.eventFetchInFlight = (async () => {
      const events: EconomicEvent[] = [];
      try {
        const ffEvents = await this.fetchForexFactoryEvents();
        if (ffEvents.length > 0) {
          events.push(...ffEvents);
        }
      } catch (e) {
        this.logger.error('Failed to fetch ForexFactory events', e);
      }

      if (events.length === 0) {
        try {
          const snapshotEvents = await this.fetchEventsFromReleaseSnapshots(
            fromDate,
            toDate,
            importance,
          );
          if (snapshotEvents.length > 0) {
            this.logger.log(
              `Using ${snapshotEvents.length} events from stored release snapshots`,
            );
            events.push(...snapshotEvents);
          }
        } catch (snapshotError) {
          this.logger.warn(
            'Failed to load economic events from release snapshots',
            snapshotError,
          );
        }
      }

      if (events.length === 0) {
        try {
          const newsResult = await this.newsAnalysisService.getMarketNews();
          const newsEvents = this.mapNewsToEvents(newsResult.news);
          if (newsEvents.length > 0) {
            events.push(...newsEvents);
          }
        } catch (newsError) {
          this.logger.warn(
            'Failed to fetch news-based economic events',
            newsError,
          );
        }
      }

      if (events.length === 0) {
        if (this.configService.get<string>('NODE_ENV') !== 'production') {
          for (let i = 0; i < 7; i++) {
            const eventDate = new Date(currentDate);
            eventDate.setDate(currentDate.getDate() + i);
            const dayEvents = this.generateEventsForDay(eventDate);
            events.push(...dayEvents);
          }
        } else {
          this.logger.warn(
            'No economic events from live sources. Returning empty calendar in production.',
          );
        }
      }

      const normalizedEvents = events
        .map((event) => this.enrichEventMetrics(event))
        .filter((event) => Number.isFinite(event.date?.getTime?.()));
      const dedupedEvents = this.deduplicateEvents(normalizedEvents);

      await this.persistReleaseSnapshots(dedupedEvents);

      this.eventCache = {
        timestamp: Date.now(),
        data: dedupedEvents,
      };

      return dedupedEvents;
    })();

    try {
      const events = await this.eventFetchInFlight;
      return this.applyEventFilters(events, fromDate, toDate, importance);
    } finally {
      this.eventFetchInFlight = null;
    }
  }

  private eventCache: { timestamp: number; data: EconomicEvent[] } | null =
    null;
  private eventFetchInFlight: Promise<EconomicEvent[]> | null = null;
  private readonly CACHE_TTL = 60 * 1000; // 1 minute for near-live actuals
  private analysisCache = new Map<
    string,
    { timestamp: number; data: EconomicImpactAnalysis }
  >();
  private readonly ANALYSIS_TTL = 30 * 60 * 1000; // 30 minutes to keep post-release context fresh

  private applyEventFilters(
    events: EconomicEvent[],
    fromDate: Date | null,
    toDate: Date | null,
    importance?: string,
  ): EconomicEvent[] {
    let result = [...events];
    if (fromDate && !isNaN(fromDate.getTime())) {
      result = result.filter((event) => event.date >= fromDate);
    }
    if (toDate && !isNaN(toDate.getTime())) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter((event) => event.date <= end);
    }
    if (importance) {
      result = result.filter((event) => event.importance === importance);
    }
    return result;
  }

  private normalizeCalendarValue(value: unknown): string | undefined {
    if (value === null || value === undefined) return undefined;
    const cleaned = String(value)
      .replace(/\u00a0/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .trim();
    if (!cleaned) return undefined;

    const lower = cleaned.toLowerCase();
    if (
      ['n/a', 'na', 'none', 'null', '--', '-', 'pending', 'tba'].includes(
        lower,
      )
    ) {
      return undefined;
    }
    return cleaned;
  }

  private toNumericValue(value?: string | number): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const normalized = String(value).replace(/,/g, '').trim();
    if (!normalized) {
      return undefined;
    }

    const multiplier = normalized.endsWith('K')
      ? 1_000
      : normalized.endsWith('M')
        ? 1_000_000
        : normalized.endsWith('B')
          ? 1_000_000_000
          : 1;

    const numericPart = normalized
      .replace(/[KMB]$/i, '')
      .replace(/[^0-9.+-]/g, '');
    if (!numericPart) {
      return undefined;
    }
    const parsed = Number.parseFloat(numericPart);
    if (!Number.isFinite(parsed)) {
      return undefined;
    }
    return parsed * multiplier;
  }

  private normalizeImportanceLabel(impact?: string): 'low' | 'medium' | 'high' {
    const normalized = (impact || '').trim().toLowerCase();
    if (normalized.startsWith('high')) return 'high';
    if (normalized.startsWith('medium') || normalized.startsWith('med')) {
      return 'medium';
    }
    return 'low';
  }

  private normalizeCurrencyCode(input?: string): string {
    if (!input) return 'USD';
    const upper = input.trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(upper)) {
      return upper;
    }
    return this.mapCountryToCurrency(input);
  }

  private computeReleaseStatus(
    eventDate: Date,
    hasActualValue: boolean,
  ): EconomicReleaseStatus {
    const now = Date.now();
    const deltaMs = now - eventDate.getTime();

    if (hasActualValue) {
      return 'released';
    }

    // Keep a short live window after scheduled release even when feed lags.
    if (deltaMs >= 0 && deltaMs <= 30 * 60 * 1000) {
      return 'live';
    }
    return deltaMs < 0 ? 'upcoming' : 'released';
  }

  private computeSurprise(
    actual?: string | number,
    forecast?: string | number,
  ): EconomicEventSurprise {
    const actualNum = this.toNumericValue(actual);
    const forecastNum = this.toNumericValue(forecast);
    if (!Number.isFinite(actualNum) || !Number.isFinite(forecastNum)) {
      return { direction: 'unknown' };
    }

    const value = Number(actualNum! - forecastNum!);
    const percent =
      forecastNum === 0
        ? undefined
        : Number(((value / Math.abs(forecastNum!)) * 100).toFixed(2));
    if (Math.abs(value) < 1e-9) {
      return { direction: 'in-line', value: 0, percent: 0 };
    }

    return {
      direction: value > 0 ? 'better' : 'worse',
      value: Number(value.toFixed(4)),
      percent,
    };
  }

  private enrichEventMetrics(event: EconomicEvent): EconomicEvent {
    const actual = this.normalizeCalendarValue(event.actual);
    const forecast = this.normalizeCalendarValue(event.forecast);
    const previous = this.normalizeCalendarValue(event.previous);
    const revised = this.normalizeCalendarValue(event.revised);
    const status = this.computeReleaseStatus(event.date, Boolean(actual));
    const surprise = this.computeSurprise(actual, forecast);

    return {
      ...event,
      currency: this.normalizeCurrencyCode(event.currency || event.country),
      importance: this.normalizeImportanceLabel(event.importance),
      actual,
      forecast,
      previous,
      revised,
      releaseStatus: status,
      surprise,
    };
  }

  private deduplicateEvents(events: EconomicEvent[]): EconomicEvent[] {
    const byKey = new Map<string, EconomicEvent>();
    for (const event of events) {
      const key = `${this.buildEventKey(event)}:${event.date.toISOString()}`;
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, event);
        continue;
      }

      // Prefer records with actual/revised values when duplicates exist.
      const currentScore =
        Number(Boolean(event.actual)) +
        Number(Boolean(event.revised)) +
        Number(Boolean(event.forecast));
      const existingScore =
        Number(Boolean(existing.actual)) +
        Number(Boolean(existing.revised)) +
        Number(Boolean(existing.forecast));
      if (currentScore >= existingScore) {
        byKey.set(key, event);
      }
    }
    return Array.from(byKey.values());
  }

  private async persistReleaseSnapshots(events: EconomicEvent[]): Promise<void> {
    const rows = events
      .filter((event) => Number.isFinite(event.date.getTime()))
      .map((event) => {
        const eventKey = this.buildEventKey(event);
        const actualNumeric = this.toNumericValue(event.actual);
        const forecastNumeric = this.toNumericValue(event.forecast);
        const previousNumeric = this.toNumericValue(event.previous);

        return {
          eventId: event.id,
          eventKey,
          title: event.title,
          country: event.country,
          currency: event.currency,
          importance: event.importance,
          eventDate: event.date,
          releaseStatus:
            event.releaseStatus ||
            this.computeReleaseStatus(event.date, Boolean(event.actual)),
          actual:
            event.actual === undefined ? undefined : String(event.actual),
          forecast:
            event.forecast === undefined ? undefined : String(event.forecast),
          previous:
            event.previous === undefined ? undefined : String(event.previous),
          revised:
            event.revised === undefined ? undefined : String(event.revised),
          actualNumeric,
          forecastNumeric,
          previousNumeric,
          surpriseNumeric:
            Number.isFinite(actualNumeric) && Number.isFinite(forecastNumeric)
              ? Number((actualNumeric! - forecastNumeric!).toFixed(4))
              : undefined,
          surprisePercent:
            Number.isFinite(actualNumeric) &&
            Number.isFinite(forecastNumeric) &&
            forecastNumeric !== 0
              ? Number(
                  (
                    ((actualNumeric! - forecastNumeric!) /
                      Math.abs(forecastNumeric!)) *
                    100
                  ).toFixed(2),
                )
              : undefined,
          source: event.source,
        } satisfies Partial<EconomicEventRelease>;
      });

    if (!rows.length) {
      return;
    }

    try {
      await this.economicReleaseRepository.upsert(rows, ['eventKey', 'eventDate']);
    } catch (error) {
      this.logger.warn('Failed to persist economic release snapshots', error);
    }
  }

  private getFredApiKey(): string | undefined {
    if (!this.fredApiKey) {
      this.fredApiKey =
        this.configService.get<string>('FRED_API_KEY') ||
        this.configService.get<string>('FRED_KEY');
    }
    return this.fredApiKey;
  }

  private async fetchForexFactoryEvents(): Promise<EconomicEvent[]> {
    const now = Date.now();

    if (now < this.forexFactoryRateLimitedUntil) {
      const waitSeconds = Math.ceil(
        (this.forexFactoryRateLimitedUntil - now) / 1000,
      );
      this.logger.warn(
        `Skipping ForexFactory fetch due to active cooldown (${waitSeconds}s remaining)`,
      );
      return [];
    }

    if (
      this.forexFactoryLastFetchAt > 0 &&
      now - this.forexFactoryLastFetchAt <
        this.FOREX_FACTORY_MIN_FETCH_INTERVAL_MS
    ) {
      const waitSeconds = Math.ceil(
        (this.FOREX_FACTORY_MIN_FETCH_INTERVAL_MS -
          (now - this.forexFactoryLastFetchAt)) /
          1000,
      );
      this.logger.debug(
        `Skipping ForexFactory fetch due to min fetch interval (${waitSeconds}s remaining)`,
      );
      return [];
    }

    try {
      const url = 'https://nfs.faireconomy.media/ff_calendar_thisweek.xml';
      this.logger.log(`Fetching FF Calendar from ${url}`);

      const response = await this.httpService.axiosRef.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        },
      });
      const xmlData = response.data;
      this.forexFactoryLastFetchAt = now;

      const parser = new XMLParser();
      const jObj = parser.parse(xmlData);

      if (!jObj.weeklyevents || !jObj.weeklyevents.event) {
        return [];
      }

      let rawEvents = jObj.weeklyevents.event;
      if (!Array.isArray(rawEvents)) {
        rawEvents = [rawEvents];
      }

      const events = rawEvents
        .map((e: Record<string, any>) => {
          const dateStr = String(e.date || '').trim(); // MM-DD-YYYY
          const timeStr = String(e.time || '').trim(); // 1:30pm

          let eventDate = new Date();
          try {
            // 1. Handle "All Day" / "Tentative"
            if (
              timeStr.toLowerCase().includes('day') ||
              timeStr.toLowerCase().includes('tentative')
            ) {
              const [m, d, y] = dateStr.split('-').map(Number);
              eventDate = new Date(Date.UTC(y, m - 1, d, 0, 0));
            } else {
              // 2. Parse standard time "MM-DD-YYYY h:mma"
              // Cloud Run is UTC.
              // parse("01-15-2026 1:30pm", ...) -> Date object acting as 13:30 UTC.
              // This corresponds to 19:00 IST.
              const dateTimeStr = `${dateStr} ${timeStr}`;
              eventDate = parse(dateTimeStr, 'MM-dd-yyyy h:mma', new Date());
            }
          } catch (err) {
            this.logger.error('Date parse error', err);
            // Fallback to today if parse fails
          }

          const rawCurrency = this.normalizeCurrencyCode(e.country);
          const impactLabel = this.normalizeImportanceLabel(e.impact);
          const actual = this.normalizeCalendarValue(e.actual);
          const forecast = this.normalizeCalendarValue(e.forecast);
          const previous = this.normalizeCalendarValue(e.previous);
          const revised = this.normalizeCalendarValue(e.revised);
          const surprise = this.computeSurprise(actual, forecast);
          const releaseStatus = this.computeReleaseStatus(
            eventDate,
            Boolean(actual),
          );

          return {
            id: `ff-${e.title}-${eventDate.getTime()}`,
            title: e.title,
            country: e.country,
            currency: rawCurrency,
            date: eventDate,
            time: timeStr || 'TBA',
            importance: impactLabel,
            actual,
            forecast,
            previous,
            revised,
            releaseStatus,
            surprise,
            source: 'ForexFactory',
            sourceUrl: 'https://www.forexfactory.com/calendar',
            description: `${e.title} (${e.impact} Impact)`,
            impact: {
              expected: 'neutral',
              explanation: 'Real-time economic event from ForexFactory',
              affectedSymbols: this.mapCurrencyToSymbols(rawCurrency),
              volatilityRating:
                impactLabel === 'high' ? 8 : impactLabel === 'medium' ? 5 : 2,
            },
            isNewsDerived: false,
          };
        })
        .filter((e) => e !== null) as EconomicEvent[];

      return events;
    } catch (error: unknown) {
      const status = this.extractHttpStatus(error);
      if (status === 429) {
        const retryAfterMs = Math.max(
          this.FOREX_FACTORY_DEFAULT_COOLDOWN_MS,
          this.extractRetryAfterMs(error) ??
            this.FOREX_FACTORY_DEFAULT_COOLDOWN_MS,
        );
        this.forexFactoryRateLimitedUntil = now + retryAfterMs;
        this.logger.warn(
          `ForexFactory responded with 429. Cooling down for ${Math.ceil(retryAfterMs / 1000)}s before next attempt.`,
        );
        return [];
      }

      this.forexFactoryRateLimitedUntil =
        now + this.FOREX_FACTORY_DEFAULT_COOLDOWN_MS;
      this.logger.warn(
        'Error fetching FF events. Temporarily backing off before retrying.',
        error,
      );

      return [];
    }
  }

  private extractHttpStatus(error: unknown): number | undefined {
    if (!error || typeof error !== 'object') {
      return undefined;
    }

    const asAny = error as {
      status?: number | string;
      response?: { status?: number | string };
      message?: string;
    };

    const statusCandidate = asAny.response?.status ?? asAny.status;
    if (typeof statusCandidate === 'number') {
      return statusCandidate;
    }
    if (typeof statusCandidate === 'string') {
      const parsed = Number.parseInt(statusCandidate, 10);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    if (typeof asAny.message === 'string') {
      const match = asAny.message.match(/\bstatus code (\d{3})\b/i);
      if (match?.[1]) {
        const parsed = Number.parseInt(match[1], 10);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return undefined;
  }

  private extractRetryAfterMs(error: unknown): number | null {
    if (!error || typeof error !== 'object') {
      return null;
    }

    const headers = (
      error as {
        response?: {
          headers?:
            | Record<string, string | string[] | undefined>
            | { get?: (name: string) => string | null };
        };
      }
    ).response?.headers;

    let rawRetryAfter:
      | string
      | string[]
      | undefined
      | null = undefined;

    if (
      headers &&
      typeof (headers as { get?: (name: string) => string | null }).get ===
        'function'
    ) {
      rawRetryAfter =
        (headers as { get: (name: string) => string | null }).get(
          'retry-after',
        ) ??
        (headers as { get: (name: string) => string | null }).get(
          'Retry-After',
        );
    } else if (headers && typeof headers === 'object') {
      rawRetryAfter =
        (headers as Record<string, string | string[] | undefined>)[
          'retry-after'
        ] ??
        (headers as Record<string, string | string[] | undefined>)[
          'Retry-After'
        ];
    }

    if (!rawRetryAfter) {
      return null;
    }

    const headerValue = Array.isArray(rawRetryAfter)
      ? rawRetryAfter[0]
      : rawRetryAfter;
    if (!headerValue) {
      return null;
    }

    const asSeconds = Number.parseInt(headerValue, 10);
    if (Number.isFinite(asSeconds) && asSeconds > 0) {
      return asSeconds * 1000;
    }

    const retryDate = new Date(headerValue);
    if (!Number.isFinite(retryDate.getTime())) {
      return null;
    }

    const deltaMs = retryDate.getTime() - Date.now();
    if (deltaMs <= 0) {
      return null;
    }

    return deltaMs;
  }

  private async fetchEventsFromReleaseSnapshots(
    fromDate: Date | null,
    toDate: Date | null,
    importance?: string,
  ): Promise<EconomicEvent[]> {
    const query = this.economicReleaseRepository.createQueryBuilder('release');

    if (fromDate && Number.isFinite(fromDate.getTime())) {
      query.andWhere('release.eventDate >= :fromDate', { fromDate });
    }
    if (toDate && Number.isFinite(toDate.getTime())) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      query.andWhere('release.eventDate <= :toDate', { toDate: endDate });
    }
    if (!fromDate && !toDate) {
      const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const end = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      query.andWhere('release.eventDate BETWEEN :start AND :end', {
        start,
        end,
      });
    }

    const normalizedImportance = importance?.trim().toLowerCase();
    if (normalizedImportance) {
      query.andWhere('LOWER(release.importance) = :importance', {
        importance: normalizedImportance,
      });
    }

    const rows = await query
      .orderBy('release.eventDate', 'ASC')
      .addOrderBy('release.updatedAt', 'DESC')
      .take(500)
      .getMany();

    return rows.map((row) => this.mapReleaseSnapshotToEvent(row));
  }

  private mapReleaseSnapshotToEvent(release: EconomicEventRelease): EconomicEvent {
    const eventDate = new Date(release.eventDate);
    const currency = this.normalizeCurrencyCode(
      release.currency || release.country || 'USD',
    );
    const importance = this.normalizeImportanceLabel(release.importance);
    const actual = this.normalizeCalendarValue(release.actual);
    const forecast = this.normalizeCalendarValue(release.forecast);
    const previous = this.normalizeCalendarValue(release.previous);
    const revised = this.normalizeCalendarValue(release.revised);

    return {
      id:
        release.eventId ||
        `snapshot-${release.eventKey}-${eventDate.getTime()}`,
      calendarId: release.eventKey,
      title: release.title,
      country: release.country || 'Unknown',
      currency,
      date: eventDate,
      time: eventDate.toISOString().slice(11, 16),
      importance,
      actual,
      forecast,
      previous,
      revised,
      releaseStatus:
        (release.releaseStatus as EconomicReleaseStatus) ||
        this.computeReleaseStatus(eventDate, Boolean(actual)),
      surprise: this.computeSurprise(actual, forecast),
      source: release.source || 'ReleaseSnapshot',
      description: `${release.title} (${importance} Impact)`,
      impact: {
        expected: 'neutral',
        explanation:
          'Recovered from stored economic release snapshots while upstream feed was unavailable.',
        affectedSymbols: this.mapCurrencyToSymbols(currency),
        volatilityRating:
          importance === 'high' ? 8 : importance === 'medium' ? 5 : 2,
      },
      isNewsDerived: false,
    };
  }

  private mapImportanceToImpact(
    importance: string | number,
  ): 'low' | 'medium' | 'high' {
    const imp = parseFloat(String(importance)) || 1;
    if (imp >= 3) return 'high';
    if (imp >= 2) return 'medium';
    return 'low';
  }

  private mapCountryToCurrency(country: string): string {
    const mapping: { [key: string]: string } = {
      'united states': 'USD',
      eurozone: 'EUR',
      'european union': 'EUR',
      germany: 'EUR',
      france: 'EUR',
      italy: 'EUR',
      spain: 'EUR',
      'united kingdom': 'GBP',
      japan: 'JPY',
      canada: 'CAD',
      australia: 'AUD',
      'new zealand': 'NZD',
      switzerland: 'CHF',
    };
    return mapping[country.toLowerCase()] || 'USD';
  }

  private mapEventToFredSeries(title: string): string | null {
    const normalized = title.toLowerCase();
    if (normalized.includes('consumer price') || normalized.includes('cpi')) {
      return 'CPIAUCSL';
    }
    if (normalized.includes('core cpi')) {
      return 'CPILFESL';
    }
    if (
      normalized.includes('pce price') ||
      normalized.includes('pce inflation')
    ) {
      return 'PCEPI';
    }
    if (normalized.includes('core pce')) {
      return 'PCEPILFE';
    }
    if (normalized.includes('non-farm') || normalized.includes('payroll')) {
      return 'PAYEMS';
    }
    if (normalized.includes('unemployment rate')) {
      return 'UNRATE';
    }
    if (normalized.includes('gdp')) {
      return 'GDP';
    }
    if (normalized.includes('gdp') && normalized.includes('q/q')) {
      return 'A191RL1Q225SBEA';
    }
    if (normalized.includes('retail sales')) {
      return 'RSAFS';
    }
    if (normalized.includes('retail') && normalized.includes('ex autos')) {
      return 'RSAFSNA';
    }
    if (normalized.includes('ppi')) {
      return 'PPIACO';
    }
    if (normalized.includes('ism') && normalized.includes('manufacturing')) {
      return 'NAPM';
    }
    if (normalized.includes('ism') && normalized.includes('services')) {
      return 'NAPMNONM';
    }
    if (normalized.includes('jobless claims')) {
      return 'ICSA';
    }
    if (normalized.includes('durable goods')) {
      return 'DGORDER';
    }
    if (normalized.includes('housing starts')) {
      return 'HOUST';
    }
    if (normalized.includes('building permits')) {
      return 'PERMIT';
    }
    if (normalized.includes('industrial production')) {
      return 'INDPRO';
    }
    if (normalized.includes('consumer confidence')) {
      return 'CSCICP03USM665S';
    }
    if (normalized.includes('producer price index')) {
      return 'PPIACO';
    }
    if (normalized.includes('personal income')) {
      return 'PI';
    }
    return null;
  }

  private async fetchFredHistory(
    seriesId: string,
    limit = 12,
  ): Promise<EconomicEventHistoryItem[]> {
    const apiKey = this.getFredApiKey();
    if (!apiKey) {
      return [];
    }

    try {
      const response = await this.httpService.axiosRef.get(
        'https://api.stlouisfed.org/fred/series/observations',
        {
          params: {
            series_id: seriesId,
            api_key: apiKey,
            file_type: 'json',
          },
          timeout: 10000,
        },
      );

      const observations = Array.isArray(response.data?.observations)
        ? response.data.observations
        : [];
      const trimmed = observations.slice(-limit);
      return trimmed.map((obs: Record<string, any>, index: number) => ({
        date: obs.date,
        actual: obs.value === '.' ? undefined : obs.value,
        previous:
          index > 0
            ? trimmed[index - 1].value === '.'
              ? undefined
              : trimmed[index - 1].value
            : undefined,
      }));
    } catch (error) {
      this.logger.warn('Failed to fetch FRED history', error.message);
      return [];
    }
  }

  private mapEventToEcbSeries(title: string, currency: string): string | null {
    const normalized = title.toLowerCase();
    if (normalized.includes('consumer price') || normalized.includes('hicp')) {
      if (currency === 'EUR') return 'M.U2.Y.XEF000.3.INX';
      if (currency === 'GBP') return 'M.GB.Y.XEF000.3.INX';
      if (currency === 'JPY') return 'M.JP.Y.XEF000.3.INX';
    }
    if (normalized.includes('unemployment') && currency === 'EUR') {
      return 'M.U2.S.UNEHRT.4.IX';
    }
    return null;
  }

  private async fetchEcbHistory(
    seriesKey: string,
    limit = 12,
  ): Promise<EconomicEventHistoryItem[]> {
    try {
      const response = await this.httpService.axiosRef.get(
        `https://data-api.ecb.europa.eu/service/data/ICP/${seriesKey}`,
        {
          params: {
            format: 'csvdata',
            lastNObservations: limit,
          },
          timeout: 10000,
        },
      );
      const csv = String(response.data || '');
      const lines = csv.trim().split('\n');
      if (lines.length < 2) return [];
      const header = lines[0].split(',');
      const timeIdx = header.findIndex((h) => h.trim() === 'TIME_PERIOD');
      const valueIdx = header.findIndex((h) => h.trim() === 'OBS_VALUE');
      if (timeIdx === -1 || valueIdx === -1) return [];

      return lines.slice(1).map((line) => {
        const cols = line.split(',');
        return {
          date: cols[timeIdx],
          actual: cols[valueIdx],
        };
      });
    } catch (error) {
      this.logger.warn('Failed to fetch ECB history', error.message);
      return [];
    }
  }

  private async fetchOnsCpihHistory(
    limit = 12,
  ): Promise<EconomicEventHistoryItem[]> {
    try {
      const versionRes = await this.httpService.axiosRef.get(
        'https://api.beta.ons.gov.uk/v1/datasets/cpih01/editions/time-series/versions',
        { timeout: 10000 },
      );
      const versions = Array.isArray(versionRes.data?.items)
        ? versionRes.data.items
        : [];
      const latestVersion = versions
        .map((item: Record<string, any>) => Number(item.id))
        .filter((id: number) => Number.isFinite(id))
        .sort((a: number, b: number) => b - a)[0];

      if (!latestVersion) return [];

      const obsRes = await this.httpService.axiosRef.get(
        `https://api.beta.ons.gov.uk/v1/datasets/cpih01/editions/time-series/versions/${latestVersion}/observations`,
        {
          params: {
            time: '*',
            geography: 'K02000001',
            aggregate: 'cpih1dim1A0',
          },
          timeout: 10000,
        },
      );

      const observations = Array.isArray(obsRes.data?.observations)
        ? obsRes.data.observations
        : [];
      const trimmed = observations.slice(-limit);
      return trimmed.map((obs: Record<string, any>) => ({
        date: obs.dimensions?.time?.id || obs.time || '',
        actual: obs.observation || obs.value || undefined,
      }));
    } catch (error) {
      this.logger.warn('Failed to fetch ONS CPIH history', error.message);
      return [];
    }
  }

  private mapCurrencyToSymbols(currency: string): string[] {
    const map: Record<string, string[]> = {
      USD: ['EURUSD', 'GBPUSD', 'XAUUSD', 'SPX500', 'NASDAQ100'],
      EUR: ['EURUSD', 'EURGBP', 'EURJPY'],
      GBP: ['GBPUSD', 'EURGBP', 'GBPJPY'],
      JPY: ['USDJPY', 'EURJPY', 'GBPJPY'],
      AUD: ['AUDUSD', 'EURAUD'],
      CAD: ['USDCAD', 'EURCAD'],
      CHF: ['USDCHF'],
      NZD: ['NZDUSD'],
      CNY: ['USDCNH', 'XAUUSD'],
    };
    return map[currency] || ['EURUSD'];
  }

  private mapNewsToEvents(newsList: Record<string, any>[]): EconomicEvent[] {
    return newsList
      .filter((news) => news.category === 'economy' || news.category === 'fed')
      .map((news) => {
        const publishedAt = new Date(news.publishedAt);
        const importance = news.impact === 'high' ? 'high' : 'medium';
        return {
          id: `news_${news.id}`,
          title: news.title,
          country: 'Global', // News often global
          currency: 'USD', // Default
          date: Number.isFinite(publishedAt.getTime()) ? publishedAt : new Date(),
          time: Number.isFinite(publishedAt.getTime())
            ? publishedAt.toISOString().slice(11, 16)
            : 'TBA',
          importance,
          description: news.summary,
          releaseStatus: 'released',
          impact: {
            expected: news.sentiment,
            explanation: `Based on news analysis: ${news.title}`,
            affectedSymbols: news.symbols || ['SPX500', 'EURUSD'],
            volatilityRating: news.impact === 'high' ? 8 : 5,
          },
          isNewsDerived: true,
        };
      });
  }

  private generateEventsForDay(date: Date): EconomicEvent[] {
    const dayOfWeek = date.getDay();
    const events: EconomicEvent[] = [];

    // Monday events
    if (dayOfWeek === 1) {
      events.push({
        id: `mon-${date.getTime()}`,
        title: 'Manufacturing PMI',
        country: 'United States',
        currency: 'USD',
        date,
        time: '15:00',
        importance: 'medium',
        forecast: '52.1',
        previous: '51.8',
        description: 'Purchasing Managers Index for the manufacturing sector',
        impact: {
          expected: 'neutral',
          explanation:
            'PMI above 50 indicates expansion. Market expects slight improvement which could be USD positive.',
          affectedSymbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'SPX500'],
          volatilityRating: 6,
        },
      });
    }

    // Tuesday events
    if (dayOfWeek === 2) {
      events.push({
        id: `tue-cpi-${date.getTime()}`,
        title: 'Consumer Price Index (CPI)',
        country: 'United States',
        currency: 'USD',
        date,
        time: '13:30',
        importance: 'high',
        forecast: '3.2%',
        previous: '3.1%',
        description:
          'Measures changes in the price level of consumer goods and services',
        impact: {
          expected: 'bearish',
          explanation:
            'Higher than expected CPI could trigger aggressive Fed action, potentially negative for equities but positive for USD.',
          affectedSymbols: ['SPX500', 'NASDAQ100', 'EURUSD', 'XAUUSD'],
          volatilityRating: 9,
        },
      });
    }

    // Wednesday events (Fed decision days)
    if (dayOfWeek === 3) {
      events.push({
        id: `wed-fomc-${date.getTime()}`,
        title: 'FOMC Interest Rate Decision',
        country: 'United States',
        currency: 'USD',
        date,
        time: '19:00',
        importance: 'high',
        forecast: '5.50%',
        previous: '5.25%',
        description: 'Federal Open Market Committee interest rate decision',
        impact: {
          expected: 'bullish',
          explanation:
            "Expected 25bp hike. Focus on forward guidance and Powell's tone in press conference.",
          affectedSymbols: [
            'EURUSD',
            'GBPUSD',
            'USDJPY',
            'SPX500',
            'NASDAQ100',
            'XAUUSD',
          ],
          volatilityRating: 10,
        },
      });

      events.push({
        id: `wed-powell-${date.getTime()}`,
        title: 'Fed Chair Powell Press Conference',
        country: 'United States',
        currency: 'USD',
        date,
        time: '19:30',
        importance: 'high',
        description:
          'Federal Reserve Chair Jerome Powell press conference following FOMC decision',
        impact: {
          expected: 'neutral',
          explanation:
            "Powell's commentary on future policy direction will be crucial for market direction.",
          affectedSymbols: [
            'EURUSD',
            'GBPUSD',
            'USDJPY',
            'SPX500',
            'NASDAQ100',
            'XAUUSD',
          ],
          volatilityRating: 10,
        },
      });
    }

    // Thursday events
    if (dayOfWeek === 4) {
      events.push({
        id: `thu-unemployment-${date.getTime()}`,
        title: 'Initial Jobless Claims',
        country: 'United States',
        currency: 'USD',
        date,
        time: '13:30',
        importance: 'medium',
        forecast: '210,000',
        previous: '205,000',
        description:
          'Number of individuals filing for unemployment benefits for the first time',
        impact: {
          expected: 'neutral',
          explanation:
            'Slight increase expected but still at historically low levels, indicating strong labor market.',
          affectedSymbols: ['EURUSD', 'USDJPY', 'SPX500'],
          volatilityRating: 5,
        },
      });
    }

    // Friday events (NFP day)
    if (dayOfWeek === 5) {
      events.push({
        id: `fri-nfp-${date.getTime()}`,
        title: 'Non-Farm Payrolls',
        country: 'United States',
        currency: 'USD',
        date,
        time: '13:30',
        importance: 'high',
        forecast: '180,000',
        previous: '195,000',
        description:
          'Change in the number of employed people during the previous month',
        impact: {
          expected: 'bearish',
          explanation:
            'Slight slowdown in job creation expected. Strong number could be hawkish for Fed policy.',
          affectedSymbols: [
            'EURUSD',
            'GBPUSD',
            'USDJPY',
            'SPX500',
            'NASDAQ100',
            'XAUUSD',
          ],
          volatilityRating: 9,
        },
      });

      events.push({
        id: `fri-unemployment-rate-${date.getTime()}`,
        title: 'Unemployment Rate',
        country: 'United States',
        currency: 'USD',
        date,
        time: '13:30',
        importance: 'high',
        forecast: '3.7%',
        previous: '3.7%',
        description: 'Percentage of the total workforce that is unemployed',
        impact: {
          expected: 'neutral',
          explanation:
            'Rate expected to remain stable. Any significant change could impact Fed policy expectations.',
          affectedSymbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'SPX500', 'XAUUSD'],
          volatilityRating: 8,
        },
      });
    }

    // Add European events for variety
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      events.push({
        id: `eur-ecb-${date.getTime()}`,
        title: 'ECB President Lagarde Speech',
        country: 'European Union',
        currency: 'EUR',
        date,
        time: '14:00',
        importance: 'medium',
        description:
          'European Central Bank President Christine Lagarde speaking at economic forum',
        impact: {
          expected: 'neutral',
          explanation:
            'Comments on inflation outlook and monetary policy stance will be closely watched.',
          affectedSymbols: ['EURUSD', 'EURGBP', 'EURJPY'],
          volatilityRating: 6,
        },
      });
    }

    return events;
  }

  private async generateWeeklyAnalysis(events: EconomicEvent[]) {
    const highImpactEvents = events.filter((e) => e.importance === 'high');
    const mediumImpactEvents = events.filter((e) => e.importance === 'medium');

    // Group events by day
    const eventsByDay = events.reduce(
      (acc, event) => {
        const dayKey = event.date.toDateString();
        if (!acc[dayKey]) {
          acc[dayKey] = [];
        }
        acc[dayKey].push(event);
        return acc;
      },
      {} as Record<string, EconomicEvent[]>,
    );

    // Calculate average volatility by symbol
    const symbolVolatility = events.reduce(
      (acc, event) => {
        event.impact.affectedSymbols.forEach((symbol) => {
          if (!acc[symbol]) {
            acc[symbol] = [];
          }
          acc[symbol].push(event.impact.volatilityRating);
        });
        return acc;
      },
      {} as Record<string, number[]>,
    );

    const averageVolatilityBySymbol = Object.entries(symbolVolatility).reduce(
      (acc, [symbol, ratings]) => {
        acc[symbol] =
          ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      summary: {
        totalEvents: events.length,
        highImpactEvents: highImpactEvents.length,
        mediumImpactEvents: mediumImpactEvents.length,
        mostVolatileDay: this.getMostVolatileDay(eventsByDay),
        averageVolatilityBySymbol,
      },
      dailyBreakdown: Object.entries(eventsByDay).map(([day, dayEvents]) => ({
        date: day,
        eventCount: dayEvents.length,
        highImpactCount: dayEvents.filter((e) => e.importance === 'high')
          .length,
        averageVolatility:
          dayEvents.reduce((sum, e) => sum + e.impact.volatilityRating, 0) /
          dayEvents.length,
        keyEvents: dayEvents
          .filter((e) => e.importance === 'high')
          .map((e) => e.title),
      })),
      tradingStrategy: {
        preparation: [
          'Review key support/resistance levels before high-impact events',
          'Reduce position sizes during FOMC and NFP releases',
          'Set appropriate stop losses to account for increased volatility',
        ],
        opportunities: [
          'Look for breakouts following Fed announcements',
          'Monitor USD pairs during US economic releases',
          'Watch for mean reversion after initial volatility spikes',
        ],
        riskManagement: [
          'Avoid holding positions through major central bank decisions',
          'Use wider stops during high-volatility periods',
          'Consider hedging strategies for existing positions',
        ],
      },
    };
  }

  private getMostVolatileDay(
    eventsByDay: Record<string, EconomicEvent[]>,
  ): string {
    let maxVolatility = 0;
    let mostVolatileDay = '';

    Object.entries(eventsByDay).forEach(([day, events]) => {
      const totalVolatility = events.reduce(
        (sum, e) => sum + e.impact.volatilityRating,
        0,
      );
      if (totalVolatility > maxVolatility) {
        maxVolatility = totalVolatility;
        mostVolatileDay = day;
      }
    });

    return mostVolatileDay;
  }

  private async generateEventImpactAnalysis(
    eventId: string,
  ): Promise<EconomicImpactAnalysis> {
    // 1. Find the event details
    // Only search today/this week (ForexFactory XML is weekly)
    const events = await this.fetchEconomicEvents();
    const event = events.find((e) => e.id === eventId);

    if (!event) {
      // Fallback mock if not found (or old event)
      return this.getMockImpactAnalysis(eventId);
    }

    const eventKey = this.buildEventKey(event);
    const priorAnalysis = eventKey
      ? await this.getLatestAnalysisByEventKey(eventKey)
      : null;

    const persistedHistory = eventKey
      ? await this.getReleaseHistoryByEventKey(eventKey, 24)
      : [];

    const fredSeries = this.mapEventToFredSeries(event.title);
    let fallbackHistory = fredSeries ? await this.fetchFredHistory(fredSeries) : [];
    let historySource: 'FRED' | 'ECB' | 'ONS' | 'TRADETAPER' | undefined =
      persistedHistory.length > 0 ? 'TRADETAPER' : fredSeries ? 'FRED' : undefined;

    if (fallbackHistory.length === 0) {
      const ecbSeries = this.mapEventToEcbSeries(event.title, event.currency);
      if (ecbSeries) {
        fallbackHistory = await this.fetchEcbHistory(ecbSeries);
        if (fallbackHistory.length > 0) historySource = 'ECB';
      }
    }

    if (fallbackHistory.length === 0 && event.currency === 'GBP') {
      fallbackHistory = await this.fetchOnsCpihHistory();
      if (fallbackHistory.length > 0) historySource = 'ONS';
    }

    const history = this.mergeHistory(persistedHistory, fallbackHistory, 24);
    const aiSummary = await this.generateAiSummary(
      event,
      history,
      priorAnalysis,
    );
    const base = this.getMockImpactAnalysis(eventId);

    const confidence =
      aiSummary?.confidence ??
      this.calculateFallbackConfidence(history.length, event.importance);
    const sourceQuality =
      aiSummary?.sourceQuality ??
      this.calculateFallbackSourceQuality(history.length);

    const analysis: EconomicImpactAnalysis = {
      ...base,
      eventId,
      event,
      history,
      aiSummary: aiSummary || undefined,
      confidence,
      sourceQuality,
      cachedAt: new Date().toISOString(),
      eventMetrics: {
        releaseStatus:
          event.releaseStatus ||
          this.computeReleaseStatus(event.date, Boolean(event.actual)),
        minutesFromRelease: this.getMinutesFromRelease(event.date),
        surpriseDirection: event.surprise?.direction || 'unknown',
        surpriseValue: event.surprise?.value,
        surprisePercent: event.surprise?.percent,
      },
      impactPlaybook: this.buildImpactPlaybook(event),
      detailedAnalysis: {
        ...base.detailedAnalysis,
        summary:
          event.description ||
          base.detailedAnalysis?.summary ||
          base.preEventAnalysis?.marketExpectations ||
          'No summary available.',
        source:
          event.source ||
          historySource ||
          base.detailedAnalysis?.source ||
          'N/A',
        measures:
          event.category ||
          event.description ||
          base.detailedAnalysis?.measures ||
          'N/A',
        usualEffect:
          base.detailedAnalysis?.usualEffect ||
          'Actual > Forecast = Good for Currency',
        frequency: event.frequency || base.detailedAnalysis?.frequency || 'N/A',
        nextRelease:
          event.referenceDate || base.detailedAnalysis?.nextRelease || 'TBA',
        whyTradersCare:
          base.detailedAnalysis?.whyTradersCare || 'Significant market impact',
        sourceUrl: event.sourceUrl,
        reference: event.reference,
        referenceDate: event.referenceDate,
        unit: event.unit,
        revised: event.revised,
        category: event.category,
        ticker: event.ticker,
        url: event.url,
      },
    };

    await this.storeAnalysisCache(
      event,
      analysis,
      aiSummary,
      confidence,
      sourceQuality,
      eventKey,
    );

    return analysis;

    /*
    try {
      const prompt = `...`;
      // AI Logic Commented Out
    } catch ...
    */
  }

  private getMockImpactAnalysis(eventId: string): EconomicImpactAnalysis {
    return {
      eventId,
      preEventAnalysis: {
        marketExpectations:
          'Market is pricing in current consensus. Standard volatility expected.',
        keyLevelsToWatch: [],
        riskScenarios: ['Deviation from forecast could trigger volatility.'],
      },
      detailedAnalysis: {
        source: 'Financial Agency',
        measures: 'Economic Activity',
        usualEffect: 'Actual > Forecast = Good for Currency',
        frequency: 'Monthly',
        whyTradersCare: 'Primary gauge of economic health',
        nextRelease: 'Next Month',
        summary: 'Baseline macro release with standard market impact.',
      },
      tradingRecommendations: {
        preEvent: ['Reduce risk.'],
        duringEvent: ['Wait for spread to normalize.'],
        postEvent: ['Trade the reaction.'],
      },
    };
  }

  private async generateAiSummary(
    event: EconomicEvent,
    history: EconomicEventHistoryItem[],
    priorAnalysis?: EconomicEventAnalysis | null,
  ): Promise<EconomicEventAiSummary | null> {
    if (event.importance !== 'high') {
      return null;
    }

    try {
      const [newsResult, highImpactResult, moversResult, liveQuotesResult] =
        await Promise.allSettled([
          this.newsAnalysisService.getMarketNews(),
          this.getHighImpactToday(),
          this.getTopMoversToday(),
          this.marketDataAggregator.getLiveQuotes(
            event.impact?.affectedSymbols || this.mapCurrencyToSymbols(event.currency)
          ),
        ]);

      const news =
        newsResult.status === 'fulfilled'
          ? newsResult.value
          : ({ news: [] } as { news: any[] });
      const highImpactEvents =
        highImpactResult.status === 'fulfilled' ? highImpactResult.value : [];
      const topMovers =
        moversResult.status === 'fulfilled' ? moversResult.value : [];
      const liveQuotes = 
        liveQuotesResult.status === 'fulfilled' ? liveQuotesResult.value : [];

      const recentNews = news.news
        .filter(
          (item) =>
            item?.publishedAt &&
            Date.now() - item.publishedAt.getTime() <= 7 * 24 * 60 * 60 * 1000,
        )
        .slice(0, 8)
        .map((item) => ({
          title: item.title,
          sentiment: item.sentiment,
          impact: item.impact,
          symbols: item.symbols,
        }));

      const context = {
        event: {
          title: event.title,
          country: event.country,
          currency: event.currency,
          importance: event.importance,
          actual: event.actual,
          forecast: event.forecast,
          previous: event.previous,
          revised: event.revised,
          unit: event.unit,
          reference: event.reference,
        },
        affectedSymbols:
          event.impact?.affectedSymbols ||
          this.mapCurrencyToSymbols(event.currency),
        history: history.slice(0, 6),
        highImpactEvents: highImpactEvents.map((item) => ({
          title: item.title,
          currency: item.currency,
          time: item.date.toISOString(),
        })),
        topMovers,
        recentNews,
        priorAnalysis: priorAnalysis?.analysis || null,
        timestamp: new Date().toISOString(),
      };

      const prompt = `
You are a senior macro strategist. Produce a high-impact briefing focused on the selected event, today's high-impact events, and top movers.
Include guidance per trading pair (FX majors, metals, indices) with explicit bias and confidence.
Use the affectedSymbols list and ensure watchlist covers each affected symbol plus at least 2 majors, 1 metal, and 1 index.
Provide a confidence score (0-100) and source quality breakdown.

Return JSON ONLY with this schema:
{
  "headline": "string",
  "marketPulse": "string",
  "highImpactDrivers": ["string"],
  "watchlist": [{"symbol":"string","bias":"bullish|bearish|neutral","confidence":number,"drivers":["string"]}],
  "topMovers": [{"symbol":"string","price":number,"change":number,"changePercent":number,"direction":"up|down|flat","source":"string"}],
  "risks": ["string"],
  "confidence": number,
  "sourceQuality": {"high": number, "medium": number, "low": number, "consensus": "string"}
}

Context:
${JSON.stringify(context)}
`;

      const response = await this.orchestrator.complete({
        prompt,
        modelPreference: 'gemini-2.0-flash',
        taskComplexity: 'complex',
        requireJson: true,
        optimizeFor: 'quality',
      });

      const parsed = this.parseAiJson(response.content);
      
      let baseWatchlist = Array.isArray(parsed.watchlist) && parsed.watchlist.length > 0 
          ? parsed.watchlist 
          : [
              { symbol: 'EURUSD', bias: 'Neutral', confidence: 50 },
              { symbol: 'GBPUSD', bias: 'Neutral', confidence: 50 },
              { symbol: 'XAUUSD', bias: 'Neutral', confidence: 50 }
            ];

      // Inject real live pricing data into watchlist
      const enrichedWatchlist = baseWatchlist.map((item: any) => {
         const trueSymbol = item.symbol?.replace('/', ''); // e.g., EUR/USD -> EURUSD
         const quote = liveQuotes.find(q => q.symbol === trueSymbol || q.symbol === item.symbol);
         if (quote) {
             return {
                 ...item,
                 price: `$${quote.bid.toFixed(quote.bid < 10 ? 4 : 2)}`,
                 changePercent: quote.changePercent,
             };
         }
         return item;
      });

      return {
        scope: 'high_event_top_movers',
        headline: parsed.headline || 'High-impact briefing',
        marketPulse: parsed.marketPulse || 'Market focus on macro drivers.',
        highImpactDrivers: parsed.highImpactDrivers || [],
        watchlist: enrichedWatchlist,
        topMovers: parsed.topMovers || [],
        risks: parsed.risks || [],
        confidence: parsed.confidence,
        sourceQuality: parsed.sourceQuality,
      };
    } catch (error) {
      this.logger.warn('AI summary failed, using fallback', error.message);
      return null;
    }
  }

  private parseAiJson(content: string): Record<string, any> {
    const cleaned = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const direct = this.tryParseJson(cleaned);
    if (direct) return direct;

    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = this.tryParseJson(match[0]);
      if (parsed) return parsed;
    }

    throw new Error('AI response JSON parsing failed');
  }

  private tryParseJson(text: string): Record<string, any> | null {
    try {
      const normalized = text.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      return JSON.parse(normalized);
    } catch {
      return null;
    }
  }

  private async getHighImpactToday(): Promise<EconomicEvent[]> {
    const { events } = await this.getEconomicCalendar();
    return events.filter((event) => event.importance === 'high');
  }

  private async getTopMoversToday(): Promise<
    {
      symbol: string;
      price: number;
      change: number;
      changePercent: number;
      direction: 'up' | 'down' | 'flat';
      source: string;
    }[]
  > {
    const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'SPY', 'QQQ'];
    const quotes = await this.marketDataService.getLiveQuotes(symbols);
    return quotes
      .filter((quote) => Number.isFinite(quote.changePercent))
      .map((quote) => ({
        symbol: quote.symbol,
        price: quote.bid,
        change: quote.change,
        changePercent: quote.changePercent,
        direction:
          (quote.changePercent > 0
            ? 'up'
            : quote.changePercent < 0
              ? 'down'
              : 'flat') as 'up' | 'down' | 'flat',
        source: quote.source,
      }))
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 6);
  }

  private async getReleaseHistoryByEventKey(
    eventKey: string,
    limit = 24,
  ): Promise<EconomicEventHistoryItem[]> {
    const rows = await this.economicReleaseRepository.find({
      where: { eventKey },
      order: { eventDate: 'DESC' },
      take: limit,
    });

    return rows.map((row) => {
      const surpriseDirection =
        row.surpriseNumeric === null || row.surpriseNumeric === undefined
          ? 'unknown'
          : row.surpriseNumeric > 0
            ? 'better'
            : row.surpriseNumeric < 0
              ? 'worse'
              : 'in-line';

      return {
        date: row.eventDate.toISOString(),
        actual: row.actual || undefined,
        forecast: row.forecast || undefined,
        previous: row.previous || undefined,
        revised: row.revised || undefined,
        source: row.source || 'TradeTaper',
        surpriseDirection,
        surpriseValue:
          row.surpriseNumeric === null || row.surpriseNumeric === undefined
            ? undefined
            : Number(row.surpriseNumeric),
        surprisePercent:
          row.surprisePercent === null || row.surprisePercent === undefined
            ? undefined
            : Number(row.surprisePercent),
      };
    });
  }

  private mergeHistory(
    persisted: EconomicEventHistoryItem[],
    fallback: EconomicEventHistoryItem[],
    limit = 24,
  ): EconomicEventHistoryItem[] {
    const merged = [...persisted];
    const seen = new Set(
      merged.map((item) => `${item.date}:${item.actual || ''}:${item.forecast || ''}`),
    );

    for (const item of fallback) {
      const key = `${item.date}:${item.actual || ''}:${item.forecast || ''}`;
      if (seen.has(key)) continue;
      merged.push(item);
      seen.add(key);
    }

    return merged
      .filter((item) => item?.date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  private getMinutesFromRelease(eventDate: Date): number {
    return Math.round((Date.now() - eventDate.getTime()) / 60000);
  }

  private buildImpactPlaybook(event: EconomicEvent): EconomicImpactAnalysis['impactPlaybook'] {
    const surpriseDirection = event.surprise?.direction || 'unknown';
    const currency = event.currency || 'USD';
    const polarity =
      surpriseDirection === 'better'
        ? 'stronger-than-forecast'
        : surpriseDirection === 'worse'
          ? 'weaker-than-forecast'
          : 'in-line';

    return {
      fx:
        polarity === 'stronger-than-forecast'
          ? `${currency} pairs can trend with momentum after spread normalization.`
          : polarity === 'weaker-than-forecast'
            ? `${currency} can weaken first, then mean-revert near liquidity zones.`
            : `${currency} pairs typically revert unless a secondary headline changes expectations.`,
      indices:
        polarity === 'weaker-than-forecast'
          ? 'Equity indices may reprice growth and earnings lower.'
          : 'Indices react to growth-vs-rates balance; wait for first pullback confirmation.',
      metals:
        currency === 'USD'
          ? 'Gold often moves inverse to USD/rates impulse; watch real-yield reaction.'
          : 'Metals react through USD and global risk sentiment transmission.',
      rates:
        'Short-end yields reprice policy path first; watch 2Y proxies for confirmation.',
      crypto:
        'Crypto typically follows liquidity/risk appetite after macro volatility cools.',
    };
  }

  private buildEventKey(event: EconomicEvent): string {
    const normalizedTitle = (event.title || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    const normalizedCurrency = (event.currency || '').toLowerCase().trim();
    const normalizedCountry = (event.country || '').toLowerCase().trim();
    return `${normalizedCurrency}:${normalizedCountry}:${normalizedTitle}`;
  }

  private calculateFallbackConfidence(
    historyLength: number,
    importance: string,
  ): number {
    const base = importance === 'high' ? 55 : 40;
    const historyBoost = Math.min(25, historyLength * 3);
    return Math.min(85, base + historyBoost);
  }

  private calculateFallbackSourceQuality(historyLength: number): {
    high: number;
    medium: number;
    low: number;
    consensus: string;
  } {
    const high = Math.min(5, Math.max(1, Math.ceil(historyLength / 3)));
    const medium = Math.min(4, Math.max(1, Math.ceil(historyLength / 4)));
    const low = Math.max(0, 5 - high - medium);
    return {
      high,
      medium,
      low,
      consensus:
        historyLength >= 6
          ? 'Strong'
          : historyLength >= 3
            ? 'Moderate'
            : 'Thin',
    };
  }

  private async getCachedAnalysis(
    eventId: string,
  ): Promise<EconomicImpactAnalysis | null> {
    const cached = this.analysisCache.get(eventId);
    if (cached && Date.now() - cached.timestamp < this.ANALYSIS_TTL) {
      return cached.data;
    }

    const stored = await this.economicAnalysisRepository.findOne({
      where: { eventId },
    });

    if (!stored || !stored.analysis) {
      return null;
    }

    if (
      stored.updatedAt &&
      Date.now() - stored.updatedAt.getTime() >= this.ANALYSIS_TTL
    ) {
      return null;
    }

    const analysis = stored.analysis as EconomicImpactAnalysis;
    const fallbackConfidence =
      typeof stored.confidence === 'number'
        ? stored.confidence
        : this.calculateFallbackConfidence(
            0,
            analysis.event?.importance || 'high',
          );
    const fallbackSourceQuality =
      (stored.sourceQuality as any) ?? this.calculateFallbackSourceQuality(0);

    const withMeta: EconomicImpactAnalysis = {
      ...analysis,
      confidence:
        stored.confidence ?? analysis.confidence ?? fallbackConfidence,
      sourceQuality:
        (stored.sourceQuality as any) ??
        analysis.sourceQuality ??
        fallbackSourceQuality,
      aiSummary: (stored.aiSummary as any) ?? analysis.aiSummary,
      cachedAt: stored.updatedAt
        ? stored.updatedAt.toISOString()
        : analysis.cachedAt,
    };

    this.analysisCache.set(eventId, { timestamp: Date.now(), data: withMeta });
    return withMeta;
  }

  private async getLatestAnalysisByEventKey(
    eventKey: string,
  ): Promise<EconomicEventAnalysis | null> {
    return this.economicAnalysisRepository.findOne({
      where: { eventKey },
      order: { updatedAt: 'DESC' },
    });
  }

  private async storeAnalysisCache(
    event: EconomicEvent,
    analysis: EconomicImpactAnalysis,
    aiSummary: EconomicEventAiSummary | null,
    confidence: number,
    sourceQuality: Record<string, any>,
    eventKey?: string,
  ): Promise<void> {
    try {
      await this.economicAnalysisRepository.upsert(
        {
          eventId: event.id,
          eventKey,
          currency: event.currency,
          importance: event.importance,
          eventDate: event.date,
          analysis: analysis as any,
          aiSummary: aiSummary as any,
          confidence,
          sourceQuality,
        },
        ['eventId'],
      );
      this.analysisCache.set(event.id, {
        timestamp: Date.now(),
        data: analysis,
      });
    } catch (error) {
      this.logger.warn(
        'Failed to persist economic analysis cache',
        error.message,
      );
    }
  }

  async precomputeHighImpactAnalysis(eventId: string): Promise<void> {
    const cached = await this.getCachedAnalysis(eventId);
    if (cached) return;
    await this.generateEventImpactAnalysis(eventId);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async refreshEconomicReleaseSnapshots(): Promise<void> {
    try {
      await this.fetchEconomicEvents(undefined, undefined, undefined, true);
    } catch (error) {
      this.logger.warn('Scheduled economic release refresh failed', error);
    }
  }
}
