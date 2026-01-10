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
  Query,
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

@Controller('mt5-accounts')
@UseGuards(JwtAuthGuard)
// Version: 20260101.v2 - Added POST create endpoint
export class MT5AccountsController {
  constructor(
    private readonly mt5AccountsService: MT5AccountsService,
    private readonly tradeHistoryParserService: TradeHistoryParserService,
    private readonly tradesService: TradesService,
  ) {}

  @Post('create')
  async create(
    @Request() req,
    @Body() createMT5AccountDto: CreateMT5AccountDto,
  ): Promise<MT5AccountResponseDto> {
    return this.mt5AccountsService.create(
      createMT5AccountDto,
      req.user.id,
    ) as Promise<MT5AccountResponseDto>;
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
    // Return empty array for now
    return [];
  }

  @Get(':id/candles')
  async getCandles(
    @Request() req,
    @Param('id') id: string,
    @Query('symbol') symbol: string,
    @Query('timeframe') timeframe: string,
    @Query('startTime') startTimeStr: string,
    @Query('endTime') endTimeStr: string,
  ) {
    const account = await this.mt5AccountsService.findOne(id);
    if (!account || account.userId !== req.user.id) {
      throw new BadRequestException('MT5 account not found');
    }

    if (!symbol || !timeframe || !startTimeStr) {
      throw new BadRequestException('Missing parameters: symbol, timeframe, startTime');
    }

    const startTime = new Date(startTimeStr);
    const endTime = endTimeStr ? new Date(endTimeStr) : new Date();

    return this.mt5AccountsService.getCandles(id, symbol, timeframe, startTime, endTime);
  }

  @Post(':id/sync')
  @HttpCode(HttpStatus.OK)
  async syncAccount(@Param('id') id: string): Promise<void> {
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
   * Link MT5 account to MetaApi cloud for real-time sync
   */
  @Post(':id/link')
  @HttpCode(HttpStatus.OK)
  async linkAccount(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { password: string },
  ) {
    const account = await this.mt5AccountsService.findOne(id);
    if (!account || account.userId !== req.user.id) {
      throw new BadRequestException('MT5 account not found');
    }

    if (!body.password) {
      throw new BadRequestException('MT5 password is required to link account');
    }

    const result = await this.mt5AccountsService.linkAccount(id, { password: body.password });
    return {
      success: true,
      message: 'MT5 account linked successfully',
      metaApiAccountId: result.accountId,
      state: result.state,
    };
  }

  /**
   * Unlink MT5 account from MetaApi
   */
  @Post(':id/unlink')
  @HttpCode(HttpStatus.OK)
  async unlinkAccount(@Request() req, @Param('id') id: string) {
    const account = await this.mt5AccountsService.findOne(id);
    if (!account || account.userId !== req.user.id) {
      throw new BadRequestException('MT5 account not found');
    }

    await this.mt5AccountsService.unlinkAccount(id);
    return {
      success: true,
      message: 'MT5 account unlinked from MetaApi',
    };
  }

  /**
   * Get connection status from MetaApi
   */
  @Get(':id/status')
  async getConnectionStatus(@Request() req, @Param('id') id: string) {
    const account = await this.mt5AccountsService.findOne(id);
    if (!account || account.userId !== req.user.id) {
      throw new BadRequestException('MT5 account not found');
    }

    return this.mt5AccountsService.getConnectionStatus(id);
  }

  @Post(':id/import-trades')
  async importTrades(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { fromDate: string; toDate: string },
  ) {
    const account = await this.mt5AccountsService.findOne(id);
    if (!account || account.userId !== req.user.id) {
      throw new BadRequestException('MT5 account not found');
    }

    const fromDate = body.fromDate ? new Date(body.fromDate) : new Date(0);
    const toDate = body.toDate ? new Date(body.toDate) : new Date();

    return this.mt5AccountsService.importTradesFromMT5(
      id,
      fromDate.toISOString(),
      toDate.toISOString(),
    );
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
  async uploadHistory(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    const account = await this.mt5AccountsService.findOne(id);
    if (!account || account.userId !== req.user.id) {
      throw new BadRequestException('MT5 account not found');
    }

    if (!file) {
      throw new BadRequestException('Trade history file is required');
    }

    try {
      const parsedTrades = await this.tradeHistoryParserService.parseTradeHistory(
        file.path,
      );
      const importedCount = await this.tradesService.importParsedTrades(
        account.id,
        req.user.id,
        parsedTrades,
      );
      return {
        message: 'Trade history uploaded and processed successfully',
        importedCount,
        fileName: file.filename,
      };
    } catch (error) {
      // Clean up uploaded file on error
      // fs.unlinkSync(file.path);
      throw new BadRequestException(
        `Failed to process trade history: ${error.message}`,
      );
    }
  }
  */

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
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
