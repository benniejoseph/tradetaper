/**
 * MT5Account represents a MetaTrader 5 trading account in the TradeTaper system
 */
export interface MT5Account {
  id: string;
  accountName: string;
  server: string;
  login: string;
  balance?: number;
  equity?: number;
  margin?: number;
  marginFree?: number;
  marginLevel?: number;
  profit?: number;
  leverage?: number;
  currency?: string;
  isActive: boolean;
  connectionStatus?: string;
  lastSyncAt?: string;
  lastSyncError?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  // Legacy fields for backward compatibility
  freeMargin?: number;
  lastSynced?: string;
  lastSyncStatus?: 'success' | 'failed' | 'pending';
}

/**
 * Payload for creating a new MT5 account
 */
export interface CreateMT5AccountPayload {
  accountName: string;
  server: string;
  login: string;
  password: string;
  isActive: boolean;
}

/**
 * Payload for updating an existing MT5 account
 */
export interface UpdateMT5AccountPayload {
  accountName?: string;
  server?: string;
  login?: string;
  password?: string;
  isActive?: boolean;
} 