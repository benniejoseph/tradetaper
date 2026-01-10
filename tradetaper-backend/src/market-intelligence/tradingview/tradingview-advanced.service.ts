import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const TradingView = require('@mathieuc/tradingview');

@Injectable()
export class TradingViewAdvancedService implements OnModuleInit {
  private readonly logger = new Logger(TradingViewAdvancedService.name);
  private client: any;
  private isAuthenticated = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initialize();
  }

  private async initialize() {
    try {
      const username = this.configService.get<string>('TRADINGVIEW_USERNAME');
      const password = this.configService.get<string>('TRADINGVIEW_PASSWORD');

      if (!username || !password) {
        this.logger.warn('TradingView credentials not found. Advanced features will be unavailable.');
        return;
      }

      this.logger.log('Initializing TradingView Advanced API...');
      
      // Create client instance
      this.client = new TradingView.Client({
        token: '', // Will be set after login
        ping: true,
      });

      // Login with credentials
      await this.loginWithCredentials(username, password);
      
    } catch (error) {
      this.logger.error('Failed to initialize TradingView Advanced API:', error.message);
    }
  }

  private async loginWithCredentials(username: string, password: string) {
    try {
      this.logger.log('Attempting to authenticate with TradingView...');
      
      // Perform login - Library method is loginUser, not login
      // Check if loginUser exists, otherwise try other common methods or log error without crashing
      let token = '';
      
      if (typeof TradingView.loginUser === 'function') {
         token = await TradingView.loginUser(username, password, false); // false = rememberMe
      } else if (typeof TradingView.login === 'function') {
         token = await TradingView.login(username, password);
      } else {
         this.logger.warn('TradingView login method not found on library export. Skipping authentication.');
         return;
      }
      
      if (token) {
        this.client.token = token;
        this.isAuthenticated = true;
        this.logger.log('✅ Successfully authenticated with TradingView!');
      } else {
        this.logger.error('❌ Failed to authenticate with TradingView - no token received');
      }
    } catch (error) {
      this.logger.error(`❌ TradingView authentication error: ${error.message}`);
      // Do not set isAuthenticated = false here, let it remain false from initialization
    }
  }

  /**
   * Get real-time chart data with indicators
   */
  async getChartWithIndicators(
    symbol: string,
    interval: string = '240', // 4H default
    indicators: string[] = [],
  ): Promise<any> {
    if (!this.isAuthenticated) {
      throw new Error('TradingView API is not authenticated');
    }

    try {
      const chart = new this.client.Session.Chart();
      
      // Set market symbol
      chart.setMarket(symbol, {
        timeframe: interval,
      });

      // Add indicators if requested
      const studyPromises = indicators.map(indicator => 
        chart.addIndicator(indicator)
      );
      
      await Promise.all(studyPromises);

      // Get chart data
      return new Promise((resolve, reject) => {
        chart.onUpdate(() => {
          const data = {
            symbol: chart.infos.symbol,
            timeframe: chart.infos.timeframe,
            periods: chart.periods,
            indicators: chart.indicators,
          };
          resolve(data);
        });

        chart.onError((error) => {
          reject(error);
        });
      });
    } catch (error) {
      this.logger.error(`Failed to get chart data for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Get technical analysis from TradingView
   */
  async getTechnicalAnalysis(symbol: string, interval: string = '4h'): Promise<any> {
    if (!this.isAuthenticated) {
      throw new Error('TradingView API is not authenticated');
    }

    try {
      const analysis = await TradingView.getIndicator(this.client, symbol, interval, 'TechnicalAnalysis');
      
      return {
        symbol,
        interval,
        recommendation: analysis?.recommendation || 'NEUTRAL',
        oscillators: analysis?.oscillators || {},
        movingAverages: analysis?.movingAverages || {},
        summary: analysis?.summary || {},
      };
    } catch (error) {
      this.logger.error(`Failed to get technical analysis for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Get custom indicator values
   */
  async getIndicatorValues(
    symbol: string,
    indicatorName: string,
    interval: string = '240',
    settings?: any,
  ): Promise<any> {
    if (!this.isAuthenticated) {
      throw new Error('TradingView API is not authenticated');
    }

    try {
      const chart = new this.client.Session.Chart();
      
      chart.setMarket(symbol, {
        timeframe: interval,
      });

      const indicator = await chart.addIndicator(indicatorName, settings);

      return new Promise((resolve, reject) => {
        indicator.onUpdate(() => {
          resolve({
            name: indicatorName,
            values: indicator.periods,
            settings: indicator.settings,
          });
        });

        indicator.onError((error) => {
          reject(error);
        });
      });
    } catch (error) {
      this.logger.error(`Failed to get indicator ${indicatorName} for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Get drawings from a chart (requires chart ID from your TradingView account)
   */
  async getChartDrawings(chartId: string): Promise<any> {
    if (!this.isAuthenticated) {
      throw new Error('TradingView API is not authenticated');
    }

    try {
      const drawings = await TradingView.getDrawings(this.client, chartId);
      
      return {
        chartId,
        drawings: drawings || [],
      };
    } catch (error) {
      this.logger.error(`Failed to get drawings for chart ${chartId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get real-time price updates
   */
  async subscribeToRealTimeUpdates(
    symbol: string,
    interval: string = '240',
    callback: (data: any) => void,
  ): Promise<any> {
    if (!this.isAuthenticated) {
      throw new Error('TradingView API is not authenticated');
    }

    try {
      const chart = new this.client.Session.Chart();
      
      chart.setMarket(symbol, {
        timeframe: interval,
      });

      chart.onUpdate(() => {
        const latestCandle = chart.periods[chart.periods.length - 1];
        callback({
          symbol,
          time: latestCandle?.time,
          open: latestCandle?.open,
          high: latestCandle?.high,
          low: latestCandle?.low,
          close: latestCandle?.close,
          volume: latestCandle?.volume,
        });
      });

      return chart; // Return chart instance so it can be managed
    } catch (error) {
      this.logger.error(`Failed to subscribe to updates for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Get screener results (top gainers, losers, etc.)
   */
  async getScreenerResults(filter: string = 'top_gainers', market: string = 'forex'): Promise<any> {
    if (!this.isAuthenticated) {
      throw new Error('TradingView API is not authenticated');
    }

    try {
      const results = await TradingView.getScreener(this.client, filter, market);
      
      return {
        filter,
        market,
        results: results || [],
      };
    } catch (error) {
      this.logger.error(`Failed to get screener results:`, error.message);
      throw error;
    }
  }

  /**
   * Get historical OHLC data for backtesting
   * @param symbol - Symbol to fetch (e.g., 'OANDA:XAUUSD', 'NASDAQ:AAPL')
   * @param interval - Timeframe ('1', '5', '15', '60', '240', 'D', 'W')
   * @param bars - Number of bars to fetch (max ~5000 with premium)
   */
  async getHistoricalData(
    symbol: string,
    interval: string = '240',
    bars: number = 500,
  ): Promise<{
    symbol: string;
    interval: string;
    data: Array<{
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
  }> {
    if (!this.isAuthenticated) {
      throw new Error('TradingView API is not authenticated');
    }

    try {
      this.logger.log(`Fetching ${bars} bars of ${interval} data for ${symbol}...`);
      
      const chart = new this.client.Session.Chart();
      
      chart.setMarket(symbol, {
        timeframe: interval,
        range: bars,
      });

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Historical data fetch timeout'));
        }, 30000);

        chart.onUpdate(() => {
          clearTimeout(timeout);
          
          const periods = chart.periods || [];
          const data = periods.map((candle: any) => ({
            time: candle.time * 1000, // Convert to milliseconds
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume || 0,
          }));

          this.logger.log(`✅ Fetched ${data.length} bars for ${symbol}`);
          
          resolve({
            symbol,
            interval,
            data,
          });
        });

        chart.onError((error: any) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    } catch (error) {
      this.logger.error(`Failed to get historical data for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Get service status
   */
  getStatus(): { authenticated: boolean; client: boolean } {
    return {
      authenticated: this.isAuthenticated,
      client: !!this.client,
    };
  }
}

