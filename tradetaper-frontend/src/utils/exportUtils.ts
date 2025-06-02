import { Trade, TradeStatus } from '@/types/trade';
import { format, parseISO, isValid } from 'date-fns';

export interface ExportOptions {
  format: 'csv' | 'excel' | 'json';
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  includeOpenTrades?: boolean;
  columns?: string[];
}

export interface ExportData {
  filename: string;
  data: string | Blob;
  mimeType: string;
}

const DEFAULT_COLUMNS = [
  'symbol',
  'direction',
  'status',
  'entryDate',
  'entryPrice',
  'exitDate',
  'exitPrice',
  'quantity',
  'profitOrLoss',
  'commission',
  'rMultiple',
  'session',
  'ictConcept',
  'notes'
];

// Helper function to format trade data for export
function formatTradeForExport(trade: Trade): Record<string, string | number> {
  return {
    symbol: trade.symbol,
    direction: trade.direction,
    status: trade.status,
    entryDate: trade.entryDate ? format(parseISO(trade.entryDate), 'yyyy-MM-dd HH:mm:ss') : '',
    entryPrice: trade.entryPrice || '',
    exitDate: trade.exitDate ? format(parseISO(trade.exitDate), 'yyyy-MM-dd HH:mm:ss') : '',
    exitPrice: trade.exitPrice || '',
    quantity: trade.quantity || '',
    profitOrLoss: trade.profitOrLoss || '',
    commission: trade.commission || '',
    rMultiple: trade.rMultiple || '',
    session: trade.session || '',
    ictConcept: trade.ictConcept || '',
    setupDetails: trade.setupDetails || '',
    mistakesMade: trade.mistakesMade || '',
    lessonsLearned: trade.lessonsLearned || '',
    notes: trade.notes || '',
    tags: trade.tags?.map(tag => tag.name).join(', ') || '',
    assetType: trade.assetType,
    isStarred: trade.isStarred ? 'Yes' : 'No',
    stopLoss: trade.stopLoss || '',
    takeProfit: trade.takeProfit || '',
  };
}

// Filter trades based on export options
function filterTradesForExport(trades: Trade[], options: ExportOptions): Trade[] {
  let filteredTrades = [...trades];

  // Filter by date range
  if (options.dateRange?.from || options.dateRange?.to) {
    filteredTrades = filteredTrades.filter(trade => {
      if (!trade.entryDate) return false;
      
      try {
        const entryDate = parseISO(trade.entryDate);
        if (!isValid(entryDate)) return false;

        if (options.dateRange?.from && entryDate < options.dateRange.from) {
          return false;
        }
        if (options.dateRange?.to && entryDate > options.dateRange.to) {
          return false;
        }
        return true;
      } catch {
        return false;
      }
    });
  }

  // Filter by trade status
  if (!options.includeOpenTrades) {
    filteredTrades = filteredTrades.filter(trade => trade.status === TradeStatus.CLOSED);
  }

  return filteredTrades;
}

// Convert trades to CSV format
function tradesToCSV(trades: Trade[], columns: string[]): string {
  const headers = columns.join(',');
  const rows = trades.map(trade => {
    const formattedTrade = formatTradeForExport(trade);
    return columns.map(column => {
      const value = formattedTrade[column] || '';
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });

  return [headers, ...rows].join('\n');
}

// Convert trades to JSON format
function tradesToJSON(trades: Trade[], columns: string[]): string {
  const formattedTrades = trades.map(trade => {
    const formattedTrade = formatTradeForExport(trade);
    const filteredTrade: Record<string, string | number> = {};
    columns.forEach(column => {
      if (formattedTrade[column] !== undefined) {
        filteredTrade[column] = formattedTrade[column];
      }
    });
    return filteredTrade;
  });

  return JSON.stringify(formattedTrades, null, 2);
}

// Main export function
export function exportTrades(trades: Trade[], options: ExportOptions): ExportData {
  const filteredTrades = filterTradesForExport(trades, options);
  const columns = options.columns || DEFAULT_COLUMNS;
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');

  switch (options.format) {
    case 'csv': {
      const csvData = tradesToCSV(filteredTrades, columns);
      return {
        filename: `trades_export_${timestamp}.csv`,
        data: csvData,
        mimeType: 'text/csv'
      };
    }
    
    case 'json': {
      const jsonData = tradesToJSON(filteredTrades, columns);
      return {
        filename: `trades_export_${timestamp}.json`,
        data: jsonData,
        mimeType: 'application/json'
      };
    }

    case 'excel': {
      // For Excel export, we'll create a CSV with Excel-friendly formatting
      const csvData = tradesToCSV(filteredTrades, columns);
      return {
        filename: `trades_export_${timestamp}.xlsx`,
        data: csvData,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };
    }

    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

// Trigger download of export data
export function downloadExportData(exportData: ExportData): void {
  const blob = new Blob([exportData.data], { type: exportData.mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = exportData.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}

// Generate summary statistics for export
export function generateExportSummary(trades: Trade[]): Record<string, string | number> {
  const closedTrades = trades.filter(t => t.status === TradeStatus.CLOSED);
  const totalPnl = closedTrades.reduce((sum, trade) => sum + (trade.profitOrLoss || 0), 0);
  const winningTrades = closedTrades.filter(t => (t.profitOrLoss || 0) > 0);
  const losingTrades = closedTrades.filter(t => (t.profitOrLoss || 0) < 0);
  
  return {
    exportDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    totalTrades: trades.length,
    closedTrades: closedTrades.length,
    openTrades: trades.length - closedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: closedTrades.length > 0 ? ((winningTrades.length / closedTrades.length) * 100).toFixed(2) + '%' : '0%',
    totalPnL: totalPnl.toLocaleString(undefined, { style: 'currency', currency: 'USD' }),
    averageWin: winningTrades.length > 0 ? (winningTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0) / winningTrades.length).toFixed(2) : '0',
    averageLoss: losingTrades.length > 0 ? (losingTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0) / losingTrades.length).toFixed(2) : '0',
  };
}

// Export with summary
export function exportTradesWithSummary(trades: Trade[], options: ExportOptions): ExportData {
  const filteredTrades = filterTradesForExport(trades, options);
  const summary = generateExportSummary(filteredTrades);
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');

  if (options.format === 'json') {
    const jsonData = {
      summary,
      trades: JSON.parse(tradesToJSON(filteredTrades, options.columns || DEFAULT_COLUMNS))
    };
    
    return {
      filename: `trades_export_with_summary_${timestamp}.json`,
      data: JSON.stringify(jsonData, null, 2),
      mimeType: 'application/json'
    };
  }

  // For CSV, add summary at the top
  const columns = options.columns || DEFAULT_COLUMNS;
  const csvData = tradesToCSV(filteredTrades, columns);
  const summaryLines = Object.entries(summary).map(([key, value]) => `${key},${value}`);
  const csvWithSummary = `EXPORT SUMMARY\n${summaryLines.join('\n')}\n\nTRADE DATA\n${csvData}`;

  return {
    filename: `trades_export_with_summary_${timestamp}.csv`,
    data: csvWithSummary,
    mimeType: 'text/csv'
  };
} 