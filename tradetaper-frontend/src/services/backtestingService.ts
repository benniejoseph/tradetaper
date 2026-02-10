import {
  BacktestTrade,
  CreateBacktestTradeDto,
  BacktestStats,
  DimensionStats,
  PerformanceMatrix,
  AnalysisData,
  MarketLog,
  CreateMarketLogDto,
  UpdateMarketLogDto,
  MarketPatternDiscovery,
} from '@/types/backtesting';

// ✅ Use correct environment variable and production default
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://api.tradetaper.com/api/v1').trim();

const getAuthHeaders = () => {
  return {
    'Content-Type': 'application/json',
    // Auth is handled via HTTP-only cookies (withCredentials)
    // No Authorization header needed
  };
};

  //Helper to transform backend response (decimal strings) to numbers
  const transformTrade = (trade: any): BacktestTrade => {
    return {
      ...trade,
      entryPrice: Number(trade.entryPrice),
      exitPrice: trade.exitPrice ? Number(trade.exitPrice) : undefined,
      stopLoss: trade.stopLoss ? Number(trade.stopLoss) : undefined,
      takeProfit: trade.takeProfit ? Number(trade.takeProfit) : undefined,
      lotSize: Number(trade.lotSize),
      pnlPips: trade.pnlPips ? Number(trade.pnlPips) : undefined,
      pnlDollars: trade.pnlDollars ? Number(trade.pnlDollars) : undefined,
      rMultiple: trade.rMultiple ? Number(trade.rMultiple) : undefined,
      checklistScore: trade.checklistScore ? Number(trade.checklistScore) : undefined,
    };
  };

export const backtestingService = {
  // ============ CRUD ============

  async createTrade(data: CreateBacktestTradeDto): Promise<BacktestTrade> {
    const response = await fetch(`${API_URL}/api/v1/backtesting/trades`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include', // ✅ Send cookies (JWT)
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create backtest trade');
    }
    const trade = await response.json();
    return transformTrade(trade);
  },

  async getTrades(
    filters?: {
      strategyId?: string;
      symbol?: string;
      session?: string;
      timeframe?: string;
      outcome?: string;
      startDate?: string;
      endDate?: string;
    },
    pagination?: {
      page?: number;
      limit?: number;
    },
  ): Promise<{
    data: BacktestTrade[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    if (pagination?.page) {
      params.append('page', pagination.page.toString());
    }
    if (pagination?.limit) {
      params.append('limit', pagination.limit.toString());
    }

    const url = `${API_URL}/api/v1/backtesting/trades${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
      credentials: 'include', // ✅ Send cookies (JWT)
    });
    if (!response.ok) throw new Error('Failed to fetch backtest trades');
    const result = await response.json();

    return {
      data: result.data.map(transformTrade),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  },

  async getTrade(id: string): Promise<BacktestTrade> {
    const response = await fetch(`${API_URL}/api/v1/backtesting/trades/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include', // ✅ Send cookies (JWT)
    });
    if (!response.ok) throw new Error('Failed to fetch backtest trade');
    const trade = await response.json();
    return transformTrade(trade);
  },

  async updateTrade(id: string, data: Partial<CreateBacktestTradeDto>): Promise<BacktestTrade> {
    const response = await fetch(`${API_URL}/api/v1/backtesting/trades/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update backtest trade');
    const trade = await response.json();
    return transformTrade(trade);
  },

  async deleteTrade(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/backtesting/trades/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include', // ✅ Send cookies (JWT)
    });
    if (!response.ok) throw new Error('Failed to delete backtest trade');
  },

  // ============ ANALYTICS ============

  async getOverallStats(): Promise<BacktestStats> {
    const response = await fetch(`${API_URL}/api/v1/backtesting/stats`, {
      headers: getAuthHeaders(),
      credentials: 'include', // ✅ Send cookies (JWT)
    });
    if (!response.ok) throw new Error('Failed to fetch overall stats');
    const stats = await response.json();
    // Transform known decimal fields in stats if necessary, though simpler to assume safer backend stats
    // But let's be safe
    return {
      ...stats,
      winRate: Number(stats.winRate),
      totalPnlPips: Number(stats.totalPnlPips),
      totalPnlDollars: Number(stats.totalPnlDollars),
      averageRMultiple: Number(stats.averageRMultiple),
      profitFactor: Number(stats.profitFactor),
      expectancy: Number(stats.expectancy),
      ruleFollowingRate: Number(stats.ruleFollowingRate),
    };
  },

  async getStrategyStats(strategyId: string): Promise<BacktestStats> {
    const response = await fetch(`${API_URL}/api/v1/backtesting/strategies/${strategyId}/stats`, {
      headers: getAuthHeaders(),
      credentials: 'include', // ✅ Send cookies (JWT)
    });
    if (!response.ok) throw new Error('Failed to fetch strategy stats');
    const stats = await response.json();
    return {
      ...stats,
      winRate: Number(stats.winRate),
      totalPnlPips: Number(stats.totalPnlPips),
      totalPnlDollars: Number(stats.totalPnlDollars),
      averageRMultiple: Number(stats.averageRMultiple),
      profitFactor: Number(stats.profitFactor),
      expectancy: Number(stats.expectancy),
      ruleFollowingRate: Number(stats.ruleFollowingRate),
    };
  },

  async getDimensionStats(
    strategyId: string,
    dimension: 'symbol' | 'session' | 'timeframe' | 'killZone' | 'dayOfWeek' | 'setupType'
  ): Promise<DimensionStats[]> {
    const response = await fetch(
      `${API_URL}/api/v1/backtesting/strategies/${strategyId}/dimension/${dimension}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include' // ✅ Send cookies (JWT)
      }
    );
    if (!response.ok) throw new Error('Failed to fetch dimension stats');
    const data = await response.json();
    return data.map((item: any) => ({
      ...item,
      winRate: Number(item.winRate),
      profitFactor: Number(item.profitFactor),
      expectancy: Number(item.expectancy),
    }));
  },

  async getPerformanceMatrix(
    strategyId: string,
    rows: 'session' | 'timeframe' | 'killZone' | 'dayOfWeek' = 'session',
    columns: 'symbol' | 'session' | 'timeframe' = 'symbol'
  ): Promise<PerformanceMatrix> {
    const response = await fetch(
      `${API_URL}/api/v1/backtesting/strategies/${strategyId}/matrix?rows=${rows}&columns=${columns}`,
      {
        headers: getAuthHeaders(),
        credentials: 'include' // ✅ Send cookies (JWT)
      }
    );
    if (!response.ok) throw new Error('Failed to fetch performance matrix');
    const matrix = await response.json();
    return {
      ...matrix,
      data: matrix.data.map((item: any) => ({
         ...item,
         winRate: Number(item.winRate),
         profitFactor: Number(item.profitFactor),
      }))
    };
  },

  async getAnalysisData(strategyId: string): Promise<AnalysisData> {
    const response = await fetch(
      `${API_URL}/api/v1/backtesting/strategies/${strategyId}/analysis`,
      {
        headers: getAuthHeaders(),
        credentials: 'include' // ✅ Send cookies (JWT)
      }
    );
    if (!response.ok) throw new Error('Failed to fetch analysis data');
    const data = await response.json();
    // Recursive transformation might be complex, but key fields:
    return {
      ...data,
      overallStats: {
        ...data.overallStats,
        winRate: Number(data.overallStats.winRate),
        totalPnlPips: Number(data.overallStats.totalPnlPips),
        totalPnlDollars: Number(data.overallStats.totalPnlDollars),
        averageRMultiple: Number(data.overallStats.averageRMultiple),
        profitFactor: Number(data.overallStats.profitFactor),
        expectancy: Number(data.overallStats.expectancy),
        ruleFollowingRate: Number(data.overallStats.ruleFollowingRate),
      },
      // Transform nested arrays if needed, but these seem to be the critical top-level ones causing crashes
    };
  },

  async getSymbols(): Promise<string[]> {
    const response = await fetch(`${API_URL}/api/v1/backtesting/symbols`, {
      headers: getAuthHeaders(),
      credentials: 'include', // ✅ Send cookies (JWT)
    });
    if (!response.ok) throw new Error('Failed to fetch symbols');
    return response.json();
  },

  // ============ MARKET LOGS ============

  async createLog(data: CreateMarketLogDto): Promise<MarketLog> {
    const response = await fetch(`${API_URL}/api/v1/backtesting/logs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create market log');
    }
    return response.json();
  },

  async getLogs(filters?: {
    symbol?: string;
    session?: string;
    timeframe?: string;
    sentiment?: string;
    tags?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<MarketLog[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value as string);
          }
        }
      });
    }

    const url = `${API_URL}/api/v1/backtesting/logs${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
      credentials: 'include', // ✅ Send cookies (JWT)
    });
    if (!response.ok) throw new Error('Failed to fetch market logs');
    return response.json();
  },

  async getLog(id: string): Promise<MarketLog> {
    const response = await fetch(`${API_URL}/api/v1/backtesting/logs/${id}`, {
      headers: getAuthHeaders(),
      credentials: 'include', // ✅ Send cookies (JWT)
    });
    if (!response.ok) throw new Error('Failed to fetch market log');
    return response.json();
  },

  async updateLog(id: string, data: UpdateMarketLogDto): Promise<MarketLog> {
    const response = await fetch(`${API_URL}/api/v1/backtesting/logs/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update market log');
    return response.json();
  },

  async deleteLog(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/backtesting/logs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include', // ✅ Send cookies (JWT)
    });
    if (!response.ok) throw new Error('Failed to delete market log');
  },

  async analyzePatterns(): Promise<{ totalLogs: number; discoveries: MarketPatternDiscovery[] }> {
    const response = await fetch(`${API_URL}/api/v1/backtesting/logs/analysis`, {
      headers: getAuthHeaders(),
      credentials: 'include', // ✅ Send cookies (JWT)
    });
    if (!response.ok) throw new Error('Failed to fetch pattern analysis');
    return response.json();
  },

  // ============ EXPORT ============

  async exportTradesCSV(filters?: {
    strategyId?: string;
    symbol?: string;
    session?: string;
    timeframe?: string;
    outcome?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    params.append('format', 'csv');

    const url = `${API_URL}/api/v1/backtesting/trades/export${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
      credentials: 'include', // ✅ Send cookies (JWT)
    });

    if (!response.ok) {
      throw new Error('Failed to export trades');
    }

    // Get JSON response with CSV data
    const result = await response.json();

    // Convert CSV string to Blob
    const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
    return blob;
  },

  async exportStrategyReport(strategyId: string): Promise<{
    blob: Blob;
    stats: BacktestStats;
    dimensionAnalysis: any;
  }> {
    const response = await fetch(
      `${API_URL}/api/v1/backtesting/strategies/${strategyId}/export`,
      {
        headers: getAuthHeaders(),
        credentials: 'include', // ✅ Send cookies (JWT)
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export strategy report');
    }

    const result = await response.json();

    // Convert CSV string to Blob
    const blob = new Blob([result.csvData], { type: 'text/csv;charset=utf-8;' });

    return {
      blob,
      stats: result.stats,
      dimensionAnalysis: result.dimensionAnalysis,
    };
  },

  // Helper function to trigger CSV download
  downloadCSV(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // ============ AI INSIGHTS ============

  async *streamInsights(strategyId: string): AsyncGenerator<string> {
    const url = `${API_URL}/api/v1/backtesting/strategies/${strategyId}/insights`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
      credentials: 'include', // ✅ Send cookies (JWT)
    });

    if (!response.ok) {
      throw new Error('Failed to fetch AI insights');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.done) {
              return;
            }
            if (data.text) {
              yield data.text;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  // ============ FILE UPLOAD ============

  async uploadScreenshot(file: File): Promise<{ url: string; filename: string; size: number; mimetype: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/v1/upload/screenshot`, {
      method: 'POST',
      credentials: 'include', // ✅ Send cookies (JWT)
      body: formData, // Don't set Content-Type header - browser will set it with boundary
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to upload screenshot' }));
      throw new Error(error.message || 'Failed to upload screenshot');
    }

    return response.json();
  },
};

// Export uploadScreenshot as named export for easier importing
export const uploadScreenshot = backtestingService.uploadScreenshot.bind(backtestingService);
