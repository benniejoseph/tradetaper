import { authApiClient } from './api';
import { MT5Account, CreateMT5AccountPayload, UpdateMT5AccountPayload } from '@/types/mt5Account';

const MT5_ACCOUNTS_ENDPOINT = '/mt5-accounts';

export interface MT5Server {
  name: string;
  description: string;
  country?: string;
  category?: string;
}

export const MT5AccountsService = {
  // Fetch all MT5 accounts for the logged-in user
  async getAccounts(): Promise<MT5Account[]> {
    const response = await authApiClient.get<MT5Account[]>(MT5_ACCOUNTS_ENDPOINT);
    return response.data;
  },

  // Get a single MT5 account by ID
  async getAccount(id: string): Promise<MT5Account> {
    const response = await authApiClient.get<MT5Account>(`${MT5_ACCOUNTS_ENDPOINT}/${id}`);
    return response.data;
  },

  // Fetch list of MT5 servers from backend
  async getServers(): Promise<MT5Server[]> {
    try {
      const response = await authApiClient.get<MT5Server[]>(`${MT5_ACCOUNTS_ENDPOINT}/servers`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch MT5 servers:', error);
      // Return some fallback servers if API fails
      return [
        { name: 'demo.mt5.com', description: 'MetaTrader 5 Demo Server' },
        { name: 'icmarkets-demo', description: 'IC Markets Demo Server' },
        { name: 'fxpro-mt5demo', description: 'FxPro Demo Server' },
        { name: 'pepperstone-demo', description: 'Pepperstone Demo Server' },
        { name: 'xm-demo', description: 'XM Demo Server' },
      ];
    }
  },

  // Create a new MT5 account
  async createAccount(accountData: CreateMT5AccountPayload): Promise<MT5Account> {
    const response = await authApiClient.post<MT5Account>(MT5_ACCOUNTS_ENDPOINT, accountData);
    return response.data;
  },

  // Update an existing MT5 account
  async updateAccount(id: string, accountData: UpdateMT5AccountPayload): Promise<MT5Account> {
    const response = await authApiClient.patch<MT5Account>(`${MT5_ACCOUNTS_ENDPOINT}/${id}`, accountData);
    return response.data;
  },

  // Delete an MT5 account
  async deleteAccount(id: string): Promise<void> {
    await authApiClient.delete(`${MT5_ACCOUNTS_ENDPOINT}/${id}`);
  },

  // Sync an MT5 account with the MetaTrader 5 server
  async syncAccount(id: string): Promise<MT5Account> {
    const response = await authApiClient.post<MT5Account>(`${MT5_ACCOUNTS_ENDPOINT}/${id}/sync`);
    return response.data;
  },

  // Import trades from MT5 account
  async importTrades(id: string, fromDate: Date, toDate: Date): Promise<any[]> {
    const response = await authApiClient.post<any[]>(`${MT5_ACCOUNTS_ENDPOINT}/${id}/import-trades`, {
      fromDate: fromDate.toISOString(),
      toDate: toDate.toISOString(),
    });
    return response.data;
  },

  // Validate MT5 account connection
  async validateConnection(id: string): Promise<{ valid: boolean; message: string }> {
    const response = await authApiClient.post<{ valid: boolean; message: string }>(`${MT5_ACCOUNTS_ENDPOINT}/${id}/validate`);
    return response.data;
  }
}; 