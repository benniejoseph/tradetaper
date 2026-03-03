'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Terminal, RefreshCw, AlertCircle, AlertTriangle, Info, Bug } from 'lucide-react';
import { adminApi } from '@/lib/api';

const LEVEL_CONFIG: Record<string, { class: string; icon: any; color: string }> = {
  error: { class: 'badge-danger', icon: AlertCircle, color: 'var(--accent-danger)' },
  warn: { class: 'badge-warning', icon: AlertTriangle, color: 'var(--accent-warning)' },
  info: { class: 'badge-primary', icon: Info, color: 'var(--accent-primary)' },
  debug: { class: 'badge-muted', icon: Bug, color: 'var(--text-muted)' },
};

export default function LogsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [levelFilter, setLevelFilter] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-logs', levelFilter],
    queryFn: () => adminApi.getLogs(100, 0, levelFilter || undefined),
    refetchInterval: 3000,
  });

  const logs = (data as any)?.data || [];
  const filteredLogs = levelFilter ? logs.filter((l: any) => l.level === levelFilter) : logs;

  const levelCounts = logs.reduce((acc: Record<string, number>, l: any) => {
    acc[l.level] = (acc[l.level] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b flex items-center justify-between"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5" style={{ color: '#10B981' }} />
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>System Logs</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Auto-refreshes every 3s • {filteredLogs.length} entries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {['error', 'warn', 'info', 'debug'].map(l => (
              <button
                key={l}
                onClick={() => setLevelFilter(levelFilter === l ? '' : l)}
                className={`badge ${LEVEL_CONFIG[l]?.class} cursor-pointer transition-opacity ${levelFilter && levelFilter !== l ? 'opacity-40' : ''}`}
              >
                {l} {levelCounts[l] ? `(${levelCounts[l]})` : ''}
              </button>
            ))}
            <button className="admin-btn-secondary ml-2" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: 'var(--bg-surface)' }} />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Terminal className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-muted)' }} />
                <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No log entries</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Logs will appear as the system generates them</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredLogs.map((log: any, i: number) => {
                const cfg = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.info;
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={log.id || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.01, 0.3) }}
                    className="admin-card px-4 py-3 flex items-start gap-3"
                  >
                    <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: cfg.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={`badge ${cfg.class} text-[10px]`}>{log.level?.toUpperCase()}</span>
                        {log.context && <span className="badge badge-muted text-[10px]">{log.context}</span>}
                        {log.endpoint && <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{log.method} {log.endpoint}</span>}
                      </div>
                      <p className="text-xs font-mono" style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{log.message}</p>
                    </div>
                    <p className="text-[10px] flex-shrink-0 font-mono" style={{ color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}