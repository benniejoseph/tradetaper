import {
  BacktestTrade,
  CreateBacktestTradeDto,
  BacktestStats,
  DimensionStats,
  PerformanceMatrix,
  AnalysisData,
} from '@/types/backtesting';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const backtestingService = {
  // ============ CRUD ============

  async createTrade(data: CreateBacktestTradeDto): Promise<BacktestTrade> {
    const response = await fetch(`${API_URL}/api/v1/backtesting/trades`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create backtest trade');
    }
    return response.json();
  },

  async getTrades(filters?: {
    strategyId?: string;
    symbol?: string;
    session?: string;
    timeframe?: string;
    outcome?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<BacktestTrade[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const url = `${API_URL}/api/v1/backtesting/trades${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch backtest trades');
    return response.json();
  },

  async getTrade(id: string): Promise<BacktestTrade> {
    const response = await fetch(`${API_URL}/api/v1/backtesting/trades/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch backtest trade');
    return response.json();
  },

  async updateTrade(id: string, data: Partial<CreateBacktestTradeDto>): Promise<BacktestTrade> {
    const response = await fetch(`${API_URL}/api/v1/backtesting/trades/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update backtest trade');
    return response.json();
  },

  async deleteTrade(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/v1/backtesting/trades/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete backtest trade');
  },

  // ============ ANALYTICS ============

  async getOverallStats(): Promise<BacktestStats> {
    const response = await fetch(`${API_URL}/api/v1/backtesting/stats`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch overall stats');
    return response.json();
  },

  async getStrategyStats(strategyId: string): Promise<BacktestStats> {
    const response = await fetch(`${API_URL}/api/v1/backtesting/strategies/${strategyId}/stats`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch strategy stats');
    return response.json();
  },

  async getDimensionStats(
    strategyId: string,
    dimension: 'symbol' | 'session' | 'timeframe' | 'killZone' | 'dayOfWeek' | 'setupType'
  ): Promise<DimensionStats[]> {
    const response = await fetch(
      `${API_URL}/api/v1/backtesting/strategies/${strategyId}/dimension/${dimension}`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch dimension stats');
    return response.json();
  },

  async getPerformanceMatrix(
    strategyId: string,
    rows: 'session' | 'timeframe' | 'killZone' | 'dayOfWeek' = 'session',
    columns: 'symbol' | 'session' | 'timeframe' = 'symbol'
  ): Promise<PerformanceMatrix> {
    const response = await fetch(
      `${API_URL}/api/v1/backtesting/strategies/${strategyId}/matrix?rows=${rows}&columns=${columns}`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch performance matrix');
    return response.json();
  },

  async getAnalysisData(strategyId: string): Promise<AnalysisData> {
    const response = await fetch(
      `${API_URL}/api/v1/backtesting/strategies/${strategyId}/analysis`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch analysis data');
    return response.json();
  },

  async getSymbols(): Promise<string[]> {
    const response = await fetch(`${API_URL}/api/v1/backtesting/symbols`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch symbols');
    return response.json();
  },
};
