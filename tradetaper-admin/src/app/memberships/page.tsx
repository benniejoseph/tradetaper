'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { CreditCard, RefreshCw, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function MembershipsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-subscriptions', page, statusFilter, planFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (statusFilter) params.append('status', statusFilter);
      if (planFilter) params.append('plan', planFilter);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/subscriptions?${params}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } }
      );
      return res.json();
    },
    keepPreviousData: true,
    refetchInterval: 30000,
  } as any);

  const subs = (data as any)?.data || [];
  const total = (data as any)?.total || 0;
  const totalPages = (data as any)?.totalPages || 1;
  const summary = (data as any)?.summary || {};

  const statusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'badge-success';
      case 'past_due': case 'past due': return 'badge-warning';
      case 'canceled': case 'cancelled': return 'badge-danger';
      default: return 'badge-muted';
    }
  };

  const planBadge = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'pro': return 'badge-primary';
      case 'premium': return 'badge-primary';
      case 'enterprise': return 'badge-warning';
      default: return 'badge-muted';
    }
  };

  const exportCsv = () => {
    if (!subs.length) return toast.error('No data');
    const headers = ['ID','User','Plan','Status','Start Date','End Date','Stripe ID'];
    const rows = subs.map((s: any) => [
      s.id,
      s.user ? `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() || s.user.email : '—',
      s.plan || s.tier, s.status,
      s.startDate ? new Date(s.startDate).toLocaleDateString() : '—',
      s.endDate ? new Date(s.endDate).toLocaleDateString() : '—',
      s.stripeSubscriptionId || '—',
    ]);
    const csv = [headers, ...rows].map(r => r.map(String).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'memberships.csv'; a.click();
    toast.success('Exported CSV');
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b flex items-center justify-between"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5" style={{ color: '#8B5CF6' }} />
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Memberships</h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatNumber(total)} subscriptions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="admin-select">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="canceled">Canceled</option>
              <option value="past_due">Past Due</option>
            </select>
            <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1); }} className="admin-select">
              <option value="">All Plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <button className="admin-btn-secondary" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /></button>
            <button className="admin-btn-secondary" onClick={exportCsv}><Download className="w-4 h-4" /><span>Export</span></button>
          </div>
        </header>

        {/* Summary */}
        <div className="px-6 py-3 border-b flex gap-6"
             style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          {[
            { label: 'Total', value: formatNumber(total), color: '#8B5CF6' },
            { label: 'Active', value: summary.activeCount != null ? formatNumber(summary.activeCount) : '—', color: '#10B981' },
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
                ) : subs.map((s: any) => (
                  <tr key={s.id}>
                    <td>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {s.user ? `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() || s.user.email : '—'}
                        </p>
                        {s.user?.email && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.user.email}</p>}
                      </div>
                    </td>
                    <td><span className={`badge ${planBadge(s.plan || s.tier)}`}>{s.plan || s.tier || 'Free'}</span></td>
                    <td><span className={`badge ${statusBadge(s.status)}`}>{s.status || '—'}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {s.startDate ? new Date(s.startDate).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {s.endDate ? new Date(s.endDate).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {s.stripeSubscriptionId ? (
                        <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                          {s.stripeSubscriptionId.slice(0, 20)}…
                        </span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
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
