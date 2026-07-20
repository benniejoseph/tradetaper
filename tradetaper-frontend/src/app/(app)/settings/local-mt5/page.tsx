"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  FaDesktop, FaSync, FaPlay, FaStop, FaCopy, FaCheck,
  FaExclamationTriangle, FaCircle, FaChartLine, FaInfoCircle,
  FaFingerprint, FaCloud, FaExchangeAlt, FaCheckCircle,
} from 'react-icons/fa';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface TerminalStatus {
  id: string;
  accountId: string;
  accountName: string;
  status: 'PENDING' | 'STARTING' | 'RUNNING' | 'STOPPING' | 'STOPPED' | 'ERROR' | 'PROVISIONING';
  containerId?: string;
  lastHeartbeat?: string;
  lastSyncAt?: string;
  createdAt?: string;
  enabled?: boolean;
}

interface LocalConnectorConfig {
  terminalId: string;
  authToken: string;
  pairingCode: string;
  mt5Login: string;
  mt5Server: string;
  apiEndpoint: string;
  connectorVersion: string;
}

interface LivePosition {
  ticket: number;
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  currentPrice?: number;
  profit?: number;
  stopLoss?: number;
  takeProfit?: number;
  openTime?: string;
}

interface MT5Account {
  id: string;
  accountName: string;
  server: string;
  login: string;
  platform: string;
  balance?: number;
  equity?: number;
  /** Whether a MetaAPI streaming connection is active for this account */
  isStreamingActive?: boolean;
  metaApiAccountId?: string;
  connectionStatus?: string;
}

type SyncMode = 'metaapi' | 'terminal' | 'none';

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error !== 'object' || error === null) return fallback;

  const apiError = error as {
    response?: { data?: { message?: unknown } };
    message?: unknown;
  };

  const raw = apiError.response?.data?.message ?? apiError.message ?? fallback;
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') return item;
        if (
          item &&
          typeof item === 'object' &&
          'field' in item &&
          'errors' in item &&
          Array.isArray((item as { errors?: unknown[] }).errors)
        ) {
          const typed = item as { field?: unknown; errors: unknown[] };
          return `${String(typed.field ?? 'validation')}: ${typed.errors.map(String).join(', ')}`;
        }
        return JSON.stringify(item);
      })
      .join(' | ');
  }

  if (raw && typeof raw === 'object') {
    if (
      'field' in raw &&
      'errors' in raw &&
      Array.isArray((raw as { errors?: unknown[] }).errors)
    ) {
      const typed = raw as { field?: unknown; errors: unknown[] };
      return `${String(typed.field ?? 'validation')}: ${typed.errors.map(String).join(', ')}`;
    }
    return JSON.stringify(raw);
  }

  return String(raw || fallback);
};

const normalizeTerminalStatus = (payload: unknown): TerminalStatus | null => {
  if (!payload || typeof payload !== 'object') return null;

  const value = payload as Partial<TerminalStatus> & { enabled?: boolean };
  if (value.enabled === false) return null;
  if (!value.id || !value.status) return null;

  return value as TerminalStatus;
};

/** Derive the current active sync mode from account + terminal status */
function getActiveSyncMode(account: MT5Account | undefined, terminal: TerminalStatus | null): SyncMode {
  if (!account) return 'none';
  const terminalRunning = terminal?.status === 'RUNNING';
  const metaapiActive = !!(account.metaApiAccountId && account.isStreamingActive);
  if (terminalRunning) return 'terminal';
  if (metaapiActive) return 'metaapi';
  return 'none';
}

export default function LocalMT5SyncPage() {
  const DISCLAIMER_VERSION = 'v2';
  const [accounts, setAccounts] = useState<MT5Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [terminalStatus, setTerminalStatus] = useState<TerminalStatus | null>(null);
  const [connectorConfig, setConnectorConfig] = useState<LocalConnectorConfig | null>(null);
  const [positions, setPositions] = useState<LivePosition[]>([]);
  const [terminalIdCopied, setTerminalIdCopied] = useState(false);
  const [authTokenCopied, setAuthTokenCopied] = useState(false);
  const [pairingCodeCopied, setPairingCodeCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectorLoading, setConnectorLoading] = useState(false);
  const [connectorError, setConnectorError] = useState<string | null>(null);
  const [disconnectingMetaApi, setDisconnectingMetaApi] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const disclaimerStorageKey = selectedAccountId
    ? `tt_local_sync_disclaimer_${DISCLAIMER_VERSION}_${selectedAccountId}`
    : null;

  // Fetch MT5 accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await api.get('/mt5-accounts');
        setAccounts(res.data || []);
        if (res.data?.length > 0 && !selectedAccountId) {
          setSelectedAccountId(res.data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
      }
    };
    void fetchAccounts();
  }, [selectedAccountId]);

  const fetchStatus = useCallback(async () => {
    if (!selectedAccountId) return;
    try {
      const res = await api.get(`/mt5-accounts/${selectedAccountId}/terminal-status`);
      setTerminalStatus(normalizeTerminalStatus(res.data));
    } catch {
      setTerminalStatus(null);
    }
  }, [selectedAccountId]);

  const fetchConnectorConfig = useCallback(async () => {
    if (!selectedAccountId) return;
    setConnectorLoading(true);
    try {
      const res = await api.get(`/mt5-accounts/${selectedAccountId}/local-connector-config`);
      setConnectorConfig(res.data as LocalConnectorConfig);
      setConnectorError(null);
    } catch (err) {
      setConnectorConfig(null);
      setConnectorError(getApiErrorMessage(err, 'Failed to load connector bundle'));
    } finally {
      setConnectorLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    if (!selectedAccountId) return;
    if (!terminalStatus?.id) {
      setConnectorConfig(null);
      setConnectorError(null);
      return;
    }
    void fetchConnectorConfig();
  }, [selectedAccountId, terminalStatus?.id, fetchConnectorConfig]);

  useEffect(() => {
    if (!selectedAccountId || !terminalStatus?.id) return;
    const interval = setInterval(() => {
      void fetchConnectorConfig();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedAccountId, terminalStatus?.id, fetchConnectorConfig]);

  const fetchPositions = useCallback(async () => {
    if (!selectedAccountId) return;
    try {
      const res = await api.get(`/mt5-accounts/${selectedAccountId}/live-positions`);
      setPositions(res.data?.positions || []);
    } catch {
      setPositions([]);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    if (terminalStatus?.status === 'RUNNING') {
      fetchPositions();
      const interval = setInterval(fetchPositions, 15000);
      return () => clearInterval(interval);
    }
  }, [terminalStatus?.status, fetchPositions]);

  useEffect(() => {
    setTerminalIdCopied(false);
    setAuthTokenCopied(false);
    setPairingCodeCopied(false);
    setConnectorError(null);
  }, [selectedAccountId]);

  useEffect(() => {
    if (!disclaimerStorageKey || typeof window === 'undefined') {
      setDisclaimerAccepted(false);
      return;
    }
    setDisclaimerAccepted(localStorage.getItem(disclaimerStorageKey) === '1');
  }, [disclaimerStorageKey]);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const activeMode = getActiveSyncMode(selectedAccount, terminalStatus);
  const metaApiConflict = !!(
    selectedAccount?.metaApiAccountId &&
    selectedAccount?.isStreamingActive &&
    (!terminalStatus || terminalStatus.status !== 'RUNNING')
  );

  /** Pause MetaAPI streaming for this account before enabling terminal */
  const disconnectMetaApi = async (): Promise<boolean> => {
    if (!selectedAccountId) return false;
    setDisconnectingMetaApi(true);
    try {
      await api.post(`/mt5-accounts/${selectedAccountId}/pause-metaapi`);
      // Refresh account list to reflect new state
      const res = await api.get('/mt5-accounts');
      setAccounts(res.data || []);
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to disconnect MetaAPI'));
      return false;
    } finally {
      setDisconnectingMetaApi(false);
    }
  };

  const handleEnableSync = async () => {
    if (!selectedAccountId) return;

    if (!disclaimerAccepted) {
      toast.error('Please accept the Local MT5 disclaimer before enabling auto-sync.');
      return;
    }

    // Conflict: MetaAPI is active — auto-disconnect before enabling Terminal
    if (metaApiConflict) {
      toast.loading('Disconnecting MetaAPI streaming…', { id: 'mode-switch' });
      const success = await disconnectMetaApi();
      if (!success) {
        toast.dismiss('mode-switch');
        return;
      }
      toast.success('MetaAPI streaming paused. Enabling Terminal sync…', { id: 'mode-switch' });
    }

    setLoading(true);
    try {
      const res = await api.post(`/mt5-accounts/${selectedAccountId}/enable-autosync`, {
        confirmRiskAcknowledgement: true,
      });
      setTerminalStatus(normalizeTerminalStatus(res.data));
      await fetchConnectorConfig();
      toast.success('Local MT5 sync enabled!');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to enable sync'));
    } finally {
      setLoading(false);
    }
  };

  const handleDisableSync = async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    try {
      await api.delete(`/mt5-accounts/${selectedAccountId}/disable-autosync`);
      setTerminalStatus(null);
      setConnectorConfig(null);
      setPositions([]);
      toast.success('Local MT5 sync disabled');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to disable sync'));
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!selectedAccountId) return;
    setSyncing(true);
    try {
      const res = await api.post(`/mt5-accounts/${selectedAccountId}/sync-terminal`);
      toast.success(res.data?.message || 'Sync request queued!');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to queue sync'));
    } finally {
      setSyncing(false);
    }
  };

  const copyTerminalId = () => {
    if (!connectorConfig?.terminalId && !terminalStatus?.id) return;
    const terminalId = connectorConfig?.terminalId || terminalStatus?.id || '';
    navigator.clipboard.writeText(terminalId);
    setTerminalIdCopied(true);
    toast.success('Terminal ID copied');
    setTimeout(() => setTerminalIdCopied(false), 2000);
  };

  const copyAuthToken = () => {
    if (!connectorConfig?.authToken) return;
    navigator.clipboard.writeText(connectorConfig.authToken);
    setAuthTokenCopied(true);
    toast.success('Auth token copied');
    setTimeout(() => setAuthTokenCopied(false), 2000);
  };

  const copyPairingCode = () => {
    if (!connectorConfig?.pairingCode) return;
    navigator.clipboard.writeText(connectorConfig.pairingCode);
    setPairingCodeCopied(true);
    toast.success('Pairing code copied');
    setTimeout(() => setPairingCodeCopied(false), 2000);
  };

  const statusColor = (status?: string) => {
    switch (status) {
      case 'RUNNING': return 'text-emerald-600 dark:text-emerald-400';
      case 'STOPPED': return 'text-gray-600 dark:text-gray-400';
      case 'ERROR': return 'text-red-600 dark:text-red-400';
      case 'PROVISIONING': return 'text-amber-600 dark:text-yellow-400';
      default: return 'text-gray-500 dark:text-gray-500';
    }
  };

  const statusBg = (status?: string) => {
    switch (status) {
      case 'RUNNING': return 'bg-emerald-500/10 border-emerald-500/30';
      case 'STOPPED': return 'bg-gray-500/10 border-gray-500/30';
      case 'ERROR': return 'bg-red-500/10 border-red-500/30';
      case 'PROVISIONING': return 'bg-yellow-500/10 border-yellow-500/30';
      default: return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-400 bg-clip-text text-transparent sm:text-4xl">
            Local MT5 Sync
          </h1>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            Expert Advisor
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Sync trades directly from your local MetaTrader 5 terminal using the TradeTaper EA
        </p>
      </div>

      {/* Sync Mode Banner */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700/40 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900/70 dark:to-gray-800/50 backdrop-blur-xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <FaExchangeAlt className="mt-0.5 w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Sync Mode — choose one per account</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              MetaAPI Cloud and Local Terminal cannot run simultaneously. Enabling one will automatically pause the other.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all
            ${activeMode === 'metaapi'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-gray-100 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700/40 text-gray-600 dark:text-gray-500'}`}>
            <FaCloud className="w-3.5 h-3.5" />
            MetaAPI Cloud
            {activeMode === 'metaapi' && <FaCheckCircle className="w-3 h-3 ml-1 text-emerald-400" />}
          </div>
          <div className="flex items-center text-gray-500 dark:text-gray-600 text-xs">vs</div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all
            ${activeMode === 'terminal'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-gray-100 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700/40 text-gray-600 dark:text-gray-500'}`}>
            <FaDesktop className="w-3.5 h-3.5" />
            Local Terminal EA
            {activeMode === 'terminal' && <FaCheckCircle className="w-3 h-3 ml-1 text-emerald-400" />}
          </div>
        </div>
      </div>

      {/* Account Selector */}
      {accounts.length > 0 && (
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-400">Select Account:</label>
          <select
            value={selectedAccountId || ''}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-auto sm:min-w-[320px]"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.accountName} • {acc.login} @ {acc.server}
              </option>
            ))}
          </select>
        </div>
      )}

      {accounts.length === 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/50 p-8 text-center">
          <FaExclamationTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
          <p className="text-gray-700 dark:text-gray-300">No MT5 accounts found. Use the global <strong>Add Account</strong> button in Accounts Hub first.</p>
        </div>
      )}

      {/* Conflict Warning: MetaAPI is active, about to switch */}
      {metaApiConflict && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
          <FaExclamationTriangle className="mt-0.5 w-4 h-4 text-amber-400 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-amber-700 dark:text-amber-300">MetaAPI Cloud is currently active for this account</p>
            <p className="text-amber-700/90 dark:text-amber-400/80 mt-0.5">
              Clicking <strong>Enable Auto-Sync</strong> will automatically pause MetaAPI streaming and switch to Local Terminal mode.
              You can re-enable MetaAPI anytime from <strong>Accounts Hub → MetaAPI Sync</strong>.
            </p>
          </div>
        </div>
      )}

      {selectedAccountId && (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4">
          <p className="text-sm text-emerald-800 dark:text-emerald-100 font-semibold mb-2">
            Local MT5 Sync Disclaimer (required)
          </p>
          <ul className="text-xs text-emerald-800/90 dark:text-emerald-200/80 space-y-1.5 mb-3 list-disc pl-5">
            <li>Use one connector bundle per MT5 account. Do not reuse across accounts.</li>
            <li>Do not run the same Terminal ID/Auth Token on multiple MT5 instances at the same time.</li>
            <li>If duplicate sessions are detected, sync will be blocked and a security notification is generated.</li>
            <li>MT5 mobile apps cannot run EAs; desktop/VPS MT5 is required.</li>
          </ul>
          <label className="inline-flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-100">
            <input
              type="checkbox"
              checked={disclaimerAccepted}
              onChange={(e) => {
                const accepted = e.target.checked;
                setDisclaimerAccepted(accepted);
                if (disclaimerStorageKey && typeof window !== 'undefined') {
                  if (accepted) {
                    localStorage.setItem(disclaimerStorageKey, '1');
                  } else {
                    localStorage.removeItem(disclaimerStorageKey);
                  }
                }
              }}
              className="h-4 w-4 rounded border-emerald-400/60 bg-transparent text-emerald-500 focus:ring-emerald-500"
            />
            I understand and accept the Local MT5 sync safety rules for this account.
          </label>
        </div>
      )}

      {selectedAccountId && (
        <>
          {activeMode === 'metaapi' ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center sm:min-h-[300px] sm:p-8">
              <div className="p-4 bg-emerald-500/10 rounded-full mb-4">
                <FaCloud className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-emerald-900 dark:text-white mb-2">MetaAPI Cloud Connected</h3>
              <p className="text-emerald-800/90 dark:text-emerald-200/80 max-w-md">
                This account is currently syncing via MetaAPI Cloud. The local Terminal EA is disabled to prevent duplicate trades.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-6">
                If you wish to use the local EA instead, click <strong>Local Terminal EA</strong> above to switch modes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Terminal Status Card */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900/80 dark:to-gray-800/60 backdrop-blur-xl shadow-xl overflow-hidden">
                <div className="p-6">
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 rounded-xl">
                        <FaDesktop className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Terminal Status</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedAccount?.accountName}</p>
                      </div>
                    </div>
                    {terminalStatus?.status && (
                      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <button
                          onClick={() => void fetchConnectorConfig()}
                          disabled={connectorLoading}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600/60 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/40 disabled:opacity-50"
                          title="Refresh connector bundle"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <FaSync className={`w-2.5 h-2.5 ${connectorLoading ? 'animate-spin' : ''}`} />
                            Refresh
                          </span>
                        </button>
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusBg(terminalStatus.status)}`}>
                          <FaCircle className={`w-2 h-2 ${statusColor(terminalStatus.status)} ${terminalStatus.status === 'RUNNING' ? 'animate-pulse' : ''}`} />
                          <span className={`text-xs font-semibold ${statusColor(terminalStatus.status)}`}>
                            {terminalStatus.status}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Terminal ID */}
                  {terminalStatus?.id && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FaFingerprint className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Terminal ID</span>
                        </div>
                        <button
                          onClick={copyTerminalId}
                          className="p-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          {terminalIdCopied ? <FaCheck className="w-3 h-3 text-emerald-400" /> : <FaCopy className="w-3 h-3 text-gray-500 dark:text-gray-400" />}
                        </button>
                      </div>
                      <p className="mt-1 text-sm font-mono text-gray-800 dark:text-gray-200 truncate">
                        {connectorConfig?.terminalId || terminalStatus.id}
                      </p>
                    </div>
                  )}

                  {/* Auth Token */}
                  {terminalStatus?.id && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FaFingerprint className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Auth Token</span>
                        </div>
                        <button
                          onClick={copyAuthToken}
                          disabled={!connectorConfig?.authToken}
                          className="p-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-40 rounded-lg transition-colors"
                        >
                          {authTokenCopied ? <FaCheck className="w-3 h-3 text-emerald-400" /> : <FaCopy className="w-3 h-3 text-gray-500 dark:text-gray-400" />}
                        </button>
                      </div>
                      <p className="mt-1 text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
                        {connectorConfig?.authToken || (connectorLoading ? 'Loading connector token…' : 'Connector token unavailable')}
                      </p>
                      {!connectorConfig?.authToken && connectorError && (
                        <p className="mt-1 text-[11px] text-red-300/90 truncate">
                          {connectorError}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Pairing Code */}
                  {terminalStatus?.id && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FaFingerprint className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Pairing Code</span>
                        </div>
                        <button
                          onClick={copyPairingCode}
                          disabled={!connectorConfig?.pairingCode}
                          className="p-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-40 rounded-lg transition-colors"
                        >
                          {pairingCodeCopied ? <FaCheck className="w-3 h-3 text-emerald-400" /> : <FaCopy className="w-3 h-3 text-gray-500 dark:text-gray-400" />}
                        </button>
                      </div>
                      <p className="mt-1 text-sm font-mono tracking-widest text-amber-600 dark:text-amber-300">
                        {connectorConfig?.pairingCode || (connectorLoading ? 'Loading pairing code…' : '—')}
                      </p>
                      {!connectorConfig?.pairingCode && connectorError && (
                        <p className="mt-1 text-[11px] text-red-300/90 truncate">
                          {connectorError}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Account binding info */}
                  {connectorConfig && (
                    <div className="mb-4 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase">Account Binding</div>
                      <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-100">
                        {connectorConfig.mt5Login} @ {connectorConfig.mt5Server}
                      </p>
                      <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-200/70">
                        Connector {connectorConfig.connectorVersion} • Endpoint {connectorConfig.apiEndpoint}
                      </p>
                    </div>
                  )}

                  {/* Status Info */}
                  {terminalStatus?.status === 'RUNNING' && (
                    <div className="mb-6 space-y-3">
                      <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Last Heartbeat</span>
                        <span className="text-gray-800 dark:text-gray-200 sm:text-right">
                          {terminalStatus.lastHeartbeat
                            ? new Date(terminalStatus.lastHeartbeat).toLocaleString()
                            : '—'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Last Sync</span>
                        <span className="text-gray-800 dark:text-gray-200 sm:text-right">
                          {terminalStatus.lastSyncAt
                            ? new Date(terminalStatus.lastSyncAt).toLocaleString()
                            : 'Never'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {!terminalStatus || terminalStatus.status === 'STOPPED' ? (
                      <button
                        onClick={handleEnableSync}
                        disabled={loading || disconnectingMetaApi || !disclaimerAccepted}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 font-medium text-white transition-all hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 sm:w-auto"
                        title={!disclaimerAccepted ? 'Accept disclaimer to enable' : undefined}
                      >
                        <FaPlay className="w-3 h-3" />
                        {disconnectingMetaApi ? 'Pausing MetaAPI…' : loading ? 'Enabling…' : 'Enable Auto-Sync'}
                      </button>
                    ) : (
                      <>
                        {terminalStatus.status === 'RUNNING' && (
                          <button
                            onClick={handleManualSync}
                            disabled={syncing}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2.5 font-medium text-emerald-500 transition-all hover:bg-emerald-500/25 disabled:opacity-50 dark:text-emerald-400 sm:w-auto"
                          >
                            <FaSync className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Syncing…' : 'Manual Sync'}
                          </button>
                        )}
                        <button
                          onClick={handleDisableSync}
                          disabled={loading}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 font-medium text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50 sm:w-auto"
                        >
                          <FaStop className="w-3 h-3" />
                          {loading ? 'Stopping...' : 'Disable'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Setup Guide Card */}
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900/80 dark:to-gray-800/60 backdrop-blur-xl shadow-xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl">
                      <FaInfoCircle className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">EA Setup Guide</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Configure your Expert Advisor</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3">
                    <ol className="text-sm text-gray-700 dark:text-gray-400 space-y-3 list-decimal list-inside">
                      <li>Download the <span className="text-emerald-500 font-medium">TradeTaper.mq5</span> EA file</li>
                      <li>Place it in your MT5 <code className="text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">Experts</code> folder</li>
                      <li>Click <span className="text-emerald-400 font-medium">&quot;Enable Auto-Sync&quot;</span> above to generate your connector bundle</li>
                      <li>Attach the EA to any chart in your MT5 terminal</li>
                      <li>Paste <span className="text-emerald-500 font-medium">Terminal ID</span>, <span className="text-emerald-400 font-medium">Auth Token</span>, and <span className="text-amber-500 dark:text-amber-300 font-medium">Pairing Code</span> into EA inputs</li>
                      <li>Enable <span className="text-gray-800 dark:text-gray-200">&quot;Allow Web Requests&quot;</span> in MT5 → Tools → Options → Expert Advisors</li>
                      <li>The EA will automatically sync your trades and 1-min candle data</li>
                    </ol>
                  </div>
                </div>
              </div>

            </div>
          )}
        </>
      )}

      {/* Live Positions Panel */}
      {terminalStatus?.status === 'RUNNING' && positions.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900/80 dark:to-gray-800/60 backdrop-blur-xl shadow-xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl">
                <FaChartLine className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Live Positions</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">{positions.length} open position{positions.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="space-y-3 md:hidden">
              {positions.map((pos) => (
                <div key={pos.ticket} className="rounded-xl border border-gray-200 bg-white/70 p-3 dark:border-gray-700/50 dark:bg-gray-900/60">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{pos.symbol}</p>
                      <span className={`mt-1 inline-flex rounded px-2 py-0.5 text-xs font-semibold ${pos.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-300' : 'bg-red-500/20 text-red-500 dark:text-red-300'}`}>
                        {pos.type}
                      </span>
                    </div>
                    <p className={`text-sm font-semibold ${(pos.profit || 0) >= 0 ? 'text-emerald-500 dark:text-emerald-300' : 'text-red-500 dark:text-red-300'}`}>
                      {typeof pos.profit === 'number' ? `$${pos.profit.toFixed(2)}` : '—'}
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-gray-100/80 px-2 py-1.5 dark:bg-gray-800/70">
                      <span className="text-gray-500 dark:text-gray-400">Volume </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{pos.volume}</span>
                    </div>
                    <div className="rounded-lg bg-gray-100/80 px-2 py-1.5 dark:bg-gray-800/70">
                      <span className="text-gray-500 dark:text-gray-400">Open </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {typeof pos.openPrice === 'number' ? pos.openPrice.toFixed(5) : '—'}
                      </span>
                    </div>
                    <div className="rounded-lg bg-gray-100/80 px-2 py-1.5 dark:bg-gray-800/70">
                      <span className="text-gray-500 dark:text-gray-400">SL </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {typeof pos.stopLoss === 'number' ? pos.stopLoss.toFixed(5) : '—'}
                      </span>
                    </div>
                    <div className="rounded-lg bg-gray-100/80 px-2 py-1.5 dark:bg-gray-800/70">
                      <span className="text-gray-500 dark:text-gray-400">TP </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {typeof pos.takeProfit === 'number' ? pos.takeProfit.toFixed(5) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase text-gray-600 dark:border-gray-700/50 dark:text-gray-400">
                    <th className="text-left py-2 px-3">Symbol</th>
                    <th className="text-left py-2 px-3">Type</th>
                    <th className="text-right py-2 px-3">Volume</th>
                    <th className="text-right py-2 px-3">Open Price</th>
                    <th className="text-right py-2 px-3">SL</th>
                    <th className="text-right py-2 px-3">TP</th>
                    <th className="text-right py-2 px-3">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos) => (
                    <tr key={pos.ticket} className="border-b border-gray-200 transition-colors hover:bg-gray-100 dark:border-gray-800/50 dark:hover:bg-gray-800/30">
                      <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">{pos.symbol}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${pos.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {pos.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-gray-700 dark:text-gray-300">{pos.volume}</td>
                      <td className="py-3 px-3 text-right text-gray-700 dark:text-gray-300">
                        {typeof pos.openPrice === 'number' ? pos.openPrice.toFixed(5) : '—'}
                      </td>
                      <td className="py-3 px-3 text-right text-gray-600 dark:text-gray-400">
                        {typeof pos.stopLoss === 'number' ? pos.stopLoss.toFixed(5) : '—'}
                      </td>
                      <td className="py-3 px-3 text-right text-gray-600 dark:text-gray-400">
                        {typeof pos.takeProfit === 'number' ? pos.takeProfit.toFixed(5) : '—'}
                      </td>
                      <td className={`py-3 px-3 text-right font-medium ${(pos.profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {typeof pos.profit === 'number' ? `$${pos.profit.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900/80 dark:to-gray-800/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-emerald-400/20 rounded-xl">
              <FaInfoCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">How Local MT5 Sync Works</h2>
          </div>

          <div className="text-sm text-gray-700 dark:text-gray-400 space-y-3">
            <p>
              Local MT5 Sync uses an Expert Advisor (EA) installed directly on your MetaTrader 5 terminal.
              Unlike Cloud MT5 (MetaApi) which connects through a third-party service, this method runs
              entirely on your machine with zero latency.
            </p>
            <p className="text-amber-700 dark:text-amber-300/90">
              Note: MT5 mobile apps (iOS/Android) cannot run EAs. Mobile users must run this connector on a desktop/VPS MT5 terminal.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50">
                <h4 className="text-gray-900 dark:text-white font-medium mb-1">📊 Trade History</h4>
                <p className="text-xs">Syncs all completed deals and open positions from your MT5 terminal</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50">
                <h4 className="text-gray-900 dark:text-white font-medium mb-1">📈 1-Min Candle Data</h4>
                <p className="text-xs">Automatically captures 1-minute OHLC data for every trade for chart replay</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700/50">
                <h4 className="text-gray-900 dark:text-white font-medium mb-1">🔒 Private &amp; Secure</h4>
                <p className="text-xs">Your credentials never leave your machine — only trade data is sent</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
