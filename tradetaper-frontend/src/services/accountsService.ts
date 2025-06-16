import { authApiClient } from './api';

export interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
  description?: string;
  isActive: boolean;
  target: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountPayload {
  name: string;
  balance?: number;
  currency?: string;
  description?: string;
  target?: number;
}

export interface UpdateAccountPayload {
  name?: string;
  balance?: number;
  currency?: string;
  description?: string;
  isActive?: boolean;
  target?: number;
}

export const accountsService = {
  async getAccounts(): Promise<Account[]> {
    const response = await authApiClient.get('/accounts');
    return response.data;
  },

  async getAccount(id: string): Promise<Account> {
    const response = await authApiClient.get(`/accounts/${id}`);
    return response.data;
  },

  async createAccount(data: CreateAccountPayload): Promise<Account> {
    const response = await authApiClient.post('/accounts', data);
    return response.data;
  },

  async updateAccount(id: string, data: UpdateAccountPayload): Promise<Account> {
    const response = await authApiClient.put(`/accounts/${id}`, data);
    return response.data;
  },

  async deleteAccount(id: string): Promise<void> {
    await authApiClient.delete(`/accounts/${id}`);
  },
}; 