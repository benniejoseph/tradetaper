'use client';

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import {
  BarChart3, RefreshCw, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Download,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { adminApi } from '@/lib/api';
import { downloadCsv } from '@/lib/csv';
import { containerVariants, itemVariants } from '@/lib/animation-variants';
import toast from 'react-hot-toast';

export default function TradesPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-trades', page, statusFilter],
    queryFn: () => adminApi.getTrades(page, 50, statusFilter || undefined),
    placeholderData: keepPreviousData,
  });

  const trades = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const summary = data?.summary;

  const exportCsv = () => {
    if (!trades.length) return toast.error('No data');
    const headers = ['ID','Symbol','Direction','User','Open Price','Close Price','P&L','Status','Date'];
    const rows = trades.map((t) => [
      t.id, t.symbol, t.side,
      t.user ? `${t.user.firstName || ''} ${t.user.lastName || ''}`.trim() || t.user.email : '—',
      t.openPrice || '—', t.closePrice || '—',
      t.profitOrLoss != null ? Number(t.profitOrLoss).toFixed(2) : '—',
      t.status, new Date(t.createdAt).toLocaleDateString(),
    ]);
    downloadCsv('trades.csv', headers, rows);
    toast.success('Exported CSV');
  };

  return (
    <div className="flex h-dvh" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header
          className="sticky top-0 z-40 border-b px-6 py-3.5 backdrop-blur-xl"
          style={{
            background: 'color-mix(in srgb, var(--bg-surface) 92%, transparent)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="max-w-[var(--content-max-width)] mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Trades</h1>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {formatNumber(total)} total trades
                </p>
              </div>
            </div>
            <div className="flex w-full lg:w-auto flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="admin-select text-sm min-w-[140px] flex-1 lg:flex-none"
              >
                <option value="">All Status</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
              </select>
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => refetch()}
                aria-label="Refresh trades"
                title="Refresh trades"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button className="admin-btn-secondary" onClick={exportCsv}>
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </header>

        {/* Summary Bar */}
        <div
          className="px-6 py-2.5 border-b flex-shrink-0"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="max-w-[var(--content-max-width)] mx-auto flex flex-wrap items-center gap-6">
            {[
              { label: 'Total P&L', value: summary?.totalPnl != null ? `$${Number(summary.totalPnl).toFixed(2)}` : '—', color: (summary?.totalPnl ?? 0) >= 0 ? '#10B981' : '#F43F5E' },
              { label: 'Win Rate', value: summary?.winRate != null ? `${summary.winRate}%` : '—', color: '#6366F1' },
              { label: 'Total Trades', value: formatNumber(total), color: 'var(--accent-primary)' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{s.label}:</span>
                <span className="text-xs font-bold" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5">
          <div className="max-w-[var(--content-max-width)] mx-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-card overflow-x-auto">
              <table className="admin-table" style={{ minWidth: 760 }}>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Direction</th>
                    <th>User</th>
                    <th>Open Price</th>
                    <th>Close Price</th>
                    <th>P&L</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                  {isLoading ? (
                    Array.from({ length: 15 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 8 }).map((__, j) => (
                        <td key={j}><div className="h-4 w-20 rounded animate-pulse" style={{ background: 'var(--bg-muted)' }} /></td>
                      ))}</tr>
                    ))
                  ) : trades.length === 0 ? (
                    <tr><td colSpan={8} className="py-20 text-center">
                      <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
                      <p style={{ color: 'var(--text-muted)' }}>No trades found</p>
                    </td></tr>
                  ) : trades.map((t) => {
                    const pnl = t.profitOrLoss != null ? Number(t.profitOrLoss) : null;
                    const isLong = ['LONG', 'long', 'BUY', 'buy'].includes(t.side);
                    return (
                      <motion.tr
                        variants={itemVariants}
                        key={t.id}
                        whileHover={{ scale: 0.999, backgroundColor: 'var(--bg-surface-hover)' }}
                        transition={{ duration: 0.15 }}
                      >
                        <td><span className="font-mono text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.symbol}</span></td>
                        <td>
                          <span className={`badge ${isLong ? 'badge-success' : 'badge-danger'}`}>
                            {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {t.side}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                          {t.user ? `${t.user.firstName || ''} ${t.user.lastName || ''}`.trim() || t.user.email : '—'}
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'monospace' }}>{t.openPrice ?? '—'}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'monospace' }}>{t.closePrice ?? '—'}</td>
                        <td>
                          {pnl != null ? (
                            <span className={`font-semibold text-sm`} style={{ color: pnl >= 0 ? '#10B981' : '#F43F5E' }}>
                              {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                            </span>
                          ) : <span style={{ color: 'var(--text-muted)' }}>Open</span>}
                        </td>
                        <td><span className={`badge ${t.status === 'OPEN' ? 'badge-primary' : 'badge-muted'}`}>{t.status}</span></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Page {page} of {totalPages} • {total} total
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="admin-btn-secondary py-2 px-3.5 disabled:opacity-40"
                      aria-label="Previous page"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="admin-btn-secondary py-2 px-3.5 disabled:opacity-40"
                      aria-label="Next page"
                      title="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
