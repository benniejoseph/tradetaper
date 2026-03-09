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

export interface LivePosition {
  ticket: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  openTime: string;
  stopLoss?: number;
  takeProfit?: number;
}

export interface LivePositionsResponse {
  enabled: boolean;
  accountId?: string;
  accountName?: string;
  terminalId?: string;
  status?: TerminalStatus['status'];
  lastHeartbeat?: string;
  positionsUpdatedAt?: string;
  positions: LivePosition[];
}

export interface LocalConnectorConfig {
  terminalId: string;
  authToken: string;
  pairingCode: string;
  mt5Login: string;
  mt5Server: string;
  apiEndpoint: string;
  connectorVersion: string;
}

export const terminalService = {
  /**
   * Enable auto-sync for an MT5 account
   */
  async enableAutoSync(
    accountId: string,
    credentials?: {
      server: string;
      login: string;
      password: string;
      confirmRiskAcknowledgement?: boolean;
    },
  ): Promise<TerminalStatus> {
    const response = await authApiClient.post<TerminalStatus>(
      `/mt5-accounts/${accountId}/enable-autosync`,
      credentials
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

  /**
   * Get per-terminal auth token (JWT) for webhook authentication
   */
  async getTerminalToken(accountId: string): Promise<{ token: string }> {
    const response = await authApiClient.get<{ token: string }>(
      `/mt5-accounts/${accountId}/terminal-token`
    );
    return response.data;
  },

  /**
   * Get account-bound local connector bundle for EA setup
   */
  async getLocalConnectorConfig(accountId: string): Promise<LocalConnectorConfig> {
    const response = await authApiClient.get<LocalConnectorConfig>(
      `/mt5-accounts/${accountId}/local-connector-config`
    );
    return response.data;
  },

  /**
   * Request a manual sync from local MT5 terminal
   */
  async requestManualSync(accountId: string): Promise<{ queued: boolean; message: string }> {
    const response = await authApiClient.post<{ queued: boolean; message: string }>(
      `/mt5-accounts/${accountId}/sync-terminal`
    );
    return response.data;
  },

  /**
   * Get live positions for an MT5 account
   */
  async getLivePositions(accountId: string): Promise<LivePositionsResponse> {
    const response = await authApiClient.get<LivePositionsResponse>(
      `/mt5-accounts/${accountId}/live-positions`
    );
    return response.data;
  },
};
