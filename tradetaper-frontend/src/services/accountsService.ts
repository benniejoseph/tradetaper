import { authApiClient } from './api';

export interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
  description?: string;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountPayload {
  name: string;
  balance: number;
  currency?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateAccountPayload {
  name?: string;
  balance?: number;
  currency?: string;
  description?: string;
  isActive?: boolean;
}

class AccountsService {
  async getAccounts(): Promise<Account[]> {
    const response = await authApiClient.get('/accounts');
    return response.data;
  }

  async getAccount(id: string): Promise<Account> {
    const response = await authApiClient.get(`/accounts/${id}`);
    return response.data;
  }

  async createAccount(payload: CreateAccountPayload): Promise<Account> {
    const response = await authApiClient.post('/accounts', payload);
    return response.data;
  }

  async updateAccount(id: string, payload: UpdateAccountPayload): Promise<Account> {
    const response = await authApiClient.put(`/accounts/${id}`, payload);
    return response.data;
  }

  async deleteAccount(id: string): Promise<void> {
    await authApiClient.delete(`/accounts/${id}`);
  }
}

export const accountsService = new AccountsService(); 