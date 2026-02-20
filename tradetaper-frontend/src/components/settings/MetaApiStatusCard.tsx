import React from 'react';
import {
  FaBolt,
  FaCloud,
  FaClock,
  FaExclamationTriangle,
  FaSatelliteDish,
  FaServer,
  FaSyncAlt,
} from 'react-icons/fa';
import { MT5Account } from '@/store/features/mt5AccountsSlice';

interface MetaApiStatusCardProps {
  account: MT5Account;
}

type Tone = 'good' | 'warn' | 'bad' | 'neutral';

const toneClasses: Record<Tone, string> = {
  good: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  warn: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  bad: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  neutral: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

const formatDate = (value?: string) => {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

const getToneFromState = (value?: string, good: string[] = [], warn: string[] = []): Tone => {
  if (!value) return 'neutral';
  const normalized = value.toUpperCase();
  if (good.some((state) => normalized.includes(state))) return 'good';
  if (warn.some((state) => normalized.includes(state))) return 'warn';
  if (normalized.includes('ERROR') || normalized.includes('FAIL')) return 'bad';
  return 'neutral';
};

const StatusBadge = ({ label, tone }: { label: string; tone: Tone }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
  >
    {label}
  </span>
);

export default function MetaApiStatusCard({ account }: MetaApiStatusCardProps) {
  if (!account.metaApiAccountId) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <FaCloud className="h-5 w-5" />
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              MetaApi not configured
            </h4>
            <p className="text-xs">Connect this account to enable MetaApi syncing.</p>
          </div>
        </div>
      </div>
    );
  }

  const deploymentTone = getToneFromState(account.deploymentState, ['DEPLOYED'], ['DEPLOYING', 'UNDEPLOYING']);
  const connectionTone = getToneFromState(
    account.connectionState || account.connectionStatus,
    ['CONNECTED', 'SYNCHRONIZED'],
    ['CONNECTING', 'SYNCHRONIZING'],
  );
  const streamingTone: Tone = account.isStreamingActive ? 'good' : 'neutral';
  const historyCheckpoint = account.metadata?.metaApiLastHistoryTime as string | undefined;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <FaCloud className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">MetaApi Status</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Deployment, connectivity, and streaming health
            </p>
          </div>
        </div>
        <span className="text-xs font-medium rounded-full px-3 py-1 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          Full history
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge label={`Deploy: ${account.deploymentState || 'UNKNOWN'}`} tone={deploymentTone} />
        <StatusBadge
          label={`Conn: ${(account.connectionState || account.connectionStatus || 'UNKNOWN').toUpperCase()}`}
          tone={connectionTone}
        />
        <StatusBadge
          label={account.isStreamingActive ? 'Streaming: Active' : 'Streaming: Idle'}
          tone={streamingTone}
        />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <FaClock className="h-3.5 w-3.5" />
            <span>Last heartbeat</span>
          </div>
          <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
            {formatDate(account.lastHeartbeatAt)}
          </div>
        </div>
        <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <FaSyncAlt className="h-3.5 w-3.5" />
            <span>Last sync</span>
          </div>
          <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
            {formatDate(account.lastSyncAt)}
          </div>
        </div>
        <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <FaServer className="h-3.5 w-3.5" />
            <span>Region</span>
          </div>
          <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
            {account.region || '—'}
          </div>
        </div>
        <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <FaSatelliteDish className="h-3.5 w-3.5" />
            <span>History checkpoint</span>
          </div>
          <div className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
            {formatDate(historyCheckpoint)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Trades imported</div>
          <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
            {(account.totalTradesImported ?? 0).toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Sync attempts</div>
          <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
            {(account.syncAttempts ?? 0).toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">MetaApi ID</div>
          <div className="mt-1 text-xs font-mono text-gray-700 dark:text-gray-300 truncate" title={account.metaApiAccountId}>
            {account.metaApiAccountId}
          </div>
        </div>
      </div>

      {account.lastSyncError && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-200">
          <div className="flex items-start gap-2">
            <FaExclamationTriangle className="mt-0.5 h-4 w-4" />
            <div>
              <div className="font-semibold">Last sync error</div>
              <div className="text-xs mt-1 break-words">{account.lastSyncError}</div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-end text-xs text-gray-400">
        <FaBolt className="mr-1 h-3 w-3 text-emerald-400" />
        MetaApi streaming enabled
      </div>
    </div>
  );
}
