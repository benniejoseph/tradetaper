'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import {
  BarChart3, RefreshCw, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Download,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api-base-url';
import toast from 'react-hot-toast';

export default function TradesPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-trades', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (statusFilter) params.append('status', statusFilter);
      const res = await fetch(
        `${API_BASE_URL}/admin/trades?${params}`,
        { credentials: 'include' }
      );
      return res.json();
    },
    keepPreviousData: true,
  } as any);

  const trades = (data as any)?.data || [];
  const total = (data as any)?.total || 0;
  const totalPages = (data as any)?.totalPages || 1;
  const summary = (data as any)?.summary || {};

  const exportCsv = () => {
    if (!trades.length) return toast.error('No data');
    const headers = ['ID','Symbol','Direction','User','Open Price','Close Price','P&L','Status','Date'];
    const rows = trades.map((t: any) => [
      t.id, t.symbol, t.side,
      t.user ? `${t.user.firstName || ''} ${t.user.lastName || ''}`.trim() || t.user.email : '—',
      t.openPrice || '—', t.closePrice || '—',
      t.profitOrLoss != null ? Number(t.profitOrLoss).toFixed(2) : '—',
      t.status, new Date(t.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(String).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'trades.csv'; a.click();
    toast.success('Exported CSV');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b flex items-center justify-between"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5" style={{ color: '#F59E0B' }} />
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Trades</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatNumber(total)} total trades</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="admin-select">
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
            <button className="admin-btn-secondary" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /></button>
            <button className="admin-btn-secondary" onClick={exportCsv}><Download className="w-4 h-4" /><span>Export</span></button>
          </div>
        </header>

        {/* Summary Bar */}
        <div className="px-6 py-3 border-b grid grid-cols-3 gap-6"
             style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          {[
            { label: 'Total P&L', value: summary.totalPnl != null ? `$${Number(summary.totalPnl).toFixed(2)}` : '—', color: summary.totalPnl >= 0 ? '#10B981' : '#F43F5E' },
            { label: 'Win Rate', value: summary.winRate != null ? `${summary.winRate}%` : '—', color: '#6366F1' },
            { label: 'Total Trades', value: formatNumber(total), color: '#F59E0B' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}:</span>
              <span className="text-sm font-bold" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-card overflow-hidden">
            <table className="admin-table">
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
              <motion.tbody
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
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
                ) : trades.map((t: any) => {
                  const pnl = t.profitOrLoss != null ? Number(t.profitOrLoss) : null;
                  const isLong = ['LONG', 'long', 'BUY', 'buy'].includes(t.side);
                  return (
                    <motion.tr 
                      variants={itemVariants}
                      key={t.id}
                      whileHover={{ scale: 0.995, backgroundColor: 'var(--bg-surface-hover)' }}
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
                          <span className={`font-semibold text-sm ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
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
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Page {page} of {totalPages} • {total} total</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="admin-btn-secondary py-1.5 px-3 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="admin-btn-secondary py-1.5 px-3 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
