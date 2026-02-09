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
  constructor(private readonly tradesService: TradesService) {}

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
}
