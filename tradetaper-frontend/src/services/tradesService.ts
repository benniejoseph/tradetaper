
import { api } from './api';
import { CreateTradeDto, UpdateTradeDto } from '../types/trade';
import { Trade } from '../types/trade';

export const tradesService = {
  async createTrade(trade: CreateTradeDto): Promise<Trade> {
    const response = await api.post<Trade>('/trades', trade);
    return response.data;
  },

  async getTrades(accountId?: string, page?: number, limit?: number): Promise<Trade[]> {
    const params = new URLSearchParams();
    if (accountId) params.append('accountId', accountId);
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    const response = await api.get<Trade[]>(`/trades?${params.toString()}`);
    return response.data;
  },

  async getTradeById(id: string): Promise<Trade> {
    const response = await api.get<Trade>(`/trades/${id}`);
    return response.data;
  },

  async updateTrade(id: string, trade: UpdateTradeDto): Promise<Trade> {
    const response = await api.patch<Trade>(`/trades/${id}`, trade);
    return response.data;
  },

  async deleteTrade(id: string): Promise<void> {
    await api.delete(`/trades/${id}`);
  },

  async analyzeChart(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<any>('/trades/analyze-chart', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
