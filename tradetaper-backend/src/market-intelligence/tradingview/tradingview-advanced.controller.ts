import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TradingViewAdvancedService } from './tradingview-advanced.service';

@Controller('market-intelligence/tradingview-advanced')
@UseGuards(JwtAuthGuard)
export class TradingViewAdvancedController {
  private readonly logger = new Logger(TradingViewAdvancedController.name);

  constructor(
    private readonly tradingViewAdvancedService: TradingViewAdvancedService,
  ) {}

  /**
   * Get service status
   */
  @Get('status')
  async getStatus(): Promise<any> {
    try {
      const status = this.tradingViewAdvancedService.getStatus();
      return {
        success: true,
        data: status,
      };
    } catch (error: any) {
      this.logger.error('Failed to get TradingView status:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get technical analysis from TradingView
   * GET /api/v1/market-intelligence/tradingview-advanced/technical-analysis?symbol=XAUUSD&interval=4h
   */
  @Get('technical-analysis')
  async getTechnicalAnalysis(
    @Query('symbol') symbol = 'XAUUSD',
    @Query('interval') interval = '4h',
  ): Promise<any> {
    try {
      const analysis =
        await this.tradingViewAdvancedService.getTechnicalAnalysis(
          symbol,
          interval,
        );

      return {
        success: true,
        data: analysis,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to get technical analysis for ${symbol}:`,
        error.message,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get chart data with indicators
   * POST /api/v1/market-intelligence/tradingview-advanced/chart-data
   * Body: { symbol: "XAUUSD", interval: "240", indicators: ["RSI", "MACD"] }
   */
  @Post('chart-data')
  async getChartData(
    @Body() body: { symbol: string; interval?: string; indicators?: string[] },
  ): Promise<any> {
    try {
      const { symbol = 'XAUUSD', interval = '240', indicators = [] } = body;

      const chartData =
        await this.tradingViewAdvancedService.getChartWithIndicators(
          symbol,
          interval,
          indicators,
        );

      return {
        success: true,
        data: chartData,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get chart data:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get specific indicator values
   * POST /api/v1/market-intelligence/tradingview-advanced/indicator
   * Body: { symbol: "XAUUSD", indicatorName: "RSI", interval: "240", settings: { length: 14 } }
   */
  @Post('indicator')
  async getIndicator(
    @Body()
    body: {
      symbol: string;
      indicatorName: string;
      interval?: string;
      settings?: any;
    },
  ): Promise<any> {
    try {
      const { symbol, indicatorName, interval = '240', settings } = body;

      if (!indicatorName) {
        return {
          success: false,
          error: 'Indicator name is required',
        };
      }

      const indicatorData =
        await this.tradingViewAdvancedService.getIndicatorValues(
          symbol,
          indicatorName,
          interval,
          settings,
        );

      return {
        success: true,
        data: indicatorData,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get indicator data:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get chart drawings (requires chart ID from TradingView account)
   * GET /api/v1/market-intelligence/tradingview-advanced/drawings?chartId=xxx
   */
  @Get('drawings')
  async getDrawings(@Query('chartId') chartId: string): Promise<any> {
    try {
      if (!chartId) {
        return {
          success: false,
          error: 'Chart ID is required',
        };
      }

      const drawings =
        await this.tradingViewAdvancedService.getChartDrawings(chartId);

      return {
        success: true,
        data: drawings,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get chart drawings:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get screener results
   * GET /api/v1/market-intelligence/tradingview-advanced/screener?filter=top_gainers&market=forex
   */
  @Get('screener')
  async getScreener(
    @Query('filter') filter = 'top_gainers',
    @Query('market') market = 'forex',
  ): Promise<any> {
    try {
      const results = await this.tradingViewAdvancedService.getScreenerResults(
        filter,
        market,
      );

      return {
        success: true,
        data: results,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get screener results:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get ICT-specific indicator values
   * This endpoint specifically fetches indicators relevant for ICT analysis
   */
  @Get('ict-indicators')
  async getICTIndicators(
    @Query('symbol') symbol = 'XAUUSD',
    @Query('interval') interval = '240',
  ): Promise<any> {
    try {
      // List of ICT-relevant indicators we can fetch
      const ictIndicators = [
        'Volume',
        'Pivot Points High Low',
        'Previous Day High Low',
        'Session Volume HD',
      ];

      const indicatorPromises = ictIndicators.map(async (indicatorName) => {
        try {
          return await this.tradingViewAdvancedService.getIndicatorValues(
            symbol,
            indicatorName,
            interval,
          );
        } catch (error: any) {
          this.logger.warn(`Failed to fetch ${indicatorName}:`, error.message);
          return null;
        }
      });

      const results = await Promise.allSettled(indicatorPromises);

      const indicators = results
        .filter((r) => r.status === 'fulfilled' && r.value !== null)
        .map((r) => (r as any).value);

      return {
        success: true,
        data: {
          symbol,
          interval,
          indicators,
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to get ICT indicators:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
