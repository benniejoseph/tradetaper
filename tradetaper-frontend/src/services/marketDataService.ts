// services/marketDataService.ts
// Note: This service uses fetch directly; no local api client import required

export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
  lastUpdate: string;
  marketCap?: number;
  bid?: number;
  ask?: number;
  spread?: number;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  summary: string;
  impact: 'High' | 'Medium' | 'Low';
  country: string;
  currency: string;
  publishTime: string;
  sentimentScore: number;
  source: string;
  category: string;
  imageUrl?: string;
  relevantSymbols: string[];
}

export interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  importance: 'High' | 'Medium' | 'Low';
  actual?: number;
  forecast?: number;
  previous?: number;
  unit: string;
  eventTime: string;
  description: string;
  impact: 'Bullish' | 'Bearish' | 'Neutral';
}

export interface TechnicalIndicator {
  symbol: string;
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  sma20: number;
  sma50: number;
  sma200: number;
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
  stochastic: {
    k: number;
    d: number;
  };
  atr: number;
  adx: number;
}

class MarketDataService {
  private readonly ALPHA_VANTAGE_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || 'demo';
  private readonly TWELVE_DATA_KEY = process.env.NEXT_PUBLIC_TWELVE_DATA_KEY || 'demo';
  private readonly FOREX_FACTORY_URL = 'https://api.forexfactory.com';
  private readonly NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY || 'demo';
  
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private wsConnections = new Map<string, WebSocket>();

  // Cache helper
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData(key: string, data: any, ttl: number = 30000): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  // Real-time market quotes with fallback providers
  async getMarketQuotes(symbols: string[]): Promise<MarketQuote[]> {
    const cacheKey = `quotes_${symbols.join(',')}`;
    const cached = this.getCachedData<MarketQuote[]>(cacheKey);
    if (cached) return cached;

    try {
      // Primary: Try Twelve Data API (more reliable for real-time)
      const quotes = await this.getTwelveDataQuotes(symbols);
      this.setCachedData(cacheKey, quotes, 15000); // 15 second cache
      return quotes;
    } catch (error) {
      console.warn('Twelve Data failed, falling back to Alpha Vantage:', error);
      
      try {
        // Fallback: Alpha Vantage
        const quotes = await this.getAlphaVantageQuotes(symbols);
        this.setCachedData(cacheKey, quotes, 30000);
        return quotes;
      } catch (fallbackError) {
        console.error('All quote providers failed:', fallbackError);
        
        // Return mock data for demo purposes
        return this.getMockQuotes(symbols);
      }
    }
  }

  private async getTwelveDataQuotes(symbols: string[]): Promise<MarketQuote[]> {
    const promises = symbols.map(async (symbol) => {
      const response = await fetch(
        `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${this.TWELVE_DATA_KEY}`
      );
      
      if (!response.ok) throw new Error(`Twelve Data API error: ${response.status}`);
      
      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message || 'Twelve Data API error');
      }

      return {
        symbol: data.symbol || symbol,
        price: parseFloat(data.close) || 0,
        change: parseFloat(data.change) || 0,
        changePercent: parseFloat(data.percent_change) || 0,
        volume: parseInt(data.volume) || 0,
        high24h: parseFloat(data.high) || 0,
        low24h: parseFloat(data.low) || 0,
        lastUpdate: new Date().toISOString(),
        bid: parseFloat(data.bid) || undefined,
        ask: parseFloat(data.ask) || undefined,
        spread: data.bid && data.ask ? parseFloat(data.ask) - parseFloat(data.bid) : undefined
      };
    });

    return Promise.all(promises);
  }

  private async getAlphaVantageQuotes(symbols: string[]): Promise<MarketQuote[]> {
    // Alpha Vantage has request limits, so we batch requests
    const quotes: MarketQuote[] = [];
    
    for (const symbol of symbols) {
      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.ALPHA_VANTAGE_KEY}`
        );
        
        const data = await response.json();
        const quote = data['Global Quote'];
        
        if (quote) {
          quotes.push({
            symbol: quote['01. symbol'],
            price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change']),
            changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
            volume: parseInt(quote['06. volume']),
            high24h: parseFloat(quote['03. high']),
            low24h: parseFloat(quote['04. low']),
            lastUpdate: quote['07. latest trading day']
          });
        }
        
        // Rate limiting - Alpha Vantage allows 5 requests per minute
        await new Promise(resolve => setTimeout(resolve, 12000));
      } catch (error) {
        console.error(`Error fetching ${symbol} from Alpha Vantage:`, error);
      }
    }
    
    return quotes;
  }

  private getMockQuotes(symbols: string[]): MarketQuote[] {
    // Generate realistic mock data for demonstration
    const basePrice: Record<string, number> = {
      'XAUUSD': 2034.85,
      'SPX500': 4785.32,
      'NAS100': 16842.15,
      'EURUSD': 1.0875,
      'GBPUSD': 1.2743,
      'USDJPY': 149.85,
      'BTCUSD': 42750.00,
      'ETHUSD': 2645.30
    };

    return symbols.map(symbol => {
      const base = basePrice[symbol] || 100;
      const change = (Math.random() - 0.5) * base * 0.02; // ±2% variation
      const price = base + change;
      const volume = Math.floor(Math.random() * 1000000) + 100000;

      return {
        symbol,
        price,
        change,
        changePercent: (change / base) * 100,
        volume,
        high24h: price * (1 + Math.random() * 0.015),
        low24h: price * (1 - Math.random() * 0.015),
        lastUpdate: new Date().toISOString()
      };
    });
  }

  // Technical indicators
  async getTechnicalIndicators(symbol: string, interval: string = '1day'): Promise<TechnicalIndicator> {
    const cacheKey = `tech_${symbol}_${interval}`;
    const cached = this.getCachedData<TechnicalIndicator>(cacheKey);
    if (cached) return cached;

    try {
      // Use Twelve Data for technical indicators
      const [rsi, macd, sma20, sma50, sma200, bbands, stoch, atr, adx] = await Promise.all([
        this.getTechnicalData(symbol, 'RSI', interval),
        this.getTechnicalData(symbol, 'MACD', interval),
        this.getTechnicalData(symbol, 'SMA', interval, { time_period: 20 }),
        this.getTechnicalData(symbol, 'SMA', interval, { time_period: 50 }),
        this.getTechnicalData(symbol, 'SMA', interval, { time_period: 200 }),
        this.getTechnicalData(symbol, 'BBANDS', interval),
        this.getTechnicalData(symbol, 'STOCH', interval),
        this.getTechnicalData(symbol, 'ATR', interval),
        this.getTechnicalData(symbol, 'ADX', interval)
      ]);

      const indicators: TechnicalIndicator = {
        symbol,
        rsi: this.getLatestValue(rsi, 'rsi'),
        macd: {
          macd: this.getLatestValue(macd, 'macd'),
          signal: this.getLatestValue(macd, 'macd_signal'),
          histogram: this.getLatestValue(macd, 'macd_hist')
        },
        sma20: this.getLatestValue(sma20, 'sma'),
        sma50: this.getLatestValue(sma50, 'sma'),
        sma200: this.getLatestValue(sma200, 'sma'),
        bollinger: {
          upper: this.getLatestValue(bbands, 'upper_band'),
          middle: this.getLatestValue(bbands, 'middle_band'),
          lower: this.getLatestValue(bbands, 'lower_band')
        },
        stochastic: {
          k: this.getLatestValue(stoch, 'slow_k'),
          d: this.getLatestValue(stoch, 'slow_d')
        },
        atr: this.getLatestValue(atr, 'atr'),
        adx: this.getLatestValue(adx, 'adx')
      };

      this.setCachedData(cacheKey, indicators, 300000); // 5 minutes cache
      return indicators;
    } catch (error) {
      console.error('Failed to fetch technical indicators:', error);
      // Return mock technical data
      return this.getMockTechnicalIndicators(symbol);
    }
  }

  private async getTechnicalData(symbol: string, indicator: string, interval: string, params: any = {}): Promise<any> {
    const paramString = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    const url = `https://api.twelvedata.com/${indicator.toLowerCase()}?symbol=${symbol}&interval=${interval}&apikey=${this.TWELVE_DATA_KEY}&${paramString}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Technical data API error: ${response.status}`);
    
    return response.json();
  }

  private getLatestValue(data: any, field: string): number {
    if (!data?.values || !Array.isArray(data.values) || data.values.length === 0) {
      return 0;
    }
    return parseFloat(data.values[0][field]) || 0;
  }

  private getMockTechnicalIndicators(symbol: string): TechnicalIndicator {
    return {
      symbol,
      rsi: 45 + Math.random() * 20, // 45-65 range
      macd: {
        macd: (Math.random() - 0.5) * 2,
        signal: (Math.random() - 0.5) * 2,
        histogram: (Math.random() - 0.5) * 0.5
      },
      sma20: 100 + Math.random() * 50,
      sma50: 100 + Math.random() * 50,
      sma200: 100 + Math.random() * 50,
      bollinger: {
        upper: 105 + Math.random() * 10,
        middle: 100 + Math.random() * 5,
        lower: 95 + Math.random() * 10
      },
      stochastic: {
        k: Math.random() * 100,
        d: Math.random() * 100
      },
      atr: Math.random() * 5,
      adx: 20 + Math.random() * 60
    };
  }

  // Market News with sentiment analysis
  async getMarketNews(limit: number = 20, category?: string): Promise<NewsItem[]> {
    const cacheKey = `news_${category || 'all'}_${limit}`;
    const cached = this.getCachedData<NewsItem[]>(cacheKey);
    if (cached) return cached;

    try {
      // In production, integrate with multiple news sources
      const news = await this.getFinancialNews(limit, category);
      this.setCachedData(cacheKey, news, 300000); // 5 minutes cache
      return news;
    } catch (error) {
      console.error('Failed to fetch market news:', error);
      return this.getMockNews(limit);
    }
  }

  private async getFinancialNews(limit: number, category?: string): Promise<NewsItem[]> {
    // This would integrate with services like:
    // - NewsAPI
    // - Alpha Vantage News
    // - Forex Factory News
    // - Financial Modeling Prep News
    
    // For now, return mock news with realistic content
    return this.getMockNews(limit);
  }

  private getMockNews(limit: number): NewsItem[] {
    const newsTemplates = [
      {
        title: 'Federal Reserve Signals Potential Policy Shift Amid Economic Uncertainty',
        content: 'Federal Reserve officials have indicated a more cautious approach to monetary policy adjustments, citing ongoing economic volatility and international trade concerns...',
        impact: 'High' as const,
        country: 'United States',
        currency: 'USD',
        category: 'Monetary Policy',
        relevantSymbols: ['EURUSD', 'GBPUSD', 'USDJPY', 'SPX500']
      },
      {
        title: 'Gold Reaches New Yearly High on Safe-Haven Demand',
        content: 'Precious metals surged to new yearly highs as investors seek safety amid geopolitical tensions and inflation concerns driving demand for alternative assets...',
        impact: 'Medium' as const,
        country: 'Global',
        currency: 'XAU',
        category: 'Commodities',
        relevantSymbols: ['XAUUSD', 'XAGUSD']
      },
      {
        title: 'Tech Sector Rally Drives Nasdaq to Record Levels',
        content: 'Major technology companies reported stronger-than-expected earnings, leading to significant gains in the Nasdaq composite index and renewed investor optimism...',
        impact: 'High' as const,
        country: 'United States',
        currency: 'USD',
        category: 'Equities',
        relevantSymbols: ['NAS100', 'SPX500']
      },
      {
        title: 'ECB Minutes Reveal Growing Concerns About Economic Growth',
        content: 'European Central Bank meeting minutes show increasing worries about the eurozone economic outlook, with officials discussing potential policy responses...',
        impact: 'High' as const,
        country: 'European Union',
        currency: 'EUR',
        category: 'Monetary Policy',
        relevantSymbols: ['EURUSD', 'EURGBP']
      },
      {
        title: 'UK Economic Data Shows Mixed Signals Ahead of BoE Decision',
        content: 'Latest UK economic indicators present a mixed picture, with employment data beating expectations while inflation concerns persist ahead of the Bank of England meeting...',
        impact: 'Medium' as const,
        country: 'United Kingdom',
        currency: 'GBP',
        category: 'Economic Data',
        relevantSymbols: ['GBPUSD', 'EURGBP']
      }
    ];

    return Array.from({ length: Math.min(limit, newsTemplates.length) }, (_, index) => {
      const template = newsTemplates[index % newsTemplates.length];
      const sentimentScore = (Math.random() - 0.5) * 1.5; // -0.75 to +0.75
      
      return {
        id: `news_${Date.now()}_${index}`,
        title: template.title,
        content: template.content,
        summary: template.content.substring(0, 150) + '...',
        impact: template.impact,
        country: template.country,
        currency: template.currency,
        publishTime: new Date(Date.now() - Math.random() * 3600000 * 24).toISOString(), // Random time in last 24h
        sentimentScore,
        source: 'Market Analysis',
        category: template.category,
        relevantSymbols: template.relevantSymbols
      };
    });
  }

  // Economic Calendar
  async getEconomicCalendar(days: number = 7): Promise<EconomicEvent[]> {
    const cacheKey = `calendar_${days}`;
    const cached = this.getCachedData<EconomicEvent[]>(cacheKey);
    if (cached) return cached;

    try {
      // In production, integrate with Forex Factory or Economic Calendar APIs
      const events = await this.getEconomicEvents(days);
      this.setCachedData(cacheKey, events, 600000); // 10 minutes cache
      return events;
    } catch (error) {
      console.error('Failed to fetch economic calendar:', error);
      return this.getMockEconomicEvents(days);
    }
  }

  private async getEconomicEvents(days: number): Promise<EconomicEvent[]> {
    // This would integrate with economic calendar APIs
    return this.getMockEconomicEvents(days);
  }

  private getMockEconomicEvents(days: number): EconomicEvent[] {
    const eventTemplates = [
      {
        title: 'Non-Farm Payrolls',
        country: 'United States',
        currency: 'USD',
        importance: 'High' as const,
        unit: 'K',
        description: 'Monthly change in employment excluding farm workers',
        impact: 'Bullish' as const
      },
      {
        title: 'Consumer Price Index',
        country: 'United States',
        currency: 'USD',
        importance: 'High' as const,
        unit: '%',
        description: 'Monthly inflation rate',
        impact: 'Bearish' as const
      },
      {
        title: 'ECB Interest Rate Decision',
        country: 'European Union',
        currency: 'EUR',
        importance: 'High' as const,
        unit: '%',
        description: 'Central bank monetary policy decision',
        impact: 'Neutral' as const
      },
      {
        title: 'GDP Growth Rate',
        country: 'United Kingdom',
        currency: 'GBP',
        importance: 'Medium' as const,
        unit: '%',
        description: 'Quarterly economic growth rate',
        impact: 'Bullish' as const
      }
    ];

    return Array.from({ length: days * 2 }, (_, index) => {
      const template = eventTemplates[index % eventTemplates.length];
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + Math.floor(index / 2));
      
      return {
        id: `event_${Date.now()}_${index}`,
        title: template.title,
        country: template.country,
        currency: template.currency,
        importance: template.importance,
        actual: Math.random() > 0.5 ? Math.random() * 10 : undefined,
        forecast: Math.random() * 10,
        previous: Math.random() * 10,
        unit: template.unit,
        eventTime: eventDate.toISOString(),
        description: template.description,
        impact: template.impact
      };
    });
  }

  // WebSocket connections for real-time data
  subscribeToSymbol(symbol: string, callback: (quote: MarketQuote) => void): () => void {
    const wsKey = `ws_${symbol}`;
    
    // Close existing connection if any
    if (this.wsConnections.has(wsKey)) {
      this.wsConnections.get(wsKey)?.close();
    }

    try {
      // In production, use actual WebSocket endpoints
      // const ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${this.TWELVE_DATA_KEY}`);
      
      // For demo, simulate real-time updates
      const interval = setInterval(() => {
        const mockQuote = this.getMockQuotes([symbol])[0];
        callback(mockQuote);
      }, 2000);

      // Return cleanup function
      return () => {
        clearInterval(interval);
        this.wsConnections.delete(wsKey);
      };
    } catch (error) {
      console.error(`Failed to subscribe to ${symbol}:`, error);
      return () => {};
    }
  }

  // Sentiment Analysis for News
  analyzeSentiment(text: string): number {
    // Simple keyword-based sentiment analysis
    // In production, use a proper NLP service like AWS Comprehend or Google Cloud Natural Language
    
    const positiveWords = ['bullish', 'gains', 'surge', 'rally', 'growth', 'positive', 'optimistic', 'strength'];
    const negativeWords = ['bearish', 'decline', 'fall', 'crash', 'recession', 'negative', 'concern', 'weakness'];
    
    const words = text.toLowerCase().split(/\W+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });
    
    // Normalize to -1 to 1 range
    return Math.max(-1, Math.min(1, score / words.length * 10));
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const marketDataService = new MarketDataService(); 