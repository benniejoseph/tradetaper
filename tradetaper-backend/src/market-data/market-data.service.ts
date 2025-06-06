/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// src/market-data/market-data.service.ts
import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  OnModuleInit,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
// import { CandlestickData, UTCTimestamp } from 'lightweight-charts'; // Removed - not needed in backend

export interface PriceDataPoint {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// Type predicate function
function isPriceDataPoint(item: PriceDataPoint | null): item is PriceDataPoint {
  return item !== null;
}

@Injectable()
export class MarketDataService implements OnModuleInit {
  private readonly logger = new Logger(MarketDataService.name);
  private tradermadeApiKey: string;
  private readonly tradermadeApiBaseUrl: string =
    'https://marketdata.tradermade.com/api/v1';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const apiKeyFromConfig =
      this.configService.get<string>('TRADERMADE_API_KEY');
    if (!apiKeyFromConfig) {
      this.logger.warn(
        'TRADERMADE_API_KEY is not configured. Market data will use fallback/mock data.',
      );
      this.tradermadeApiKey = '';
    } else {
      this.tradermadeApiKey = apiKeyFromConfig;
      this.logger.log('MarketDataService initialized with Tradermade API Key.');
    }
  }

  async getTradermadeHistoricalData(
    currencyPair: string, // e.g., EURUSD
    startDate: string, // YYYY-MM-DD
    endDate: string, // YYYY-MM-DD
    interval: string, // e.g., "daily", "hourly", "15minute", "minute"
  ): Promise<PriceDataPoint[]> {
    if (!this.tradermadeApiKey) {
      throw new HttpException(
        'Market data service not configured (API key missing)',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // For minute intervals, we need to handle them differently
    if (interval.includes('minute')) {
      return this.getMinuteHistoricalData(currencyPair, startDate, endDate, interval);
    } else if (interval === 'hourly') {
      return this.getHourlyHistoricalData(currencyPair, startDate, endDate);
    } else {
      // Use timeseries for daily data
      return this.getTimeseriesData(currencyPair, startDate, endDate, interval);
    }
  }

  private async getMinuteHistoricalData(
    currencyPair: string,
    startDate: string,
    endDate: string,
    interval: string,
  ): Promise<PriceDataPoint[]> {
    // For minute data, we need to use timeseries endpoint with proper parameters
    // Tradermade allows max 2 working days for 1m and 5m data
    
    // Calculate working days between start and end date
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    
    // If requesting 1m or 5m data and the range is too large, limit it
    if ((interval === '1minute' || interval === '5minute') && daysDiff > 2) {
      this.logger.warn(
        `Limiting date range for ${interval} data from ${daysDiff} days to 2 days due to Tradermade API limits`,
      );
      // Adjust end date to be max 2 days from start
      const limitedEndDate = new Date(start);
      limitedEndDate.setDate(start.getDate() + 2);
      endDate = limitedEndDate.toISOString().split('T')[0];
    }
    
    // If requesting 15m or 30m data and the range is too large, limit it to 5 working days
    if ((interval === '15minute' || interval === '30minute') && daysDiff > 5) {
      this.logger.warn(
        `Limiting date range for ${interval} data from ${daysDiff} days to 5 days due to Tradermade API limits`,
      );
      // Adjust end date to be max 5 days from start
      const limitedEndDate = new Date(start);
      limitedEndDate.setDate(start.getDate() + 5);
      endDate = limitedEndDate.toISOString().split('T')[0];
    }

    const paramsObj: Record<string, string> = {
      currency: currencyPair,
      api_key: this.tradermadeApiKey,
      start_date: `${startDate}-00:00`, // YYYY-MM-DD-HH:MM format for minute data
      end_date: `${endDate}-23:59`, // YYYY-MM-DD-HH:MM format for minute data
      interval: 'minute',
      format: 'records',
    };

    // Add period parameter for minute intervals
    if (interval === '1minute') {
      paramsObj.period = '1';
    } else if (interval === '5minute') {
      paramsObj.period = '5';
    } else if (interval === '15minute') {
      paramsObj.period = '15';
    } else if (interval === '30minute') {
      paramsObj.period = '30';
    } else {
      // Default to 15 minutes if not specified
      paramsObj.period = '15';
    }

    const params = new URLSearchParams(paramsObj);
    const url = `${this.tradermadeApiBaseUrl}/timeseries?${params.toString()}`;

    this.logger.log(
      `Fetching minute data for ${currencyPair} (Interval: ${interval}) from ${startDate} to ${endDate} from Tradermade. URL: ${url}`,
    );

    try {
      const response = await firstValueFrom(this.httpService.get(url));
      return this.processTimeseriesResponse(
        response.data,
        currencyPair,
        interval,
      );
    } catch (error) {
      return this.handleTradermadeError(error, currencyPair, interval);
    }
  }

  private async getHourlyHistoricalData(
    currencyPair: string,
    startDate: string,
    endDate: string,
  ): Promise<PriceDataPoint[]> {
    const paramsObj: Record<string, string> = {
      currency: currencyPair,
      api_key: this.tradermadeApiKey,
      start_date: `${startDate}-00:00`, // YYYY-MM-DD-HH:MM format for hourly data
      end_date: `${endDate}-23:00`,     // YYYY-MM-DD-HH:MM format for hourly data
      interval: 'hourly',
      period: '1',
      format: 'records',
    };

    const params = new URLSearchParams(paramsObj);
    const url = `${this.tradermadeApiBaseUrl}/timeseries?${params.toString()}`;

    this.logger.log(
      `Fetching hourly data for ${currencyPair} from ${startDate} to ${endDate} from Tradermade. URL: ${url}`,
    );

    try {
      const response = await firstValueFrom(this.httpService.get(url));
      return this.processTimeseriesResponse(
        response.data,
        currencyPair,
        'hourly',
      );
    } catch (error) {
      return this.handleTradermadeError(error, currencyPair, 'hourly');
    }
  }

  private async getTimeseriesData(
    currencyPair: string,
    startDate: string,
    endDate: string,
    interval: string,
  ): Promise<PriceDataPoint[]> {
    const paramsObj: Record<string, string> = {
      currency: currencyPair,
      api_key: this.tradermadeApiKey,
      start_date: startDate, // YYYY-MM-DD format for daily data
      end_date: endDate,     // YYYY-MM-DD format for daily data
      format: 'records',
    };

    // Only add interval if it's not daily (daily is default)
    if (interval !== 'daily') {
      paramsObj.interval = interval;
    }

    const params = new URLSearchParams(paramsObj);
    const url = `${this.tradermadeApiBaseUrl}/timeseries?${params.toString()}`;

    this.logger.log(
      `Fetching timeseries data for ${currencyPair} (Interval: ${interval}) from ${startDate} to ${endDate} from Tradermade. URL: ${url}`,
    );

    try {
      const response = await firstValueFrom(this.httpService.get(url));
      return this.processTimeseriesResponse(
        response.data,
        currencyPair,
        interval,
      );
    } catch (error) {
      return this.handleTradermadeError(error, currencyPair, interval);
    }
  }

  private processTimeseriesResponse(
    data: any,
    currencyPair: string,
    interval: string,
  ): PriceDataPoint[] {
    // Check for API errors in response
    if (
      data &&
      (data.error ||
        data.errors ||
        (data.message && data.message.toLowerCase().includes('invalid')))
    ) {
      const errorMessage =
        data.message ||
        data.error ||
        JSON.stringify(data.errors) ||
        'Unknown Tradermade API error';
      this.logger.error(
        `Tradermade API Error for ${currencyPair} (${interval}): ${errorMessage}`,
      );
      throw new HttpException(
        `Tradermade API Error: ${errorMessage}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    let quotes: any[] = [];

    if (data && Array.isArray(data)) {
      quotes = data;
    } else if (data && data.quotes && Array.isArray(data.quotes)) {
      quotes = data.quotes;
    } else {
      this.logger.warn(
        `Unexpected response structure from Tradermade for ${currencyPair} (${interval}):`,
        data,
      );
      return []; // Return empty array instead of throwing error
    }

    if (quotes.length === 0) {
      this.logger.warn(
        `Tradermade returned no quotes for ${currencyPair} (${interval})`,
      );
      return [];
    }

    const priceData: PriceDataPoint[] = quotes
      .map((q: any): PriceDataPoint | null => {
        // Handle both 'date' field (timeseries) and 'date_time' field (minute/hour historical)
        const dateField = q.date || q.date_time;
        if (
          !dateField ||
          q.open == null ||
          q.high == null ||
          q.low == null ||
          q.close == null
        ) {
          this.logger.warn('Skipping incomplete quote data point:', q);
          return null;
        }

        try {
          const timestamp = new Date(dateField).getTime() / 1000;
          if (isNaN(timestamp)) {
            this.logger.warn('Invalid date in quote:', dateField);
            return null;
          }

          return {
            time: timestamp as number,
            open: parseFloat(q.open),
            high: parseFloat(q.high),
            low: parseFloat(q.low),
            close: parseFloat(q.close),
          };
        } catch (error) {
          this.logger.warn('Error processing quote date:', dateField, error);
          return null;
        }
      })
      .filter(isPriceDataPoint)
      .sort((a, b) => a.time - b.time);

    this.logger.log(
      `Successfully processed ${priceData.length} data points for ${currencyPair} (${interval})`,
    );
    return priceData;
  }

  private handleTradermadeError(
    error: any,
    currencyPair: string,
    interval: string,
  ): never {
    this.logger.error(
      `Failed to fetch Tradermade data for ${currencyPair} (${interval}): ${error.message}`,
      error.stack,
    );

    if (error instanceof HttpException) {
      throw error;
    }

    if (error.response) {
      this.logger.error(
        `Tradermade API HTTP Error Status: ${error.response.status}`,
      );
      this.logger.error(
        `Tradermade API HTTP Error Data: ${JSON.stringify(error.response.data)}`,
      );

      const apiErrorMessage =
        error.response.data?.message ||
        error.response.data?.error ||
        error.response.statusText;
      
      // Provide helpful error messages for common API limitations
      if (error.response.status === 403 && apiErrorMessage?.includes('working days')) {
        throw new HttpException(
          `Tradermade API limit: ${apiErrorMessage}. Try selecting a shorter date range or higher timeframe.`,
          HttpStatus.BAD_REQUEST,
        );
      }
      
      throw new HttpException(
        `Tradermade API HTTP error: ${apiErrorMessage}`,
        error.response.status,
      );
    }

    throw new HttpException(
      `Failed to fetch market data for ${currencyPair}`,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
