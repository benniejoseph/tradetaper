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
  ServiceUnavailableException,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
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
    private readonly configService: ConfigService,
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

  private isTradingViewAdvancedEnabled(): boolean {
    const value = this.configService.get<string>('BACKTEST_TV_ADVANCED_ENABLED');
    if (value == null) return true;

    const raw = value.trim().toLowerCase();
    if (!raw) return true;

    if (
      raw === '0' ||
      raw === 'false' ||
      raw === 'no' ||
      raw === 'off' ||
      raw === 'disabled'
    ) {
      return false;
    }

    return true;
  }

  private getTradingViewGateReason(): string {
    return (
      this.configService.get<string>('BACKTEST_TV_ADVANCED_DISABLED_REASON') ||
      'TradingView Advanced Charts are temporarily disabled pending license approval.'
    );
  }

  private assertTradingViewAdvancedEnabled(): void {
    if (this.isTradingViewAdvancedEnabled()) return;
    throw new ServiceUnavailableException(this.getTradingViewGateReason());
  }

  @Get('tv/status')
  getTradingViewStatus() {
    return {
      enabled: this.isTradingViewAdvancedEnabled(),
      reason: this.getTradingViewGateReason(),
    };
  }

  @Get('tv/config')
  getTradingViewConfig() {
    return {
      supports_search: true,
      supports_group_request: false,
      supports_marks: false,
      supports_timescale_marks: false,
      supports_time: true,
      supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D'],
      advanced_enabled: this.isTradingViewAdvancedEnabled(),
      advanced_disabled_reason: this.getTradingViewGateReason(),
    };
  }

  @Get('tv/time')
  getTradingViewServerTime() {
    this.assertTradingViewAdvancedEnabled();
    return Math.floor(Date.now() / 1000);
  }

  @Get('tv/search')
  async searchTradingViewSymbols(
    @Request() req,
    @Query('query') query?: string,
    @Query('limit') limit?: string,
  ) {
    this.assertTradingViewAdvancedEnabled();
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
    this.assertTradingViewAdvancedEnabled();
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
    @Query('countback') countback?: string,
  ) {
    this.assertTradingViewAdvancedEnabled();
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
    const minValidTime = Math.floor(new Date('2000-01-01T00:00:00.000Z').getTime() / 1000);
    const resolutionSeconds = this.mapTradingViewResolutionToSeconds(resolution);
    const maxBars = this.maxTradingViewBarsForResolution(resolution);
    const parsedCountBack = Number(countback);
    const boundedCountBack = Number.isFinite(parsedCountBack)
      ? Math.min(Math.max(Math.floor(parsedCountBack), 50), maxBars)
      : maxBars;
    const boundedTo = Math.max(safeTo, minValidTime + 1);
    const boundedFrom = Math.max(
      minValidTime,
      Math.max(safeFrom, boundedTo - boundedCountBack * resolutionSeconds),
    );

    const rows = await this.candleManagementService.getCandles(
      normalizedSymbol,
      timeframe,
      new Date(boundedFrom * 1000),
      new Date(boundedTo * 1000),
    );

    let bars = this.normalizeTradingViewBars(rows || [], boundedFrom, boundedTo);

    const rangeSeconds = Math.max(1, boundedTo - boundedFrom);
    const expectedBars = Math.max(
      1,
      Math.floor(rangeSeconds / Math.max(1, resolutionSeconds)),
    );
    const coverageRatio = bars.length / expectedBars;
    const shouldFallbackToOneMinuteAggregation =
      timeframe !== '1m' &&
      rangeSeconds <= 120 * 24 * 60 * 60 && // keep fallback bounded for performance
      (bars.length === 0 ||
        coverageRatio < 0.65 ||
        this.hasTradingViewBarDiscontinuities(bars, resolutionSeconds));

    if (shouldFallbackToOneMinuteAggregation) {
      const oneMinuteRows = await this.candleManagementService.getCandles(
        normalizedSymbol,
        '1m',
        new Date(boundedFrom * 1000),
        new Date(boundedTo * 1000),
      );
      const oneMinuteBars = this.normalizeTradingViewBars(
        oneMinuteRows || [],
        boundedFrom,
        boundedTo,
      );
      const aggregatedBars = this.aggregateTradingViewBarsFromOneMinute(
        oneMinuteBars,
        resolutionSeconds,
        boundedFrom,
        boundedTo,
      );

      if (aggregatedBars.length > 0) {
        bars = aggregatedBars;
      }
    }

    if (bars.length === 0) {
      return { s: 'no_data', nextTime: boundedFrom };
    }

    return {
      s: 'ok',
      t: bars.map((bar) => bar.time),
      o: bars.map((bar) => bar.open),
      h: bars.map((bar) => bar.high),
      l: bars.map((bar) => bar.low),
      c: bars.map((bar) => bar.close),
      v: bars.map((bar) => (Number.isFinite(bar.volume) ? bar.volume : 0)),
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

  @Get('sessions/:id/review-report')
  async getSessionReviewReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('refresh') refresh: string | undefined,
    @Request() req,
  ) {
    const shouldRefresh =
      refresh === '1' || refresh === 'true' || refresh === 'yes';

    return this.replaySessionService.getSessionReviewReport(id, req.user.id, {
      refresh: shouldRefresh,
    });
  }

  @Post('sessions/:id/review-report')
  async generateSessionReviewReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    return this.replaySessionService.generateSessionReviewReport(
      id,
      req.user.id,
    );
  }

  @Get('sessions/:id/review-report/export')
  async exportSessionReviewReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('format') format: string | undefined,
    @Query('refresh') refresh: string | undefined,
    @Request() req,
    @Res() res: Response,
  ) {
    const normalizedFormat = (format || 'json').toLowerCase();
    const exportFormat = normalizedFormat === 'pdf' ? 'pdf' : 'json';
    const shouldRefresh =
      refresh === '1' || refresh === 'true' || refresh === 'yes';

    const exported = await this.replaySessionService.exportSessionReviewReport(
      id,
      req.user.id,
      exportFormat,
      { refresh: shouldRefresh },
    );

    res.setHeader('Content-Type', exported.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exported.filename}"`,
    );
    res.status(HttpStatus.OK).send(exported.content);
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
      openPositions?: Record<string, unknown>[];
      pendingOrders?: Record<string, unknown>[];
      journalEntries?: Record<string, unknown>[];
      endingBalance?: number;
      totalPnl?: number;
      totalTrades?: number;
      winningTrades?: number;
      losingTrades?: number;
      winRate?: number;
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

  private mapTradingViewResolutionToSeconds(resolution?: string): number {
    const r = (resolution || '60').toUpperCase();
    switch (r) {
      case '1':
        return 60;
      case '5':
        return 300;
      case '15':
        return 900;
      case '30':
        return 1800;
      case '60':
      case '1H':
        return 3600;
      case '240':
      case '4H':
        return 14400;
      case '1D':
      case 'D':
        return 86400;
      default:
        return 3600;
    }
  }

  private maxTradingViewBarsForResolution(resolution?: string): number {
    const r = (resolution || '60').toUpperCase();
    switch (r) {
      case '1':
        return 12000;
      case '5':
        return 12000;
      case '15':
        return 12000;
      case '30':
        return 12000;
      case '60':
      case '1H':
        return 15000;
      case '240':
      case '4H':
        return 18000;
      case '1D':
      case 'D':
        return 20000;
      default:
        return 12000;
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

  private getTradingViewSession(symbol: string): string {
    const type = this.getTradingViewSymbolType(symbol);
    if (type === 'crypto') {
      return '24x7';
    }

    // Most non-crypto instruments in this feed follow 24/5 trading.
    return '0000-2359:12345';
  }

  private normalizeTradingViewBars(
    rows: Array<{
      time?: number;
      timestamp?: Date | string | number;
      open?: number;
      high?: number;
      low?: number;
      close?: number;
      volume?: number;
    }>,
    fromSec: number,
    toSec: number,
  ): Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }> {
    if (!Array.isArray(rows) || rows.length === 0) return [];

    const byTime = new Map<
      number,
      {
        time: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
      }
    >();

    for (const row of rows) {
      const rawTime = Number(row?.time);
      const fallbackTimeMs = row?.timestamp ? new Date(row.timestamp).getTime() : NaN;
      const rawSeconds = Number.isFinite(rawTime)
        ? rawTime > 2_000_000_000_000
          ? Math.floor(rawTime / 1000)
          : Math.floor(rawTime)
        : Number.isFinite(fallbackTimeMs)
          ? Math.floor(fallbackTimeMs / 1000)
          : NaN;
      if (!Number.isFinite(rawSeconds)) continue;
      if (rawSeconds < fromSec || rawSeconds > toSec) continue;

      const open = Number(row?.open);
      const high = Number(row?.high);
      const low = Number(row?.low);
      const close = Number(row?.close);
      const volume = Number(row?.volume ?? 0);
      if (
        !Number.isFinite(open) ||
        !Number.isFinite(high) ||
        !Number.isFinite(low) ||
        !Number.isFinite(close)
      ) {
        continue;
      }

      byTime.set(rawSeconds, {
        time: rawSeconds,
        open,
        high: Math.max(high, open, close, low),
        low: Math.min(low, open, close, high),
        close,
        volume: Number.isFinite(volume) ? volume : 0,
      });
    }

    return Array.from(byTime.values()).sort((a, b) => a.time - b.time);
  }

  private aggregateTradingViewBarsFromOneMinute(
    oneMinuteBars: Array<{
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>,
    resolutionSeconds: number,
    fromSec: number,
    toSec: number,
  ): Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }> {
    if (!Array.isArray(oneMinuteBars) || oneMinuteBars.length === 0) return [];

    const bucketSize = Math.max(60, Math.floor(resolutionSeconds));
    const buckets = new Map<
      number,
      {
        time: number;
        open: number;
        high: number;
        low: number;
        close: number;
        volume: number;
      }
    >();

    const sortedBars = [...oneMinuteBars].sort((a, b) => a.time - b.time);
    for (const bar of sortedBars) {
      const barTime = Math.floor(Number(bar.time));
      if (!Number.isFinite(barTime)) continue;
      if (barTime < fromSec || barTime > toSec) continue;

      const bucketTime = Math.floor(barTime / bucketSize) * bucketSize;
      if (bucketTime < fromSec || bucketTime > toSec) continue;
      const volume = Number(bar.volume ?? 0);
      const existing = buckets.get(bucketTime);
      if (!existing) {
        buckets.set(bucketTime, {
          time: bucketTime,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: Number.isFinite(volume) ? volume : 0,
        });
        continue;
      }

      existing.high = Math.max(existing.high, bar.high, bar.open, bar.close);
      existing.low = Math.min(existing.low, bar.low, bar.open, bar.close);
      existing.close = bar.close;
      existing.volume += Number.isFinite(volume) ? volume : 0;
    }

    return Array.from(buckets.values()).sort((a, b) => a.time - b.time);
  }

  private hasTradingViewBarDiscontinuities(
    bars: Array<{ time: number }>,
    resolutionSeconds: number,
  ): boolean {
    if (!Array.isArray(bars) || bars.length < 25) return false;

    const sortedBars = [...bars].sort((a, b) => a.time - b.time);
    const interval = Math.max(60, Math.floor(resolutionSeconds));
    let irregularTransitions = 0;
    let severeTransitions = 0;

    for (let i = 1; i < sortedBars.length; i++) {
      const prev = Number(sortedBars[i - 1]?.time);
      const curr = Number(sortedBars[i]?.time);
      if (!Number.isFinite(prev) || !Number.isFinite(curr)) {
        irregularTransitions += 1;
        continue;
      }

      const delta = curr - prev;
      if (delta <= 0) {
        irregularTransitions += 1;
        continue;
      }

      const ratio = delta / interval;
      if (ratio > 1.5) {
        irregularTransitions += 1;
      }
      if (ratio > 8) {
        severeTransitions += 1;
      }
    }

    const irregularThreshold = Math.max(4, Math.floor(sortedBars.length * 0.2));
    const severeThreshold = Math.max(3, Math.floor(sortedBars.length * 0.08));
    return (
      irregularTransitions >= irregularThreshold ||
      severeTransitions >= severeThreshold
    );
  }

  private buildTradingViewSymbolInfo(symbol: string) {
    return {
      name: symbol,
      ticker: symbol,
      full_name: `TradeTaper:${symbol}`,
      description: `${symbol} (TradeTaper Backtesting Feed)`,
      type: this.getTradingViewSymbolType(symbol),
      session: this.getTradingViewSession(symbol),
      exchange: 'TradeTaper',
      listed_exchange: 'TradeTaper',
      timezone: 'Etc/UTC',
      minmov: 1,
      pricescale: this.getTradingViewPriceScale(symbol),
      has_intraday: true,
      has_daily: true,
      has_weekly_and_monthly: false,
      has_no_volume: false,
      has_empty_bars: false,
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
