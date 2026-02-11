// src/services/tradesService.ts
import { authApiClient } from './api';
import { Trade, CreateTradePayload, UpdateTradePayload } from '@/types/trade';
import { ChecklistResponse } from './disciplineService';

// ==================== Types ====================

export interface CreateTradeFromDisciplineDto {
  accountId: string;
  strategyId: string;
  symbol: string;
  direction: 'Long' | 'Short';
  lotSize: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit?: number;
  riskPercent: number;
  checklistResponses: ChecklistResponse[];
}

// ==================== API Functions ====================

export const tradesService = {
  // Get all trades
  getTrades: async (): Promise<Trade[]> => {
    const response = await authApiClient.get('/trades');
    return response.data;
  },

  // Get a single trade by ID
  getTrade: async (id: string): Promise<Trade> => {
    const response = await authApiClient.get(`/trades/${id}`);
    return response.data;
  },

  // Create a new trade
  createTrade: async (dto: CreateTradePayload): Promise<Trade> => {
    const response = await authApiClient.post('/trades', dto);
    return response.data;
  },

  // Create a trade from discipline flow (with approval/checklist data)
  createFromDiscipline: async (dto: CreateTradeFromDisciplineDto): Promise<Trade> => {
    const response = await authApiClient.post('/trades/discipline', dto);
    return response.data;
  },

  // Update an existing trade
  updateTrade: async (id: string, dto: UpdateTradePayload): Promise<Trade> => {
    const response = await authApiClient.put(`/trades/${id}`, dto);
    return response.data;
  },

  // Delete a trade
  deleteTrade: async (id: string): Promise<void> => {
    await authApiClient.delete(`/trades/${id}`);
  },

  // Star/unstar a trade
  toggleStar: async (id: string): Promise<Trade> => {
    const response = await authApiClient.patch(`/trades/${id}/star`);
    return response.data;
  },
};

export default tradesService;
