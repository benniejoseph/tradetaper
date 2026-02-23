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
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
  Logger, // New import
} from '@nestjs/common';
import { TradesService } from './trades.service';
import { PerformanceService } from './performance.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Trade } from './entities/trade.entity';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import {
  UsageLimitGuard,
  UsageFeature,
} from '../subscriptions/guards/usage-limit.guard';

@UseGuards(JwtAuthGuard)
@Controller('trades')
export class TradesController {
  private readonly logger = new Logger(TradesController.name); // New logger
  constructor(
    private readonly tradesService: TradesService,
    private readonly performanceService: PerformanceService,
  ) {}

  @Post()
  @UseGuards(UsageLimitGuard)
  @UsageFeature('trades')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createTradeDto: CreateTradeDto,
    @Request() req,
  ): Promise<Trade> {
    this.logger.debug(
      `📥 Received create trade request: ${JSON.stringify(createTradeDto)}`,
    );
    this.logger.debug(`👤 User: ${req.user?.email || req.user?.id}`);
    return this.tradesService.create(createTradeDto, req.user);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('accountId') accountId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedResponseDto<Trade>> {
    // Ensure limit doesn't exceed a max value to prevent abuse
    // Increase max limit to support full analytics
    const safeLimit = Math.min(5000, limit);
    return this.tradesService.findAll(
      req.user,
      accountId,
      undefined,
      page,
      safeLimit,
    );
  }

  @Get('list')
  findAllLite(
    @Request() req,
    @Query('accountId') accountId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('includeTags') includeTags = 'false',
    @Query('status') status?: string,
    @Query('direction') direction?: string,
    @Query('assetType') assetType?: string,
    @Query('symbol') symbol?: string,
    @Query('search') search?: string,
    @Query('from') dateFrom?: string,
    @Query('to') dateTo?: string,
    @Query('isStarred') isStarred?: string,
    @Query('minPnl') minPnl?: string,
    @Query('maxPnl') maxPnl?: string,
    @Query('minDuration') minDuration?: string,
    @Query('maxDuration') maxDuration?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: string,
  ): Promise<PaginatedResponseDto<Trade>> {
    const safeLimit = Math.min(1000, Number(limit) || 10);
    return this.tradesService.findAllLite(
      req.user,
      accountId,
      Number(page) || 1,
      safeLimit,
      includeTags === 'true',
      {
        status,
        direction,
        assetType,
        symbol,
        search,
        dateFrom,
        dateTo,
        isStarred: isStarred === 'true',
        minPnl: minPnl ? Number(minPnl) : undefined,
        maxPnl: maxPnl ? Number(maxPnl) : undefined,
        minDuration: minDuration ? Number(minDuration) : undefined,
        maxDuration: maxDuration ? Number(maxDuration) : undefined,
        sortBy,
        sortDir,
      },
    );
  }

  @Get('summary')
  getSummary(
    @Request() req,
    @Query('accountId') accountId?: string,
    @Query('from') dateFrom?: string,
    @Query('to') dateTo?: string,
    @Query('status') status?: string,
    @Query('direction') direction?: string,
    @Query('assetType') assetType?: string,
    @Query('symbol') symbol?: string,
    @Query('search') search?: string,
    @Query('isStarred') isStarred?: string,
    @Query('minPnl') minPnl?: string,
    @Query('maxPnl') maxPnl?: string,
    @Query('minDuration') minDuration?: string,
    @Query('maxDuration') maxDuration?: string,
  ) {
    return this.performanceService.getPerformanceMetrics(
      req.user,
      accountId,
      dateFrom,
      dateTo,
      {
        status,
        direction,
        assetType,
        symbol,
        search,
        isStarred: isStarred === 'true',
        minPnl: minPnl ? Number(minPnl) : undefined,
        maxPnl: maxPnl ? Number(maxPnl) : undefined,
        minDuration: minDuration ? Number(minDuration) : undefined,
        maxDuration: maxDuration ? Number(maxDuration) : undefined,
      },
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<Trade> {
    return this.tradesService.findOne(id, req.user);
  }

  @Get(':id/candles')
  getCandles(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('timeframe') timeframe: string,
    @Request() req,
  ) {
    return this.tradesService.getTradeCandles(id, timeframe || '1h', req.user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTradeDto: UpdateTradeDto,
    @Request() req,
  ): Promise<Trade> {
    this.logger.debug(`📥 Received update trade ${id} payload: ${JSON.stringify(updateTradeDto)}`);
    return this.tradesService.update(id, updateTradeDto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<void> {
    return this.tradesService.remove(id, req.user);
  }

  // Bulk operations
  @Post('bulk/delete')
  @HttpCode(HttpStatus.OK)
  bulkDelete(
    @Body() body: { tradeIds: string[] },
    @Request() req,
  ): Promise<{ deletedCount: number }> {
    return this.tradesService.bulkDelete(body.tradeIds, req.user);
  }

  @Post('bulk/update')
  @HttpCode(HttpStatus.OK)
  bulkUpdate(
    @Body() body: { updates: { id: string; data: Partial<UpdateTradeDto> }[] },
    @Request() req,
  ): Promise<{ updatedCount: number; trades: Trade[] }> {
    return this.tradesService.bulkUpdate(body.updates, req.user);
  }

  @Post('bulk/import')
  @UseGuards(UsageLimitGuard)
  @UsageFeature('trades')
  @HttpCode(HttpStatus.CREATED)
  bulkImport(
    @Body() body: { trades: CreateTradeDto[] },
    @Request() req,
  ): Promise<{ importedCount: number; trades: Trade[] }> {
    return this.tradesService.bulkImport(body.trades, req.user);
  }

  @Post('maintenance/merge-duplicates')
  @HttpCode(HttpStatus.OK)
  mergeDuplicates(
    @Request() req,
    @Query('accountId') accountId?: string,
  ): Promise<{ merged: number; totalDuplicates: number }> {
    return this.tradesService.mergeDuplicateExternalTradesForUser(
      req.user.id,
      accountId,
    );
  }
}
