'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import {
  Users, TrendingUp, BarChart3, DollarSign, Activity, RefreshCw,
  ArrowUpRight, ArrowDownRight, Download, CreditCard, Wallet,
  Globe, Zap
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { formatNumber } from '@/lib/utils';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

const PLAN_COLORS = ['#6B7280', '#6366F1', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];

function KpiCard({ label, value, icon: Icon, color, growth, delay = 0 }: {
  label: string; value: string; icon: any; color: string; growth?: number; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="admin-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 rounded-xl" style={{ background: `${color}18` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {growth != null && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${growth >= 0 ? 'badge-success' : 'badge-danger'}`}>
            {growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(growth)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </motion.div>
  );
}

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => adminApi.getDashboardStats(),
    refetchInterval: 30000,
  });

  const { data: userAnalytics, isLoading: userLoading } = useQuery({
    queryKey: ['user-analytics', timeRange],
    queryFn: () => adminApi.getUserAnalytics(timeRange),
    refetchInterval: 60000,
  });

  const { data: revenueAnalytics, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-analytics', timeRange],
    queryFn: () => adminApi.getRevenueAnalytics(timeRange),
    refetchInterval: 60000,
  });

  const { data: subscriptionAnalytics, isLoading: subLoading } = useQuery({
    queryKey: ['subscription-analytics', timeRange],
    queryFn: () => adminApi.getSubscriptionAnalytics(timeRange),
    refetchInterval: 60000,
  });

  const { data: systemHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => adminApi.getSystemHealth(),
    refetchInterval: 15000,
  });

  const { data: activityFeed, isLoading: activityLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: () => adminApi.getActivityFeed(15),
    refetchInterval: 5000,
  });

  const { data: recentUsers } = useQuery({
    queryKey: ['recent-users'],
    queryFn: () => adminApi.getUsers(1, 5),
    refetchInterval: 60000,
  });

  const plans = subscriptionAnalytics?.subscriptionDistribution || [];
  const totalPlanUsers = plans.reduce((s, p) => s + p.count, 0);
  const paidUsers = plans.filter(p => p.plan !== 'Free').reduce((s, p) => s + p.count, 0);

  const tooltipStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: 13,
  };

  const kpiCards = [
    { label: 'Total Users', value: stats?.totalUsers != null ? formatNumber(stats.totalUsers) : '—', icon: Users, color: '#6366F1', growth: stats?.userGrowth },
    { label: 'Active Users', value: stats?.activeUsers != null ? formatNumber(stats.activeUsers) : '—', icon: Activity, color: '#10B981', growth: stats?.activeGrowth },
    { label: 'Total Trades', value: stats?.totalTrades != null ? formatNumber(stats.totalTrades) : '—', icon: BarChart3, color: '#F59E0B', growth: stats?.tradeGrowth },
    { label: 'Paid Subscribers', value: paidUsers > 0 ? formatNumber(paidUsers) : '—', icon: CreditCard, color: '#8B5CF6' },
    { label: 'Total Revenue', value: stats?.totalRevenue != null ? `$${formatNumber(stats.totalRevenue)}` : '—', icon: DollarSign, color: '#EC4899', growth: stats?.revenueGrowth },
    { label: 'Avg Trades/User', value: stats?.avgTradesPerUser != null ? `${stats.avgTradesPerUser}` : '—', icon: TrendingUp, color: '#06B6D4' },
  ];

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 border-b flex items-center justify-between"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div>
            <h1 className="text-xl font-bold text-gradient">Dashboard</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Platform overview • Auto-refreshes every 30s
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="admin-select text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className="admin-btn-secondary" onClick={() => { refetchStats(); toast.success('Refreshed'); }}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="admin-btn-primary">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {statsLoading || subLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="admin-card p-5 animate-pulse">
                  <div className="w-10 h-10 rounded-xl mb-4" style={{ background: 'var(--bg-muted)' }} />
                  <div className="h-6 w-20 rounded mb-1" style={{ background: 'var(--bg-muted)' }} />
                  <div className="h-3 w-16 rounded" style={{ background: 'var(--bg-subtle)' }} />
                </div>
              ))
            ) : kpiCards.map((card, i) => (
              <KpiCard key={card.label} {...card} delay={i * 0.06} />
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="admin-card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>User Growth</h3>
              {userLoading ? (
                <div className="h-52 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
              ) : (
                <ResponsiveContainer width="100%" height={208}>
                  <AreaChart data={userAnalytics?.data || []}>
                    <defs>
                      <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="users" stroke="#6366F1" fill="url(#ug)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Revenue */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="admin-card p-5">
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Revenue</h3>
              {revenueLoading ? (
                <div className="h-52 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
              ) : (
                <ResponsiveContainer width="100%" height={208}>
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
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Activity Feed */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="admin-card" style={{ maxHeight: 360, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: '#10B981' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Live Activity</h3>
                </div>
                <Zap className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="overflow-y-auto flex-1 p-3 space-y-2">
                {activityLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-3 p-2 animate-pulse">
                      <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: 'var(--bg-muted)' }} />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-full rounded" style={{ background: 'var(--bg-muted)' }} />
                        <div className="h-2.5 w-20 rounded" style={{ background: 'var(--bg-subtle)' }} />
                      </div>
                    </div>
                  ))
                ) : activityFeed && activityFeed.length > 0 ? activityFeed.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-xl" style={{ background: 'var(--bg-muted)' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                         style={{ background: 'var(--gradient-brand)' }}>
                      {(a.user?.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{a.description}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {new Date(a.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-25" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No recent activity</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Subscription Distribution */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="admin-card p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Subscription Plans</h3>
              {subLoading ? (
                <div className="h-40 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
              ) : plans.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={plans} dataKey="count" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                        {plans.map((_, i) => <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v, n, p) => [`${p.payload.plan}: ${v}`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-3">
                    {plans.map((p, i) => (
                      <div key={p.plan} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: PLAN_COLORS[i % PLAN_COLORS.length] }} />
                          <span style={{ color: 'var(--text-secondary)' }}>{p.plan}</span>
                        </div>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {formatNumber(p.count)} {totalPlanUsers > 0 && `(${Math.round(p.count / totalPlanUsers * 100)}%)`}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-25" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No subscription data</p>
                </div>
              )}
            </motion.div>

            {/* System Health + Recent Users */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="admin-card p-4 space-y-4">
              {/* System Health */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>System Health</h3>
                  <span className={`badge text-[10px] ${systemHealth?.status === 'healthy' ? 'badge-success' : 'badge-warning'}`}>
                    {systemHealth?.status || 'Unknown'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Response', value: systemHealth?.responseTime != null ? `${systemHealth.responseTime}ms` : '—', color: '#10B981' },
                    { label: 'CPU', value: systemHealth?.cpuUsage != null ? `${systemHealth.cpuUsage}%` : '—', color: '#6366F1' },
                    { label: 'Memory', value: systemHealth?.memoryUsage != null ? `${systemHealth.memoryUsage}%` : '—', color: '#F59E0B' },
                    { label: 'Cache Hit', value: systemHealth?.cacheHitRate != null ? `${systemHealth.cacheHitRate}%` : '—', color: '#06B6D4' },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl p-3" style={{ background: 'var(--bg-muted)' }}>
                      <p className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: m.color }}>{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Users */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Recent Signups</h3>
                <div className="space-y-2">
                  {recentUsers?.data.slice(0, 4).map((u) => (
                    <div key={u.id} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                           style={{ background: 'var(--gradient-brand)' }}>
                        {(u.firstName?.[0] || u.email[0]).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.email.split('@')[0]}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                      </div>
                      <Globe className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )) || (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No users yet</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
