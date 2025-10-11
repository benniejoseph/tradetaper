// services/forexFactoryService.ts

export interface ForexFactoryEvent {
  id: string;
  date: string;
  time: string;
  currency: string;
  impact: 'Low' | 'Medium' | 'High';
  event: string;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  description: string;
  category: string;
}

class ForexFactoryService {
  private cache = new Map<string, { data: ForexFactoryEvent[]; timestamp: number }>();
  private readonly CACHE_TTL = 300000; // 5 minutes

  async getCalendarEvents(): Promise<ForexFactoryEvent[]> {
    const cacheKey = 'calendar_today';
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      // For now, return realistic mock data since CORS will block direct scraping
      // In production, you'd need a backend proxy or server-side scraping
      const events = this.getMockCalendarEvents();
      
      // Cache the result
      this.cache.set(cacheKey, { data: events, timestamp: Date.now() });
      
      return events;
    } catch (error) {
      console.error('Failed to fetch Forex Factory calendar:', error);
      return this.getMockCalendarEvents();
    }
  }

  private getMockCalendarEvents(): ForexFactoryEvent[] {
    return [
      {
        id: 'ff_1',
        date: new Date().toISOString().split('T')[0],
        time: '08:30',
        currency: 'USD',
        impact: 'High',
        event: 'Non-Farm Payrolls',
        actual: null,
        forecast: '200K',
        previous: '180K',
        description: 'Monthly report on employment changes in the US economy, excluding farm workers.',
        category: 'Employment'
      },
      {
        id: 'ff_2',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        currency: 'EUR',
        impact: 'High',
        event: 'ECB Interest Rate Decision',
        actual: null,
        forecast: '3.75%',
        previous: '3.75%',
        description: 'European Central Bank monetary policy decision affecting EUR rates.',
        category: 'Monetary Policy'
      },
      {
        id: 'ff_3',
        date: new Date().toISOString().split('T')[0],
        time: '12:30',
        currency: 'GBP',
        impact: 'Medium',
        event: 'GDP (QoQ)',
        actual: '0.2%',
        forecast: '0.3%',
        previous: '0.1%',
        description: 'Quarterly Gross Domestic Product growth measurement.',
        category: 'GDP & Growth'
      },
      {
        id: 'ff_4',
        date: new Date().toISOString().split('T')[0],
        time: '14:00',
        currency: 'USD',
        impact: 'High',
        event: 'Consumer Price Index (YoY)',
        actual: null,
        forecast: '2.9%',
        previous: '3.1%',
        description: 'Annual inflation rate measured by consumer price changes.',
        category: 'Inflation'
      },
      {
        id: 'ff_5',
        date: new Date().toISOString().split('T')[0],
        time: '15:30',
        currency: 'USD',
        impact: 'Medium',
        event: 'Core PCE Price Index (MoM)',
        actual: '0.3%',
        forecast: '0.2%',
        previous: '0.4%',
        description: 'Monthly core Personal Consumption Expenditures price index.',
        category: 'Inflation'
      },
      {
        id: 'ff_6',
        date: new Date().toISOString().split('T')[0],
        time: '16:00',
        currency: 'USD',
        impact: 'High',
        event: 'ISM Manufacturing PMI',
        actual: '47.4',
        forecast: '47.0',
        previous: '47.0',
        description: 'Institute for Supply Management Manufacturing index.',
        category: 'Manufacturing'
      },
      {
        id: 'ff_7',
        date: new Date().toISOString().split('T')[0],
        time: '13:15',
        currency: 'JPY',
        impact: 'Low',
        event: 'Trade Balance',
        actual: null,
        forecast: '¥0.8T',
        previous: '¥0.6T',
        description: 'Difference between exports and imports for Japan.',
        category: 'Trade'
      },
      {
        id: 'ff_8',
        date: new Date().toISOString().split('T')[0],
        time: '09:45',
        currency: 'EUR',
        impact: 'Medium',
        event: 'German IFO Business Climate',
        actual: '85.7',
        forecast: '86.0',
        previous: '85.9',
        description: 'German business confidence indicator.',
        category: 'Business Sentiment'
      }
    ];
  }

  getHighImpactEvents(events: ForexFactoryEvent[]): ForexFactoryEvent[] {
    return events.filter(event => event.impact === 'High');
  }

  getEventsByCurrency(events: ForexFactoryEvent[], currency: string): ForexFactoryEvent[] {
    return events.filter(event => event.currency === currency);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const forexFactoryService = new ForexFactoryService(); 