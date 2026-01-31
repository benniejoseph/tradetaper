// src/statement-parser/statement-parser.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatementUpload, StatementFileType, UploadStatus } from './entities/statement-upload.entity';
import { ParsedTrade, StatementUploadResponseDto } from './dto/upload-statement.dto';
import { MT4HtmlParser } from './parsers/mt4-html.parser';
import { MT5CsvParser } from './parsers/mt5-csv.parser';
import { TradesService } from '../trades/trades.service';
import { TradeStatus, TradeDirection, AssetType } from '../types/enums';

@Injectable()
export class StatementParserService {
  private readonly logger = new Logger(StatementParserService.name);

  constructor(
    @InjectRepository(StatementUpload)
    private readonly uploadRepository: Repository<StatementUpload>,
    private readonly mt4HtmlParser: MT4HtmlParser,
    private readonly mt5CsvParser: MT5CsvParser,
    private readonly tradesService: TradesService,
  ) {}

  /**
   * Process uploaded statement file
   */
  async processUpload(
    file: Express.Multer.File,
    userId: string,
    accountId?: string,
  ): Promise<StatementUploadResponseDto> {
    this.logger.log(`Processing statement upload for user ${userId}, file: ${file.originalname}`);

    // Create upload record
    const upload = this.uploadRepository.create({
      fileName: file.originalname,
      fileSize: file.size,
      storagePath: file.path || '',
      userId,
      accountId,
      status: UploadStatus.PENDING,
    });

    await this.uploadRepository.save(upload);

    try {
      // Update status to processing
      upload.status = UploadStatus.PROCESSING;
      await this.uploadRepository.save(upload);

      // Read file content
      const content = file.buffer?.toString('utf-8') || '';
      
      if (!content) {
        throw new BadRequestException('Empty file or unable to read content');
      }

      // Detect file type and parse
      const { fileType, trades } = this.detectAndParse(content, file.originalname);
      
      upload.fileType = fileType;

      if (trades.length === 0) {
        throw new BadRequestException('No trades found in the uploaded file');
      }

      // Import trades
      const { imported, skipped } = await this.importTrades(trades, userId, accountId);

      // Update upload record
      upload.status = UploadStatus.COMPLETED;
      upload.tradesImported = imported;
      upload.tradesSkipped = skipped;
      upload.processedAt = new Date();
      
      await this.uploadRepository.save(upload);

      this.logger.log(`Upload ${upload.id} completed: ${imported} imported, ${skipped} skipped`);

      return this.mapToResponse(upload);
    } catch (error) {
      this.logger.error(`Upload processing failed: ${error.message}`);
      
      upload.status = UploadStatus.FAILED;
      upload.errorMessage = error.message;
      upload.processedAt = new Date();
      
      await this.uploadRepository.save(upload);

      throw error;
    }
  }

  /**
   * Detect file type and parse content
   */
  private detectAndParse(content: string, fileName: string): { 
    fileType: StatementFileType; 
    trades: ParsedTrade[] 
  } {
    const lowerFileName = fileName.toLowerCase();

    // Check by file extension first
    if (lowerFileName.endsWith('.csv')) {
      if (MT5CsvParser.isMatch(content)) {
        return {
          fileType: StatementFileType.MT5_CSV,
          trades: this.mt5CsvParser.parse(content),
        };
      }
    }

    if (lowerFileName.endsWith('.html') || lowerFileName.endsWith('.htm')) {
      if (MT4HtmlParser.isMatch(content)) {
        return {
          fileType: StatementFileType.MT4_HTML,
          trades: this.mt4HtmlParser.parse(content),
        };
      }
      
      // MT5 also exports HTML
      if (content.includes('MetaTrader 5')) {
        return {
          fileType: StatementFileType.MT5_HTML,
          trades: this.mt4HtmlParser.parse(content), // Similar structure
        };
      }
    }

    // Try content-based detection
    if (MT4HtmlParser.isMatch(content)) {
      return {
        fileType: StatementFileType.MT4_HTML,
        trades: this.mt4HtmlParser.parse(content),
      };
    }

    if (MT5CsvParser.isMatch(content)) {
      return {
        fileType: StatementFileType.MT5_CSV,
        trades: this.mt5CsvParser.parse(content),
      };
    }

    throw new BadRequestException(
      'Unable to detect file format. Please upload MT4 HTML or MT5 CSV statement.'
    );
  }

  /**
   * Import parsed trades into database
   */
  private async importTrades(
    trades: ParsedTrade[],
    userId: string,
    accountId?: string,
  ): Promise<{ imported: number; skipped: number }> {
    let imported = 0;
    let skipped = 0;

    for (const trade of trades) {
      try {
        // Check for duplicate
        const duplicate = await this.tradesService.findDuplicate(
          userId,
          trade.symbol,
          trade.openTime,
          trade.externalId
        );

        if (duplicate) {
          this.logger.debug(`Skipping duplicate: ${trade.symbol} @ ${trade.openTime}`);
          skipped++;
          continue;
        }

        // Determine asset type from symbol
        const assetType = this.detectAssetType(trade.symbol);

        // Create trade
        await this.tradesService.create(
          {
            symbol: trade.symbol,
            assetType,
            side: trade.side === 'BUY' ? TradeDirection.LONG : TradeDirection.SHORT,
            status: trade.closeTime ? TradeStatus.CLOSED : TradeStatus.OPEN,
            openTime: trade.openTime.toISOString(),
            closeTime: trade.closeTime?.toISOString(),
            openPrice: trade.openPrice,
            closePrice: trade.closePrice,
            quantity: trade.quantity,
            commission: trade.commission,
            notes: trade.comment ? `Imported from statement. ${trade.comment}` : 'Imported from statement.',
            accountId,
          },
          { id: userId } as any
        );

        imported++;
      } catch (error) {
        this.logger.warn(`Failed to import trade ${trade.externalId}: ${error.message}`);
        skipped++;
      }
    }

    return { imported, skipped };
  }

  /**
   * Detect asset type from symbol
   */
  private detectAssetType(symbol: string): AssetType {
    const upper = symbol.toUpperCase();

    // Forex pairs
    const forexPairs = ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF'];
    const forexMatch = forexPairs.filter(c => upper.includes(c)).length >= 2;
    if (forexMatch && upper.length <= 7) {
      return AssetType.FOREX;
    }

    // Crypto
    if (upper.includes('BTC') || upper.includes('ETH') || upper.includes('XRP') || 
        upper.includes('LTC') || upper.includes('DOGE')) {
      return AssetType.CRYPTO;
    }

    // Indices
    if (upper.includes('US30') || upper.includes('NAS') || upper.includes('SPX') ||
        upper.includes('DAX') || upper.includes('FTSE') || upper.includes('NDX')) {
      return AssetType.FUTURES; // Using FUTURES for indices
    }

    // Commodities
    if (upper.includes('GOLD') || upper.includes('XAU') || upper.includes('XAG') ||
        upper.includes('OIL') || upper.includes('WTI') || upper.includes('BRENT')) {
      return AssetType.COMMODITIES;
    }

    // Default to forex for unknown
    return AssetType.FOREX;
  }

  /**
   * Get upload history for user
   */
  async getUploadHistory(userId: string): Promise<StatementUploadResponseDto[]> {
    const uploads = await this.uploadRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return uploads.map(u => this.mapToResponse(u));
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponse(upload: StatementUpload): StatementUploadResponseDto {
    return {
      id: upload.id,
      fileName: upload.fileName,
      fileType: upload.fileType,
      status: upload.status,
      tradesImported: upload.tradesImported,
      tradesSkipped: upload.tradesSkipped,
      errorMessage: upload.errorMessage,
      createdAt: upload.createdAt,
      processedAt: upload.processedAt,
    };
  }
}
