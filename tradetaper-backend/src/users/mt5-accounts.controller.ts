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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MT5AccountsService } from './mt5-accounts.service';
import {
  MetaApiService,
  MT5AccountCredentials,
  HistoricalTradeFilter,
} from './metaapi.service';
import {
  CreateMT5AccountDto,
  CreateManualMT5AccountDto,
  UpdateMT5AccountDto,
  TradeHistoryUploadResponse,
} from './dto/mt5-account.dto';
import { TradeHistoryParserService } from './trade-history-parser.service';
import { TradesService } from '../trades/trades.service';
import { CreateTradeDto } from '../trades/dto/create-trade.dto';
import {
  AssetType,
  TradeDirection,
  TradeStatus,
} from '../trades/entities/trade.entity';

@Controller('mt5-accounts')
@UseGuards(JwtAuthGuard)
export class MT5AccountsController {
  constructor(
    private readonly mt5AccountsService: MT5AccountsService,
    private readonly metaApiService: MetaApiService,
    private readonly tradeHistoryParserService: TradeHistoryParserService,
    private readonly tradesService: TradesService,
  ) {}

  @Post()
  async create(
    @Request() req,
    @Body() createMT5AccountDto: CreateMT5AccountDto,
  ) {
    // Use MetaApi service to create account
    const credentials: MT5AccountCredentials = {
      accountName: createMT5AccountDto.accountName,
      server: createMT5AccountDto.server,
      login: createMT5AccountDto.login,
      password: createMT5AccountDto.password,
      isRealAccount: createMT5AccountDto.isRealAccount || false,
    };

    return this.metaApiService.addMT5Account(req.user.id, credentials);
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
  async findAll(@Request() req) {
    return this.mt5AccountsService.findAllByUser(req.user.id);
  }

  @Get('servers')
  async getServers() {
    return this.metaApiService.getAvailableServers();
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const account = await this.mt5AccountsService.findOne(id);

    if (!account) {
      throw new NotFoundException('MT5 account not found');
    }

    if (account.userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to access this account',
      );
    }

    return account;
  }

  @Get(':id/status')
  async getAccountStatus(@Request() req, @Param('id') id: string) {
    const account = await this.mt5AccountsService.findOne(id);

    if (!account) {
      throw new NotFoundException('MT5 account not found');
    }

    if (account.userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to access this account',
      );
    }

    return this.metaApiService.getAccountStatus(id);
  }

  @Get(':id/historical-trades')
  async getHistoricalTrades(
    @Request() req,
    @Param('id') id: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    const account = await this.mt5AccountsService.findOne(id);

    if (!account) {
      throw new NotFoundException('MT5 account not found');
    }

    if (account.userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to access this account',
      );
    }

    const filter: HistoricalTradeFilter = {
      fromDate: startTime ? new Date(startTime) : undefined,
      toDate: endTime ? new Date(endTime) : undefined,
      symbol: undefined,
      type: undefined,
    };

    return this.metaApiService.getHistoricalTrades(id, filter);
  }

  @Get(':id/live-data')
  async getLiveTradeData(@Request() req, @Param('id') id: string) {
    const account = await this.mt5AccountsService.findOne(id);

    if (!account) {
      throw new NotFoundException('MT5 account not found');
    }

    if (account.userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to access this account',
      );
    }

    return this.metaApiService.getLiveTradeData(id);
  }

  @Post(':id/connect')
  async connectAccount(@Request() req, @Param('id') id: string) {
    const account = await this.mt5AccountsService.findOne(id);

    if (!account) {
      throw new NotFoundException('MT5 account not found');
    }

    if (account.userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to connect this account',
      );
    }

    await this.metaApiService.connectAccount(id);
    return { message: 'Account connection initiated' };
  }

  @Post(':id/start-streaming')
  async startStreaming(@Request() req, @Param('id') id: string) {
    const account = await this.mt5AccountsService.findOne(id);

    if (!account) {
      throw new NotFoundException('MT5 account not found');
    }

    if (account.userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to start streaming for this account',
      );
    }

    await this.metaApiService.startStreaming(id);
    return { message: 'Streaming started successfully' };
  }

  @Post(':id/stop-streaming')
  async stopStreaming(@Request() req, @Param('id') id: string) {
    const account = await this.mt5AccountsService.findOne(id);

    if (!account) {
      throw new NotFoundException('MT5 account not found');
    }

    if (account.userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to stop streaming for this account',
      );
    }

    await this.metaApiService.stopStreaming(id);
    return { message: 'Streaming stopped successfully' };
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateMT5AccountDto: UpdateMT5AccountDto,
  ) {
    const account = await this.mt5AccountsService.findOne(id);

    if (!account) {
      throw new NotFoundException('MT5 account not found');
    }

    if (account.userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to update this account',
      );
    }

    return this.mt5AccountsService.update(id, updateMT5AccountDto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    const account = await this.mt5AccountsService.findOne(id);

    if (!account) {
      throw new NotFoundException('MT5 account not found');
    }

    if (account.userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to delete this account',
      );
    }

    // Check if this is a manual account or MetaApi account
    if (account.metadata?.isManual || account.connectionStatus === 'manual') {
      // For manual accounts, delete directly from database
      await this.mt5AccountsService.remove(id);
    } else {
      // For MetaApi accounts, use MetaApi service to remove account
      await this.metaApiService.removeMT5Account(id, req.user.id);
    }

    return { message: 'Account removed successfully' };
  }

  @Post(':id/sync')
  async syncAccount(@Request() req, @Param('id') id: string) {
    const account = await this.mt5AccountsService.findOne(id);

    if (!account) {
      throw new NotFoundException('MT5 account not found');
    }

    if (account.userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to sync this account',
      );
    }

    return this.mt5AccountsService.syncAccount(id);
  }

  @Post(':id/import-trades')
  async importTrades(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { fromDate: string; toDate: string },
  ) {
    const account = await this.mt5AccountsService.findOne(id);

    if (!account) {
      throw new NotFoundException('MT5 account not found');
    }

    if (account.userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to import trades from this account',
      );
    }

    const fromDate = new Date(body.fromDate);
    const toDate = new Date(body.toDate);

    // Use MetaApi service for trade import
    const filter: HistoricalTradeFilter = {
      fromDate: fromDate,
      toDate: toDate,
    };

    const trades = await this.metaApiService.getHistoricalTrades(id, filter);
    return {
      message: 'Trades imported successfully',
      count: trades.length,
      trades,
    };
  }

  @Post(':id/validate')
  async validateConnection(@Request() req, @Param('id') id: string) {
    const account = await this.mt5AccountsService.findOne(id);

    if (!account) {
      throw new NotFoundException('MT5 account not found');
    }

    if (account.userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to validate this account',
      );
    }

    try {
      await this.metaApiService.connectAccount(id);
      return { valid: true, message: 'Connection validation successful' };
    } catch (error) {
      return {
        valid: false,
        message: `Connection validation failed: ${error.message}`,
      };
    }
  }

  @Post(':id/upload-trade-history')
  @UseInterceptors(FileInterceptor('file'))
  async uploadTradeHistory(
    @Request() req,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<TradeHistoryUploadResponse> {
    const account = await this.mt5AccountsService.findOne(id);

    if (!account) {
      throw new NotFoundException('MT5 account not found');
    }

    if (account.userId !== req.user.id) {
      throw new ForbiddenException(
        'You do not have permission to upload trade history for this account',
      );
    }

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Determine file type from extension
    const fileName = file.originalname.toLowerCase();
    let fileType: 'html' | 'xlsx';

    if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
      fileType = 'html';
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      fileType = 'xlsx';
    } else {
      throw new BadRequestException(
        'Unsupported file type. Please upload HTML or Excel (.xlsx) files only.',
      );
    }

    try {
      // Parse the uploaded file
      const parseResult =
        await this.tradeHistoryParserService.parseTradeHistory(
          file.buffer,
          fileType,
          file.originalname,
        );

      const {
        trades,
        accountBalance,
        accountCurrency,
        totalNetProfit,
        equity,
      } = parseResult;

      if (trades.length === 0) {
        return {
          success: false,
          message: 'No valid trades found in the uploaded file',
          tradesImported: 0,
          errors: ['No trade data could be extracted from the file'],
          accountBalance,
          accountCurrency,
          totalNetProfit,
          equity,
        };
      }

      // Convert MT5 trades to CreateTradeDto format
      const tradesDtos = this.convertMT5TradesToCreateTradeDto(trades, id);

      // Save trades to database using TradesService
      const importResult = await this.tradesService.bulkImport(
        tradesDtos,
        req.user,
      );

      return {
        success: true,
        message: `Successfully imported ${importResult.importedCount} trades from ${file.originalname}`,
        tradesImported: importResult.importedCount,
        trades: trades, // Return original parsed data for display
        accountBalance,
        accountCurrency,
        totalNetProfit,
        equity,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to parse trade history: ${error.message}`,
        tradesImported: 0,
        errors: [error.message],
        accountBalance: undefined,
        accountCurrency: undefined,
        totalNetProfit: undefined,
        equity: undefined,
      };
    }
  }

  @Get('health')
  async healthCheck() {
    return this.metaApiService.healthCheck();
  }

  /**
   * Convert parsed MT5 trade data to CreateTradeDto format
   */
  private convertMT5TradesToCreateTradeDto(
    parsedTrades: any[],
    accountId: string,
  ): CreateTradeDto[] {
    return parsedTrades.map((trade) => {
      // Determine asset type based on symbol
      let assetType: AssetType = AssetType.FOREX; // Default for MT5
      if (
        trade.symbol.includes('USD') ||
        trade.symbol.includes('EUR') ||
        trade.symbol.includes('GBP') ||
        trade.symbol.includes('JPY')
      ) {
        assetType = AssetType.FOREX;
      }

      // Convert MT5 trade type to our trade direction
      const direction =
        trade.type === 'buy' ? TradeDirection.LONG : TradeDirection.SHORT;

      // MT5 trades are already closed when we import from history
      const status = TradeStatus.CLOSED;

      const dto: CreateTradeDto = {
        assetType,
        symbol: trade.symbol,
        direction,
        status,
        entryDate: trade.openTime.toISOString(),
        entryPrice: trade.openPrice,
        exitDate: trade.closeTime.toISOString(),
        exitPrice: trade.closePrice,
        quantity: trade.volume,
        commission: Math.abs(trade.commission || 0) + Math.abs(trade.swap || 0), // Include swap as part of commission
        notes:
          trade.comment ||
          `Imported from MT5 - Position ID: ${trade.positionId}`,
        accountId: accountId, // Link to the MT5 account
      };

      return dto;
    });
  }
}
