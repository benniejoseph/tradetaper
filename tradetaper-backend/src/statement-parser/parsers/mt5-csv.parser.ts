// src/statement-parser/parsers/mt5-csv.parser.ts
import { Injectable, Logger } from '@nestjs/common';
import { ParsedTrade } from '../dto/upload-statement.dto';

/**
 * Parser for MT5 CSV Deal History exports
 * 
 * MT5 exports deal history as CSV with columns that vary by broker.
 * Common columns: Time, Deal, Symbol, Type, Direction, Volume, Price, Commission, Swap, Profit
 */
@Injectable()
export class MT5CsvParser {
  private readonly logger = new Logger(MT5CsvParser.name);

  /**
   * Parse MT5 CSV statement content
   */
  parse(csvContent: string): ParsedTrade[] {
    this.logger.log('Parsing MT5 CSV statement...');
    const trades: ParsedTrade[] = [];

    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        this.logger.warn('CSV file has no data rows');
        return trades;
      }

      // Parse header to find column indices
      const headerLine = lines[0];
      const delimiter = this.detectDelimiter(headerLine);
      const headers = this.parseCSVLine(headerLine, delimiter).map(h => 
        h.toLowerCase().trim()
      );

      // Map column indices
      const colMap = this.mapColumns(headers);

      if (!colMap.symbol || colMap.symbol === -1) {
        this.logger.warn('Could not find symbol column in CSV');
        return trades;
      }

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cells = this.parseCSVLine(line, delimiter);
        
        // Get values using column map
        const dealId = colMap.deal !== -1 ? cells[colMap.deal] : '';
        const symbol = colMap.symbol !== -1 ? cells[colMap.symbol] : '';
        const typeStr = colMap.type !== -1 ? cells[colMap.type]?.toLowerCase() : '';
        const directionStr = colMap.direction !== -1 ? cells[colMap.direction]?.toLowerCase() : '';
        const volume = colMap.volume !== -1 ? parseFloat(cells[colMap.volume]) || 0 : 0;
        const price = colMap.price !== -1 ? parseFloat(cells[colMap.price]) || 0 : 0;
        const timeStr = colMap.time !== -1 ? cells[colMap.time] : '';
        const commission = colMap.commission !== -1 ? parseFloat(cells[colMap.commission]) || 0 : 0;
        const swap = colMap.swap !== -1 ? parseFloat(cells[colMap.swap]) || 0 : 0;
        const profit = colMap.profit !== -1 ? parseFloat(cells[colMap.profit]) || 0 : 0;
        const comment = colMap.comment !== -1 ? cells[colMap.comment] : '';

        // Skip non-trade entries
        if (!symbol || symbol === '') continue;
        
        // Determine trade direction from type or direction column
        let side: 'BUY' | 'SELL' | null = null;
        
        if (directionStr.includes('buy') || directionStr.includes('in')) {
          side = 'BUY';
        } else if (directionStr.includes('sell') || directionStr.includes('out')) {
          side = 'SELL';
        } else if (typeStr.includes('buy')) {
          side = 'BUY';
        } else if (typeStr.includes('sell')) {
          side = 'SELL';
        }

        // Skip balance operations, deposits, etc.
        if (!side || typeStr.includes('balance') || typeStr.includes('credit')) {
          continue;
        }

        const trade: ParsedTrade = {
          externalId: dealId,
          symbol: this.normalizeSymbol(symbol),
          side,
          openTime: this.parseDateTime(timeStr),
          openPrice: price,
          quantity: volume,
          commission,
          swap,
          profit,
          comment,
        };

        trades.push(trade);
      }

      // For MT5 CSV, deals are individual entries (not paired in/out)
      // We may need to pair them based on position ID if available
      const pairedTrades = this.pairDeals(trades, headers, colMap);

      this.logger.log(`Parsed ${pairedTrades.length} trades from MT5 CSV`);
      return pairedTrades;
    } catch (error) {
      this.logger.error(`Error parsing MT5 CSV: ${error.message}`);
      throw error;
    }
  }

  /**
   * Detect if content is MT5 CSV format
   */
  static isMatch(content: string): boolean {
    const firstLine = content.split('\n')[0]?.toLowerCase() || '';
    return (
      firstLine.includes('deal') ||
      firstLine.includes('position') ||
      (firstLine.includes('symbol') && firstLine.includes('volume'))
    );
  }

  /**
   * Detect CSV delimiter (comma, semicolon, or tab)
   */
  private detectDelimiter(line: string): string {
    const commas = (line.match(/,/g) || []).length;
    const semicolons = (line.match(/;/g) || []).length;
    const tabs = (line.match(/\t/g) || []).length;

    if (tabs > commas && tabs > semicolons) return '\t';
    if (semicolons > commas) return ';';
    return ',';
  }

  /**
   * Parse CSV line handling quoted values
   */
  private parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Map column names to indices
   */
  private mapColumns(headers: string[]): Record<string, number> {
    const findIndex = (patterns: string[]): number => {
      for (const pattern of patterns) {
        const idx = headers.findIndex(h => h.includes(pattern));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    return {
      deal: findIndex(['deal', 'ticket', 'order']),
      time: findIndex(['time', 'date']),
      symbol: findIndex(['symbol', 'item']),
      type: findIndex(['type', 'action']),
      direction: findIndex(['direction', 'entry']),
      volume: findIndex(['volume', 'size', 'lots']),
      price: findIndex(['price']),
      commission: findIndex(['commission', 'comm']),
      swap: findIndex(['swap']),
      profit: findIndex(['profit', 'p/l', 'pnl']),
      comment: findIndex(['comment', 'note']),
      positionId: findIndex(['position', 'position id']),
    };
  }

  /**
   * Parse MT5 date/time string
   * Formats: "2024.01.15 14:30:00", "2024-01-15 14:30:00", "01/15/2024 14:30"
   */
  private parseDateTime(dateStr: string): Date {
    if (!dateStr) return new Date();
    
    // Normalize separators
    let cleaned = dateStr.trim()
      .replace(/\./g, '-')
      .replace(/\//g, '-');
    
    // Try direct parsing
    let parsed = new Date(cleaned);
    
    if (isNaN(parsed.getTime())) {
      // Try extracting components
      const match = dateStr.match(/(\d{4})[\.\-\/](\d{2})[\.\-\/](\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
      if (match) {
        parsed = new Date(
          parseInt(match[1]),
          parseInt(match[2]) - 1,
          parseInt(match[3]),
          parseInt(match[4]),
          parseInt(match[5]),
          parseInt(match[6] || '0')
        );
      }
    }
    
    return parsed;
  }

  /**
   * Normalize symbol name
   */
  private normalizeSymbol(symbol: string): string {
    return symbol
      .replace(/\.(pro|raw|ecn|std|mic)/i, '')
      .replace(/#/g, '')
      .toUpperCase()
      .trim();
  }

  /**
   * Pair MT5 deals into complete trades
   * MT5 CSV often has separate "in" and "out" entries for each trade
   */
  private pairDeals(deals: ParsedTrade[], headers: string[], colMap: Record<string, number>): ParsedTrade[] {
    // For now, return deals as-is
    // In a more sophisticated implementation, we would pair entries by position ID
    // and create complete trades with openTime, closeTime, openPrice, closePrice
    
    // TODO: Implement deal pairing based on position ID if available
    return deals;
  }
}
