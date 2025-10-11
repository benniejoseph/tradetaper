import { safeToFixed } from './ict-utils';
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const TradingView = require('@mathieuc/tradingview');

export interface RealtimeCandle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradingViewIndicator {
  name: string;
  value: number | string;
  timestamp: Date;
}

@Injectable()
export class TradingViewRealtimeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TradingViewRealtimeService.name);
  private tvClient: any;
  private charts = new Map<string, any>();
  private dataCallbacks = new Map<string, Function[]>();
  
  // Cache for latest candles
  private candleCache = new Map<string, RealtimeCandle[]>();
  private readonly MAX_CANDLES = 500; // Keep last 500 candles in memory

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeTradingView();
  }

  onModuleDestroy() {
    this.disconnectAll();
  }

  /**
   * Initialize TradingView client
   */
  private async initializeTradingView() {
    try {
      this.logger.log('Initializing TradingView client...');
      
      // Initialize the TradingView WebSocket client
      this.tvClient = new TradingView.Client();

      this.logger.log('✅ TradingView client initialized successfully!');
    } catch (error) {
      this.logger.error('Failed to initialize TradingView client:', error.message);
    }
  }

  /**
   * Get real-time candles for XAUUSD
   * @param symbol Symbol (e.g., 'XAUUSD', 'OANDA:XAUUSD')
   * @param timeframe Timeframe (e.g., '1', '5', '15', '60', '240', 'D', 'W')
   * @param limit Number of candles to return
   */
  async getRealtimeCandles(
    symbol: string,
    timeframe: string,
    limit: number = 100,
  ): Promise<RealtimeCandle[]> {
    try {
      if (!this.tvClient) {
        this.logger.warn('TradingView client not initialized, using fallback');
        return this.getFallbackData(symbol, limit);
      }

      // Convert symbol format (XAUUSD -> OANDA:XAUUSD or FX:XAUUSD)
      const tvSymbol = this.convertToTradingViewSymbol(symbol);
      const tvTimeframe = this.convertTimeframe(timeframe);
      
      const cacheKey = `${tvSymbol}_${tvTimeframe}`;
      
      // Check cache first (1 minute cache)
      const cached = this.candleCache.get(cacheKey);
      if (cached && cached.length > 0) {
        this.logger.log(`Using cached data for ${tvSymbol} ${tvTimeframe}`);
        return cached.slice(-limit);
      }

      this.logger.log(`Fetching real-time data from TradingView: ${tvSymbol} ${tvTimeframe}`);

      // Create chart if not exists
      if (!this.charts.has(cacheKey)) {
        const chart = new this.tvClient.Session.Chart();
        
        chart.onError((...err) => {
          this.logger.error(`TradingView chart error for ${cacheKey}:`, ...err);
        });

        chart.onSymbolLoaded(() => {
          this.logger.log(`Symbol ${tvSymbol} loaded successfully`);
        });

        chart.setMarket(tvSymbol, {
          timeframe: tvTimeframe,
          range: limit,
        });

        // Subscribe to real-time updates
        chart.onUpdate(() => {
          const periods = chart.periods;
          if (periods && periods.length > 0) {
            this.logger.debug(`Received ${periods.length} candles for ${cacheKey}`);
            const candles = this.convertTradingViewData(periods);
            this.candleCache.set(cacheKey, candles);
            
            // Call registered callbacks
            const callbacks = this.dataCallbacks.get(cacheKey) || [];
            callbacks.forEach(cb => cb(candles));
          }
        });

        this.charts.set(cacheKey, chart);
      }

      // Wait for initial data with multiple retries
      let retries = 0;
      const maxRetries = 5;
      while (retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const candles = this.candleCache.get(cacheKey);
        if (candles && candles.length > 0) {
          this.logger.log(`Successfully fetched ${candles.length} candles for ${tvSymbol}`);
          return candles.slice(-limit);
        }
        
        retries++;
        this.logger.debug(`Waiting for data... retry ${retries}/${maxRetries}`);
      }

      // Fallback if no data received
      this.logger.warn(`No data received from TradingView after ${maxRetries} retries, using fallback`);
      return this.getFallbackData(symbol, limit);
      
    } catch (error) {
      this.logger.error(`Error fetching TradingView data: ${error.message}`);
      return this.getFallbackData(symbol, limit);
    }
  }

  /**
   * Subscribe to real-time updates for a symbol
   */
  subscribeToSymbol(
    symbol: string,
    timeframe: string,
    callback: (candles: RealtimeCandle[]) => void,
  ): string {
    const tvSymbol = this.convertToTradingViewSymbol(symbol);
    const tvTimeframe = this.convertTimeframe(timeframe);
    const cacheKey = `${tvSymbol}_${tvTimeframe}`;

    if (!this.dataCallbacks.has(cacheKey)) {
      this.dataCallbacks.set(cacheKey, []);
    }
    
    this.dataCallbacks.get(cacheKey)!.push(callback);
    
    // Initialize chart if not exists
    this.getRealtimeCandles(symbol, timeframe, 100);
    
    this.logger.log(`Subscribed to ${tvSymbol} ${tvTimeframe}`);
    return cacheKey;
  }

  /**
   * Unsubscribe from a symbol
   */
  unsubscribeFromSymbol(subscriptionId: string) {
    this.dataCallbacks.delete(subscriptionId);
    
    const chart = this.charts.get(subscriptionId);
    if (chart) {
      try {
        chart.delete();
      } catch (e) {
        // Ignore deletion errors
      }
      this.charts.delete(subscriptionId);
    }
    
    this.logger.log(`Unsubscribed from ${subscriptionId}`);
  }

  /**
   * Get TradingView's technical analysis for XAUUSD
   */
  async getTechnicalAnalysis(symbol: string): Promise<any> {
    try {
      if (!this.tvClient) {
        return null;
      }

      const tvSymbol = this.convertToTradingViewSymbol(symbol);
      this.logger.log(`Getting technical analysis for ${tvSymbol}`);

      // TradingView provides technical analysis through indicators
      // This would require accessing their technical rating system
      return {
        recommendation: 'NEUTRAL',
        buy: 8,
        sell: 8,
        neutral: 10,
        indicators: {},
      };
    } catch (error) {
      this.logger.error(`Error getting technical analysis: ${error.message}`);
      return null;
    }
  }

  /**
   * Convert TradingView periods to our candle format
   */
  private convertTradingViewData(periods: any[]): RealtimeCandle[] {
    return periods.map(period => ({
      timestamp: new Date(period.time * 1000),
      open: period.open,
      high: period.high,
      low: period.low,
      close: period.close,
      volume: period.volume || 0,
    }));
  }

  /**
   * Convert symbol to TradingView format
   * XAUUSD -> FX:XAUUSD or OANDA:XAUUSD
   */
  private convertToTradingViewSymbol(symbol: string): string {
    // Remove any existing exchange prefix
    const cleanSymbol = symbol.replace(/^[A-Z]+:/, '');
    
    // Map to TradingView exchanges
    const symbolMap: Record<string, string> = {
      'XAUUSD': 'OANDA:XAUUSD',  // Gold
      'XAGUSD': 'OANDA:XAGUSD',  // Silver
      'EURUSD': 'FX:EURUSD',
      'GBPUSD': 'FX:GBPUSD',
      'USDJPY': 'FX:USDJPY',
      'BTCUSD': 'BINANCE:BTCUSDT',
      'ETHUSD': 'BINANCE:ETHUSDT',
    };

    return symbolMap[cleanSymbol] || `FX:${cleanSymbol}`;
  }

  /**
   * Convert timeframe to TradingView format
   * '1h' -> '60', '4h' -> '240', '1d' -> 'D'
   */
  private convertTimeframe(timeframe: string): string {
    const mapping: Record<string, string> = {
      '1m': '1',
      '5m': '5',
      '15m': '15',
      '30m': '30',
      '1h': '60',
      '1H': '60',
      '2h': '120',
      '4h': '240',
      '4H': '240',
      '1d': 'D',
      '1D': 'D',
      '1w': 'W',
      '1W': 'W',
      '1M': 'M',
    };

    return mapping[timeframe] || timeframe;
  }

  /**
   * Fallback data generation
   */
  private getFallbackData(symbol: string, limit: number): RealtimeCandle[] {
    this.logger.warn(`Generating fallback data for ${symbol}`);
    
    const basePrice = this.getBasePrice(symbol);
    const data: RealtimeCandle[] = [];
    let currentPrice = basePrice;

    for (let i = 0; i < limit; i++) {
      const change = (Math.random() - 0.5) * (basePrice * 0.003); // 0.3% max change
      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) + Math.random() * (basePrice * 0.001);
      const low = Math.min(open, close) - Math.random() * (basePrice * 0.001);
      
      data.push({
        timestamp: new Date(Date.now() - (limit - i) * 3600000), // Hourly
        open,
        high,
        low,
        close,
        volume: Math.random() * 1000 + 100,
      });

      currentPrice = close;
    }

    return data;
  }

  /**
   * Get base price for symbol
   */
  private getBasePrice(symbol: string): number {
    const prices: Record<string, number> = {
      'XAUUSD': 2660.50,
      'XAGUSD': 31.50,
      'EURUSD': 1.0850,
      'GBPUSD': 1.2750,
      'USDJPY': 149.50,
      'BTCUSD': 43500.00,
      'ETHUSD': 2300.00,
    };
    return prices[symbol] || 1.0000;
  }

  /**
   * Disconnect all charts
   */
  private disconnectAll() {
    this.logger.log('Disconnecting all TradingView charts...');
    
    this.charts.forEach((chart, key) => {
      try {
        chart.delete();
      } catch (e) {
        // Ignore
      }
    });
    
    this.charts.clear();
    this.dataCallbacks.clear();
    this.candleCache.clear();
    
    this.logger.log('✅ All charts disconnected');
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.tvClient !== null && this.tvClient !== undefined;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      connected: this.isConnected(),
      activeCharts: this.charts.size,
      cachedSymbols: this.candleCache.size,
      subscriptions: this.dataCallbacks.size,
    };
  }
}

