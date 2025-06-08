import { Strategy, CreateStrategyDto, UpdateStrategyDto, StrategyStats } from '@/types/strategy';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class StrategiesService {
  private async getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getStrategies(): Promise<Strategy[]> {
    const response = await fetch(`${API_BASE_URL}/strategies`, {
      headers: await this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch strategies');
    }
    
    return response.json();
  }

  async getStrategiesWithStats(): Promise<Strategy[]> {
    const response = await fetch(`${API_BASE_URL}/strategies/with-stats`, {
      headers: await this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch strategies with stats');
    }
    
    return response.json();
  }

  async getStrategy(id: string): Promise<Strategy> {
    const response = await fetch(`${API_BASE_URL}/strategies/${id}`, {
      headers: await this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch strategy');
    }
    
    return response.json();
  }

  async getStrategyStats(id: string): Promise<StrategyStats> {
    const response = await fetch(`${API_BASE_URL}/strategies/${id}/stats`, {
      headers: await this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch strategy stats');
    }
    
    return response.json();
  }

  async createStrategy(data: CreateStrategyDto): Promise<Strategy> {
    const response = await fetch(`${API_BASE_URL}/strategies`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create strategy');
    }
    
    return response.json();
  }

  async updateStrategy(id: string, data: UpdateStrategyDto): Promise<Strategy> {
    const response = await fetch(`${API_BASE_URL}/strategies/${id}`, {
      method: 'PATCH',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update strategy');
    }
    
    return response.json();
  }

  async toggleStrategyActive(id: string): Promise<Strategy> {
    const response = await fetch(`${API_BASE_URL}/strategies/${id}/toggle-active`, {
      method: 'PATCH',
      headers: await this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to toggle strategy active status');
    }
    
    return response.json();
  }

  async deleteStrategy(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/strategies/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete strategy');
    }
  }
}

export const strategiesService = new StrategiesService();