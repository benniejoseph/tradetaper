// src/services/terminalService.ts
import { authApiClient } from './api';

export interface TerminalStatus {
  id: string;
  accountId: string;
  accountName: string;
  status: 'PENDING' | 'STARTING' | 'RUNNING' | 'STOPPING' | 'STOPPED' | 'ERROR';
  containerId?: string;
  lastHeartbeat?: string;
  lastSyncAt?: string;
  createdAt: string;
}

export const terminalService = {
  /**
   * Enable auto-sync for an MT5 account
   */
  async enableAutoSync(accountId: string): Promise<TerminalStatus> {
    const response = await authApiClient.post<TerminalStatus>(
      `/mt5-accounts/${accountId}/enable-autosync`
    );
    return response.data;
  },

  /**
   * Disable auto-sync for an MT5 account
   */
  async disableAutoSync(accountId: string): Promise<void> {
    await authApiClient.delete(`/mt5-accounts/${accountId}/disable-autosync`);
  },

  /**
   * Get terminal status for an account
   */
  async getTerminalStatus(accountId: string): Promise<TerminalStatus | { enabled: false }> {
    const response = await authApiClient.get<TerminalStatus | { enabled: false }>(
      `/mt5-accounts/${accountId}/terminal-status`
    );
    return response.data;
  },
};
