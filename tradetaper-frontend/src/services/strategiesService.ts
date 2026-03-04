import {
  Strategy,
  CreateStrategyDto,
  UpdateStrategyDto,
  StrategyStats,
} from '@/types/strategy';
import { authApiClient } from './api';

class StrategiesService {
  async getStrategies(): Promise<Strategy[]> {
    const response = await authApiClient.get<Strategy[]>('/strategies');
    return response.data;
  }

  async getStrategiesWithStats(): Promise<Strategy[]> {
    const response = await authApiClient.get<Strategy[]>(
      '/strategies/with-stats',
    );
    return response.data;
  }

  async getStrategy(id: string): Promise<Strategy> {
    const response = await authApiClient.get<Strategy>(`/strategies/${id}`);
    return response.data;
  }

  async getStrategyStats(id: string): Promise<StrategyStats> {
    const response = await authApiClient.get<StrategyStats>(
      `/strategies/${id}/stats`,
    );
    return response.data;
  }

  async createStrategy(data: CreateStrategyDto): Promise<Strategy> {
    const response = await authApiClient.post<Strategy>('/strategies', data);
    return response.data;
  }

  async updateStrategy(id: string, data: UpdateStrategyDto): Promise<Strategy> {
    const response = await authApiClient.patch<Strategy>(`/strategies/${id}`, data);
    return response.data;
  }

  async toggleStrategyActive(id: string): Promise<Strategy> {
    const response = await authApiClient.patch<Strategy>(
      `/strategies/${id}/toggle-active`,
    );
    return response.data;
  }

  async deleteStrategy(id: string): Promise<void> {
    await authApiClient.delete(`/strategies/${id}`);
  }
}

export const strategiesService = new StrategiesService();
