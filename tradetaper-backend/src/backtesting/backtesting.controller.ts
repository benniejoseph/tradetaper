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
} from '@nestjs/common';
import { BacktestingService } from './backtesting.service';
import { CreateBacktestTradeDto } from './dto/create-backtest-trade.dto';
import { UpdateBacktestTradeDto } from './dto/update-backtest-trade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('backtesting')
@UseGuards(JwtAuthGuard)
export class BacktestingController {
  constructor(private readonly backtestingService: BacktestingService) {}

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
  ) {
    return this.backtestingService.findAll(req.user.id, {
      strategyId,
      symbol,
      session,
      timeframe,
      outcome,
      startDate,
      endDate,
    });
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
    @Param('dimension') dimension: 'symbol' | 'session' | 'timeframe' | 'killZone' | 'dayOfWeek' | 'setupType',
    @Request() req,
  ) {
    return this.backtestingService.getStatsByDimension(strategyId, req.user.id, dimension);
  }

  @Get('strategies/:strategyId/matrix')
  async getPerformanceMatrix(
    @Param('strategyId', ParseUUIDPipe) strategyId: string,
    @Query('rows') rowDimension: 'session' | 'timeframe' | 'killZone' | 'dayOfWeek' = 'session',
    @Query('columns') columnDimension: 'symbol' | 'session' | 'timeframe' = 'symbol',
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

  @Get('symbols')
  async getSymbols(@Request() req) {
    return this.backtestingService.getDistinctSymbols(req.user.id);
  }
}
