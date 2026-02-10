import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseUUIDPipe,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { BacktestingService } from './backtesting.service';
import { TagService } from './services/tag.service';
import { BacktestInsightsService } from './services/backtest-insights.service';
import { CandleManagementService } from './services/candle-management.service';
import { ReplaySessionService } from './services/replay-session.service';
import { CreateBacktestTradeDto } from './dto/create-backtest-trade.dto';
import { UpdateBacktestTradeDto } from './dto/update-backtest-trade.dto';
import { CreateMarketLogDto } from './dto/create-market-log.dto';
import { UpdateMarketLogDto } from './dto/update-market-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('backtesting')
@UseGuards(JwtAuthGuard)
export class BacktestingController {
  constructor(
    private readonly backtestingService: BacktestingService,
    private readonly tagService: TagService,
    private readonly insightsService: BacktestInsightsService,
    private readonly candleManagementService: CandleManagementService,
    private readonly replaySessionService: ReplaySessionService,
  ) {}

  // ============ CRUD ============

  @Post('trades')
  async create(@Body() createDto: CreateBacktestTradeDto, @Request() req) {
    return this.backtestingService.create(createDto, req.user.id);
  }

  @Get('trades')
  async findAll(
    @Request() req,
    @Query('strategyId') strategyId?: string,
    @Query('symbol') symbol?: string,
    @Query('session') session?: string,
    @Query('timeframe') timeframe?: string,
    @Query('outcome') outcome?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.backtestingService.findAll(
      req.user.id,
      {
        strategyId,
        symbol,
        session,
        timeframe,
        outcome,
        startDate,
        endDate,
      },
      {
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      },
    );
  }

  @Get('trades/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.backtestingService.findOne(id, req.user.id);
  }

  @Patch('trades/:id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateBacktestTradeDto,
    @Request() req,
  ) {
    return this.backtestingService.update(id, updateDto, req.user.id);
  }

  @Delete('trades/:id')
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.backtestingService.remove(id, req.user.id);
  }

  // ============ TAG INTELLIGENCE ============

  @Get('tags/suggestions')
  async getTagSuggestions(
    @Request() req,
    @Query('prefix') prefix: string = '',
  ) {
    return this.tagService.getSuggestions(req.user.id, prefix);
  }

  @Post('tags/check-duplicate')
  async checkDuplicate(
    @Request() req,
    @Body() body: { symbol: string; tradeDate: string; tags: string[] },
  ) {
    return this.tagService.checkDuplicate(
      req.user.id,
      body.symbol,
      body.tradeDate,
      body.tags,
    );
  }

  @Post('tags/normalize')
  normalizeTagsEndpoint(@Body() body: { tags: string[] }) {
    return { normalized: this.tagService.normalizeAll(body.tags) };
  }

  // ============ MARKET LOGS ============

  @Post('logs')
  async createLog(@Body() createDto: CreateMarketLogDto, @Request() req) {
    return this.backtestingService.createLog(createDto, req.user.id);
  }

  @Get('logs/analysis')
  async analyzePatterns(@Request() req) {
    return this.backtestingService.analyzePatterns(req.user.id);
  }

  @Get('logs')
  async findAllLogs(
    @Request() req,
    @Query('symbol') symbol?: string,
    @Query('session') session?: string,
    @Query('timeframe') timeframe?: string,
    @Query('sentiment') sentiment?: string,
    @Query('tags') tags?: string[],
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Handle tags if they come as a single string
    const tagArray = typeof tags === 'string' ? [tags] : tags;

    return this.backtestingService.findAllLogs(req.user.id, {
      symbol,
      session,
      timeframe,
      sentiment,
      tags: tagArray,
      startDate,
      endDate,
    });
  }

  @Get('logs/:id')
  async findOneLog(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.backtestingService.findOneLog(id, req.user.id);
  }

  @Patch('logs/:id')
  async updateLog(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateMarketLogDto,
    @Request() req,
  ) {
    return this.backtestingService.updateLog(id, updateDto, req.user.id);
  }

  @Delete('logs/:id')
  async removeLog(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.backtestingService.removeLog(id, req.user.id);
  }

  // ============ ANALYTICS ============

  @Get('stats')
  async getOverallStats(@Request() req) {
    return this.backtestingService.getOverallStats(req.user.id);
  }

  @Get('strategies/:strategyId/stats')
  async getStrategyStats(
    @Param('strategyId', ParseUUIDPipe) strategyId: string,
    @Request() req,
  ) {
    return this.backtestingService.getStrategyStats(strategyId, req.user.id);
  }

  @Get('strategies/:strategyId/dimension/:dimension')
  async getStatsByDimension(
    @Param('strategyId', ParseUUIDPipe) strategyId: string,
    @Param('dimension')
    dimension:
      | 'symbol'
      | 'session'
      | 'timeframe'
      | 'killZone'
      | 'dayOfWeek'
      | 'setupType',
    @Request() req,
  ) {
    return this.backtestingService.getStatsByDimension(
      strategyId,
      req.user.id,
      dimension,
    );
  }

  @Get('strategies/:strategyId/matrix')
  async getPerformanceMatrix(
    @Param('strategyId', ParseUUIDPipe) strategyId: string,
    @Query('rows')
    rowDimension:
      | 'session'
      | 'timeframe'
      | 'killZone'
      | 'dayOfWeek' = 'session',
    @Query('columns')
    columnDimension: 'symbol' | 'session' | 'timeframe' = 'symbol',
    @Request() req,
  ) {
    return this.backtestingService.getPerformanceMatrix(
      strategyId,
      req.user.id,
      rowDimension,
      columnDimension,
    );
  }

  @Get('strategies/:strategyId/analysis')
  async getAnalysisData(
    @Param('strategyId', ParseUUIDPipe) strategyId: string,
    @Request() req,
  ) {
    return this.backtestingService.getAnalysisData(strategyId, req.user.id);
  }

  @Get('strategies/:strategyId/insights')
  async getAIInsights(
    @Param('strategyId', ParseUUIDPipe) strategyId: string,
    @Request() req,
    @Res() res: Response,
  ) {
    try {
      // Get comprehensive analysis data
      const analysisData = await this.backtestingService.getAnalysisData(
        strategyId,
        req.user.id,
      );

      // Set headers for SSE (Server-Sent Events)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx

      // Stream AI insights
      const insightsGenerator = this.insightsService.generateInsights({
        stats: analysisData.overallStats,
        dimensionAnalysis: {
          bySymbol: analysisData.bySymbol,
          bySession: analysisData.bySession,
          byTimeframe: analysisData.byTimeframe,
          byKillZone: analysisData.byKillZone,
          byDayOfWeek: analysisData.byDayOfWeek,
          bySetup: analysisData.bySetup,
        },
        tradeCount: analysisData.tradeCount,
        dateRange: analysisData.dateRange,
      });

      for await (const chunk of insightsGenerator) {
        // Send as SSE format
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      }

      // Send completion event
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to generate insights',
        message: error.message,
      });
    }
  }

  @Get('symbols')
  async getSymbols(@Request() req) {
    return this.backtestingService.getDistinctSymbols(req.user.id);
  }

  // ============ EXPORT ============

  @Get('trades/export')
  async exportTrades(
    @Request() req,
    @Query('strategyId') strategyId?: string,
    @Query('symbol') symbol?: string,
    @Query('session') session?: string,
    @Query('timeframe') timeframe?: string,
    @Query('outcome') outcome?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('format') format: 'csv' = 'csv',
  ) {
    const csvData = await this.backtestingService.exportTradesToCSV(
      req.user.id,
      {
        strategyId,
        symbol,
        session,
        timeframe,
        outcome,
        startDate,
        endDate,
      },
    );

    // Return CSV data with proper headers
    // Note: In a production environment, you might want to use @Res() decorator
    // and set headers manually for better control over Content-Disposition
    return {
      data: csvData,
      filename: `backtest-trades-${new Date().toISOString().split('T')[0]}.csv`,
      format: 'csv',
    };
  }

  @Get('strategies/:strategyId/export')
  async exportStrategy(
    @Param('strategyId', ParseUUIDPipe) strategyId: string,
    @Request() req,
  ) {
    const reportData = await this.backtestingService.exportStrategyReport(
      strategyId,
      req.user.id,
    );

    return {
      ...reportData,
      filename: `strategy-report-${strategyId}-${new Date().toISOString().split('T')[0]}.csv`,
      format: 'csv',
    };
  }

  // ============ CANDLE DATA ============

  @Get('candles/:symbol')
  async getMarketCandles(
    @Param('symbol') symbol: string,
    @Query('timeframe') timeframe: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req,
  ) {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const tf = timeframe || '1h';

    return this.candleManagementService.getCandles(symbol, tf, start, end);
  }

  @Post('candles/:symbol/fetch')
  async fetchCandles(
    @Param('symbol') symbol: string,
    @Body() body: { timeframe: string; startDate: string; endDate: string },
    @Request() req,
  ) {
    const start = new Date(body.startDate);
    const end = body.endDate ? new Date(body.endDate) : new Date();

    await this.candleManagementService.fetchAndStoreCandles(
      symbol,
      body.timeframe,
      start,
      end,
    );

    return { message: 'Candles fetched and stored successfully' };
  }

  // ============ REPLAY SESSIONS ============

  @Post('sessions')
  async createSession(
    @Body()
    body: {
      symbol: string;
      timeframe: string;
      startDate: string;
      endDate: string;
      startingBalance?: number;
    },
    @Request() req,
  ) {
    return this.replaySessionService.createSession({
      userId: req.user.id,
      symbol: body.symbol,
      timeframe: body.timeframe,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      startingBalance: body.startingBalance,
    });
  }

  @Get('sessions')
  async getUserSessions(@Request() req) {
    return this.replaySessionService.getUserSessions(req.user.id);
  }

  @Get('sessions/:id')
  async getSession(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.replaySessionService.getSession(id);
  }

  @Patch('sessions/:id')
  async updateSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      trades?: any[];
      endingBalance?: number;
      totalPnl?: number;
      status?: 'in_progress' | 'completed' | 'abandoned';
    },
    @Request() req,
  ) {
    return this.replaySessionService.updateSession(id, body);
  }

  @Post('sessions/:id/complete')
  async completeSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { endingBalance: number; trades: any[] },
    @Request() req,
  ) {
    return this.replaySessionService.completeSession(id, body);
  }

  @Delete('sessions/:id')
  async deleteSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    await this.replaySessionService.deleteSession(id);
    return { message: 'Session deleted successfully' };
  }

  @Post('sessions/:id/abandon')
  async abandonSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    return this.replaySessionService.abandonSession(id);
  }
}
