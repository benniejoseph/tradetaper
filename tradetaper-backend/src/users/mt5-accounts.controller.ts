// src/users/mt5-accounts.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MT5AccountsService } from './mt5-accounts.service';
import {
  CreateMT5AccountDto,
  CreateManualMT5AccountDto,
  UpdateMT5AccountDto,
  MT5AccountResponseDto,
} from './dto/mt5-account.dto';
import { TradeHistoryParserService } from './trade-history-parser.service';
import { TradesService } from '../trades/trades.service';
import {
  UsageLimitGuard,
  UsageFeature,
} from '../subscriptions/guards/usage-limit.guard';

@Controller('mt5-accounts')
@UseGuards(JwtAuthGuard)
// Version: 20260127.v1 - Removed MetaAPI integration, preparing for FTP sync
export class MT5AccountsController {
  constructor(
    private readonly mt5AccountsService: MT5AccountsService,
    private readonly tradeHistoryParserService: TradeHistoryParserService,
    private readonly tradesService: TradesService,
  ) {}

  @Post('create')
  @UseGuards(UsageLimitGuard)
  @UsageFeature('mt5Accounts')
  async create(
    @Request() req,
    @Body() createMT5AccountDto: CreateMT5AccountDto,
  ): Promise<MT5AccountResponseDto> {
    return this.mt5AccountsService.create(createMT5AccountDto, req.user.id);
  }

  @Post('manual')
  @UseGuards(UsageLimitGuard)
  @UsageFeature('mt5Accounts')
  async createManual(
    @Request() req,
    @Body() createMT5AccountDto: CreateManualMT5AccountDto,
  ) {
    // Create account for manual file upload workflow
    const manualAccount = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: req.user.id,
      accountName: createMT5AccountDto.accountName,
      server: createMT5AccountDto.server || 'Manual-Upload',
      login: createMT5AccountDto.login,
      isRealAccount: createMT5AccountDto.isRealAccount || false,
      isManual: true,
      connectionStatus: 'manual',
      balance: 0,
      equity: 0,
      margin: 0,
      freeMargin: 0,
      leverage: 1,
      currency: 'USD',
      trades: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.mt5AccountsService.createManual(manualAccount);
  }

  @Get()
  async findAll(@Request() req): Promise<MT5AccountResponseDto[]> {
    return this.mt5AccountsService.findAllByUser(req.user.id);
  }

  @Get(':id')
  async findOne(
    @Request() req,
    @Param('id') id: string,
  ): Promise<MT5AccountResponseDto> {
    const account = await this.mt5AccountsService.findOne(id);
    if (!account || account.userId !== req.user.id) {
      throw new BadRequestException('MT5 account not found');
    }
    return account as MT5AccountResponseDto;
  }

  @Get(':id/trades/live')
  getLiveTrades() {
    // Return empty array - live trades require Terminal Farm (Phase 2)
    return [];
  }

  @Post(':id/sync')
  @HttpCode(HttpStatus.OK)
  async syncAccount(@Request() req, @Param('id') id: string): Promise<void> {
    const account = await this.mt5AccountsService.findOne(id);
    if (!account || account.userId !== req.user.id) {
      throw new BadRequestException('MT5 account not found');
    }
    await this.mt5AccountsService.syncAccount(id);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string): Promise<void> {
    const account = await this.mt5AccountsService.findOne(id);
    if (!account || account.userId !== req.user.id) {
      throw new BadRequestException('MT5 account not found');
    }
    await this.mt5AccountsService.remove(id);
  }

  /**
   * Get connection/sync status
   */
  @Get(':id/status')
  async getConnectionStatus(@Request() req, @Param('id') id: string) {
    const account = await this.mt5AccountsService.findOne(id);
    if (!account || account.userId !== req.user.id) {
      throw new BadRequestException('MT5 account not found');
    }

    return this.mt5AccountsService.getConnectionStatus(id);
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      syncMethod: 'ftp', // Changed from 'metaapi'
      timestamp: new Date().toISOString(),
    };
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateMT5AccountDto: UpdateMT5AccountDto,
  ): Promise<MT5AccountResponseDto> {
    const account = await this.mt5AccountsService.findOne(id);
    if (!account || account.userId !== req.user.id) {
      throw new BadRequestException('MT5 account not found');
    }
    return this.mt5AccountsService.update(id, updateMT5AccountDto);
  }
}
