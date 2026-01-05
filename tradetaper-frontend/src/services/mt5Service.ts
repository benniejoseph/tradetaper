// src/services/mt5Service.ts
import { authApiClient } from './api';

export interface MT5LinkRequest {
  password: string;
}

export interface MT5LinkResponse {
  success: boolean;
  message: string;
  metaApiAccountId: string;
  state: string;
}

export interface MT5ConnectionStatus {
  state: string;
  connectionStatus: string;
  deployed: boolean;
  metaApiAvailable: boolean;
}

export interface MT5ImportRequest {
  fromDate: string;
  toDate: string;
}

export interface MT5ImportResponse {
  imported: number;
  skipped: number;
  errors: number;
}

export const mt5Service = {
  /**
   * Link MT5 account to MetaApi cloud for real-time sync
   */
  async linkAccount(accountId: string, password: string): Promise<MT5LinkResponse> {
    const response = await authApiClient.post<MT5LinkResponse>(
      `/mt5-accounts/${accountId}/link`,
      { password }
    );
    return response.data;
  },

  /**
   * Unlink MT5 account from MetaApi
   */
  async unlinkAccount(accountId: string): Promise<{ success: boolean; message: string }> {
    const response = await authApiClient.post<{ success: boolean; message: string }>(
      `/mt5-accounts/${accountId}/unlink`
    );
    return response.data;
  },

  /**
   * Get connection status from MetaApi
   */
  async getConnectionStatus(accountId: string): Promise<MT5ConnectionStatus> {
    const response = await authApiClient.get<MT5ConnectionStatus>(
      `/mt5-accounts/${accountId}/status`
    );
    return response.data;
  },

  /**
   * Sync account info (balance, equity) from MetaApi
   */
  async syncAccount(accountId: string): Promise<void> {
    await authApiClient.post(`/mt5-accounts/${accountId}/sync`);
  },

  /**
   * Import trade history from MT5
   */
  async importTrades(
    accountId: string,
    fromDate: string,
    toDate: string
  ): Promise<MT5ImportResponse> {
    const response = await authApiClient.post<MT5ImportResponse>(
      `/mt5-accounts/${accountId}/import-trades`,
      { fromDate, toDate }
    );
    return response.data;
  },
};
