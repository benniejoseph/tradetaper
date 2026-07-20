'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { DollarSign, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { adminApi } from '@/lib/api';
import { isFreePlan } from '@/lib/subscription-plan';

const PLAN_COLORS = [
  'var(--accent-neutral)',
  'var(--chart-2)',
  'var(--chart-1)',
  'var(--chart-4)',
  'var(--chart-5)',
];

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
  const paidSubs = plans
    .filter((p) => !isFreePlan(p.plan))
    .reduce((s, p) => s + p.count, 0);

  const tooltipStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: 13,
  };

  const kpis = [
    { label: 'Total Subscriptions', value: totalSubs > 0 ? totalSubs.toLocaleString() : '—', color: 'var(--chart-2)' },
    { label: 'Paid Subscribers', value: paidSubs > 0 ? paidSubs.toLocaleString() : '—', color: 'var(--chart-4)' },
    { label: 'Revenue (Est. MRR)', value: totalRevenue > 0 ? `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—', color: 'var(--chart-1)' },
    { label: 'Conversion Rate', value: totalSubs > 0 ? `${Math.round((paidSubs / totalSubs) * 100)}%` : '—', color: 'var(--chart-3)' },
  ];

  return (
    <div className="flex h-dvh min-w-0" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="admin-page-header">
          <div className="admin-shell flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
              <div>
                <h1 className="admin-page-title">Billing & Revenue</h1>
                <p className="admin-page-subtitle">Finance operations, revenue health, and subscription performance</p>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
              <select value={timeRange} onChange={e => setTimeRange(e.target.value)} className="admin-select min-w-[150px] flex-1 sm:flex-none">
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
                <option value="90d">90 Days</option>
              </select>
              <button
                type="button"
                className="admin-btn-secondary min-w-[44px] justify-center"
                onClick={() => refetch()}
                aria-label="Refresh billing data"
                title="Refresh billing data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto admin-page-main">
          <div className="admin-shell admin-page-stack">
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {kpis.map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                          className="admin-card admin-metric-card">
                <p className="admin-metric-label">{k.label}</p>
                <p className="admin-metric-value" style={{ color: k.color }}>{k.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7">
            {/* Revenue Trend */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="admin-card admin-card-panel">
              <h3 className="admin-section-title mb-4">Revenue Trend</h3>
              {revLoading ? (
                <div className="h-64 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
              ) : (
                <ResponsiveContainer width="100%" height={248}>
                  <LineChart data={revenueAnalytics?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} minTickGap={20} />
                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} width={44} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Plan Distribution */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="admin-card admin-card-panel">
              <h3 className="admin-section-title mb-4">Plan Distribution</h3>
              {subLoading ? (
                <div className="h-64 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
              ) : plans.length > 0 ? (
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-6">
                  <div className="mx-auto h-[176px] w-[176px] md:mx-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={plans} dataKey="count" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                          {plans.map((_, i) => <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(v, n, p) => [`${p.payload.plan}: ${v}`, '']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3.5">
                    {plans.map((p, i) => (
                      <div key={p.plan}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: PLAN_COLORS[i % PLAN_COLORS.length] }} />
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{p.plan}</span>
                          </div>
                          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{p.count}</span>
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
            <div className="admin-table-head">
              <h3 className="admin-section-title">Plan Breakdown</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Subscription mix with contribution by plan</p>
            </div>
            <div className="xl:hidden">
              {subLoading ? (
                <div className="admin-mobile-list">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="admin-mobile-card animate-pulse">
                      <div className="h-4 rounded w-1/2 mb-3" style={{ background: 'var(--bg-muted)' }} />
                      <div className="h-3 rounded mb-2" style={{ background: 'var(--bg-muted)' }} />
                      <div className="h-3 rounded w-4/5" style={{ background: 'var(--bg-muted)' }} />
                    </div>
                  ))}
                </div>
              ) : plans.length > 0 ? (
                <div className="admin-mobile-list">
                  {plans.map((p, i) => (
                    <div key={p.plan} className="admin-mobile-card space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: PLAN_COLORS[i % PLAN_COLORS.length] }} />
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.plan}</span>
                        </div>
                        <span className="badge badge-muted">
                          {totalSubs > 0 ? `${Math.round(p.count / totalSubs * 100)}%` : '—'}
                        </span>
                      </div>
                      <div className="admin-mobile-row">
                        <span className="admin-mobile-label">Subscribers</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{p.count.toLocaleString()}</span>
                      </div>
                      <div className="admin-mobile-row">
                        <span className="admin-mobile-label">Revenue</span>
                        <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>
                          {p.revenue > 0 ? `$${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>No billing data</div>
              )}
            </div>

            <div className="hidden xl:block admin-page-table-wrap">
              <table className="admin-table" style={{ minWidth: 760 }}>
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
                      <td style={{ color: 'var(--accent-success)', fontWeight: 600 }}>
                        {p.revenue > 0 ? `$${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>No billing data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
