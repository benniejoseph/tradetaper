'use client';

import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { CreditCard, RefreshCw, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { adminApi } from '@/lib/api';
import { downloadCsv } from '@/lib/csv';
import { formatPlanLabel, normalizePlanKey } from '@/lib/subscription-plan';
import toast from 'react-hot-toast';

export default function MembershipsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-subscriptions', page, statusFilter, planFilter],
    queryFn: () =>
      adminApi.getSubscriptions(
        page,
        50,
        statusFilter || undefined,
        planFilter || undefined,
      ),
    placeholderData: keepPreviousData,
    refetchInterval: 30000,
  });

  const subs = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const summary = data?.summary;

  const statusBadge = (status?: string | null) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'badge-success';
      case 'past_due': case 'past due': return 'badge-warning';
      case 'canceled': case 'cancelled': return 'badge-danger';
      default: return 'badge-muted';
    }
  };

  const planBadge = (plan?: string | null) => {
    const normalizedPlan = normalizePlanKey(plan);
    switch (normalizedPlan) {
      case 'essential': return 'badge-primary';
      case 'premium': return 'badge-primary';
      case 'enterprise': return 'badge-warning';
      default: return 'badge-muted';
    }
  };

  const exportCsv = () => {
    if (!subs.length) return toast.error('No data');
    const headers = ['ID','User','Plan','Status','Start Date','End Date','Stripe ID'];
    const rows = subs.map((s) => [
      s.id,
      s.user ? `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() || s.user.email : '—',
      formatPlanLabel(s.plan, s.tier), s.status,
      s.startDate ? new Date(s.startDate).toLocaleDateString() : '—',
      s.endDate ? new Date(s.endDate).toLocaleDateString() : '—',
      s.stripeSubscriptionId || '—',
    ]);
    downloadCsv('memberships.csv', headers, rows);
    toast.success('Exported CSV');
  };

  return (
    <div className="flex h-dvh min-w-0" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="admin-page-header">
          <div className="admin-shell flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6" style={{ color: 'var(--chart-2)' }} />
              <div>
                <h1 className="admin-page-title">Memberships</h1>
                <p className="admin-page-subtitle">{formatNumber(total)} subscriptions</p>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="admin-select min-w-[148px] flex-1 sm:flex-none">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="canceled">Canceled</option>
                <option value="past_due">Past Due</option>
              </select>
              <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1); }} className="admin-select min-w-[148px] flex-1 sm:flex-none">
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="essential">Essential</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
              <button
                type="button"
                className="admin-btn-secondary min-w-[44px] justify-center"
                onClick={() => refetch()}
                aria-label="Refresh memberships"
                title="Refresh memberships"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button className="admin-btn-secondary" onClick={exportCsv}><Download className="w-4 h-4" /><span>Export</span></button>
            </div>
          </div>
        </header>

        <div className="admin-page-subbar">
          <div className="admin-shell grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {[
              { label: 'Total', value: formatNumber(total), color: 'var(--chart-2)' },
              { label: 'Active', value: summary?.activeCount != null ? formatNumber(summary.activeCount) : '—', color: 'var(--accent-success)' },
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
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="admin-mobile-card animate-pulse">
                      <div className="h-4 rounded w-2/3 mb-3" style={{ background: 'var(--bg-muted)' }} />
                      <div className="h-3 rounded mb-2" style={{ background: 'var(--bg-muted)' }} />
                      <div className="h-3 rounded w-4/5" style={{ background: 'var(--bg-muted)' }} />
                    </div>
                  ))}
                </div>
              ) : subs.length === 0 ? (
                <div className="py-16 text-center">
                  <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: 'var(--text-muted)' }} />
                  <p style={{ color: 'var(--text-muted)' }}>No subscriptions found</p>
                </div>
              ) : (
                <div className="admin-mobile-list">
                  {subs.map((s) => (
                    <div key={s.id} className="admin-mobile-card space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {s.user ? `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() || s.user.email : '—'}
                        </p>
                        <span className={`badge ${statusBadge(s.status)}`}>{s.status || '—'}</span>
                      </div>
                      {s.user?.email && (
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.user.email}</p>
                      )}
                      <div className="admin-mobile-row">
                        <span className="admin-mobile-label">Plan</span>
                        <span className={`badge ${planBadge(s.plan || s.tier)}`}>{formatPlanLabel(s.plan, s.tier)}</span>
                      </div>
                      <div className="admin-mobile-row">
                        <span className="admin-mobile-label">Start</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {s.startDate ? new Date(s.startDate).toLocaleDateString() : '—'}
                        </span>
                      </div>
                      <div className="admin-mobile-row">
                        <span className="admin-mobile-label">End</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {s.endDate ? new Date(s.endDate).toLocaleDateString() : '—'}
                        </span>
                      </div>
                      <div className="admin-mobile-row">
                        <span className="admin-mobile-label">Stripe ID</span>
                        <span className="font-mono text-sm" style={{ color: 'var(--text-muted)', textAlign: 'right' }}>
                          {s.stripeSubscriptionId ? `${s.stripeSubscriptionId.slice(0, 20)}…` : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden xl:block admin-page-table-wrap">
            <table className="admin-table" style={{ minWidth: 860 }}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Stripe ID</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 12 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 6 }).map((__, j) => (
                      <td key={j}><div className="h-4 w-24 rounded animate-pulse" style={{ background: 'var(--bg-muted)' }} /></td>
                    ))}</tr>
                  ))
                ) : subs.length === 0 ? (
                  <tr><td colSpan={6} className="py-20 text-center">
                    <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: 'var(--text-muted)' }} />
                    <p style={{ color: 'var(--text-muted)' }}>No subscriptions found</p>
                  </td></tr>
                ) : subs.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {s.user ? `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() || s.user.email : '—'}
                        </p>
                        {s.user?.email && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.user.email}</p>}
                      </div>
                    </td>
                    <td><span className={`badge ${planBadge(s.plan || s.tier)}`}>{formatPlanLabel(s.plan, s.tier)}</span></td>
                    <td><span className={`badge ${statusBadge(s.status)}`}>{s.status || '—'}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {s.startDate ? new Date(s.startDate).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {s.endDate ? new Date(s.endDate).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {s.stripeSubscriptionId ? (
                        <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                          {s.stripeSubscriptionId.slice(0, 20)}…
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {totalPages > 1 && (
              <div className="admin-pagination">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Page {page} of {totalPages} • {total} total</p>
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
