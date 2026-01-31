import React, { useState, useEffect } from 'react';
import { terminalService, TerminalStatus } from '@/services/terminalService';
import { LoaderCircle, Power, Copy, CircleCheck, CircleX, CircleAlert, RefreshCw } from 'lucide-react';

interface TerminalStatusCardProps {
  accountId: string;
  accountName: string;
}

export default function TerminalStatusCard({ accountId, accountName }: TerminalStatusCardProps) {
  const [status, setStatus] = useState<TerminalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchStatus = async () => {
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
    } catch (err: any) {
      console.error('Failed to fetch terminal status:', err);
      // Don't show error for 404 (just means not enabled)
      if (err.response?.status !== 404) {
        setError('Failed to load status');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll for updates if running or pending
    const interval = setInterval(() => {
      if (status && (status.status === 'PENDING' || status.status === 'STARTING')) {
        fetchStatus();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [accountId, status?.status]);

  const handleEnable = async () => {
    try {
      setActionLoading(true);
      const newStatus = await terminalService.enableAutoSync(accountId);
      setStatus(newStatus);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to enable auto-sync');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm('Are you sure you want to stop auto-sync? This will stop trade copying.')) return;
    
    try {
      setActionLoading(true);
      await terminalService.disableAutoSync(accountId);
      setStatus(null);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to disable auto-sync');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500 text-sm p-4 bg-gray-50 rounded-lg">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        <span>Loading terminal status...</span>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Auto-Sync (Terminal Farm)</h4>
            <p className="text-sm text-gray-500">Real-time trade synchronization is disabled.</p>
          </div>
          <button
            onClick={handleEnable}
            disabled={actionLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {actionLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
            <span>Enable Auto-Sync</span>
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600 flex items-center"><CircleAlert className="h-4 w-4 mr-1" />{error}</p>}
      </div>
    );
  }

  return (
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
            Waiting for connection... Make sure you've added the API URL to MT5 settings and attached the EA.
          </span>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={fetchStatus} className="text-xs text-gray-500 hover:text-gray-900 flex items-center">
          <RefreshCw className="h-3 w-3 mr-1" /> Refresh Status
        </button>
      </div>
    </div>
  );
}
