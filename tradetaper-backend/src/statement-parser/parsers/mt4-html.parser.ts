// src/statement-parser/parsers/mt4-html.parser.ts
import { Injectable, Logger } from '@nestjs/common';
import { ParsedTrade } from '../dto/upload-statement.dto';

/**
 * Parser for MT4 HTML Statement files
 *
 * MT4 exports trade history as HTML with a table structure.
 * Key columns: Ticket, Open Time, Type, Size, Item, Price, S/L, T/P, Close Time, Price, Commission, Swap, Profit
 */
@Injectable()
export class MT4HtmlParser {
  private readonly logger = new Logger(MT4HtmlParser.name);

  /**
   * Parse MT4 HTML statement content
   */
  parse(htmlContent: string): ParsedTrade[] {
    this.logger.log('Parsing MT4 HTML statement...');
    const trades: ParsedTrade[] = [];

    try {
      // Find the "Closed Transactions" section
      const closedTransactionsMatch = htmlContent.match(
        /Closed\s+Transactions[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/i,
      );

      if (!closedTransactionsMatch) {
        this.logger.warn('Could not find Closed Transactions table');
        return trades;
      }

      const tableContent = closedTransactionsMatch[1];

      // Parse rows
      const rowMatches = tableContent.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);

      let isHeaderSkipped = false;

      for (const rowMatch of rowMatches) {
        const rowContent = rowMatch[1];

        // Skip header row
        if (rowContent.includes('<th') || rowContent.includes('Ticket')) {
          isHeaderSkipped = true;
          continue;
        }

        if (!isHeaderSkipped) continue;

        // Skip summary rows (balance, credit, etc.)
        if (
          rowContent.toLowerCase().includes('balance') ||
          rowContent.toLowerCase().includes('credit') ||
          rowContent.toLowerCase().includes('closed p/l')
        ) {
          continue;
        }

        // Extract cells
        const cellMatches = rowContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi);
        const cells: string[] = [];

        for (const cellMatch of cellMatches) {
          // Strip HTML tags and trim
          const cellValue = cellMatch[1]
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim();
          cells.push(cellValue);
        }

        // Skip if not enough columns (need at least ticket, time, type, size, item, prices, profit)
        if (cells.length < 10) continue;

        // Parse based on typical MT4 statement structure
        // [0] Ticket, [1] Open Time, [2] Type, [3] Size, [4] Item/Symbol,
        // [5] Open Price, [6] S/L, [7] T/P, [8] Close Time, [9] Close Price,
        // [10] Commission, [11] Taxes, [12] Swap, [13] Profit

        const ticket = cells[0];
        const openTimeStr = cells[1];
        const tradeType = cells[2]?.toLowerCase();
        const size = parseFloat(cells[3]) || 0;
        const symbol = cells[4];
        const openPrice = parseFloat(cells[5]) || 0;
        const closeTimeStr = cells[8];
        const closePrice = parseFloat(cells[9]) || 0;

        // Commission, Swap, Profit positions may vary
        let commission = 0;
        let swap = 0;
        let profit = 0;

        if (cells.length >= 14) {
          commission = parseFloat(cells[10]) || 0;
          swap = parseFloat(cells[12]) || 0;
          profit = parseFloat(cells[13]) || 0;
        } else if (cells.length >= 12) {
          commission = parseFloat(cells[10]) || 0;
          swap = parseFloat(cells[11]) || 0;
          profit = parseFloat(cells[cells.length - 1]) || 0;
        }

        // Skip non-trade entries (deposits, withdrawals, etc.)
        if (
          !tradeType ||
          (!tradeType.includes('buy') && !tradeType.includes('sell'))
        ) {
          continue;
        }

        // Skip if no symbol
        if (!symbol || symbol === '') continue;

        const trade: ParsedTrade = {
          externalId: ticket,
          symbol: this.normalizeSymbol(symbol),
          side: tradeType.includes('buy') ? 'BUY' : 'SELL',
          openTime: this.parseDateTime(openTimeStr),
          closeTime: closeTimeStr
            ? this.parseDateTime(closeTimeStr)
            : undefined,
          openPrice,
          closePrice: closePrice || undefined,
          quantity: size,
          commission,
          swap,
          profit,
        };

        trades.push(trade);
      }

      this.logger.log(`Parsed ${trades.length} trades from MT4 HTML`);
      return trades;
    } catch (error) {
      this.logger.error(`Error parsing MT4 HTML: ${error.message}`);
      throw error;
    }
  }

  /**
   * Detect if content is MT4 HTML format
   */
  static isMatch(content: string): boolean {
    return (
      content.includes('MetaTrader 4') ||
      content.includes('Statement:') ||
      (content.includes('Closed Transactions') && content.includes('Ticket'))
    );
  }

  /**
   * Parse MT4 date/time string
   * Format: "2024.01.15 14:30:00" or "2024.01.15 14:30"
   */
  private parseDateTime(dateStr: string): Date {
    if (!dateStr) return new Date();

    // Handle format: 2024.01.15 14:30:00
    const cleaned = dateStr.replace(/\./g, '-').trim();
    const parsed = new Date(cleaned);

    if (isNaN(parsed.getTime())) {
      // Try alternative parsing
      const parts = dateStr.match(
        /(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/,
      );
      if (parts) {
        return new Date(
          parseInt(parts[1]),
          parseInt(parts[2]) - 1,
          parseInt(parts[3]),
          parseInt(parts[4]),
          parseInt(parts[5]),
          parseInt(parts[6] || '0'),
        );
      }
    }

    return parsed;
  }

  /**
   * Normalize symbol name (remove suffixes like .pro, .raw, etc.)
   */
  private normalizeSymbol(symbol: string): string {
    // Remove common broker suffixes
    return symbol
      .replace(/\.(pro|raw|ecn|std|mic)/i, '')
      .replace(/#/g, '')
      .toUpperCase();
  }
}
