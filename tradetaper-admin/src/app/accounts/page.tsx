'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Wallet, RefreshCw, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api-base-url';
import toast from 'react-hot-toast';

export default function AccountsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-accounts', page],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/admin/accounts?page=${page}&limit=50`,
        { credentials: 'include' }
      );
      return res.json();
    },
    keepPreviousData: true,
  } as any);

  const accounts = (data as any)?.data || [];
  const total = (data as any)?.total || 0;
  const totalPages = (data as any)?.totalPages || 1;
  const summary = (data as any)?.summary || {};

  const exportCsv = () => {
    if (!accounts.length) return toast.error('No data');
    const headers = ['ID', 'Name', 'User', 'Balance', 'Currency', 'Created'];
    const rows = accounts.map((a: any) => [
      a.id, a.name || 'Account',
      a.user ? `${a.user.firstName || ''} ${a.user.lastName || ''}`.trim() || a.user?.email : '—',
      a.balance ?? '—', a.currency || 'USD',
      new Date(a.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(String).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a2 = document.createElement('a'); a2.href = URL.createObjectURL(blob);
    a2.download = 'accounts.csv'; a2.click();
    toast.success('Exported CSV');
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b flex items-center justify-between"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5" style={{ color: '#10B981' }} />
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Accounts</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatNumber(total)} trading accounts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="admin-btn-secondary" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /></button>
            <button className="admin-btn-secondary" onClick={exportCsv}><Download className="w-4 h-4" /><span>Export</span></button>
          </div>
        </header>

        {/* Summary */}
        <div className="px-6 py-3 border-b flex gap-6"
             style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          {[
            { label: 'Total Accounts', value: formatNumber(total), color: '#10B981' },
            { label: 'Total Balance', value: summary.totalBalance != null ? `$${Number(summary.totalBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—', color: '#6366F1' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
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
                  <th>Account</th>
                  <th>User</th>
                  <th>Balance</th>
                  <th>Currency</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 5 }).map((__, j) => (
                      <td key={j}><div className="h-4 w-24 rounded animate-pulse" style={{ background: 'var(--bg-muted)' }} /></td>
                    ))}</tr>
                  ))
                ) : accounts.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center">
                    <Wallet className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: 'var(--text-muted)' }} />
                    <p style={{ color: 'var(--text-muted)' }}>No accounts found</p>
                  </td></tr>
                ) : accounts.map((a: any) => (
                  <tr key={a.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#10B98120' }}>
                          <Wallet className="w-3.5 h-3.5" style={{ color: '#10B981' }} />
                        </div>
                        <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{a.name || 'Account'}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {a.user ? (`${a.user.firstName || ''} ${a.user.lastName || ''}`.trim() || a.user.email) : '—'}
                    </td>
                    <td>
                      <span className="font-semibold" style={{ color: '#10B981' }}>
                        {a.balance != null ? `$${Number(a.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                      </span>
                    </td>
                    <td><span className="badge badge-muted">{a.currency || 'USD'}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Page {page} of {totalPages}</p>
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
