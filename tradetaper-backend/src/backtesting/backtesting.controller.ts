import {
  Controller,
  Get,
  Post,
  Put,
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
import {
  FeatureAccessGuard,
  RequireFeature,
} from '../subscriptions/guards/feature-access.guard';

@Controller('backtesting')
@UseGuards(JwtAuthGuard, FeatureAccessGuard)
@RequireFeature('backtesting')
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

  // ============ TRADINGVIEW ADVANCED DATAFEED (UDF-LIKE) ============

  @Get('tv/config')
  getTradingViewConfig() {
    return {
      supports_search: true,
      supports_group_request: false,
      supports_marks: false,
      supports_timescale_marks: false,
      supports_time: true,
      supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D'],
    };
  }

  @Get('tv/time')
  getTradingViewServerTime() {
    return Math.floor(Date.now() / 1000);
  }

  @Get('tv/search')
  async searchTradingViewSymbols(
    @Request() req,
    @Query('query') query?: string,
    @Query('limit') limit?: string,
  ) {
    const q = (query || '').trim().toUpperCase();
    const max = Math.min(Math.max(parseInt(limit || '20', 10) || 20, 1), 50);
    const symbols = await this.getTradingViewSymbolUniverse(req.user.id);

    return symbols
      .filter((symbol) => !q || symbol.includes(q))
      .slice(0, max)
      .map((symbol) => ({
        symbol,
        full_name: `TradeTaper:${symbol}`,
        description: `${symbol} (TradeTaper Backtesting Feed)`,
        exchange: 'TradeTaper',
        ticker: symbol,
        type: this.getTradingViewSymbolType(symbol),
      }));
  }

  @Get('tv/symbols')
  async resolveTradingViewSymbol(
    @Request() req,
    @Query('symbol') symbol?: string,
  ) {
    const normalized = this.normalizeTradingViewSymbol(symbol);
    const symbols = await this.getTradingViewSymbolUniverse(req.user.id);
    const resolvedSymbol =
      symbols.find((s) => s === normalized) || normalized || 'XAUUSD';

    return this.buildTradingViewSymbolInfo(resolvedSymbol);
  }

  @Get('tv/history')
  async getTradingViewHistory(
    @Request() req,
    @Query('symbol') symbol?: string,
    @Query('resolution') resolution?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const normalizedSymbol = this.normalizeTradingViewSymbol(symbol);
    const timeframe = this.mapTradingViewResolutionToTimeframe(resolution);
    const fromSec = Number(from);
    const toSec = Number(to);

    if (
      !normalizedSymbol ||
      !Number.isFinite(fromSec) ||
      !Number.isFinite(toSec)
    ) {
      return { s: 'error', errmsg: 'Invalid history query params' };
    }

    const safeFrom = Math.max(0, Math.floor(fromSec));
    const safeTo = Math.max(safeFrom + 1, Math.floor(toSec));

    const rows = await this.candleManagementService.getCandles(
      normalizedSymbol,
      timeframe,
      new Date(safeFrom * 1000),
      new Date(safeTo * 1000),
    );

    const bars = (rows || [])
      .filter((row) => Number.isFinite(Number(row?.time)))
      .map((row) => ({
        time: Number(row.time),
        open: Number(row.open),
        high: Number(row.high),
        low: Number(row.low),
        close: Number(row.close),
      }))
      .filter(
        (bar) =>
          Number.isFinite(bar.open) &&
          Number.isFinite(bar.high) &&
          Number.isFinite(bar.low) &&
          Number.isFinite(bar.close),
      )
      .sort((a, b) => a.time - b.time);

    if (bars.length === 0) {
      return { s: 'no_data', nextTime: safeFrom };
    }

    return {
      s: 'ok',
      t: bars.map((bar) => bar.time),
      o: bars.map((bar) => bar.open),
      h: bars.map((bar) => bar.high),
      l: bars.map((bar) => bar.low),
      c: bars.map((bar) => bar.close),
      v: bars.map(() => 0),
    };
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
    return this.replaySessionService.getSession(id, req.user.id);
  }

  @Get('sessions/:id/chart-layout')
  async getSessionChartLayout(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    const layout = await this.replaySessionService.getChartLayout(id, req.user.id);
    return { layout };
  }

  @Put('sessions/:id/chart-layout')
  async saveSessionChartLayout(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { layout?: Record<string, unknown> | null },
    @Request() req,
  ) {
    const layout = await this.replaySessionService.saveChartLayout(
      id,
      req.user.id,
      body?.layout || null,
    );

    return { layout };
  }

  @Patch('sessions/:id')
  async updateSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      trades?: Record<string, unknown>[];
      endingBalance?: number;
      totalPnl?: number;
      status?: 'in_progress' | 'completed' | 'abandoned';
    },
    @Request() req,
  ) {
    return this.replaySessionService.updateSession(id, req.user.id, body);
  }

  @Post('sessions/:id/complete')
  async completeSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { endingBalance: number; trades: Record<string, unknown>[] },
    @Request() req,
  ) {
    return this.replaySessionService.completeSession(id, req.user.id, body);
  }

  @Delete('sessions/:id')
  async deleteSession(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    await this.replaySessionService.deleteSession(id, req.user.id);
    return { message: 'Session deleted successfully' };
  }

  @Post('sessions/:id/abandon')
  async abandonSession(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.replaySessionService.abandonSession(id, req.user.id);
  }

  private normalizeTradingViewSymbol(symbol?: string): string {
    if (!symbol) return '';
    const upper = symbol.trim().toUpperCase();
    const value = upper.includes(':') ? upper.split(':').pop() || upper : upper;
    return value.replace(/[^A-Z0-9._-]/g, '');
  }

  private mapTradingViewResolutionToTimeframe(resolution?: string): string {
    const r = (resolution || '60').toUpperCase();
    switch (r) {
      case '1':
        return '1m';
      case '5':
        return '5m';
      case '15':
        return '15m';
      case '30':
        return '30m';
      case '60':
      case '1H':
        return '1h';
      case '240':
      case '4H':
        return '4h';
      case '1D':
      case 'D':
        return '1d';
      default:
        return '1h';
    }
  }

  private getTradingViewSymbolType(symbol: string): string {
    if (symbol.startsWith('XAU') || symbol.startsWith('XAG')) return 'metal';
    if (
      symbol.startsWith('US') ||
      symbol.startsWith('NAS') ||
      symbol.startsWith('SPX') ||
      symbol.startsWith('DJ')
    ) {
      return 'index';
    }
    if (symbol.endsWith('USD') && symbol.length >= 6) return 'forex';
    if (symbol.startsWith('BTC') || symbol.startsWith('ETH')) return 'crypto';
    return 'forex';
  }

  private getTradingViewPriceScale(symbol: string): number {
    if (symbol.endsWith('JPY')) return 1000;
    if (symbol.startsWith('XAU') || symbol.startsWith('XAG')) return 100;
    if (symbol.startsWith('US') || symbol.startsWith('NAS') || symbol.startsWith('SPX')) {
      return 100;
    }
    return 100000;
  }

  private buildTradingViewSymbolInfo(symbol: string) {
    return {
      name: symbol,
      ticker: symbol,
      full_name: `TradeTaper:${symbol}`,
      description: `${symbol} (TradeTaper Backtesting Feed)`,
      type: this.getTradingViewSymbolType(symbol),
      session: '24x7',
      exchange: 'TradeTaper',
      listed_exchange: 'TradeTaper',
      timezone: 'Etc/UTC',
      minmov: 1,
      pricescale: this.getTradingViewPriceScale(symbol),
      has_intraday: true,
      has_daily: true,
      has_weekly_and_monthly: false,
      has_no_volume: false,
      supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D'],
      volume_precision: 2,
      data_status: 'streaming',
    };
  }

  private async getTradingViewSymbolUniverse(userId: string): Promise<string[]> {
    const defaults = [
      'XAUUSD',
      'XAGUSD',
      'EURUSD',
      'GBPUSD',
      'USDJPY',
      'AUDUSD',
      'USDCAD',
      'USDCHF',
      'NZDUSD',
      'US100',
      'US500',
      'US30',
      'BTCUSD',
      'ETHUSD',
    ];
    const userSymbols = await this.backtestingService.getDistinctSymbols(userId);
    return Array.from(
      new Set(
        [...defaults, ...(userSymbols || [])]
          .map((s) => this.normalizeTradingViewSymbol(s))
          .filter(Boolean),
      ),
    );
  }
}
