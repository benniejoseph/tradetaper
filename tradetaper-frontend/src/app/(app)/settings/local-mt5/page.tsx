"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { FaDesktop, FaSync, FaPlay, FaStop, FaKey, FaCopy, FaCheck, FaExclamationTriangle, FaCircle, FaChartLine, FaInfoCircle, FaDownload } from 'react-icons/fa';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface TerminalStatus {
  id: string;
  accountId: string;
  accountName: string;
  status: 'RUNNING' | 'STOPPED' | 'ERROR' | 'PROVISIONING';
  containerId?: string;
  lastHeartbeat?: string;
  lastSyncAt?: string;
  createdAt?: string;
  enabled: boolean;
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
}

export default function LocalMT5SyncPage() {
  const [accounts, setAccounts] = useState<MT5Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [terminalStatus, setTerminalStatus] = useState<TerminalStatus | null>(null);
  const [positions, setPositions] = useState<LivePosition[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

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
    fetchAccounts();
  }, []);

  // Fetch terminal status when account selected
  const fetchStatus = useCallback(async () => {
    if (!selectedAccountId) return;
    setStatusLoading(true);
    try {
      const res = await api.get(`/mt5-accounts/${selectedAccountId}/terminal-status`);
      setTerminalStatus(res.data);
    } catch {
      setTerminalStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Fetch live positions
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

  const handleEnableSync = async () => {
    if (!selectedAccountId) return;
    setLoading(true);
    try {
      const res = await api.post(`/mt5-accounts/${selectedAccountId}/enable-autosync`, {});
      setTerminalStatus(res.data);
      toast.success('Local MT5 sync enabled!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to enable sync');
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
      setPositions([]);
      toast.success('Local MT5 sync disabled');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to disable sync');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async () => {
    if (!selectedAccountId) return;
    setSyncing(true);
    try {
      const res = await api.post(`/mt5-accounts/${selectedAccountId}/sync`);
      toast.success(res.data?.message || 'Sync request queued!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to queue sync');
    } finally {
      setSyncing(false);
    }
  };

  const handleGetToken = async () => {
    if (!selectedAccountId) return;
    try {
      const res = await api.get(`/mt5-accounts/${selectedAccountId}/terminal-token`);
      setToken(res.data?.token);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to get token');
    }
  };

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setTokenCopied(true);
    toast.success('Token copied to clipboard');
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const statusColor = (status?: string) => {
    switch (status) {
      case 'RUNNING': return 'text-emerald-400';
      case 'STOPPED': return 'text-gray-400';
      case 'ERROR': return 'text-red-400';
      case 'PROVISIONING': return 'text-yellow-400';
      default: return 'text-gray-500';
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

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Local MT5 Sync
          </h1>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            Expert Advisor
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Sync trades directly from your local MetaTrader 5 terminal using the TradeTaper EA
        </p>
      </div>

      {/* Account Selector */}
      {accounts.length > 0 && (
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-400">Select Account:</label>
          <select
            value={selectedAccountId || ''}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="rounded-2xl border border-gray-700/50 bg-gray-900/50 p-8 text-center">
          <FaExclamationTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
          <p className="text-gray-300">No MT5 accounts found. Add an account in Settings → Manual Account first.</p>
        </div>
      )}

      {selectedAccountId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Terminal Status Card */}
          <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl">
                    <FaDesktop className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Terminal Status</h2>
                    <p className="text-sm text-gray-400">{selectedAccount?.accountName}</p>
                  </div>
                </div>
                {terminalStatus?.status && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusBg(terminalStatus.status)}`}>
                    <FaCircle className={`w-2 h-2 ${statusColor(terminalStatus.status)} ${terminalStatus.status === 'RUNNING' ? 'animate-pulse' : ''}`} />
                    <span className={`text-xs font-semibold ${statusColor(terminalStatus.status)}`}>
                      {terminalStatus.status}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Info */}
              {terminalStatus?.status === 'RUNNING' && (
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Last Heartbeat</span>
                    <span className="text-gray-200">
                      {terminalStatus.lastHeartbeat
                        ? new Date(terminalStatus.lastHeartbeat).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Last Sync</span>
                    <span className="text-gray-200">
                      {terminalStatus.lastSyncAt
                        ? new Date(terminalStatus.lastSyncAt).toLocaleString()
                        : 'Never'}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {!terminalStatus || terminalStatus.status === 'STOPPED' ? (
                  <button
                    onClick={handleEnableSync}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                  >
                    <FaPlay className="w-3 h-3" />
                    {loading ? 'Enabling...' : 'Enable Auto-Sync'}
                  </button>
                ) : (
                  <>
                    {terminalStatus.status === 'RUNNING' && (
                      <button
                        onClick={handleManualSync}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-xl font-medium transition-all disabled:opacity-50"
                      >
                        <FaSync className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                        {syncing ? 'Syncing…' : 'Manual Sync'}
                      </button>
                    )}
                    <button
                      onClick={handleDisableSync}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-medium transition-all disabled:opacity-50"
                    >
                      <FaStop className="w-3 h-3" />
                      {loading ? 'Stopping...' : 'Disable'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Auth Token & Setup */}
          <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl">
                  <FaKey className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">EA Configuration</h2>
                  <p className="text-sm text-gray-400">Setup your Expert Advisor</p>
                </div>
              </div>

              {/* Token Display */}
              {!token ? (
                <button
                  onClick={handleGetToken}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-medium transition-all mb-4"
                >
                  <FaKey className="w-3 h-3" />
                  Reveal Auth Token
                </button>
              ) : (
                <div className="mb-4">
                  <label className="text-xs text-gray-400 mb-1 block">Auth Token (paste into EA settings)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={token}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono truncate"
                    />
                    <button
                      onClick={copyToken}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      {tokenCopied ? <FaCheck className="w-4 h-4 text-emerald-400" /> : <FaCopy className="w-4 h-4 text-gray-400" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Setup Guide */}
              <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                  <FaInfoCircle className="w-3 h-3 text-blue-400" />
                  Quick Setup Guide
                </h3>
                <ol className="text-xs text-gray-400 space-y-2 list-decimal list-inside">
                  <li>Download the <span className="text-blue-400">TradeTaper.mq5</span> EA file</li>
                  <li>Place it in your MT5 <code className="text-gray-300 bg-gray-700 px-1 rounded">Experts</code> folder</li>
                  <li>Attach the EA to any chart in your MT5 terminal</li>
                  <li>Paste the <span className="text-amber-400">Auth Token</span> into the EA&apos;s settings</li>
                  <li>Enable &quot;Allow Web Requests&quot; in MT5 → Tools → Options → Expert Advisors</li>
                  <li>The EA will automatically sync your trades and 1-min candle data</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Positions Panel */}
      {terminalStatus?.status === 'RUNNING' && positions.length > 0 && (
        <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-xl shadow-xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl">
                <FaChartLine className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Live Positions</h2>
                <p className="text-sm text-gray-400">{positions.length} open position{positions.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase border-b border-gray-700/50">
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
                    <tr key={pos.ticket} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 px-3 font-medium text-white">{pos.symbol}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${pos.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {pos.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-gray-300">{pos.volume}</td>
                      <td className="py-3 px-3 text-right text-gray-300">{pos.openPrice?.toFixed(5)}</td>
                      <td className="py-3 px-3 text-right text-gray-400">{pos.stopLoss?.toFixed(5) || '—'}</td>
                      <td className="py-3 px-3 text-right text-gray-400">{pos.takeProfit?.toFixed(5) || '—'}</td>
                      <td className={`py-3 px-3 text-right font-medium ${(pos.profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pos.profit !== undefined ? `$${pos.profit.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* About Section */}
      <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl">
              <FaInfoCircle className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">How Local MT5 Sync Works</h2>
          </div>

          <div className="text-sm text-gray-400 space-y-3">
            <p>
              Local MT5 Sync uses an Expert Advisor (EA) installed directly on your MetaTrader 5 terminal.
              Unlike Cloud MT5 (MetaApi) which connects through a third-party service, this method runs
              entirely on your machine with zero latency.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h4 className="text-white font-medium mb-1">📊 Trade History</h4>
                <p className="text-xs">Syncs all completed deals and open positions from your MT5 terminal</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h4 className="text-white font-medium mb-1">📈 1-Min Candle Data</h4>
                <p className="text-xs">Automatically captures 1-minute OHLC data for every trade for chart replay</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h4 className="text-white font-medium mb-1">🔒 Private & Secure</h4>
                <p className="text-xs">Your credentials never leave your machine — only trade data is sent</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
