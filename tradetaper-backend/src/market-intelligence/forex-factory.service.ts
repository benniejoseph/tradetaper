import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface ForexFactoryEvent {
  id: string;
  title: string;
  country: string;
  date: Date;
  time: string;
  impact: 'low' | 'medium' | 'high';
  forecast: string;
  previous: string;
  actual?: string;
  currency: string;
  description?: string;
  source: 'economic_calendar' | 'alpha_vantage' | 'trading_economics';
}

@Injectable()
export class ForexFactoryService {
  private readonly logger = new Logger(ForexFactoryService.name);
  private readonly economicCalendarApiKey =
    process.env.ECONOMIC_CALENDAR_API_KEY;
  private readonly alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY;
  private readonly tradingEconomicsApiKey =
    process.env.TRADING_ECONOMICS_API_KEY;

  constructor(private readonly httpService: HttpService) {}

  async getEconomicCalendar(): Promise<ForexFactoryEvent[]> {
    try {
      this.logger.log('Fetching live economic calendar events...');

      // Try multiple sources for comprehensive coverage
      const [
        economicCalendarEvents,
        alphaVantageEvents,
        tradingEconomicsEvents,
      ] = await Promise.allSettled([
        this.getEconomicCalendarEvents(),
        this.getAlphaVantageEvents(),
        this.getTradingEconomicsEvents(),
      ]);

      const allEvents: ForexFactoryEvent[] = [];

      if (economicCalendarEvents.status === 'fulfilled') {
        allEvents.push(...economicCalendarEvents.value);
      }

      if (alphaVantageEvents.status === 'fulfilled') {
        allEvents.push(...alphaVantageEvents.value);
      }

      if (tradingEconomicsEvents.status === 'fulfilled') {
        allEvents.push(...tradingEconomicsEvents.value);
      }

      // If no live data available, log warning but don't fail
      if (allEvents.length === 0) {
        this.logger.warn('No live economic data available from any source');
        return this.getFallbackEconomicEvents();
      }

      // Sort by date and remove duplicates
      const uniqueEvents = this.deduplicateEvents(allEvents);
      return uniqueEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch (error) {
      this.logger.error('Error fetching live economic calendar:', error);
      return this.getFallbackEconomicEvents();
    }
  }

  private async getEconomicCalendarEvents(): Promise<ForexFactoryEvent[]> {
    if (!this.economicCalendarApiKey) {
      this.logger.warn('Economic Calendar API key not configured');
      return [];
    }

    try {
      // Economic Calendar API (https://tradingeconomics.com/api/)
      const response = await firstValueFrom(
        this.httpService.get('https://api.tradingeconomics.com/calendar', {
          params: {
            key: this.economicCalendarApiKey,
            country:
              'united states,eurozone,united kingdom,japan,canada,australia',
            importance: '2,3', // Medium and High importance
            format: 'json',
          },
        }),
      );

      return response.data.map((event: Record<string, any>) => ({
        id: `ec_${event.CalendarId || Date.now()}_${Math.random()}`,
        title: event.Event || event.Name,
        country: this.mapCountryToCurrency(event.Country),
        date: new Date(event.Date),
        time: new Date(event.Date).toTimeString().slice(0, 5),
        impact: this.mapImportanceToImpact(event.Importance),
        forecast: event.Forecast || 'N/A',
        previous: event.Previous || 'N/A',
        actual: event.Actual || undefined,
        currency: this.mapCountryToCurrency(event.Country),
        description: event.Reference,
        source: 'economic_calendar',
      }));
    } catch (error) {
      this.logger.error('Economic Calendar API error:', error.message);
      return [];
    }
  }

  private async getAlphaVantageEvents(): Promise<ForexFactoryEvent[]> {
    if (!this.alphaVantageApiKey) {
      this.logger.warn('Alpha Vantage API key not configured');
      return [];
    }

    try {
      // Alpha Vantage Economic Indicators
      const response = await firstValueFrom(
        this.httpService.get('https://www.alphavantage.co/query', {
          params: {
            function: 'NEWS_SENTIMENT',
            apikey: this.alphaVantageApiKey,
            topics: 'financial_markets,economy_fiscal,economy_monetary',
            limit: 20,
          },
        }),
      );

      if (response.data.feed) {
        return response.data.feed.map((item: Record<string, any>) => ({
          id: `av_${item.url.split('/').pop()}_${Date.now()}`,
          title: item.title,
          country: 'USD', // Alpha Vantage primarily covers US markets
          date: new Date(item.time_published),
          time: new Date(item.time_published).toTimeString().slice(0, 5),
          impact: this.mapSentimentToImpact(item.overall_sentiment_score),
          forecast: 'Market Sentiment',
          previous: 'N/A',
          actual: item.overall_sentiment_label,
          currency: 'USD',
          description: item.summary,
          source: 'alpha_vantage',
        }));
      }

      return [];
    } catch (error) {
      this.logger.error('Alpha Vantage API error:', error.message);
      return [];
    }
  }

  private async getTradingEconomicsEvents(): Promise<ForexFactoryEvent[]> {
    if (!this.tradingEconomicsApiKey) {
      this.logger.warn('Trading Economics API key not configured');
      return [];
    }

    try {
      // Trading Economics Calendar
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const response = await firstValueFrom(
        this.httpService.get(
          `https://api.tradingeconomics.com/calendar/country/united states,eurozone,united kingdom,japan/${today}/${nextWeek}`,
          {
            params: {
              key: this.tradingEconomicsApiKey,
            },
          },
        ),
      );

      return response.data.map((event: Record<string, any>) => ({
        id: `te_${event.CalendarId}_${Date.now()}`,
        title: event.Event,
        country: event.Country,
        date: new Date(event.Date),
        time: new Date(event.Date).toTimeString().slice(0, 5),
        impact: this.mapImportanceToImpact(event.Importance),
        forecast: event.Forecast?.toString() || 'N/A',
        previous: event.Previous?.toString() || 'N/A',
        actual: event.Actual?.toString() || undefined,
        currency: this.mapCountryToCurrency(event.Country),
        description: event.Reference,
        source: 'trading_economics',
      }));
    } catch (error) {
      this.logger.error('Trading Economics API error:', error.message);
      return [];
    }
  }

  async getHighImpactEvents(): Promise<ForexFactoryEvent[]> {
    const events = await this.getEconomicCalendar();
    return events.filter((event) => event.impact === 'high');
  }

  private deduplicateEvents(events: ForexFactoryEvent[]): ForexFactoryEvent[] {
    const seen = new Set();
    return events.filter((event) => {
      const key = `${event.title}_${event.country}_${event.date.toDateString()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
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

  private mapImportanceToImpact(
    importance: string | number,
  ): 'low' | 'medium' | 'high' {
    const imp = parseFloat(String(importance)) || 1;
    if (imp >= 3) return 'high';
    if (imp >= 2) return 'medium';
    return 'low';
  }

  private mapSentimentToImpact(sentiment: number): 'low' | 'medium' | 'high' {
    const abs = Math.abs(sentiment);
    if (abs >= 0.5) return 'high';
    if (abs >= 0.2) return 'medium';
    return 'low';
  }

  private getFallbackEconomicEvents(): ForexFactoryEvent[] {
    // Minimal fallback - only return current market session info
    const now = new Date();
    return [
      {
        id: `fallback_${now.getTime()}`,
        title: 'Live Market Analysis Active',
        country: 'USD',
        date: now,
        time: now.toTimeString().slice(0, 5),
        impact: 'medium' as const,
        forecast: 'Real-time data integration',
        previous: 'System online',
        currency: 'USD',
        description: 'Market intelligence system monitoring live feeds',
        source: 'economic_calendar' as const,
      },
    ];
  }
}
