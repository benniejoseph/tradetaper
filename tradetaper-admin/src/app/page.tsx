'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import {
  Users,
  TrendingUp,
  BarChart3,
  DollarSign,
  Activity,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  CreditCard,
  Globe,
  Zap,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatNumber } from '@/lib/utils';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

const PLAN_COLORS = ['#6B7280', '#10B981', '#22D3EE', '#14B8A6', '#34D399', '#2DD4BF'];

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  growth,
  delay = 0,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
  growth?: number;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="admin-card p-5 min-h-[132px] flex flex-col justify-between"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="p-2.5 rounded-xl" style={{ background: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {growth != null ? (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${growth >= 0 ? 'badge-success' : 'badge-danger'}`}>
            {growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(growth)}%
          </div>
        ) : null}
      </div>

      <div>
        <p className="text-3xl leading-none font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{value}</p>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      </div>
    </motion.div>
  );
}

function SectionCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`admin-card p-5 ${className}`}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => adminApi.getDashboardStats(),
    refetchInterval: 60000,
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
    refetchInterval: 30000,
  });

  const { data: activityFeed, isLoading: activityLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: () => adminApi.getActivityFeed(15),
    refetchInterval: 15000,
  });

  const { data: recentUsers } = useQuery({
    queryKey: ['recent-users'],
    queryFn: () => adminApi.getUsers(1, 5),
    refetchInterval: 60000,
  });

  const plans = subscriptionAnalytics?.subscriptionDistribution || [];
  const totalPlanUsers = plans.reduce((s, p) => s + p.count, 0);
  const paidUsers = plans.filter((p) => p.plan !== 'Free').reduce((s, p) => s + p.count, 0);

  const tooltipStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontSize: 12,
  };

  const kpiCards = [
    { label: 'Total Users', value: stats?.totalUsers != null ? formatNumber(stats.totalUsers) : '—', icon: Users, color: '#10B981', growth: stats?.userGrowth },
    { label: 'Active Users', value: stats?.activeUsers != null ? formatNumber(stats.activeUsers) : '—', icon: Activity, color: '#22D3EE', growth: stats?.activeGrowth },
    { label: 'Total Trades', value: stats?.totalTrades != null ? formatNumber(stats.totalTrades) : '—', icon: BarChart3, color: '#14B8A6', growth: stats?.tradeGrowth },
    { label: 'Paid Subscribers', value: paidUsers > 0 ? formatNumber(paidUsers) : '—', icon: CreditCard, color: '#34D399' },
    { label: 'Total Revenue', value: stats?.totalRevenue != null ? `$${formatNumber(stats.totalRevenue)}` : '—', icon: DollarSign, color: '#2DD4BF', growth: stats?.revenueGrowth },
    { label: 'Avg Trades/User', value: stats?.avgTradesPerUser != null ? `${stats.avgTradesPerUser}` : '—', icon: TrendingUp, color: '#5EEAD4' },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="max-w-[1680px] mx-auto flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gradient">Dashboard</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Platform overview and operations health
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="admin-select text-sm min-w-[140px]"
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
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <div className="max-w-[1680px] mx-auto space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
              {statsLoading || subLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="admin-card p-5 min-h-[132px] animate-pulse">
                      <div className="w-10 h-10 rounded-xl mb-5" style={{ background: 'var(--bg-muted)' }} />
                      <div className="h-7 w-24 rounded mb-3" style={{ background: 'var(--bg-muted)' }} />
                      <div className="h-4 w-28 rounded" style={{ background: 'var(--bg-subtle)' }} />
                    </div>
                  ))
                : kpiCards.map((card, i) => <KpiCard key={card.label} {...card} delay={i * 0.05} />)}
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
              <SectionCard title="User Growth">
                {userLoading ? (
                  <div className="h-[320px] rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
                ) : (
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={userAnalytics?.data || []}>
                        <defs>
                          <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                        <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Area type="monotone" dataKey="users" stroke="#10B981" fill="url(#ug)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Revenue">
                {revenueLoading ? (
                  <div className="h-[320px] rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
                ) : (
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueAnalytics?.data || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                        <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="revenue" stroke="#22D3EE" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
              <div className="2xl:col-span-4">
                <SectionCard title="Live Activity" className="h-[360px]">
                  <div className="h-[290px] overflow-y-auto pr-1 space-y-2">
                    {activityLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex gap-3 p-2.5 rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }}>
                          <div className="w-8 h-8 rounded-full" style={{ background: 'var(--bg-subtle)' }} />
                          <div className="flex-1 space-y-1">
                            <div className="h-3 rounded w-full" style={{ background: 'var(--bg-subtle)' }} />
                            <div className="h-2.5 rounded w-28" style={{ background: 'var(--bg-subtle)' }} />
                          </div>
                        </div>
                      ))
                    ) : activityFeed?.length ? (
                      activityFeed.map((a: any) => (
                        <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-xl" style={{ background: 'var(--bg-muted)' }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'var(--gradient-brand)' }}>
                            {(a.user?.name || '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>{a.description}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{new Date(a.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
                        No recent activity
                      </div>
                    )}
                  </div>
                </SectionCard>
              </div>

              <div className="2xl:col-span-4">
                <SectionCard title="Subscription Plans" className="h-[360px]">
                  {subLoading ? (
                    <div className="h-[290px] rounded-xl animate-pulse" style={{ background: 'var(--bg-muted)' }} />
                  ) : plans.length ? (
                    <>
                      <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={plans} dataKey="count" cx="50%" cy="50%" innerRadius={48} outerRadius={74} paddingAngle={3}>
                              {plans.map((_: any, i: number) => (
                                <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} formatter={(v, n, p) => [`${p.payload.plan}: ${v}`, '']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-2 mt-2">
                        {plans.map((p: any, i: number) => (
                          <div key={p.plan} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: PLAN_COLORS[i % PLAN_COLORS.length] }} />
                              <span style={{ color: 'var(--text-secondary)' }}>{p.plan}</span>
                            </div>
                            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {formatNumber(p.count)} {totalPlanUsers > 0 ? `(${Math.round((p.count / totalPlanUsers) * 100)}%)` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-[290px] flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
                      No subscription data
                    </div>
                  )}
                </SectionCard>
              </div>

              <div className="2xl:col-span-4">
                <SectionCard title="System Health" className="h-[360px]">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: 'Response', value: systemHealth?.responseTime != null ? `${systemHealth.responseTime}ms` : '—', color: '#10B981' },
                      { label: 'CPU', value: systemHealth?.cpuUsage != null ? `${systemHealth.cpuUsage}%` : '—', color: '#22D3EE' },
                      { label: 'Memory', value: systemHealth?.memoryUsage != null ? `${systemHealth.memoryUsage}%` : '—', color: '#14B8A6' },
                      { label: 'Cache', value: systemHealth?.cacheHitRate != null ? `${systemHealth.cacheHitRate}%` : '—', color: '#34D399' },
                    ].map((m) => (
                      <div key={m.label} className="rounded-xl p-3" style={{ background: 'var(--bg-muted)' }}>
                        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
                        <p className="text-sm font-bold" style={{ color: m.color }}>{m.value}</p>
                      </div>
                    ))}
                  </div>

                  <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Recent Signups</h4>
                  <div className="space-y-2">
                    {recentUsers?.data?.slice(0, 3)?.length ? (
                      recentUsers.data.slice(0, 3).map((u: any) => (
                        <div key={u.id} className="flex items-center gap-2.5 p-2 rounded-lg" style={{ background: 'var(--bg-muted)' }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'var(--gradient-brand)' }}>
                            {(u.firstName?.[0] || u.email[0]).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                              {u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.email.split('@')[0]}
                            </p>
                            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                          </div>
                          <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                        </div>
                      ))
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No users yet</p>
                    )}
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
