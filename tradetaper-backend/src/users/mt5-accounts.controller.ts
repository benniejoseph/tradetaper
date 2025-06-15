// src/users/mt5-accounts.controller.ts
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
  ForbiddenException,
  NotFoundException,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MT5AccountsService } from './mt5-accounts.service';
import {
  CreateMT5AccountDto,
  CreateManualMT5AccountDto,
  UpdateMT5AccountDto,
  TradeHistoryUploadResponse,
  MT5AccountResponseDto,
} from './dto/mt5-account.dto';
import { TradeHistoryParserService } from './trade-history-parser.service';
import { TradesService } from '../trades/trades.service';
import { CreateTradeDto } from '../trades/dto/create-trade.dto';
import {
  AssetType,
  TradeDirection,
  TradeStatus,
} from '../types/enums';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Trade } from '../trades/entities/trade.entity';

@Controller('mt5-accounts')
@UseGuards(JwtAuthGuard)
export class MT5AccountsController {
  constructor(
    private readonly mt5AccountsService: MT5AccountsService,
    private readonly tradeHistoryParserService: TradeHistoryParserService,
    private readonly tradesService: TradesService,
  ) {}

  @Post()
  async create(
    @Request() req,
    @Body() createMT5AccountDto: CreateMT5AccountDto,
  ): Promise<MT5AccountResponseDto> {
    // Create account without MetaApi integration (for file upload alternative)
    return this.mt5AccountsService.create(createMT5AccountDto, req.user);
  }

  @Post('manual')
  async createManual(
    @Request() req,
    @Body() createMT5AccountDto: CreateManualMT5AccountDto,
  ) {
    // Create account without MetaApi integration (for file upload alternative)
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

    // Save to database via service
    return this.mt5AccountsService.createManual(manualAccount);
  }

  @Get()
  async findAll(@Request() req): Promise<MT5AccountResponseDto[]> {
    return this.mt5AccountsService.findAllByUser(req.user.id);
  }

  @Get('servers')
  async getAvailableServers() {
    // Return mock servers for now
    return [
      { name: 'ICMarkets-Demo', region: 'new-york' },
      { name: 'ICMarkets-Live', region: 'new-york' },
      { name: 'Pepperstone-Demo', region: 'london' },
      { name: 'Pepperstone-Live', region: 'london' },
    ];
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

  @Get(':id/status')
  async getAccountStatus(@Param('id') id: string) {
    // Return mock status for now
    return {
      id,
      connectionStatus: 'DISCONNECTED',
      deploymentState: 'NOT_DEPLOYED',
      connectionState: 'DISCONNECTED',
      lastSyncAt: null,
    };
  }

  @Get(':id/trades')
  async getHistoricalTrades(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    // Return empty array for now
    return [];
  }

  @Get(':id/trades/live')
  async getLiveTrades(@Param('id') id: string) {
    // Return empty array for now
    return [];
  }

  @Post(':id/connect')
  @HttpCode(HttpStatus.OK)
  async connectAccount(@Param('id') id: string) {
    return { 
      message: 'MetaApi connection is temporarily disabled',
      status: 'disabled' 
    };
  }

  @Post(':id/stream/start')
  @HttpCode(HttpStatus.OK)
  async startStreaming(@Param('id') id: string) {
    return { 
      message: 'MetaApi streaming is temporarily disabled',
      status: 'disabled' 
    };
  }

  @Post(':id/stream/stop')
  @HttpCode(HttpStatus.OK)
  async stopStreaming(@Param('id') id: string) {
    return { 
      message: 'MetaApi streaming is temporarily disabled',
      status: 'disabled' 
    };
  }

  @Post(':id/sync')
  async syncAccount(
    @Request() req,
    @Param('id') id: string,
  ): Promise<MT5AccountResponseDto> {
    const account = await this.mt5AccountsService.findOne(id);
    if (!account || account.userId !== req.user.id) {
      throw new BadRequestException('MT5 account not found');
    }
    return this.mt5AccountsService.syncAccount(id);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string): Promise<void> {
    const account = await this.mt5AccountsService.findOne(id);
    if (!account || account.userId !== req.user.id) {
      throw new BadRequestException('MT5 account not found');
    }

    // Check if this is a manual account or MetaApi account
    const isManualAccount =
      account.metadata?.isManual || account.connectionStatus === 'manual';

    if (!isManualAccount) {
      throw new BadRequestException('MetaApi account removal is temporarily disabled');
    } else {
      // For manual accounts, just remove from database
      await this.mt5AccountsService.remove(id);
    }
  }

  @Post(':id/import-trades')
  async importTrades(
    @Request() req,
    @Param('id') id: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    const account = await this.mt5AccountsService.findOne(id);
    if (!account || account.userId !== req.user.id) {
      throw new BadRequestException('MT5 account not found');
    }

    // For manual accounts, return error
    throw new BadRequestException(
      'Trade import is not available for manual accounts. Please upload trade history file instead.',
    );
  }

  @Post(':id/reconnect')
  async reconnectAccount(@Request() req, @Param('id') id: string) {
    const account = await this.mt5AccountsService.findOne(id);
    if (!account || account.userId !== req.user.id) {
      throw new BadRequestException('MT5 account not found');
    }

    return { 
      message: 'MetaApi reconnection is temporarily disabled',
      status: 'disabled' 
    };
  }

  // TEMPORARY: Comment out upload-history endpoint due to type issues
  /*
  @Post(':id/upload-history')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/trade-history',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(csv|html|htm)$/)) {
          return cb(
            new BadRequestException(
              'Only CSV and HTML files are allowed for trade history',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadTradeHistory(
    @Request() req,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const account = await this.mt5AccountsService.findOne(id);
    if (!account || account.userId !== req.user.id) {
      throw new BadRequestException('MT5 account not found');
    }

    try {
      // Parse the trade history file
      const parsedResult =
        await this.tradeHistoryParserService.parseTradeHistory(
          file.path,
          file.mimetype,
        );

      // Convert parsed trades to our trade format and save them
      const savedTrades: Trade[] = [];
      for (const parsedTrade of parsedResult.trades) {
        const createTradeDto: CreateTradeDto = {
          symbol: parsedTrade.symbol,
          side: parsedTrade.type.toLowerCase() === 'buy' ? TradeDirection.LONG : TradeDirection.SHORT,
          quantity: parsedTrade.volume,
          openPrice: parsedTrade.openPrice,
          closePrice: parsedTrade.closePrice,
          openTime: parsedTrade.openTime.toISOString(),
          closeTime: parsedTrade.closeTime ? parsedTrade.closeTime.toISOString() : undefined,
          profitOrLoss: parsedTrade.profit,
          commission: parsedTrade.commission,
          swap: parsedTrade.swap,
          status: parsedTrade.closeTime ? TradeStatus.CLOSED : TradeStatus.OPEN,
          accountId: id,
          notes: `Imported from ${file.originalname}`,
          metadata: {
            originalOrderId: parsedTrade.positionId,
            importedFrom: file.originalname,
            importedAt: new Date().toISOString(),
          },
        };

        const savedTrade = await this.tradesService.create(
          createTradeDto,
          req.user,
        );
        savedTrades.push(savedTrade);
      }

      return {
        message: `Successfully imported ${savedTrades.length} trades from ${file.originalname}`,
        tradesImported: savedTrades.length,
        trades: savedTrades,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to parse trade history: ${error.message}`,
      );
    }
  }
  */

  @Get('health/check')
  async healthCheck() {
    return {
      status: 'healthy',
      message: 'MT5 Accounts service is running (MetaApi disabled)',
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
