import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  date: Date;
  time: string;
  importance: 'low' | 'medium' | 'high';
  actual?: number | string;
  forecast?: number | string;
  previous?: number | string;
  description: string;
  impact: {
    expected: 'bullish' | 'bearish' | 'neutral';
    explanation: string;
    affectedSymbols: string[];
    volatilityRating: number; // 1-10
  };
}

export interface EconomicImpactAnalysis {
  eventId: string;
  preEventAnalysis: {
    marketExpectations: string;
    keyLevelsToWatch: number[];
    riskScenarios: string[];
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

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getEconomicCalendar(
    from?: string,
    to?: string,
    importance?: string,
  ): Promise<{ events: EconomicEvent[]; weeklyAnalysis: any }> {
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
      // This would analyze the specific event and its market impact
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
    // In production, this would call real APIs
    // For now, generating comprehensive mock data based on real economic events

    const currentDate = new Date();
    const events: EconomicEvent[] = [];

    // Generate events for the next 7 days
    for (let i = 0; i < 7; i++) {
      const eventDate = new Date(currentDate);
      eventDate.setDate(currentDate.getDate() + i);

      const dayEvents = this.generateEventsForDay(eventDate);
      events.push(...dayEvents);
    }

    // Filter by importance if specified
    if (importance) {
      return events.filter((e) => e.importance === importance);
    }

    return events;
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
    // This would fetch specific event details and generate analysis
    // For now, providing sophisticated mock analysis

    return {
      eventId,
      preEventAnalysis: {
        marketExpectations:
          'Market is pricing in a 25bp rate hike with 78% probability based on Fed funds futures. Focus will be on forward guidance and dot plot projections.',
        keyLevelsToWatch: [1.085, 1.08, 1.09, 1.095], // EURUSD levels
        riskScenarios: [
          'Hawkish surprise: Rate hike + aggressive forward guidance could send USD higher',
          'Dovish pivot: Any hints of pause or cuts could weaken USD significantly',
          'Neutral stance: Market may focus on economic data dependency',
        ],
      },
      tradingRecommendations: {
        preEvent: [
          'Reduce position sizes 2 hours before announcement',
          'Set protective stops beyond key technical levels',
          'Avoid opening new positions 1 hour before release',
        ],
        duringEvent: [
          'Wait for initial volatility to subside (15-30 minutes)',
          'Look for institutional order flow clues',
          'Monitor price reaction at key levels',
        ],
        postEvent: [
          'Assess if reaction aligns with fundamentals',
          'Look for continuation or reversal patterns',
          'Re-evaluate position sizes based on new information',
        ],
      },
    };
  }
}
