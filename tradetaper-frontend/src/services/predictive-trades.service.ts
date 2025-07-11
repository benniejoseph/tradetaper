import { apiClient } from './apiClient';

export interface CreatePredictionDto {
  instrument: string;
  direction: 'buy' | 'sell';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  expectedDurationHours?: number;
}

export const predictiveTradesService = {
  predict: async (data: CreatePredictionDto) => {
    const response = await apiClient.post('/predictive-trades/predict', data);
    return response.data;
  },
}; 