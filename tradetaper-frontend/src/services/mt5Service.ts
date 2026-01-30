// src/services/mt5Service.ts
import { authApiClient } from './api';

export interface MT5ConnectionStatus {
  state: string;
  connectionStatus: string;
  deployed: boolean;
  ftpConfigured: boolean;
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
   * Trigger sync (placeholder for FTP sync)
   */
  async syncAccount(accountId: string): Promise<void> {
    await authApiClient.post(`/mt5-accounts/${accountId}/sync`);
  },
};
