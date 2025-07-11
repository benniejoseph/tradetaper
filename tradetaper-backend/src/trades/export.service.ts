import { Injectable, Logger } from '@nestjs/common';
import { Trade } from './entities/trade.entity';
import { UserResponseDto } from '../users/dto/user-response.dto';

export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  exportTrades(
    trades: Trade[],
    options: ExportOptions,
    userContext: UserResponseDto,
  ): { data: string | Buffer; filename: string; mimeType: string } {
    this.logger.log(
      `User ${userContext.id} exporting ${trades.length} trades as ${options.format}`,
    );

    const timestamp = new Date().toISOString().split('T')[0];
    const accountSuffix = options.accountId ? `_${options.accountId}` : '';
    const filename = `trades_export${accountSuffix}_${timestamp}`;

    switch (options.format) {
      case 'csv':
        return {
          data: this.generateCSV(trades),
          filename: `${filename}.csv`,
          mimeType: 'text/csv',
        };
      case 'json':
        return {
          data: this.generateJSON(trades),
          filename: `${filename}.json`,
          mimeType: 'application/json',
        };
      case 'xlsx':
        return {
          data: this.generateXLSX(trades),
          filename: `${filename}.xlsx`,
          mimeType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
      default:
        throw new Error('Unsupported export format');
    }
  }

  private generateCSV(trades: Trade[]): string {
    const headers = [
      'ID',
      'Symbol',
      'Side',
      'Open Time',
      'Close Time',
      'Open Price',
      'Close Price',
      'Quantity',
      'Status',
      'Profit/Loss',
      'Commission',
      'R Multiple',
      'Notes',
      'Tags',
      'Account ID',
      'Asset Type',
    ];

    const rows = trades.map((trade) => [
      trade.id,
      trade.symbol,
      trade.side,
      trade.openTime,
      trade.closeTime || '',
      trade.openPrice || '',
      trade.closePrice || '',
      trade.quantity || '',
      trade.status,
      trade.profitOrLoss || '',
      trade.commission || '',
      trade.rMultiple || '',
      trade.notes || '',
      trade.tags?.map((tag) => tag.name).join(';') || '',
      trade.accountId || '',
      trade.assetType || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');

    return csvContent;
  }

  private generateJSON(trades: Trade[]): string {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalTrades: trades.length,
      trades: trades.map((trade) => ({
        id: trade.id,
        symbol: trade.symbol,
        side: trade.side,
        openTime: trade.openTime,
        closeTime: trade.closeTime,
        openPrice: trade.openPrice,
        closePrice: trade.closePrice,
        quantity: trade.quantity,
        status: trade.status,
        profitOrLoss: trade.profitOrLoss,
        commission: trade.commission,
        rMultiple: trade.rMultiple,
        notes: trade.notes,
        tags: trade.tags?.map((tag) => tag.name) || [],
        accountId: trade.accountId,
        assetType: trade.assetType,
        createdAt: trade.createdAt,
        updatedAt: trade.updatedAt,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }

  private generateXLSX(trades: Trade[]): Buffer {
    // For now, return CSV as buffer - in a real implementation you'd use a library like xlsx
    // This is a placeholder implementation
    const csvData = this.generateCSV(trades);
    return Buffer.from(csvData, 'utf-8');
  }
}
