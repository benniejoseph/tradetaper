'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Server, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Cpu, HardDrive, Wifi } from 'lucide-react';
import { adminApi } from '@/lib/api';

function HealthRing({ value, label, color, max = 100 }: { value: number | null; label: string; color: string; max?: number }) {
  const pct = value != null ? Math.min((value / max) * 100, 100) : 0;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const isCritical = pct > 85;

  return (
    <div className="admin-card p-4 flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
          <circle cx="48" cy="48" r={r} fill="none" strokeWidth="8" stroke="var(--bg-muted)" />
          <circle cx="48" cy="48" r={r} fill="none" strokeWidth="8"
            stroke={isCritical ? 'var(--accent-danger)' : color}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color: isCritical ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
            {value != null ? (max <= 100 ? `${value}${label.includes('ms') ? '' : '%'}` : value) : '—'}
          </span>
        </div>
      </div>
      <p className="text-xs font-medium text-center" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}

export default function SystemPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: health, isLoading, refetch } = useQuery({
    queryKey: ['system-health-full'],
    queryFn: () => adminApi.getSystemHealth(),
    refetchInterval: 10000,
  });

  const statusIcon = (s: string) => {
    if (s === 'healthy') return <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--accent-success)' }} />;
    if (s === 'warning') return <AlertTriangle className="w-4 h-4" style={{ color: 'var(--accent-warning)' }} />;
    return <XCircle className="w-4 h-4" style={{ color: 'var(--accent-danger)' }} />;
  };

  const rings = [
    { label: 'CPU Usage', value: health?.cpuUsage ?? null, color: '#6366F1' },
    { label: 'Memory', value: health?.memoryUsage ?? null, color: '#8B5CF6' },
    { label: 'Disk', value: health?.diskUsage ?? null, color: '#F59E0B' },
    { label: 'Cache Hit Rate', value: health?.cacheHitRate ?? null, color: '#10B981' },
    { label: 'Uptime', value: health?.uptime ?? null, color: '#06B6D4' },
  ];

  const statCards = [
    { label: 'Response Time', value: health?.responseTime != null ? `${health.responseTime}ms` : '—', icon: Wifi, color: '#10B981' },
    { label: 'DB Connections', value: health?.databaseConnections ?? '—', icon: HardDrive, color: '#6366F1' },
    { label: 'Errors (24h)', value: health?.errors24h ?? '—', icon: AlertTriangle, color: '#F43F5E' },
    { label: 'API Calls (24h)', value: health?.apiCalls24h != null ? health.apiCalls24h.toLocaleString() : '—', icon: Cpu, color: '#8B5CF6' },
  ];

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b flex items-center justify-between"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>System Health</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Real-time • 10s refresh</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {health && (
              <div className="flex items-center gap-2">
                {statusIcon(health.status)}
                <span className={`badge ${health.status === 'healthy' ? 'badge-success' : health.status === 'warning' ? 'badge-warning' : 'badge-danger'}`}>
                  {health.status?.toUpperCase()}
                </span>
              </div>
            )}
            <button className="admin-btn-secondary" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /></button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Health Rings */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Resource Usage</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="admin-card p-4 flex flex-col items-center gap-2 animate-pulse">
                    <div className="w-24 h-24 rounded-full" style={{ background: 'var(--bg-muted)' }} />
                    <div className="h-3 w-16 rounded" style={{ background: 'var(--bg-muted)' }} />
                  </div>
                ))
              ) : rings.map((r, i) => (
                <motion.div key={r.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}>
                  <HealthRing {...r} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Stat Cards */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Performance Metrics</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }}
                            className="admin-card p-5">
                  <div className="p-2.5 rounded-xl mb-3 w-fit" style={{ background: `${s.color}18` }}>
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <p className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{String(s.value)}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Backend Services */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Services</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'API Server', status: health?.status === 'healthy' ? 'operational' : 'degraded', color: '#10B981' },
                { label: 'PostgreSQL Database', status: health?.databaseConnections != null ? 'operational' : 'unknown', color: '#6366F1' },
                { label: 'Cache Layer', status: health?.cacheHitRate != null ? 'operational' : 'unknown', color: '#F59E0B' },
              ].map((svc) => (
                <div key={svc.label} className="admin-card p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${svc.color}18` }}>
                    <div className="w-3 h-3 rounded-full animate-pulse-dot" style={{ background: svc.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{svc.label}</p>
                    <p className="text-xs capitalize" style={{ color: svc.color }}>{svc.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
