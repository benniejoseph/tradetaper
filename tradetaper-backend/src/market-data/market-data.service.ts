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
import { CandlestickData, UTCTimestamp } from 'lightweight-charts';
// import { format as formatDateFns } from 'date-fns'; // No longer needed here if dates are passed as strings

export interface PriceDataPoint extends CandlestickData {
  time: UTCTimestamp;
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
      this.logger.error(
        'FATAL: TRADERMADE_API_KEY is not configured in environment variables!',
      );
      throw new Error(
        'FATAL: TRADERMADE_API_KEY is not configured. MarketDataService cannot operate.',
      );
    }
    this.tradermadeApiKey = apiKeyFromConfig;
    this.logger.log('MarketDataService initialized with Tradermade API Key.');
  }

  async getTradermadeHistoricalData(
    // Renamed for clarity, handles interval
    currencyPair: string, // e.g., EURUSD
    startDate: string, // YYYY-MM-DD
    endDate: string, // YYYY-MM-DD
    interval: string, // e.g., "daily", "hourly", "15minute", "minute" (VERIFY TRADERMADE VALUES)
  ): Promise<PriceDataPoint[]> {
    if (!this.tradermadeApiKey) {
      throw new HttpException(
        'Market data service not configured (API key missing)',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const paramsObj: Record<string, string> = {
      currency: currencyPair,
      api_key: this.tradermadeApiKey,
      start_date: startDate, // For daily, Tradermade uses YYYY-MM-DD
      end_date: endDate, // For daily, Tradermade uses YYYY-MM-DD
      format: 'records',
      // interval: interval, // Default is daily for /timeseries
    };

    // Tradermade uses different endpoints or parameters for intraday vs daily
    // For /timeseries, 'interval' is usually for > daily. For intraday, often /minute_historical or similar.
    // Let's assume /timeseries handles 'daily', 'hourly'. For finer granularities, you might need /minute_historical.
    // This logic needs to be **EXACTLY** aligned with Tradermade's API for different intervals.

    let endpointPath = '/timeseries'; // Default for daily, weekly, monthly, hourly
    if (interval.includes('minute')) {
      // e.g., "15minute", "1minute"
      endpointPath = '/minute_historical'; // HYPOTHETICAL - CHECK TRADERMADE DOCS
      // For /minute_historical, Tradermade might expect date_time for start/end
      // And 'interval' parameter might be named differently or implied by endpoint.
      // Example: date_time=YYYY-MM-DD-HH:MM, interval might not be needed if endpoint is specific
      // paramsObj.date_time = startDate; // This would need startDate to be YYYY-MM-DD-HH:MM
      // delete paramsObj.start_date;
      // delete paramsObj.end_date;
      // paramsObj.period = interval.replace('minute', ''); // e.g. "15" if interval is "15minute" - CHECK DOCS
      this.logger.warn(
        `Intraday interval ${interval} for Tradermade might require different endpoint/params. Current setup is a guess.`,
      );
      // For now, we'll stick to /timeseries and assume it can handle some intervals.
      // If interval is not 'daily', add it.
      if (interval !== 'daily') {
        paramsObj.interval = interval; // E.g., "hourly", "4hourly" - CHECK VALID VALUES
      }
    } else if (interval !== 'daily') {
      // For intervals like "hourly" handled by /timeseries
      paramsObj.interval = interval;
    }
    // If interval is 'daily', we don't need to pass the interval param for /timeseries typically.

    const params = new URLSearchParams(paramsObj);
    const url = `${this.tradermadeApiBaseUrl}${endpointPath}?${params.toString()}`;

    this.logger.log(
      `Fetching data for ${currencyPair} (Interval: ${interval}) from ${startDate} to ${endDate} from Tradermade. URL: ${url}`,
    );

    try {
      const response = await firstValueFrom(this.httpService.get(url));
      let quotes: any[] = [];

      // Tradermade often returns error messages directly in the JSON body with a 200 OK for some errors (like invalid key for minute data)
      if (
        response.data &&
        (response.data.error ||
          (typeof response.data.message === 'string' &&
            response.data.message.toLowerCase().includes('invalid')))
      ) {
        const errorMessage =
          response.data.message ||
          response.data.error ||
          'Unknown Tradermade API error';
        this.logger.error(
          `Tradermade API Error (possibly with 200 OK): ${errorMessage} for ${currencyPair}`,
        );
        throw new HttpException(
          `Tradermade API Error: ${errorMessage}`,
          HttpStatus.BAD_REQUEST,
        ); // Use 400 for client-side error like invalid params
      }

      if (response.data && Array.isArray(response.data)) {
        quotes = response.data;
      } else if (
        response.data &&
        response.data.quotes &&
        Array.isArray(response.data.quotes)
      ) {
        quotes = response.data.quotes;
      } else {
        this.logger.warn(
          `Unexpected response structure from Tradermade for ${currencyPair} (Interval: ${interval}):`,
          response.data,
        );
        throw new HttpException(
          `Invalid data received from Tradermade for ${currencyPair}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      if (quotes.length === 0) {
        this.logger.warn(
          `Tradermade returned no quotes for ${currencyPair} (Interval: ${interval}) between ${startDate}-${endDate}`,
        );
        return [];
      }

      const priceData: PriceDataPoint[] = quotes
        .map((q: any): PriceDataPoint | null => {
          // The 'date' field from Tradermade might be YYYY-MM-DD for daily,
          // or YYYY-MM-DD HH:MM:SS for intraday. new Date() handles both.
          if (
            !q.date ||
            q.open == null ||
            q.high == null ||
            q.low == null ||
            q.close == null
          ) {
            this.logger.warn('Skipping incomplete quote data point:', q);
            return null;
          }
          return {
            time: (new Date(q.date).getTime() / 1000) as UTCTimestamp,
            open: parseFloat(q.open),
            high: parseFloat(q.high),
            low: parseFloat(q.low),
            close: parseFloat(q.close),
          };
        })
        .filter(isPriceDataPoint)
        .sort((a, b) => a.time - b.time);

      return priceData;
    } catch (error) {
      this.logger.error(
        `Failed to fetch Tradermade data for ${currencyPair} (Interval: ${interval}): ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) throw error;

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
}
