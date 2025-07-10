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
import { PriceDataPoint } from './market-data.service';
import {
  MultiProviderMarketDataService,
  HistoricalPrice,
} from './multi-provider.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('market-data')
export class MarketDataController {
  private readonly logger = new Logger(MarketDataController.name); // Add logger instance

  constructor(
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
    const symbol = `${baseCurrency.toUpperCase()}${quoteCurrency.toUpperCase()}`;

    this.logger.log(
      `[MarketDataController] Forex request: ${symbol}, interval=${interval}`,
    );

    return this.getHistoricalDataForAssetType(
      symbol,
      'forex',
      startDate,
      endDate,
      interval,
    );
  }

  @Get('historical/commodities/:symbol')
  async getCommoditiesHistoricalData(
    @Param('symbol') symbol: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('interval') interval: string,
  ): Promise<PriceDataPoint[]> {
    this.logger.log(
      `[MarketDataController] Commodities request: ${symbol}, interval=${interval}`,
    );

    return this.getHistoricalDataForAssetType(
      symbol.toUpperCase(),
      'commodities',
      startDate,
      endDate,
      interval,
    );
  }

  @Get('historical/stocks/:symbol')
  async getStocksHistoricalData(
    @Param('symbol') symbol: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('interval') interval: string,
  ): Promise<PriceDataPoint[]> {
    this.logger.log(
      `[MarketDataController] Stocks request: ${symbol}, interval=${interval}`,
    );

    return this.getHistoricalDataForAssetType(
      symbol.toUpperCase(),
      'stocks',
      startDate,
      endDate,
      interval,
    );
  }

  @Get('historical/crypto/:symbol')
  async getCryptoHistoricalData(
    @Param('symbol') symbol: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('interval') interval: string,
  ): Promise<PriceDataPoint[]> {
    this.logger.log(
      `[MarketDataController] Crypto request: ${symbol}, interval=${interval}`,
    );

    return this.getHistoricalDataForAssetType(
      symbol.toUpperCase(),
      'crypto',
      startDate,
      endDate,
      interval,
    );
  }

  private async getHistoricalDataForAssetType(
    symbol: string,
    assetType: string,
    startDate: string,
    endDate: string,
    interval: string,
  ): Promise<PriceDataPoint[]> {
    if (!symbol || !startDate || !endDate || !interval) {
      this.logger.warn('[MarketDataController] Missing required parameters.');
      throw new HttpException(
        'Missing required parameters: symbol, startDate, endDate, interval',
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
      '1day',
    ];
    if (!validIntervals.includes(interval.toLowerCase())) {
      this.logger.warn(
        `[MarketDataController] Invalid interval received: ${interval}`,
      );
      throw new HttpException(
        `Invalid interval: ${interval}. Valid intervals are: ${validIntervals.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    this.logger.log(
      `[MarketDataController] Calling MultiProviderMarketDataService.getHistoricalPrices with: symbol=${symbol}, assetType=${assetType}, interval=${interval.toLowerCase()}`,
    );

    try {
      const result = await this.multiProviderService.getHistoricalPrices(
        symbol,
        assetType,
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
