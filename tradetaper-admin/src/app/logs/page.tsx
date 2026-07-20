'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Terminal, RefreshCw, AlertCircle, Info, LucideIcon } from 'lucide-react';
import { adminApi } from '@/lib/api';

const OUTCOME_CONFIG: Record<'success' | 'failure', { class: string; icon: LucideIcon; color: string }> = {
  failure: { class: 'badge-danger', icon: AlertCircle, color: 'var(--accent-danger)' },
  success: { class: 'badge-primary', icon: Info, color: 'var(--accent-primary)' },
};

export default function LogsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [outcomeFilter, setOutcomeFilter] = useState<'success' | 'failure' | ''>('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-auth-audit-logs', outcomeFilter],
    queryFn: () =>
      adminApi.getAuthAuditLogs({
        limit: 100,
        offset: 0,
        outcome: outcomeFilter || undefined,
      }),
    refetchInterval: 10000,
  });

  const logs = data?.data || [];
  const displayLogs = logs;

  const outcomeCounts = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.outcome] = (acc[l.outcome] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex h-dvh" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="admin-page-header">
          <div className="admin-shell flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Terminal className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
              <div>
                <h1 className="admin-page-title">Auth Audit Logs</h1>
                <p className="admin-page-subtitle">Auto-refreshes every 10s • {displayLogs.length} entries</p>
              </div>
            </div>
            <div className="flex w-full sm:w-auto flex-wrap items-center gap-2">
              <div className="admin-inline-filters">
                {(['failure', 'success'] as const).map((outcome) => (
                  <button
                    key={outcome}
                    onClick={() => setOutcomeFilter(outcomeFilter === outcome ? '' : outcome)}
                    className={`badge ${OUTCOME_CONFIG[outcome].class} cursor-pointer transition-opacity min-h-[42px] ${outcomeFilter && outcomeFilter !== outcome ? 'opacity-40' : ''}`}
                  >
                    {outcome} {outcomeCounts[outcome] ? `(${outcomeCounts[outcome]})` : ''}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => refetch()}
                aria-label="Refresh logs"
                title="Refresh logs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto admin-page-main">
          <div className="admin-shell admin-page-stack">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: 'var(--bg-surface)' }} />
              ))}
            </div>
          ) : displayLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Terminal className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-muted)' }} />
                <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No log entries</p>
                <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>Admin authentication events will appear here</p>
              </div>
            </div>
          ) : (
            <div className="admin-list-stack">
              {displayLogs.map((log, i: number) => {
                const cfg = OUTCOME_CONFIG[log.outcome as 'success' | 'failure'] || OUTCOME_CONFIG.success;
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={log.id || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.01, 0.3) }}
                    className="admin-card admin-card-panel-compact"
                  >
                    <div className="flex gap-3">
                      <Icon className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: cfg.color }} />
                      <div className="flex-1 min-w-0 space-y-2.5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`badge ${cfg.class}`}>{(log.outcome || 'success').toUpperCase()}</span>
                            <span className="badge badge-muted">{log.eventType}</span>
                            {log.adminEmail && <span className="badge badge-muted break-all">{log.adminEmail}</span>}
                            {log.requestId && <span className="text-sm font-mono break-all" style={{ color: 'var(--text-muted)' }}>req:{log.requestId}</span>}
                          </div>
                          <p className="text-xs sm:text-sm sm:text-right flex-shrink-0 font-mono" style={{ color: 'var(--text-muted)' }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm font-mono leading-6" style={{ color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                          {log.reason ? `${log.eventType}: ${log.reason}` : log.eventType}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
