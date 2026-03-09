import React, { useState, useEffect, useCallback } from 'react';
import { terminalService, TerminalStatus } from '@/services/terminalService';
import { LoaderCircle, Power, Copy, CircleCheck, CircleAlert, RefreshCw } from 'lucide-react';
import { ConnectTerminalModal } from './ConnectTerminalModal';

interface TerminalStatusCardProps {
  accountId: string;
  accountName: string;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
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

export default function TerminalStatusCard({ accountId, accountName }: TerminalStatusCardProps) {
  const [status, setStatus] = useState<TerminalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const terminalPhase = status?.status;

  const handleConnect = async (
    credentials: {
      server: string;
      login: string;
      password: string;
      confirmRiskAcknowledgement?: boolean;
    },
  ) => {
    try {
      setActionLoading(true);
      const newStatus = await terminalService.enableAutoSync(accountId, credentials);
      setStatus(newStatus);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to enable auto-sync'));
    } finally {
      setActionLoading(false);
    }
  };

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const result = await terminalService.getTerminalStatus(accountId);
      // If enabled: false is returned, result will be { enabled: false }
      // We check if 'id' exists to determine if it's a valid terminal status
      if ('id' in result) {
        setStatus(result as TerminalStatus);
      } else {
        setStatus(null);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch terminal status:', err);
      // Don't show error for 404 (just means not enabled)
      if ((err as { response?: { status?: number } })?.response?.status !== 404) {
        setError('Failed to load status');
      }
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    void fetchStatus();
    // Poll for updates if running or pending
    const interval = setInterval(() => {
      if (terminalPhase === 'PENDING' || terminalPhase === 'STARTING') {
        void fetchStatus();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus, terminalPhase]);

  const handleDisable = async () => {
    if (!confirm('Are you sure you want to stop auto-sync? This will stop trade copying.')) return;
    
    try {
      setActionLoading(true);
      await terminalService.disableAutoSync(accountId);
      setStatus(null);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to disable auto-sync'));
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoadToken = async () => {
    try {
      setTokenLoading(true);
      const response = await terminalService.getTerminalToken(accountId);
      setToken(response.token);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch terminal token'));
    } finally {
      setTokenLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500 text-sm p-4 bg-gray-50 rounded-lg">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        <span>Loading terminal status...</span>
      </div>
    );
  }

  return (
    <>
      <ConnectTerminalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnect={handleConnect}
        accountName={accountName}
      />
      
      {!status ? (
        <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto-Sync (Terminal Farm)</h4>
              <p className="text-sm text-gray-500">Real-time trade synchronization is disabled.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={actionLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
              <span>Enable Auto-Sync</span>
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600 flex items-center"><CircleAlert className="h-4 w-4 mr-1" />{error}</p>}
        </div>
      ) : (
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-gray-900 flex items-center">
                Auto-Sync Active
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full flex items-center ${
                  status.status === 'RUNNING' ? 'bg-green-100 text-green-800' :
                  status.status === 'ERROR' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {status.status === 'RUNNING' && <CircleCheck className="h-3 w-3 mr-1" />}
                  {status.status}
                </span>
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Created: {new Date(status.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <button
              onClick={handleDisable}
              disabled={actionLoading}
              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              {actionLoading ? 'Stopping...' : 'Disable'}
            </button>
          </div>

          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
              Terminal ID (Copy to EA Inputs)
            </label>
            <div className="flex items-center space-x-2">
              <code className="text-sm font-mono bg-white px-2 py-1 rounded border border-gray-200 flex-1 overflow-hidden overflow-ellipsis">
                {status.id}
              </code>
              <button
                onClick={() => copyToClipboard(status.id)}
                className="p-1.5 hover:bg-gray-200 rounded-md text-gray-600 transition-colors"
                title="Copy ID"
              >
                {copied ? <CircleCheck className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
              Auth Token (Copy to EA Inputs)
            </label>
            <div className="flex items-center space-x-2">
              <code className="text-sm font-mono bg-white px-2 py-1 rounded border border-gray-200 flex-1 overflow-hidden overflow-ellipsis">
                {token ? token : 'Click “Load Token” to view'}
              </code>
              {token ? (
                <button
                  onClick={() => copyToClipboard(token)}
                  className="p-1.5 hover:bg-gray-200 rounded-md text-gray-600 transition-colors"
                  title="Copy Token"
                >
                  {copied ? <CircleCheck className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              ) : (
                <button
                  onClick={handleLoadToken}
                  disabled={tokenLoading}
                  className="px-3 py-1.5 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {tokenLoading ? 'Loading...' : 'Load Token'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 text-xs block">Last Heartbeat</span>
              <span className="font-medium">
                {status.lastHeartbeat ? new Date(status.lastHeartbeat).toLocaleString() : 'Never'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 text-xs block">Last Data Sync</span>
              <span className="font-medium">
                {status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : 'Never'}
              </span>
            </div>
          </div>

          {status.status === 'RUNNING' && !status.lastHeartbeat && (
            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded flex items-start">
              <CircleAlert className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
              <span>
                Waiting for connection... Make sure you&apos;ve added the API URL to MT5 settings and attached the EA.
              </span>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={() => void fetchStatus()} className="text-xs text-gray-500 hover:text-gray-900 flex items-center">
              <RefreshCw className="h-3 w-3 mr-1" /> Refresh Status
            </button>
          </div>
        </div>
      )}
    </>
  );
}
