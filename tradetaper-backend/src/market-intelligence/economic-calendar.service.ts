import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NewsAnalysisService } from './news-analysis.service';
import { XMLParser } from 'fast-xml-parser'; // Added
import { parse } from 'date-fns'; // Added for date parsing // Added
import { MarketDataAggregatorService } from './market-data-aggregator.service';
import { MultiModelOrchestratorService } from '../agents/llm/multi-model-orchestrator.service';
import { EconomicEventAnalysis } from './entities/economic-event-analysis.entity';

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

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly newsAnalysisService: NewsAnalysisService,
    private readonly marketDataService: MarketDataAggregatorService,
    private readonly orchestrator: MultiModelOrchestratorService,
    @InjectRepository(EconomicEventAnalysis)
    private readonly economicAnalysisRepository: Repository<EconomicEventAnalysis>,
  ) {}

  async getEconomicCalendar(
    from?: string,
    to?: string,
    importance?: string,
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

      const events = await this.fetchEconomicEvents(from, to, importance);
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
  ): Promise<EconomicEvent[]> {
    const currentDate = new Date();
    const events: EconomicEvent[] = [];
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    if (
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
      for (let i = 0; i < 7; i++) {
        const eventDate = new Date(currentDate);
        eventDate.setDate(currentDate.getDate() + i);
        const dayEvents = this.generateEventsForDay(eventDate);
        events.push(...dayEvents);
      }
    }

    this.eventCache = {
      timestamp: Date.now(),
      data: events,
    };

    return this.applyEventFilters(events, fromDate, toDate, importance);
  }

  private eventCache: { timestamp: number; data: EconomicEvent[] } | null =
    null;
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour
  private analysisCache = new Map<
    string,
    { timestamp: number; data: EconomicImpactAnalysis }
  >();
  private readonly ANALYSIS_TTL = 12 * 60 * 60 * 1000; // 12 hours

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

  private getFredApiKey(): string | undefined {
    if (!this.fredApiKey) {
      this.fredApiKey =
        this.configService.get<string>('FRED_API_KEY') ||
        this.configService.get<string>('FRED_KEY');
    }
    return this.fredApiKey;
  }

  private async fetchForexFactoryEvents(): Promise<EconomicEvent[]> {
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
          const dateStr = e.date; // MM-DD-YYYY
          const timeStr = e.time; // 1:30pm

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

          return {
            id: `ff-${e.title}-${eventDate.getTime()}`,
            title: e.title,
            country: e.country,
            currency: e.country,
            date: eventDate,
            time: e.time,
            importance: e.impact.toLowerCase(),
            actual: e.actual,
            forecast: e.forecast,
            previous: e.previous,
            source: 'ForexFactory',
            sourceUrl: 'https://www.forexfactory.com/calendar',
            description: `${e.title} (${e.impact} Impact)`,
            impact: {
              expected: 'neutral',
              explanation: 'Real-time economic event from ForexFactory',
              affectedSymbols: this.mapCurrencyToSymbols(e.country),
              volatilityRating:
                e.impact === 'High' ? 8 : e.impact === 'Medium' ? 5 : 2,
            },
            isNewsDerived: false,
          };
        })
        .filter((e) => e !== null) as EconomicEvent[];

      return events;
    } catch (error) {
      this.logger.error('Critical error fetching FF Events', error);

      return [];
    }
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
      .map((news) => ({
        id: `news_${news.id}`,
        title: news.title,
        country: 'Global', // News often global
        currency: 'USD', // Default
        date: news.publishedAt,
        time: news.publishedAt.toLocaleTimeString(),
        importance: news.impact === 'high' ? 'high' : 'medium',
        description: news.summary,
        impact: {
          expected: news.sentiment,
          explanation: `Based on news analysis: ${news.title}`,
          affectedSymbols: news.symbols || ['SPX500', 'EURUSD'],
          volatilityRating: news.impact === 'high' ? 8 : 5,
        },
        isNewsDerived: true,
      }));
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

    const fredSeries = this.mapEventToFredSeries(event.title);
    let history = fredSeries ? await this.fetchFredHistory(fredSeries) : [];
    let historySource: 'FRED' | 'ECB' | 'ONS' | undefined = fredSeries
      ? 'FRED'
      : undefined;

    if (history.length === 0) {
      const ecbSeries = this.mapEventToEcbSeries(event.title, event.currency);
      if (ecbSeries) {
        history = await this.fetchEcbHistory(ecbSeries);
        if (history.length > 0) historySource = 'ECB';
      }
    }

    if (history.length === 0 && event.currency === 'GBP') {
      history = await this.fetchOnsCpihHistory();
      if (history.length > 0) historySource = 'ONS';
    }
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
      const [newsResult, highImpactResult, moversResult] =
        await Promise.allSettled([
          this.newsAnalysisService.getMarketNews(),
          this.getHighImpactToday(),
          this.getTopMoversToday(),
        ]);

      const news =
        newsResult.status === 'fulfilled'
          ? newsResult.value
          : ({ news: [] } as { news: any[] });
      const highImpactEvents =
        highImpactResult.status === 'fulfilled' ? highImpactResult.value : [];
      const topMovers =
        moversResult.status === 'fulfilled' ? moversResult.value : [];

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

      return {
        scope: 'high_event_top_movers',
        headline: parsed.headline || 'High-impact briefing',
        marketPulse: parsed.marketPulse || 'Market focus on macro drivers.',
        highImpactDrivers: parsed.highImpactDrivers || [],
        watchlist: parsed.watchlist || [],
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

  private buildEventKey(event: EconomicEvent): string {
    return `${event.currency}:${event.title}`.toLowerCase();
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
}
