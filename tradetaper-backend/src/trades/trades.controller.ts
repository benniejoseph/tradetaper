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
} from '@nestjs/common';
import { TradesService } from './trades.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Trade } from './entities/trade.entity';

@UseGuards(JwtAuthGuard)
@Controller('trades')
export class TradesController {
  constructor(private readonly tradesService: TradesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createTradeDto: CreateTradeDto,
    @Request() req,
  ): Promise<Trade> {
    return this.tradesService.create(createTradeDto, req.user);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('accountId') accountId?: string,
  ): Promise<Trade[]> {
    return this.tradesService.findAll(req.user, accountId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ): Promise<Trade> {
    return this.tradesService.findOne(id, req.user);
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
  @HttpCode(HttpStatus.CREATED)
  bulkImport(
    @Body() body: { trades: CreateTradeDto[] },
    @Request() req,
  ): Promise<{ importedCount: number; trades: Trade[] }> {
    return this.tradesService.bulkImport(body.trades, req.user);
  }
}
