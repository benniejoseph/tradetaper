import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ParsedTradeData } from './dto/mt5-account.dto';
import * as XLSX from 'xlsx';

@Injectable()
export class TradeHistoryParserService {
  private readonly logger = new Logger(TradeHistoryParserService.name);

  /**
   * Parse trade history from uploaded file buffer
   */
  async parseTradeHistory(
    buffer: Buffer,
    fileType: 'html' | 'xlsx',
    fileName: string,
  ): Promise<{
    trades: ParsedTradeData[];
    accountBalance?: number;
    accountCurrency?: string;
    totalNetProfit?: number;
    equity?: number;
  }> {
    this.logger.log(
      `Parsing ${fileType.toUpperCase()} trade history file: ${fileName}`,
    );

    try {
      if (fileType === 'html') {
        return this.parseHTMLTradeHistory(buffer);
      } else if (fileType === 'xlsx') {
        return this.parseExcelTradeHistory(buffer);
      } else {
        throw new BadRequestException(
          'Unsupported file type. Only HTML and XLSX files are supported.',
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to parse trade history file ${fileName}:`,
        error,
      );
      throw new BadRequestException(
        `Failed to parse trade history: ${error.message}`,
      );
    }
  }

  /**
   * Parse MT5 HTML trade history report using regex
   */
  private parseHTMLTradeHistory(buffer: Buffer): {
    trades: ParsedTradeData[];
    accountBalance?: number;
    accountCurrency?: string;
    totalNetProfit?: number;
    equity?: number;
  } {
    // Check for UTF-16LE BOM and handle encoding appropriately
    let html: string;
    if (buffer[0] === 0xff && buffer[1] === 0xfe) {
      // UTF-16LE with BOM
      html = buffer.toString('utf16le');
    } else if (buffer[0] === 0xfe && buffer[1] === 0xff) {
      // UTF-16BE with BOM
      html = buffer.toString('utf16le'); // Node.js doesn't support utf16be directly
    } else {
      // Assume UTF-8
      html = buffer.toString('utf8');
    }
    const trades: ParsedTradeData[] = [];
    let accountBalance: number | undefined;
    let accountCurrency: string | undefined;
    let totalNetProfit: number | undefined;
    let equity: number | undefined;

    // Extract account balance and currency from HTML header
    const balanceRegex = /balance[^\d]*([\d,.]+)\s*([A-Z]{3})/i;
    const balanceMatch = html.match(balanceRegex);
    if (balanceMatch) {
      accountBalance = parseFloat(balanceMatch[1].replace(/,/g, ''));
      accountCurrency = balanceMatch[2];
      this.logger.log(
        `Extracted account balance from header: ${accountBalance} ${accountCurrency}`,
      );
    }

    // Extract summary section data (Balance, Total Net Profit, Equity)
    const summaryBalanceRegex =
      /<td[^>]*>Balance:<\/td>\s*<td[^>]*><b>([\d,.\s-]+)<\/b><\/td>/i;
    const totalNetProfitRegex =
      /<td[^>]*>Total Net Profit:<\/td>\s*<td[^>]*><b>([\d,.\s-]+)<\/b><\/td>/i;
    const equityRegex =
      /<td[^>]*>Equity:<\/td>\s*<td[^>]*><b>([\d,.\s-]+)<\/b><\/td>/i;

    const summaryBalanceMatch = html.match(summaryBalanceRegex);
    if (summaryBalanceMatch) {
      const summaryBalance = parseFloat(
        summaryBalanceMatch[1].replace(/[,\s]/g, ''),
      );
      if (!isNaN(summaryBalance)) {
        accountBalance = summaryBalance; // Use summary balance as it's more accurate
        this.logger.log(
          `Extracted account balance from summary: ${accountBalance}`,
        );
      }
    }

    const netProfitMatch = html.match(totalNetProfitRegex);
    if (netProfitMatch) {
      totalNetProfit = parseFloat(netProfitMatch[1].replace(/[,\s]/g, ''));
      this.logger.log(`Extracted total net profit: ${totalNetProfit}`);
    }

    const equityMatch = html.match(equityRegex);
    if (equityMatch) {
      equity = parseFloat(equityMatch[1].replace(/[,\s]/g, ''));
      this.logger.log(`Extracted equity: ${equity}`);
    }

    // Look for table rows with trade data using regex
    // This is a simplified approach - we'll look for patterns in the HTML
    const tableRowRegex = /<tr[^>]*>(.*?)<\/tr>/gis;
    const cellRegex = /<t[dh][^>]*>(.*?)<\/t[dh]>/gis;

    let match;
    let headerFound = false;
    const columnMap: { [key: string]: number } = {};

    while ((match = tableRowRegex.exec(html)) !== null) {
      const rowHtml = match[1];
      const cells: string[] = [];

      // Extract cell contents
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
        // Remove HTML tags and decode entities
        const cellContent = cellMatch[1]
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .trim();
        cells.push(cellContent);
      }

      if (cells.length === 0) continue;

      // Check if this is a header row
      const rowText = cells.join(' ').toLowerCase();
      if (
        !headerFound &&
        rowText.includes('position') &&
        rowText.includes('symbol') &&
        rowText.includes('type')
      ) {
        headerFound = true;
        this.logger.log('Found header row in HTML');

        // Map column indices
        cells.forEach((header, index) => {
          const headerText = header.toLowerCase();
          if (headerText.includes('position')) columnMap.position = index;
          if (headerText.includes('symbol')) columnMap.symbol = index;
          if (headerText.includes('type')) columnMap.type = index;
          if (headerText.includes('volume')) columnMap.volume = index;
          if (
            headerText.includes('price') &&
            !headerText.includes('s / l') &&
            !headerText.includes('t / p')
          ) {
            if (!columnMap.openPrice) columnMap.openPrice = index;
            else if (!columnMap.closePrice) columnMap.closePrice = index;
          }
          if (headerText.includes('time')) {
            if (!columnMap.openTime) columnMap.openTime = index;
            else if (!columnMap.closeTime) columnMap.closeTime = index;
          }
          if (headerText.includes('commission')) columnMap.commission = index;
          if (headerText.includes('swap')) columnMap.swap = index;
          if (headerText.includes('profit')) columnMap.profit = index;
        });

        this.logger.log('Column mapping:', columnMap);
        continue;
      }

      // If we found the header, process data rows
      if (headerFound && cells.length > 5) {
        // HTML data rows have 14 cells, structured as:
        // [0]=OpenTime, [1]=Position, [2]=Symbol, [3]=Type, [4]=EmptyVolume, [5]=Volume, [6]=OpenPrice, [7]=S/L, [8]=T/P, [9]=CloseTime, [10]=ClosePrice, [11]=Commission, [12]=Swap, [13]=Profit
        const openTime = this.parseDateTime(cells[0] || ''); // Opening time at index 0
        const positionId = cells[1] || ''; // Position at index 1
        const symbol = cells[2] || ''; // Symbol at index 2
        const type = (cells[3] || '').toLowerCase(); // Type at index 3
        const volume = parseFloat(cells[5] || '0'); // Volume at index 5 (index 4 is empty)
        const openPrice = parseFloat(cells[6] || '0'); // Open price at index 6
        // Indices 7 and 8 are S/L and T/P (not used)
        const closeTime = this.parseDateTime(cells[9] || ''); // Close time at index 9
        const closePrice = parseFloat(cells[10] || '0'); // Close price at index 10
        const commission = parseFloat(cells[11] || '0'); // Commission at index 11
        const swap = parseFloat(cells[12] || '0'); // Swap at index 12
        const profit = parseFloat(cells[13] || '0'); // Profit at index 13

        // Validate essential fields (volume might be in a different column or missing)
        if (
          positionId &&
          symbol &&
          (type === 'buy' || type === 'sell') &&
          !isNaN(openPrice) &&
          !isNaN(closePrice) &&
          openTime &&
          closeTime &&
          !isNaN(profit)
        ) {
          trades.push({
            positionId,
            symbol,
            type: type,
            volume,
            openPrice,
            closePrice,
            openTime,
            closeTime,
            profit,
            commission,
            swap,
            comment: '',
          });
        }
      }
    }

    this.logger.log(`Parsed ${trades.length} trades from HTML file`);
    return { trades, accountBalance, accountCurrency, totalNetProfit, equity };
  }

  /**
   * Parse MT5 Excel trade history report
   */
  private parseExcelTradeHistory(buffer: Buffer): {
    trades: ParsedTradeData[];
    accountBalance?: number;
    accountCurrency?: string;
    totalNetProfit?: number;
    equity?: number;
  } {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const trades: ParsedTradeData[] = [];
    let accountBalance: number | undefined;
    let accountCurrency: string | undefined;
    let totalNetProfit: number | undefined;
    let equity: number | undefined;

    // Try to find the sheet with trade data
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
      });

      // Extract account balance and currency from header rows (first 10 rows)
      for (let i = 0; i < Math.min(sheetData.length, 10); i++) {
        const row = sheetData[i] as any[];
        if (!row) continue;

        const rowText = row.join(' ').toLowerCase();
        if (rowText.includes('balance') && !accountBalance) {
          // Look for balance pattern in the row
          for (let j = 0; j < (row as any[]).length; j++) {
            const cell = (row[j] || '').toString();
            if (
              cell &&
              typeof cell === 'string' &&
              cell.toLowerCase().includes('balance')
            ) {
              // Check next cell for balance value
              if (j + 1 < row.length) {
                const balanceValue = parseFloat(
                  (row[j + 1] || '').toString().replace(/,/g, ''),
                );
                if (!isNaN(balanceValue)) {
                  accountBalance = balanceValue;
                  this.logger.log(
                    `Extracted account balance: ${accountBalance}`,
                  );
                }
              }
            }
          }
        }

        // Look for currency in header rows
        if (rowText.includes('currency') && !accountCurrency) {
          for (let j = 0; j < (row as any[]).length; j++) {
            const cell = (row[j] || '').toString();
            if (
              cell &&
              typeof cell === 'string' &&
              cell.toLowerCase().includes('currency')
            ) {
              // Check next cell for currency value
              if (j + 1 < row.length) {
                const currencyValue = (row[j + 1] || '').toString().trim();
                if (currencyValue && currencyValue.length === 3) {
                  accountCurrency = currencyValue.toUpperCase();
                  this.logger.log(
                    `Extracted account currency: ${accountCurrency}`,
                  );
                }
              }
            }
          }
        }
      }

      // Look for headers that indicate trade data
      let headerRowIndex = -1;
      const columnMap: { [key: string]: number } = {};

      for (let i = 0; i < Math.min(sheetData.length, 10); i++) {
        const row = sheetData[i] as any[];
        if (!row) continue;

        const rowText = row.join(' ').toLowerCase();
        if (
          rowText.includes('position') &&
          rowText.includes('symbol') &&
          rowText.includes('type')
        ) {
          headerRowIndex = i;

          // Map column indices based on exact XLSX structure
          // First pass - map unique columns
          row.forEach((header: string, index: number) => {
            const headerText = (header || '').toString().toLowerCase().trim();
            if (headerText === 'position') columnMap.position = index;
            if (headerText === 'symbol') columnMap.symbol = index;
            if (headerText === 'type') columnMap.type = index;
            if (headerText === 'volume') columnMap.volume = index;
            if (headerText === 'commission') columnMap.commission = index;
            if (headerText === 'swap') columnMap.swap = index;
            if (headerText === 'profit') columnMap.profit = index;
          });

          // Second pass - handle duplicate Time and Price columns by order
          let timeCount = 0;
          let priceCount = 0;
          row.forEach((header: string, index: number) => {
            const headerText = (header || '').toString().toLowerCase().trim();
            if (headerText === 'time') {
              if (timeCount === 0) {
                columnMap.openTime = index; // First Time column (index 0)
              } else if (timeCount === 1) {
                columnMap.closeTime = index; // Second Time column (index 8)
              }
              timeCount++;
            }
            if (headerText === 'price') {
              if (priceCount === 0) {
                columnMap.openPrice = index; // First Price column (index 5)
              } else if (priceCount === 1) {
                columnMap.closePrice = index; // Second Price column (index 9)
              }
              priceCount++;
            }
          });
          break;
        }
      }

      if (headerRowIndex >= 0) {
        this.logger.log(`Found trade data in sheet: ${sheetName}`);
        this.logger.log('Column mapping:', columnMap);

        // Parse data rows
        for (let i = headerRowIndex + 1; i < sheetData.length; i++) {
          const row = sheetData[i] as any[];
          if (!row || row.length === 0) continue;

          // Use the correct column mapping based on actual XLSX structure
          // XLSX structure: ["Time","Position","Symbol","Type","Volume","Price","S / L","T / P","Time","Price","Commission","Swap","Profit"]
          const openTime = this.parseExcelDateTime(row[0]); // Time at index 0
          const positionId = (row[1] || '').toString().trim(); // Position at index 1
          const symbol = (row[2] || '').toString().trim(); // Symbol at index 2
          const type = (row[3] || '').toString().trim().toLowerCase(); // Type at index 3
          const volume = parseFloat(row[4] || '0'); // Volume at index 4
          const openPrice = parseFloat(row[5] || '0'); // Price at index 5
          // Indices 6 and 7 are S/L and T/P (not used)
          const closeTime = this.parseExcelDateTime(row[8]); // Time at index 8
          const closePrice = parseFloat(row[9] || '0'); // Price at index 9
          const commission = parseFloat(row[10] || '0'); // Commission at index 10
          const swap = parseFloat(row[11] || '0'); // Swap at index 11
          const profit = parseFloat(row[12] || '0'); // Profit at index 12

          // Validate essential fields (relax volume requirement to match HTML parser)
          if (
            positionId &&
            symbol &&
            (type === 'buy' || type === 'sell') &&
            !isNaN(openPrice) &&
            !isNaN(closePrice) &&
            openTime &&
            closeTime &&
            !isNaN(profit)
          ) {
            trades.push({
              positionId,
              symbol,
              type: type as 'buy' | 'sell',
              volume,
              openPrice,
              closePrice,
              openTime,
              closeTime,
              profit,
              commission,
              swap,
              comment: '',
            });
          }
        }

        // After processing trades, scan for summary section data (last 30 rows)
        this.logger.log(`Scanning for summary data in sheet: ${sheetName}`);
        const startRow = Math.max(0, sheetData.length - 30);
        for (let i = startRow; i < sheetData.length; i++) {
          const row = sheetData[i];
          if (!row) continue;

          // Look for Balance:, Total Net Profit:, Equity: labels
          for (let j = 0; j < (row as any[]).length; j++) {
            const cell = (row[j] || '').toString().toLowerCase().trim();

            if (cell === 'balance:') {
              // Look for value in adjacent cells (typically j+3 based on analysis)
              for (let k = j + 1; k < Math.min(j + 5, (row as any[]).length); k++) {
                const value = parseFloat(
                  (row[k] || '').toString().replace(/,/g, ''),
                );
                if (!isNaN(value)) {
                  accountBalance = value;
                  this.logger.log(
                    `Extracted account balance from summary: ${accountBalance}`,
                  );
                  break;
                }
              }
            }

            if (cell === 'total net profit:') {
              // Look for value in adjacent cells
              for (let k = j + 1; k < Math.min(j + 5, (row as any[]).length); k++) {
                const value = parseFloat(
                  (row[k] || '').toString().replace(/,/g, ''),
                );
                if (!isNaN(value)) {
                  totalNetProfit = value;
                  this.logger.log(
                    `Extracted total net profit: ${totalNetProfit}`,
                  );
                  break;
                }
              }
            }

            if (cell === 'equity:') {
              // Look for value in adjacent cells
              for (let k = j + 1; k < Math.min(j + 5, (row as any[]).length); k++) {
                const value = parseFloat(
                  (row[k] || '').toString().replace(/,/g, ''),
                );
                if (!isNaN(value)) {
                  equity = value;
                  this.logger.log(`Extracted equity: ${equity}`);
                  break;
                }
              }
            }
          }
        }
        break;
      }
    }

    this.logger.log(`Parsed ${trades.length} trades from Excel file`);
    return { trades, accountBalance, accountCurrency, totalNetProfit, equity };
  }

  /**
   * Parse date/time from various formats
   */
  private parseDateTime(dateTimeStr: string): Date | null {
    if (!dateTimeStr || dateTimeStr.trim() === '') return null;

    try {
      // Try common MT5 date formats
      const formats = [
        /(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/, // 2025.06.06 00:33:56
        /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/, // 2025-06-06 00:33:56
        /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/, // 06/06/2025 00:33:56
      ];

      for (const format of formats) {
        const match = dateTimeStr.match(format);
        if (match) {
          const [, year, month, day, hour, minute, second] = match;
          return new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(minute),
            parseInt(second),
          );
        }
      }

      // Fallback to Date.parse
      const parsed = new Date(dateTimeStr);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch (error) {
      this.logger.warn(`Failed to parse date/time: ${dateTimeStr}`);
      return null;
    }
  }

  /**
   * Parse Excel date/time (could be serial number or string)
   */
  private parseExcelDateTime(value: any): Date | null {
    if (!value) return null;

    // If it's already a Date object
    if (value instanceof Date) {
      return value;
    }

    // If it's a number (Excel serial date)
    if (typeof value === 'number') {
      try {
        // Excel epoch is 1900-01-01, but Excel incorrectly treats 1900 as a leap year
        const excelEpoch = new Date(1900, 0, 1);
        const days = value - 1; // Adjust for Excel's off-by-one error
        return new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
      } catch (error) {
        this.logger.warn(`Failed to parse Excel date: ${value}`);
        return null;
      }
    }

    // If it's a string, use regular date parsing
    return this.parseDateTime(value.toString());
  }
}
