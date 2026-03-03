'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { DollarSign, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { adminApi } from '@/lib/api';

const PLAN_COLORS = ['#6B7280', '#6366F1', '#10B981', '#8B5CF6', '#F59E0B'];

export default function BillingPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');

  const { data: subAnalytics, isLoading: subLoading, refetch } = useQuery({
    queryKey: ['sub-analytics', timeRange],
    queryFn: () => adminApi.getSubscriptionAnalytics(timeRange),
    refetchInterval: 60000,
  });

  const { data: revenueAnalytics, isLoading: revLoading } = useQuery({
    queryKey: ['revenue-analytics', timeRange],
    queryFn: () => adminApi.getRevenueAnalytics(timeRange),
    refetchInterval: 60000,
  });

  const plans = subAnalytics?.subscriptionDistribution || [];
  const totalRevenue = plans.reduce((s, p) => s + (p.revenue || 0), 0);
  const totalSubs = plans.reduce((s, p) => s + p.count, 0);
  const paidSubs = plans.filter(p => p.plan !== 'Free').reduce((s, p) => s + p.count, 0);

  const tooltipStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: 13,
  };

  const kpis = [
    { label: 'Total Subscriptions', value: totalSubs > 0 ? totalSubs.toLocaleString() : '—', color: '#8B5CF6' },
    { label: 'Paid Subscribers', value: paidSubs > 0 ? paidSubs.toLocaleString() : '—', color: '#6366F1' },
    { label: 'Revenue (MRR est.)', value: totalRevenue > 0 ? `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—', color: '#10B981' },
  ];

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b flex items-center justify-between"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5" style={{ color: '#10B981' }} />
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Billing & Revenue</h1>
          </div>
          <div className="flex items-center gap-2">
            <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="admin-select">
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="90d">90 Days</option>
            </select>
            <button className="admin-btn-secondary" onClick={() => refetch()}><RefreshCw className="w-4 h-4" /></button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4">
            {kpis.map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                          className="admin-card p-5">
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{k.label}</p>
                <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="admin-card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Revenue Trend</h3>
              {revLoading ? (
                <div className="h-52 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={revenueAnalytics?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Plan Distribution */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="admin-card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Plan Distribution</h3>
              {subLoading ? (
                <div className="h-52 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
              ) : plans.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={plans} dataKey="count" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                        {plans.map((_, i) => <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v, n, p) => [`${p.payload.plan}: ${v}`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-3">
                    {plans.map((p, i) => (
                      <div key={p.plan}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: PLAN_COLORS[i % PLAN_COLORS.length] }} />
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.plan}</span>
                          </div>
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{p.count}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                          <div className="h-full rounded-full" style={{
                            background: PLAN_COLORS[i % PLAN_COLORS.length],
                            width: totalSubs > 0 ? `${(p.count / totalSubs) * 100}%` : '0%'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p style={{ color: 'var(--text-muted)' }} className="text-sm">No subscription data available</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Plans Table */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="admin-card overflow-hidden">
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Plan Breakdown</h3>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Subscribers</th>
                  <th>Share</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {subLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 4 }).map((__, j) => (
                      <td key={j}><div className="h-4 w-20 rounded animate-pulse" style={{ background: 'var(--bg-muted)' }} /></td>
                    ))}</tr>
                  ))
                ) : plans.length > 0 ? plans.map((p, i) => (
                  <tr key={p.plan}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: PLAN_COLORS[i % PLAN_COLORS.length] }} />
                        <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{p.plan}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.count.toLocaleString()}</td>
                    <td>
                      <span className="badge badge-muted">
                        {totalSubs > 0 ? `${Math.round(p.count / totalSubs * 100)}%` : '—'}
                      </span>
                    </td>
                    <td style={{ color: '#10B981', fontWeight: 600 }}>
                      {p.revenue > 0 ? `$${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>No billing data</td></tr>
                )}
              </tbody>
            </table>
          </motion.div>
        </div>
      </div>
    </div>
  );
}