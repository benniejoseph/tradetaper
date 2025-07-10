// src/market-data/multi-provider.service.ts
import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MarketDataService } from './market-data.service';

export interface MarketDataProvider {
  name: string;
  priority: number;
  supports: string[]; // Asset types: 'forex', 'stocks', 'crypto', 'commodities'
  rateLimit: number; // Requests per minute
  isActive: boolean;
}

export interface PriceQuote {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
  provider: string;
}

export interface HistoricalPrice {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketDataResponse {
  success: boolean;
  data?: PriceQuote | HistoricalPrice[];
  error?: string;
  provider: string;
  cached: boolean;
}

@Injectable()
export class MultiProviderMarketDataService {
  private readonly logger = new Logger(MultiProviderMarketDataService.name);
  private readonly providers: MarketDataProvider[] = [
    {
      name: 'tradermade',
      priority: 1,
      supports: ['forex', 'commodities'],
      rateLimit: 100,
      isActive: true,
    },
    {
      name: 'alphaVantage',
      priority: 2,
      supports: ['stocks', 'forex', 'crypto'],
      rateLimit: 5,
      isActive: true,
    },
    {
      name: 'iexCloud',
      priority: 3,
      supports: ['stocks'],
      rateLimit: 100,
      isActive: true,
    },
    {
      name: 'yahooFinance',
      priority: 4,
      supports: ['stocks', 'forex', 'crypto', 'commodities'],
      rateLimit: 2000,
      isActive: true,
    },
    {
      name: 'coinGecko',
      priority: 5,
      supports: ['crypto'],
      rateLimit: 50,
      isActive: true,
    },
  ];

  private requestCounts = new Map<
    string,
    { count: number; resetTime: number }
  >();

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly marketDataService: MarketDataService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getRealTimePrice(
    symbol: string,
    assetType: string,
  ): Promise<MarketDataResponse> {
    const cacheKey = `price:${symbol}:${assetType}`;

    // Check cache first
    const cached = await this.cacheManager.get<PriceQuote>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        provider: cached.provider,
        cached: true,
      };
    }

    // Find suitable providers
    const suitableProviders = this.providers
      .filter((p) => p.isActive && p.supports.includes(assetType))
      .sort((a, b) => a.priority - b.priority);

    for (const provider of suitableProviders) {
      if (!this.canMakeRequest(provider.name, provider.rateLimit)) {
        this.logger.warn(`Rate limit exceeded for provider ${provider.name}`);
        continue;
      }

      try {
        const result = await this.fetchPriceFromProvider(
          provider.name,
          symbol,
          assetType,
        );
        if (result.success && result.data) {
          // Cache for 30 seconds
          await this.cacheManager.set(cacheKey, result.data, 30000);
          this.incrementRequestCount(provider.name);
          return { ...result, cached: false };
        }
      } catch (error) {
        this.logger.error(
          `Error fetching from ${provider.name}: ${error.message}`,
        );
        continue;
      }
    }

    return {
      success: false,
      error: 'No providers available or all providers failed',
      provider: 'none',
      cached: false,
    };
  }

  async getHistoricalPrices(
    symbol: string,
    assetType: string,
    interval: string = '1day',
    fromDate?: Date,
    toDate?: Date,
  ): Promise<MarketDataResponse> {
    const cacheKey = `history:${symbol}:${assetType}:${interval}:${fromDate?.toISOString()}:${toDate?.toISOString()}`;

    // Check cache first (cache for 1 hour for historical data)
    const cached = await this.cacheManager.get<HistoricalPrice[]>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        provider: 'cache',
        cached: true,
      };
    }

    const suitableProviders = this.providers
      .filter((p) => p.isActive && p.supports.includes(assetType))
      .sort((a, b) => a.priority - b.priority);

    for (const provider of suitableProviders) {
      if (!this.canMakeRequest(provider.name, provider.rateLimit)) {
        continue;
      }

      try {
        const result = await this.fetchHistoricalFromProvider(
          provider.name,
          symbol,
          assetType,
          interval,
          fromDate,
          toDate,
        );

        if (result.success && result.data) {
          await this.cacheManager.set(cacheKey, result.data, 3600000); // 1 hour
          this.incrementRequestCount(provider.name);
          return { ...result, cached: false };
        }
      } catch (error) {
        this.logger.error(
          `Error fetching historical from ${provider.name}: ${error.message}`,
        );
        continue;
      }
    }

    return {
      success: false,
      error: 'No providers available for historical data',
      provider: 'none',
      cached: false,
    };
  }

  private async fetchPriceFromProvider(
    providerName: string,
    symbol: string,
    assetType: string,
  ): Promise<MarketDataResponse> {
    switch (providerName) {
      case 'tradermade':
        return this.fetchFromTraderMade(symbol, assetType);
      case 'alphaVantage':
        return this.fetchFromAlphaVantage(symbol, assetType);
      case 'iexCloud':
        return this.fetchFromIEXCloud(symbol, assetType);
      case 'yahooFinance':
        return this.fetchFromYahooFinance(symbol, assetType);
      case 'coinGecko':
        return this.fetchFromCoinGecko(symbol, assetType);
      default:
        return {
          success: false,
          error: `Unknown provider: ${providerName}`,
          provider: providerName,
          cached: false,
        };
    }
  }

  private async fetchHistoricalFromProvider(
    providerName: string,
    symbol: string,
    assetType: string,
    interval: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<MarketDataResponse> {
    switch (providerName) {
      case 'tradermade':
        return this.fetchHistoricalFromTraderMade(
          symbol,
          assetType,
          interval,
          fromDate,
          toDate,
        );
      case 'alphaVantage':
        return this.fetchHistoricalFromAlphaVantage(
          symbol,
          assetType,
          interval,
          fromDate,
          toDate,
        );
      case 'yahooFinance':
        return this.fetchHistoricalFromYahooFinance(
          symbol,
          assetType,
          interval,
          fromDate,
          toDate,
        );
      case 'iexCloud':
        return this.fetchHistoricalFromIEXCloud(
          symbol,
          assetType,
          interval,
          fromDate,
          toDate,
        );
      default:
        return {
          success: false,
          error: `Historical data not supported by provider: ${providerName}`,
          provider: providerName,
          cached: false,
        };
    }
  }

  private async fetchFromTraderMade(
    symbol: string,
    assetType: string,
  ): Promise<MarketDataResponse> {
    try {
      const apiKey = this.configService.get<string>('TRADERMADE_API_KEY');
      if (!apiKey) {
        throw new Error('TraderMade API key not configured');
      }

      const url = `https://marketdata.tradermade.com/api/v1/live?currency=${symbol}&api_key=${apiKey}`;
      const response = await firstValueFrom(this.httpService.get(url));

      if (
        response.data &&
        response.data.quotes &&
        response.data.quotes.length > 0
      ) {
        const quote = response.data.quotes[0];
        return {
          success: true,
          data: {
            symbol: quote.base_currency + quote.quote_currency,
            bid: parseFloat(quote.bid),
            ask: parseFloat(quote.ask),
            last: parseFloat(quote.mid),
            change: 0, // TraderMade doesn't provide change in live endpoint
            changePercent: 0,
            volume: 0,
            timestamp: new Date(),
            provider: 'tradermade',
          },
          provider: 'tradermade',
          cached: false,
        };
      }

      throw new Error('No data received from TraderMade');
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'tradermade',
        cached: false,
      };
    }
  }

  private async fetchFromAlphaVantage(
    symbol: string,
    assetType: string,
  ): Promise<MarketDataResponse> {
    try {
      const apiKey = this.configService.get<string>('ALPHA_VANTAGE_API_KEY');
      if (!apiKey) {
        throw new Error('Alpha Vantage API key not configured');
      }

      let url: string;
      if (assetType === 'forex') {
        url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol.substring(0, 3)}&to_currency=${symbol.substring(3, 6)}&apikey=${apiKey}`;
      } else if (assetType === 'stocks') {
        url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
      } else if (assetType === 'crypto') {
        url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol}&to_currency=USD&apikey=${apiKey}`;
      } else {
        throw new Error(
          `Asset type ${assetType} not supported by Alpha Vantage`,
        );
      }

      const response = await firstValueFrom(this.httpService.get(url));

      if (assetType === 'forex' || assetType === 'crypto') {
        const exchangeRate = response.data['Realtime Currency Exchange Rate'];
        if (exchangeRate) {
          const rate = parseFloat(exchangeRate['5. Exchange Rate']);
          return {
            success: true,
            data: {
              symbol,
              bid: rate * 0.9995, // Approximate bid
              ask: rate * 1.0005, // Approximate ask
              last: rate,
              change: 0,
              changePercent: 0,
              volume: 0,
              timestamp: new Date(exchangeRate['6. Last Refreshed']),
              provider: 'alphaVantage',
            },
            provider: 'alphaVantage',
            cached: false,
          };
        }
      } else if (assetType === 'stocks') {
        const quote = response.data['Global Quote'];
        if (quote) {
          return {
            success: true,
            data: {
              symbol,
              bid: parseFloat(quote['05. price']) * 0.999, // Approximate bid
              ask: parseFloat(quote['05. price']) * 1.001, // Approximate ask
              last: parseFloat(quote['05. price']),
              change: parseFloat(quote['09. change']),
              changePercent: parseFloat(
                quote['10. change percent'].replace('%', ''),
              ),
              volume: parseInt(quote['06. volume']),
              timestamp: new Date(quote['07. latest trading day']),
              provider: 'alphaVantage',
            },
            provider: 'alphaVantage',
            cached: false,
          };
        }
      }

      throw new Error('No data received from Alpha Vantage');
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'alphaVantage',
        cached: false,
      };
    }
  }

  private async fetchFromIEXCloud(
    symbol: string,
    assetType: string,
  ): Promise<MarketDataResponse> {
    try {
      const apiKey = this.configService.get<string>('IEX_CLOUD_API_KEY');
      if (!apiKey) {
        throw new Error('IEX Cloud API key not configured');
      }

      if (assetType !== 'stocks') {
        throw new Error(`Asset type ${assetType} not supported by IEX Cloud`);
      }

      const url = `https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=${apiKey}`;
      const response = await firstValueFrom(this.httpService.get(url));

      if (response.data) {
        const data = response.data;
        return {
          success: true,
          data: {
            symbol,
            bid: data.iexBidPrice || data.latestPrice * 0.999,
            ask: data.iexAskPrice || data.latestPrice * 1.001,
            last: data.latestPrice,
            change: data.change,
            changePercent: data.changePercent * 100,
            volume: data.latestVolume,
            timestamp: new Date(data.latestUpdate),
            provider: 'iexCloud',
          },
          provider: 'iexCloud',
          cached: false,
        };
      }

      throw new Error('No data received from IEX Cloud');
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'iexCloud',
        cached: false,
      };
    }
  }

  private async fetchFromYahooFinance(
    symbol: string,
    assetType: string,
  ): Promise<MarketDataResponse> {
    try {
      // Yahoo Finance doesn't require API key but has unofficial endpoints
      let yahooSymbol = symbol;

      if (assetType === 'forex') {
        yahooSymbol = `${symbol}=X`;
      } else if (assetType === 'crypto') {
        yahooSymbol = `${symbol}-USD`;
      }

      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
      const response = await firstValueFrom(this.httpService.get(url));

      if (
        response.data &&
        response.data.chart &&
        response.data.chart.result.length > 0
      ) {
        const result = response.data.chart.result[0];
        const meta = result.meta;

        return {
          success: true,
          data: {
            symbol,
            bid: meta.bid || meta.regularMarketPrice * 0.999,
            ask: meta.ask || meta.regularMarketPrice * 1.001,
            last: meta.regularMarketPrice,
            change: meta.regularMarketPrice - meta.previousClose,
            changePercent:
              ((meta.regularMarketPrice - meta.previousClose) /
                meta.previousClose) *
              100,
            volume: meta.regularMarketVolume || 0,
            timestamp: new Date(meta.regularMarketTime * 1000),
            provider: 'yahooFinance',
          },
          provider: 'yahooFinance',
          cached: false,
        };
      }

      throw new Error('No data received from Yahoo Finance');
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'yahooFinance',
        cached: false,
      };
    }
  }

  private async fetchFromCoinGecko(
    symbol: string,
    assetType: string,
  ): Promise<MarketDataResponse> {
    try {
      if (assetType !== 'crypto') {
        throw new Error(`Asset type ${assetType} not supported by CoinGecko`);
      }

      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd&include_24hr_change=true`;
      const response = await firstValueFrom(this.httpService.get(url));

      const coinId = symbol.toLowerCase();
      if (response.data && response.data[coinId]) {
        const data = response.data[coinId];
        const price = data.usd;

        return {
          success: true,
          data: {
            symbol,
            bid: price * 0.999,
            ask: price * 1.001,
            last: price,
            change: 0, // Would need additional API call for absolute change
            changePercent: data.usd_24h_change || 0,
            volume: 0,
            timestamp: new Date(),
            provider: 'coinGecko',
          },
          provider: 'coinGecko',
          cached: false,
        };
      }

      throw new Error('No data received from CoinGecko');
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'coinGecko',
        cached: false,
      };
    }
  }

  private async fetchHistoricalFromAlphaVantage(
    symbol: string,
    assetType: string,
    interval: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<MarketDataResponse> {
    try {
      const apiKey = this.configService.get<string>('ALPHA_VANTAGE_API_KEY');
      if (!apiKey) {
        throw new Error('Alpha Vantage API key not configured');
      }

      let url: string;
      if (assetType === 'stocks') {
        url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;
      } else if (assetType === 'forex') {
        url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${symbol.substring(0, 3)}&to_symbol=${symbol.substring(3, 6)}&apikey=${apiKey}`;
      } else {
        throw new Error(
          `Historical data for ${assetType} not supported by Alpha Vantage`,
        );
      }

      const response = await firstValueFrom(this.httpService.get(url));

      let timeSeries: any;
      if (assetType === 'stocks') {
        timeSeries = response.data['Time Series (Daily)'];
      } else if (assetType === 'forex') {
        timeSeries = response.data['Time Series (Daily)'];
      }

      if (timeSeries) {
        const historicalData: HistoricalPrice[] = [];

        Object.entries(timeSeries).forEach(([date, data]: [string, any]) => {
          const timestamp = new Date(date);
          if (fromDate && timestamp < fromDate) return;
          if (toDate && timestamp > toDate) return;

          historicalData.push({
            timestamp,
            open: parseFloat(data['1. open'] || data['1. Open']),
            high: parseFloat(data['2. high'] || data['2. High']),
            low: parseFloat(data['3. low'] || data['3. Low']),
            close: parseFloat(data['4. close'] || data['4. Close']),
            volume: parseInt(data['5. volume'] || data['5. Volume'] || '0'),
          });
        });

        return {
          success: true,
          data: historicalData.sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
          ),
          provider: 'alphaVantage',
          cached: false,
        };
      }

      throw new Error('No historical data received from Alpha Vantage');
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'alphaVantage',
        cached: false,
      };
    }
  }

  private async fetchHistoricalFromYahooFinance(
    symbol: string,
    assetType: string,
    interval: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<MarketDataResponse> {
    try {
      let yahooSymbol = symbol;

      if (assetType === 'forex') {
        yahooSymbol = `${symbol}=X`;
      } else if (assetType === 'crypto') {
        yahooSymbol = `${symbol}-USD`;
      }

      const period1 = fromDate
        ? Math.floor(fromDate.getTime() / 1000)
        : Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60;
      const period2 = toDate
        ? Math.floor(toDate.getTime() / 1000)
        : Math.floor(Date.now() / 1000);

      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=${period1}&period2=${period2}&interval=1d`;
      const response = await firstValueFrom(this.httpService.get(url));

      if (
        response.data &&
        response.data.chart &&
        response.data.chart.result.length > 0
      ) {
        const result = response.data.chart.result[0];
        const timestamps = result.timestamp;
        const ohlcv = result.indicators.quote[0];

        const historicalData: HistoricalPrice[] = timestamps.map(
          (timestamp: number, index: number) => ({
            timestamp: new Date(timestamp * 1000),
            open: ohlcv.open[index] || 0,
            high: ohlcv.high[index] || 0,
            low: ohlcv.low[index] || 0,
            close: ohlcv.close[index] || 0,
            volume: ohlcv.volume[index] || 0,
          }),
        );

        return {
          success: true,
          data: historicalData,
          provider: 'yahooFinance',
          cached: false,
        };
      }

      throw new Error('No historical data received from Yahoo Finance');
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'yahooFinance',
        cached: false,
      };
    }
  }

  private async fetchHistoricalFromIEXCloud(
    symbol: string,
    assetType: string,
    interval: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<MarketDataResponse> {
    try {
      const apiKey = this.configService.get<string>('IEX_CLOUD_API_KEY');
      if (!apiKey) {
        throw new Error('IEX Cloud API key not configured');
      }

      if (assetType !== 'stocks') {
        throw new Error(`Asset type ${assetType} not supported by IEX Cloud`);
      }

      const url = `https://cloud.iexapis.com/stable/stock/${symbol}/chart/1y?token=${apiKey}`;
      const response = await firstValueFrom(this.httpService.get(url));

      if (response.data && Array.isArray(response.data)) {
        const historicalData: HistoricalPrice[] = response.data
          .filter((item: any) => {
            const timestamp = new Date(item.date);
            if (fromDate && timestamp < fromDate) return false;
            if (toDate && timestamp > toDate) return false;
            return true;
          })
          .map((item: any) => ({
            timestamp: new Date(item.date),
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
            volume: item.volume,
          }));

        return {
          success: true,
          data: historicalData,
          provider: 'iexCloud',
          cached: false,
        };
      }

      throw new Error('No historical data received from IEX Cloud');
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'iexCloud',
        cached: false,
      };
    }
  }

  private canMakeRequest(providerName: string, rateLimit: number): boolean {
    const now = Date.now();
    const windowMs = 60000; // 1 minute

    const current = this.requestCounts.get(providerName) || {
      count: 0,
      resetTime: now + windowMs,
    };

    if (now > current.resetTime) {
      this.requestCounts.set(providerName, {
        count: 0,
        resetTime: now + windowMs,
      });
      return true;
    }

    return current.count < rateLimit;
  }

  private incrementRequestCount(providerName: string): void {
    const current = this.requestCounts.get(providerName) || {
      count: 0,
      resetTime: Date.now() + 60000,
    };
    current.count++;
    this.requestCounts.set(providerName, current);
  }

  getProviderStatus(): any {
    return this.providers.map((provider) => ({
      ...provider,
      requestsUsed: this.requestCounts.get(provider.name)?.count || 0,
      nextReset: new Date(
        this.requestCounts.get(provider.name)?.resetTime || Date.now(),
      ),
    }));
  }

  private async fetchHistoricalFromTraderMade(
    symbol: string,
    assetType: string,
    interval: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<MarketDataResponse> {
    try {
      if (assetType !== 'forex' && assetType !== 'commodities') {
        throw new Error(
          `Asset type ${assetType} not supported by TraderMade for historical data`,
        );
      }

      // Format dates for TraderMade API
      const startDate = fromDate
        ? fromDate.toISOString().split('T')[0]
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];
      const endDate = toDate
        ? toDate.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      // Use the existing MarketDataService method
      const priceDataPoints =
        await this.marketDataService.getTradermadeHistoricalData(
          symbol,
          startDate,
          endDate,
          interval,
        );

      // Convert PriceDataPoint[] to HistoricalPrice[]
      const historicalData: HistoricalPrice[] = priceDataPoints.map(
        (point) => ({
          timestamp: new Date(point.time * 1000), // Convert from Unix timestamp
          open: point.open,
          high: point.high,
          low: point.low,
          close: point.close,
          volume: point.volume || 0,
        }),
      );

      return {
        success: true,
        data: historicalData,
        provider: 'tradermade',
        cached: false,
      };
    } catch (error) {
      this.logger.error(`TraderMade historical data error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        provider: 'tradermade',
        cached: false,
      };
    }
  }

  async testAllProviders(): Promise<any[]> {
    const results: any[] = [];

    for (const provider of this.providers.filter((p) => p.isActive)) {
      try {
        const testSymbol = provider.supports.includes('forex')
          ? 'EURUSD'
          : provider.supports.includes('stocks')
            ? 'AAPL'
            : 'bitcoin';
        const assetType = provider.supports.includes('forex')
          ? 'forex'
          : provider.supports.includes('stocks')
            ? 'stocks'
            : 'crypto';

        const result = await this.fetchPriceFromProvider(
          provider.name,
          testSymbol,
          assetType,
        );
        results.push({
          provider: provider.name,
          status: result.success ? 'working' : 'failed',
          error: result.error,
          testSymbol,
          assetType,
        });
      } catch (error) {
        results.push({
          provider: provider.name,
          status: 'error',
          error: error.message,
        });
      }
    }

    return results;
  }
}
