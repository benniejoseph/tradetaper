import { Injectable, Logger } from '@nestjs/common';
import { Trade } from './entities/trade.entity';
import { UserResponseDto } from '../users/dto/user-response.dto';
import * as ExcelJS from 'exceljs';

export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  async exportTrades(
    trades: Trade[],
    options: ExportOptions,
    userContext: UserResponseDto,
  ): Promise<{ data: string | Buffer; filename: string; mimeType: string }> {
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
          data: await this.generateXLSX(trades),
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

  private async generateXLSX(trades: Trade[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TradeTaper';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Trades');

    // Define columns with headers and widths
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 36 },
      { header: 'Symbol', key: 'symbol', width: 12 },
      { header: 'Side', key: 'side', width: 8 },
      { header: 'Open Time', key: 'openTime', width: 20 },
      { header: 'Close Time', key: 'closeTime', width: 20 },
      { header: 'Open Price', key: 'openPrice', width: 12 },
      { header: 'Close Price', key: 'closePrice', width: 12 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Profit/Loss', key: 'profitOrLoss', width: 12 },
      { header: 'Commission', key: 'commission', width: 12 },
      { header: 'R Multiple', key: 'rMultiple', width: 10 },
      { header: 'Notes', key: 'notes', width: 30 },
      { header: 'Tags', key: 'tags', width: 20 },
      { header: 'Account ID', key: 'accountId', width: 36 },
      { header: 'Asset Type', key: 'assetType', width: 12 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add trade data
    trades.forEach((trade) => {
      worksheet.addRow({
        id: trade.id,
        symbol: trade.symbol,
        side: trade.side,
        openTime: trade.openTime,
        closeTime: trade.closeTime || '',
        openPrice: trade.openPrice || '',
        closePrice: trade.closePrice || '',
        quantity: trade.quantity || '',
        status: trade.status,
        profitOrLoss: trade.profitOrLoss || '',
        commission: trade.commission || '',
        rMultiple: trade.rMultiple || '',
        notes: trade.notes || '',
        tags: trade.tags?.map((tag) => tag.name).join('; ') || '',
        accountId: trade.accountId || '',
        assetType: trade.assetType || '',
      });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
