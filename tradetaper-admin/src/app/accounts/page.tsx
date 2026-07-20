'use client';

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { Wallet, RefreshCw, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { adminApi } from '@/lib/api';
import { downloadCsv } from '@/lib/csv';
import toast from 'react-hot-toast';

export default function AccountsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-accounts', page],
    queryFn: () => adminApi.getAccounts(page, 50),
    placeholderData: keepPreviousData,
  });

  const accounts = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const summary = data?.summary;

  const exportCsv = () => {
    if (!accounts.length) return toast.error('No data');
    const headers = ['ID', 'Name', 'User', 'Balance', 'Currency', 'Created'];
    const rows = accounts.map((a) => [
      a.id, a.name || 'Account',
      a.user ? `${a.user.firstName || ''} ${a.user.lastName || ''}`.trim() || a.user?.email : '—',
      a.balance ?? '—', a.currency || 'USD',
      new Date(a.createdAt).toLocaleDateString(),
    ]);
    downloadCsv('accounts.csv', headers, rows);
    toast.success('Exported CSV');
  };

  return (
    <div className="flex h-dvh min-w-0" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="admin-page-header">
          <div className="admin-shell flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              <div>
                <h1 className="admin-page-title">Accounts</h1>
                <p className="admin-page-subtitle">{formatNumber(total)} trading accounts</p>
              </div>
            </div>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <button
                type="button"
                className="admin-btn-secondary min-w-[44px] justify-center"
                onClick={() => refetch()}
                aria-label="Refresh accounts"
                title="Refresh accounts"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button className="admin-btn-secondary" onClick={exportCsv}><Download className="w-4 h-4" /><span>Export</span></button>
            </div>
          </div>
        </header>

        {/* Summary */}
        <div className="admin-page-subbar">
          <div className="admin-shell grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {[
              { label: 'Total Accounts', value: formatNumber(total), color: 'var(--chart-1)' },
              { label: 'Total Balance', value: summary?.totalBalance != null ? `$${Number(summary.totalBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—', color: 'var(--chart-2)' },
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
              {isLoading ? (
                <div className="admin-mobile-list">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="admin-mobile-card animate-pulse">
                      <div className="h-4 w-28 rounded mb-3" style={{ background: 'var(--bg-muted)' }} />
                      <div className="space-y-2">
                        <div className="h-3 rounded" style={{ background: 'var(--bg-muted)' }} />
                        <div className="h-3 rounded w-4/5" style={{ background: 'var(--bg-muted)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : accounts.length === 0 ? (
                <div className="py-16 text-center">
                  <Wallet className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: 'var(--text-muted)' }} />
                  <p style={{ color: 'var(--text-muted)' }}>No accounts found</p>
                </div>
              ) : (
                <div className="admin-mobile-list">
                  {accounts.map((a) => (
                    <div key={a.id} className="admin-mobile-card space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: 'color-mix(in srgb, var(--accent-primary) 16%, transparent)' }}
                          >
                            <Wallet className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                          </div>
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{a.name || 'Account'}</span>
                        </div>
                        <span className="badge badge-muted">{a.currency || 'USD'}</span>
                      </div>
                      <div className="admin-mobile-row">
                        <span className="admin-mobile-label">User</span>
                        <span style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>
                          {a.user ? (`${a.user.firstName || ''} ${a.user.lastName || ''}`.trim() || a.user.email) : '—'}
                        </span>
                      </div>
                      <div className="admin-mobile-row">
                        <span className="admin-mobile-label">Balance</span>
                        <span className="font-semibold" style={{ color: 'var(--accent-success)' }}>
                          {a.balance != null ? `$${Number(a.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                        </span>
                      </div>
                      <div className="admin-mobile-row">
                        <span className="admin-mobile-label">Created</span>
                        <span style={{ color: 'var(--text-muted)' }}>{new Date(a.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden xl:block admin-page-table-wrap">
              <table className="admin-table" style={{ minWidth: 820 }}>
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
                  ) : accounts.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: 'color-mix(in srgb, var(--accent-primary) 16%, transparent)' }}
                          >
                            <Wallet className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                          </div>
                          <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{a.name || 'Account'}</span>
                        </div>
                      </td>
                      <td className="text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
                        {a.user ? (`${a.user.firstName || ''} ${a.user.lastName || ''}`.trim() || a.user.email) : '—'}
                      </td>
                      <td>
                        <span className="font-semibold" style={{ color: 'var(--accent-success)' }}>
                          {a.balance != null ? `$${Number(a.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                        </span>
                      </td>
                      <td><span className="badge badge-muted">{a.currency || 'USD'}</span></td>
                      <td style={{ color: 'var(--text-muted)' }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="admin-pagination">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Page {page} of {totalPages}</p>
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
