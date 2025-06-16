// src/market-data/market-data.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'; // Added Logger
import { MarketDataService, PriceDataPoint } from './market-data.service';
import { MultiProviderMarketDataService, HistoricalPrice } from './multi-provider.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('market-data')
export class MarketDataController {
  private readonly logger = new Logger(MarketDataController.name); // Add logger instance

  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly multiProviderService: MultiProviderMarketDataService,
  ) {}

  @Get('historical/forex/:baseCurrency/:quoteCurrency')
  async getForexHistoricalData(
    @Param('baseCurrency') baseCurrency: string,
    @Param('quoteCurrency') quoteCurrency: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('interval') interval: string,
  ): Promise<PriceDataPoint[]> {
    const pair = `${baseCurrency}/${quoteCurrency}`;

    // ADD DETAILED LOGGING HERE
    this.logger.log(
      `[MarketDataController] Received request for /historical/forex/${baseCurrency}/${quoteCurrency} with query:`,
      {
        baseCurrency,
        quoteCurrency,
        pair,
        startDate,
        endDate,
        interval,
      },
    );

    if (
      !baseCurrency ||
      !quoteCurrency ||
      !startDate ||
      !endDate ||
      !interval
    ) {
      this.logger.warn('[MarketDataController] Missing required parameters.');
      throw new HttpException(
        'Missing required parameters: baseCurrency, quoteCurrency, startDate, endDate, interval',
        HttpStatus.BAD_REQUEST,
      );
    }

    const validIntervals = [
      'daily',
      'hourly',
      '4hourly',
      '15minute',
      '5minute',
      '1minute',
      '1day', // Add standard intervals for multi-provider
    ]; // VERIFY with Tradermade
    if (!validIntervals.includes(interval.toLowerCase())) {
      this.logger.warn(
        `[MarketDataController] Invalid interval received: ${interval}`,
      );
      throw new HttpException(
        `Invalid interval: ${interval}. Valid intervals are: ${validIntervals.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Convert to the format expected by the multi-provider service (EURUSD)
    const symbol = `${baseCurrency.toUpperCase()}${quoteCurrency.toUpperCase()}`;

    // Log before calling the service
    this.logger.log(
      `[MarketDataController] Calling MultiProviderMarketDataService.getHistoricalPrices with: symbol=${symbol}, assetType=forex, interval=${interval.toLowerCase()}`,
    );

    try {
      const result = await this.multiProviderService.getHistoricalPrices(
        symbol,
        'forex',
        interval.toLowerCase(),
        new Date(startDate),
        new Date(endDate),
      );

      if (!result.success) {
        this.logger.error(
          `[MarketDataController] Failed to get historical data: ${result.error}`,
        );
        throw new HttpException(
          result.error || 'Failed to fetch historical data',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Convert HistoricalPrice[] to PriceDataPoint[]
      const data = result.data as HistoricalPrice[];
      const priceDataPoints: PriceDataPoint[] = data.map((item) => ({
        time: Math.floor(item.timestamp.getTime() / 1000), // Convert to Unix timestamp
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
      }));

      this.logger.log(
        `[MarketDataController] Successfully fetched ${priceDataPoints.length} data points from provider: ${result.provider}`,
      );

      return priceDataPoints;
    } catch (error) {
      this.logger.error(
        `[MarketDataController] Error fetching historical data: ${error.message}`,
      );
      throw new HttpException(
        'Failed to fetch historical data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
