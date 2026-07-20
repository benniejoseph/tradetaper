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
    <div className="flex h-dvh min-w-0" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="admin-page-header">
          <div className="admin-shell flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
              <div>
                <h1 className="admin-page-title">Trades</h1>
                <p className="admin-page-subtitle">
                  {formatNumber(total)} total trades
                </p>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="admin-select min-w-[160px] flex-1 sm:flex-none"
              >
                <option value="">All Status</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
              </select>
              <button
                type="button"
                className="admin-btn-secondary min-w-[44px] justify-center"
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
        <div className="admin-page-subbar">
          <div className="admin-shell grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            {[
              { label: 'Total P&L', value: summary?.totalPnl != null ? `$${Number(summary.totalPnl).toFixed(2)}` : '—', color: (summary?.totalPnl ?? 0) >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' },
              { label: 'Win Rate', value: summary?.winRate != null ? `${summary.winRate}%` : '—', color: 'var(--chart-2)' },
              { label: 'Total Trades', value: formatNumber(total), color: 'var(--accent-primary)' },
            ].map(s => (
              <div key={s.label} className="admin-card admin-metric-card">
                <p className="admin-metric-label">{s.label}</p>
                <p className="admin-metric-value" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto admin-page-main">
          <div className="admin-shell admin-page-stack">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-card overflow-hidden">
              <div className="xl:hidden">
                <div className="admin-table-head">
                  <h2 className="admin-section-title">Trade Records</h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Mobile-friendly stacked list for quick scanning</p>
                </div>
                {isLoading ? (
                  <div className="admin-mobile-list">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="admin-mobile-card animate-pulse">
                        <div className="h-4 rounded w-2/5 mb-3" style={{ background: 'var(--bg-muted)' }} />
                        <div className="h-3 rounded mb-2" style={{ background: 'var(--bg-muted)' }} />
                        <div className="h-3 rounded w-4/5" style={{ background: 'var(--bg-muted)' }} />
                      </div>
                    ))}
                  </div>
                ) : trades.length === 0 ? (
                  <div className="py-16 text-center">
                    <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
                    <p style={{ color: 'var(--text-muted)' }}>No trades found</p>
                  </div>
                ) : (
                  <div className="admin-mobile-list">
                    {trades.map((t) => {
                      const pnl = t.profitOrLoss != null ? Number(t.profitOrLoss) : null;
                      const isLong = ['LONG', 'long', 'BUY', 'buy'].includes(t.side);
                      return (
                        <div key={t.id} className="admin-mobile-card space-y-3.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{t.symbol}</span>
                            <span className={`badge ${t.status === 'OPEN' ? 'badge-primary' : 'badge-muted'}`}>{t.status}</span>
                          </div>
                          <div className="admin-mobile-row">
                            <span className="admin-mobile-label">Direction</span>
                            <span className={`badge ${isLong ? 'badge-success' : 'badge-danger'}`}>
                              {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {t.side}
                            </span>
                          </div>
                          <div className="admin-mobile-row">
                            <span className="admin-mobile-label">User</span>
                            <span className="text-sm leading-6" style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>
                              {t.user ? `${t.user.firstName || ''} ${t.user.lastName || ''}`.trim() || t.user.email : '—'}
                            </span>
                          </div>
                          <div className="admin-mobile-row">
                            <span className="admin-mobile-label">Open / Close</span>
                            <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {t.openPrice ?? '—'} / {t.closePrice ?? '—'}
                            </span>
                          </div>
                          <div className="admin-mobile-row">
                            <span className="admin-mobile-label">P&L</span>
                            {pnl != null ? (
                              <span className="font-semibold" style={{ color: pnl >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                                {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                              </span>
                            ) : <span style={{ color: 'var(--text-muted)' }}>Open</span>}
                          </div>
                          <div className="admin-mobile-row">
                            <span className="admin-mobile-label">Date</span>
                            <span style={{ color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="hidden xl:block admin-page-table-wrap">
                <div className="admin-table-head">
                  <h2 className="admin-section-title">Trade Records</h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Structured table view for deep analysis</p>
                </div>
                <table className="admin-table" style={{ minWidth: 900 }}>
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
                          <td className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                            {t.user ? `${t.user.firstName || ''} ${t.user.lastName || ''}`.trim() || t.user.email : '—'}
                          </td>
                          <td className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{t.openPrice ?? '—'}</td>
                          <td className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{t.closePrice ?? '—'}</td>
                          <td>
                            {pnl != null ? (
                              <span className="font-semibold text-sm" style={{ color: pnl >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                                {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                              </span>
                            ) : <span style={{ color: 'var(--text-muted)' }}>Open</span>}
                          </td>
                          <td><span className={`badge ${t.status === 'OPEN' ? 'badge-primary' : 'badge-muted'}`}>{t.status}</span></td>
                          <td style={{ color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                        </motion.tr>
                      );
                    })}
                  </motion.tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="admin-pagination">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Page {page} of {totalPages} • {total} total
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="admin-btn-secondary min-w-[44px] justify-center disabled:opacity-40"
                      aria-label="Previous page"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="admin-btn-secondary min-w-[44px] justify-center disabled:opacity-40"
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
