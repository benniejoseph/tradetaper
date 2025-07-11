import { CreatePredictionDto, PredictionResult } from '@/types/predictive-trades';
import { apiClient } from './api';

export const predictiveTradesService = {
  predict: async (data: CreatePredictionDto): Promise<PredictionResult> => {
    const response = await apiClient.post('/predictive-trades/predict', data);
    return response.data;
  },
}; 