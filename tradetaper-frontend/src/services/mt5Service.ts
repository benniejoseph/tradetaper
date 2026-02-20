// src/services/mt5Service.ts
import { authApiClient } from './api';

export interface MT5ConnectionStatus {
  state: string;
  connectionStatus: string;
  deployed: boolean;
  autoSyncEnabled: boolean;
}

export const mt5Service = {
  /**
   * Get connection/sync status
   */
  async getConnectionStatus(accountId: string): Promise<MT5ConnectionStatus> {
    const response = await authApiClient.get<MT5ConnectionStatus>(
      `/mt5-accounts/${accountId}/status`
    );
    return response.data;
  },

  /**
   * Trigger sync (Terminal Farm)
   */
  async syncAccount(accountId: string): Promise<void> {
    await authApiClient.post(`/mt5-accounts/${accountId}/sync`);
  },

  /**
   * Search MetaApi MT5 servers
   */
  async searchServers(query: string): Promise<Array<{ name: string; broker?: string; type?: string }>> {
    if (!query || query.trim().length < 2) return [];
    const response = await authApiClient.get(`/mt5-accounts/servers`, {
      params: { query },
    });
    return response.data as Array<{ name: string; broker?: string; type?: string }>;
  },
};
