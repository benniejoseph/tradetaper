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
    <div className="admin-card admin-card-panel flex flex-col items-center gap-3 text-center">
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
      <p className="text-sm font-medium leading-6" style={{ color: 'var(--text-muted)' }}>{label}</p>
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
    { label: 'CPU Usage', value: health?.cpuUsage ?? null, color: 'var(--chart-4)' },
    { label: 'Memory', value: health?.memoryUsage ?? null, color: 'var(--chart-3)' },
    { label: 'Disk', value: health?.diskUsage ?? null, color: 'var(--chart-5)' },
    { label: 'Cache Hit Rate', value: health?.cacheHitRate ?? null, color: 'var(--chart-1)' },
    { label: 'Uptime', value: health?.uptime ?? null, color: 'var(--chart-2)' },
  ];

  const statCards = [
    { label: 'Response Time', value: health?.responseTime != null ? `${health.responseTime}ms` : '—', icon: Wifi, color: 'var(--chart-1)' },
    { label: 'DB Connections', value: health?.databaseConnections ?? '—', icon: HardDrive, color: 'var(--chart-2)' },
    { label: 'Errors (24h)', value: health?.errors24h ?? '—', icon: AlertTriangle, color: 'var(--accent-danger)' },
    { label: 'API Calls (24h)', value: health?.apiCalls24h != null ? health.apiCalls24h.toLocaleString() : '—', icon: Cpu, color: 'var(--chart-4)' },
  ];

  const serviceRows = [
    { label: 'API Server', status: health?.status === 'healthy' ? 'operational' : 'degraded', color: 'var(--accent-success)' },
    { label: 'PostgreSQL Database', status: health?.databaseConnections != null ? 'operational' : 'unknown', color: 'var(--chart-2)' },
    { label: 'Cache Layer', status: health?.cacheHitRate != null ? 'operational' : 'unknown', color: 'var(--accent-warning)' },
  ];

  return (
    <div className="flex h-dvh" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="admin-page-header">
          <div className="admin-shell flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Server className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
              <div>
                <h1 className="admin-page-title">System Health</h1>
                <p className="admin-page-subtitle">Real-time infrastructure telemetry • 10s refresh</p>
              </div>
            </div>
            <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start gap-3">
              {health && (
                <div className="flex items-center gap-2">
                  {statusIcon(health.status)}
                  <span className={`badge ${health.status === 'healthy' ? 'badge-success' : health.status === 'warning' ? 'badge-warning' : 'badge-danger'}`}>
                    {health.status?.toUpperCase()}
                  </span>
                </div>
              )}
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => refetch()}
                aria-label="Refresh system health"
                title="Refresh system health"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto admin-page-main">
          <div className="admin-shell admin-page-stack">
          {/* Health Rings */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Resource Usage</p>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="admin-card admin-card-panel flex flex-col items-center gap-2 animate-pulse">
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
            <p className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Performance Metrics</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
              {statCards.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }}
                            className="admin-card admin-card-panel">
                  <div className="p-2.5 rounded-xl mb-3 w-fit" style={{ background: `${s.color}18` }}>
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{String(s.value)}</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Backend Services */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Services</p>
            <div className="admin-card overflow-hidden">
              <div className="xl:hidden">
                <div className="admin-mobile-list">
                  {serviceRows.map((svc) => (
                    <div key={svc.label} className="admin-mobile-card space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{svc.label}</p>
                        <span className="badge badge-muted capitalize">{svc.status}</span>
                      </div>
                      <div className="admin-mobile-row admin-muted-block">
                        <span className="admin-mobile-label">Health</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: svc.color }} />
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Monitoring</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden xl:block">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Status</th>
                      <th>Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceRows.map((svc) => (
                      <tr key={svc.label}>
                        <td>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{svc.label}</span>
                        </td>
                        <td>
                          <span className="badge badge-muted capitalize">{svc.status}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: svc.color }} />
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Monitoring</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
