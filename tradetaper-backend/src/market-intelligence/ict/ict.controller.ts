import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LiquidityAnalysisService } from './liquidity-analysis.service';
import { MarketStructureService } from './market-structure.service';
import { FairValueGapService } from './fair-value-gap.service';
import { OrderBlockService } from './order-block.service';
import { KillZoneService } from './kill-zone.service';
import { PremiumDiscountService } from './premium-discount.service';
import { PowerOfThreeService } from './power-of-three.service';
import { ChartImageAnalysisService } from './chart-image-analysis.service';
import { ICTAIAgentService } from './ict-ai-agent.service';
import { ICTMasterService } from './ict-master.service';
import { MarketDataProviderService } from './market-data-provider.service';

@Controller('ict')
export class ICTController {
  private readonly logger = new Logger(ICTController.name);

  constructor(
    private readonly marketDataProvider: MarketDataProviderService,
    private readonly liquidityAnalysis: LiquidityAnalysisService,
    private readonly marketStructure: MarketStructureService,
    private readonly fairValueGap: FairValueGapService,
    private readonly orderBlock: OrderBlockService,
    private readonly killZone: KillZoneService,
    private readonly premiumDiscount: PremiumDiscountService,
    private readonly powerOfThree: PowerOfThreeService,
    private readonly chartImageAnalysis: ChartImageAnalysisService,
    private readonly ictAIAgent: ICTAIAgentService,
    private readonly ictMaster: ICTMasterService,
  ) {}

  /**
   * Get complete ICT analysis (all concepts combined)
   */
  @Get('complete-analysis')
  async getCompleteAnalysis(@Query('symbol') symbol: string) {
    this.logger.log(`Getting complete ICT analysis for ${symbol}`);

    if (!symbol) {
      throw new HttpException('Symbol is required', HttpStatus.BAD_REQUEST);
    }

    try {
      // Fetch real market data
      const priceData = await this.marketDataProvider.getPriceData({
        symbol,
        timeframe: '1H',
        limit: 100,
      });

      const analysis = await this.ictMaster.analyzeComplete(
        symbol,
        priceData,
        '1H',
      );

      return {
        success: true,
        data: analysis,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get complete ICT analysis for ${symbol}`);
      this.logger.error(`Error: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      throw new HttpException(
        `Failed to analyze ICT data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get liquidity analysis
   */
  @Get('liquidity/:symbol')
  async getLiquidityAnalysis(
    @Param('symbol') symbol: string,
    @Query('timeframe') timeframe: string = '1H',
  ) {
    this.logger.log(`Getting liquidity analysis for ${symbol} on ${timeframe}`);

    try {
      const priceData = await this.marketDataProvider.getPriceData({
        symbol,
        timeframe,
        limit: 100,
      });
      const analysis = this.liquidityAnalysis.analyzeLiquidity(
        symbol,
        priceData,
        timeframe,
      );

      return {
        success: true,
        data: analysis,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get liquidity analysis`, error);
      throw new HttpException(
        'Failed to analyze liquidity',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get market structure analysis
   */
  @Get('market-structure/:symbol')
  async getMarketStructure(
    @Param('symbol') symbol: string,
    @Query('timeframe') timeframe: string = '1H',
  ) {
    this.logger.log(`Getting market structure for ${symbol} on ${timeframe}`);

    try {
      const priceData = await this.marketDataProvider.getPriceData({
        symbol,
        timeframe,
        limit: 100,
      });
      const analysis = this.marketStructure.analyzeMarketStructure(
        symbol,
        priceData,
        timeframe,
      );

      return {
        success: true,
        data: analysis,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get market structure`, error);
      throw new HttpException(
        'Failed to analyze market structure',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get Fair Value Gaps
   */
  @Get('fair-value-gaps/:symbol')
  async getFairValueGaps(
    @Param('symbol') symbol: string,
    @Query('timeframe') timeframe: string = '1H',
  ) {
    this.logger.log(`Getting FVGs for ${symbol} on ${timeframe}`);

    try {
      const priceData = await this.marketDataProvider.getPriceData({
        symbol,
        timeframe,
        limit: 100,
      });
      const analysis = this.fairValueGap.identifyFairValueGaps(
        symbol,
        priceData,
        timeframe,
      );

      return {
        success: true,
        data: analysis,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get FVGs`, error);
      throw new HttpException(
        'Failed to identify Fair Value Gaps',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get Order Blocks
   */
  @Get('order-blocks/:symbol')
  async getOrderBlocks(
    @Param('symbol') symbol: string,
    @Query('timeframe') timeframe: string = '1H',
  ) {
    this.logger.log(`Getting Order Blocks for ${symbol} on ${timeframe}`);

    try {
      const priceData = await this.marketDataProvider.getPriceData({
        symbol,
        timeframe: timeframe || '1H',
        limit: 100,
      });
      const analysis = this.orderBlock.identifyOrderBlocks(
        symbol,
        priceData,
        timeframe,
      );

      return {
        success: true,
        data: analysis,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get Order Blocks`, error);
      throw new HttpException(
        'Failed to identify Order Blocks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get Kill Zones status (no authentication required - public info)
   */
  @Get('kill-zones')
  async getKillZones() {
    this.logger.log('Getting Kill Zones status');

    try {
      const analysis = this.killZone.analyzeKillZones();

      return {
        success: true,
        data: analysis,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get Kill Zones', error);
      throw new HttpException(
        'Failed to analyze Kill Zones',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get Premium/Discount analysis
   */
  @Get('premium-discount/:symbol')
  async getPremiumDiscount(
    @Param('symbol') symbol: string,
    @Query('timeframe') timeframe: string = '1H',
  ) {
    this.logger.log(`Getting Premium/Discount for ${symbol} on ${timeframe}`);

    try {
      const { data: priceData, source } =
        await this.marketDataProvider.getPriceDataWithSource({
          symbol,
          timeframe: timeframe || '1H',
          limit: 100,
        });
      const analysis = this.premiumDiscount.analyzePremiumDiscount(
        symbol,
        priceData,
        timeframe,
      );

      return {
        success: true,
        data: {
          ...analysis,
          dataSource: source,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get Premium/Discount`, error);
      throw new HttpException(
        'Failed to analyze Premium/Discount',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get Power of Three analysis
   */
  @Get('power-of-three/:symbol')
  async getPowerOfThree(
    @Param('symbol') symbol: string,
    @Query('timeframe') timeframe: string = '1H',
  ) {
    this.logger.log(`Getting Power of Three for ${symbol} on ${timeframe}`);

    try {
      const { data: priceData, source } =
        await this.marketDataProvider.getPriceDataWithSource({
          symbol,
          timeframe: timeframe || '1H',
          limit: 100,
        });
      const analysis = this.powerOfThree.analyzePowerOfThree(
        symbol,
        priceData,
        timeframe,
      );

      return {
        success: true,
        data: {
          ...analysis,
          dataSource: source,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get Power of Three`, error);
      throw new HttpException(
        'Failed to detect Power of Three',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Analyze chart images (multi-timeframe)
   */
  @Post('analyze-chart-images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('charts', 7)) // Max 7 timeframes
  async analyzeChartImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { symbol: string; timeframes: string[] },
  ) {
    this.logger.log(
      `Analyzing ${files?.length || 0} chart images for ${body.symbol}`,
    );

    try {
      if (!files || files.length === 0) {
        throw new HttpException(
          'No chart images provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Convert uploaded files to base64 for Gemini Vision API
      const chartData: any = {};
      const timeframes = Array.isArray(body.timeframes)
        ? body.timeframes
        : [body.timeframes];

      files.forEach((file, index) => {
        const timeframe = timeframes[index] || '1H';
        const base64 = file.buffer.toString('base64');
        chartData[timeframe] = base64;
      });

      // Get current price from real market data
      const latestData = await this.marketDataProvider.getPriceData({
        symbol: body.symbol,
        timeframe: '1H',
        limit: 1,
      });
      const currentPrice = latestData.length > 0 ? latestData[0].close : 0;

      const request = {
        symbol: body.symbol,
        timeframes: chartData,
        currentPrice,
        context: 'Multi-timeframe ICT analysis',
      };

      const analysis =
        await this.chartImageAnalysis.analyzeChartImages(request);

      return {
        success: true,
        data: analysis,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to analyze chart images', error);
      throw new HttpException(
        error.message || 'Failed to analyze charts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get ICT AI Agent analysis (pure ICT methodology)
   */
  @Get('ai-analysis/:symbol')
  @UseGuards(JwtAuthGuard)
  async getAIAnalysis(
    @Param('symbol') symbol: string,
    @Query('timeframe') timeframe: string = '1H',
  ) {
    this.logger.log(`Getting ICT AI analysis for ${symbol} on ${timeframe}`);

    try {
      const priceData = await this.marketDataProvider.getPriceData({
        symbol,
        timeframe: timeframe || '1H',
        limit: 100,
      });
      const analysis = await this.ictAIAgent.analyze(
        symbol,
        priceData,
        timeframe,
      );

      return {
        success: true,
        data: analysis,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get AI analysis`, error);
      throw new HttpException(
        'Failed to generate AI analysis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
