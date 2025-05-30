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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('market-data')
export class MarketDataController {
  private readonly logger = new Logger(MarketDataController.name); // Add logger instance

  constructor(private readonly marketDataService: MarketDataService) {}

  @Get('historical/forex/:pair')
  async getForexHistoricalData(
    @Param('pair') pair: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('interval') interval: string,
  ): Promise<PriceDataPoint[]> {
    // ADD DETAILED LOGGING HERE
    this.logger.log(
      `[MarketDataController] Received request for /historical/forex/${pair} with query:`,
      {
        startDate,
        endDate,
        interval,
      },
    );

    if (!pair || !startDate || !endDate || !interval) {
      this.logger.warn('[MarketDataController] Missing required parameters.');
      throw new HttpException(
        'Missing required parameters: pair, startDate, endDate, interval',
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

    // Log before calling the service
    this.logger.log(
      `[MarketDataController] Calling MarketDataService.getTradermadeHistoricalData with: pair=${pair.toUpperCase()}, startDate=${startDate}, endDate=${endDate}, interval=${interval.toLowerCase()}`,
    );

    return this.marketDataService.getTradermadeHistoricalData(
      pair.toUpperCase(),
      startDate,
      endDate,
      interval.toLowerCase(),
    );
  }
}
