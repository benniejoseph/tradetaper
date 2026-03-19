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
  LucideIcon,
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
import { Activity as AdminActivity, adminApi } from '@/lib/api';
import toast from 'react-hot-toast';

const PLAN_COLORS = ['#6B7280', '#10B981', '#22D3EE', '#14B8A6', '#34D399', '#2DD4BF'];

const ACTIVITY_COLORS: Record<string, string> = {
  trade_closed: '#10B981',
  trade_created: '#22D3EE',
  user_created: '#818CF8',
  subscription_changed: '#FBBF24',
};

/* ─── Tiny sparkline inside KPI cards ─────────────────── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color.replace('#', '')})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ─── KPI Card ─────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  color,
  growth,
  sparkData = [],
  delay = 0,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  growth?: number;
  sparkData?: number[];
  delay?: number;
}) {
  const isPositive = growth == null || growth >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.23, 1, 0.32, 1] }}
      className="admin-card overflow-hidden flex flex-col justify-between pt-4 px-4 pb-0 min-h-[130px]"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
            {label}
          </p>
          <p className="text-2xl font-bold leading-none tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {value}
          </p>
        </div>
        {growth != null && (
          <div
            className={`flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 flex-shrink-0 ${
              isPositive ? 'badge-success' : 'badge-danger'
            }`}
          >
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(growth)}%
          </div>
        )}
      </div>

      {/* Sparkline flush to bottom */}
      <div className="w-full -mx-0">
        <Sparkline data={sparkData.length ? sparkData : [0, 1, 0.5, 1.2, 0.8, 1.5, 1]} color={color} />
      </div>
    </motion.div>
  );
}

/* ─── Section wrapper ──────────────────────────────────── */
function Card({ title, children, className = '', delay = 0, action }: {
  title: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      className={`admin-card p-5 flex flex-col ${className}`}
    >
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        {action}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </motion.div>
  );
}

/* ─── System Health progress bar ──────────────────────── */
function ProgressBar({ label, value, color, unit = '%' }: { label: string; value: number | undefined; color: string; unit?: string }) {
  const pct = Math.min(100, Math.max(0, value ?? 0));
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
          {value != null ? `${value}${unit}` : '—'}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/* ─── Dashboard ────────────────────────────────────────── */
export default function Dashboard() {
  type TimeRange = '7d' | '30d' | '90d' | '1y';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => adminApi.getDashboardStats(),
    refetchInterval: 60000,
    retry: 1,
    retryDelay: 750,
  });

  const { data: userAnalytics, isLoading: userLoading, isError: userError } = useQuery({
    queryKey: ['user-analytics', timeRange],
    queryFn: () => adminApi.getUserAnalytics(timeRange),
    refetchInterval: 60000,
    retry: 1,
    retryDelay: 750,
  });

  const { data: revenueAnalytics, isLoading: revenueLoading, isError: revenueError } = useQuery({
    queryKey: ['revenue-analytics', timeRange],
    queryFn: () => adminApi.getRevenueAnalytics(timeRange),
    refetchInterval: 60000,
    retry: 1,
    retryDelay: 750,
  });

  const { data: subscriptionAnalytics, isLoading: subLoading, isError: subError } = useQuery({
    queryKey: ['subscription-analytics', timeRange],
    queryFn: () => adminApi.getSubscriptionAnalytics(timeRange),
    refetchInterval: 60000,
    retry: 1,
    retryDelay: 750,
  });

  const { data: systemHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => adminApi.getSystemHealth(),
    refetchInterval: 30000,
  });

  const { data: activityFeed, isLoading: activityLoading, isError: activityError } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: () => adminApi.getActivityFeed(20),
    refetchInterval: 15000,
    retry: 1,
    retryDelay: 750,
  });

  const { data: recentUsers } = useQuery({
    queryKey: ['recent-users'],
    queryFn: () => adminApi.getUsers(1, 5),
    refetchInterval: 60000,
  });

  const plans = subscriptionAnalytics?.subscriptionDistribution || [];
  const totalPlanUsers = plans.reduce((s: number, p) => s + p.count, 0);
  const paidUsers = plans
    .filter((p) => (p.planKey || p.plan)?.toLowerCase() !== 'free')
    .reduce((s: number, p) => s + p.count, 0);
  const showKpiSkeleton = statsLoading && !stats;

  /* Sparkline data derived from user analytics trend */
  const userSparkData = (userAnalytics?.values ?? []).slice(-10);
  const revenueSparkData = (revenueAnalytics?.values ?? []).slice(-10);

  const tooltipStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: 11,
  };

  const isTimeRange = (value: string): value is TimeRange =>
    value === '7d' || value === '30d' || value === '90d' || value === '1y';

  const kpiCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers != null ? formatNumber(stats.totalUsers) : '—',
      icon: Users,
      color: '#10B981',
      growth: stats?.userGrowth,
      sparkData: userSparkData,
    },
    {
      label: 'Active Users',
      value: stats?.activeUsers != null ? formatNumber(stats.activeUsers) : '—',
      icon: Activity,
      color: '#22D3EE',
      growth: stats?.activeGrowth,
      sparkData: userSparkData,
    },
    {
      label: 'Total Trades',
      value: stats?.totalTrades != null ? formatNumber(stats.totalTrades) : '—',
      icon: BarChart3,
      color: '#14B8A6',
      growth: stats?.tradeGrowth,
      sparkData: revenueSparkData,
    },
    {
      label: 'Paid Subscribers',
      value: paidUsers > 0 ? formatNumber(paidUsers) : '—',
      icon: CreditCard,
      color: '#818CF8',
      sparkData: [],
    },
    {
      label: 'Total Revenue',
      value: stats?.totalRevenue != null ? `$${formatNumber(stats.totalRevenue)}` : '—',
      icon: DollarSign,
      color: '#2DD4BF',
      growth: stats?.revenueGrowth,
      sparkData: revenueSparkData,
    },
    {
      label: 'Avg Trades/User',
      value: stats?.avgTradesPerUser != null ? `${stats.avgTradesPerUser}` : '—',
      icon: TrendingUp,
      color: '#FBBF24',
      sparkData: [],
    },
  ];

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <header
          className="sticky top-0 z-40 border-b px-6 py-3 backdrop-blur-xl flex-shrink-0"
          style={{
            background: 'color-mix(in srgb, var(--bg-surface) 92%, transparent)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Platform overview and operations health
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => {
                  const next = e.target.value;
                  if (isTimeRange(next)) {
                    setTimeRange(next);
                  }
                }}
                className="admin-select"
                style={{ minWidth: 120 }}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button
                className="admin-btn-secondary"
                onClick={() => { refetchStats(); toast.success('Refreshed'); }}
                title="Refresh"
                aria-label="Refresh dashboard"
                type="button"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button className="admin-btn-primary">
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── Main ── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-5">
          <div className="mx-auto max-w-[var(--content-max-width)] space-y-4">

            {/* Error banner */}
            {(statsError || userError || revenueError || subError || activityError) && (
              <div
                className="rounded-lg border px-4 py-2 text-xs"
                style={{
                  background: 'var(--accent-warning-subtle)',
                  borderColor: 'var(--accent-warning-muted)',
                  color: 'var(--accent-warning)',
                }}
              >
                Some dashboard data could not be loaded. Retrying automatically.
              </div>
            )}

            {/* ── Row 1: KPI Cards (3 across) ── */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {showKpiSkeleton
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="admin-card p-4 min-h-[130px] animate-pulse">
                      <div className="h-3 w-20 rounded mb-3" style={{ background: 'var(--bg-muted)' }} />
                      <div className="h-7 w-16 rounded mb-4" style={{ background: 'var(--bg-muted)' }} />
                      <div className="h-10 w-full rounded" style={{ background: 'var(--bg-subtle)' }} />
                    </div>
                  ))
                : kpiCards.slice(0, 3).map((card, i) => (
                    <KpiCard key={card.label} {...card} delay={i * 0.04} />
                  ))}
            </div>

            {/* ── Row 2: Second row of KPIs ── */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {showKpiSkeleton
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="admin-card p-4 min-h-[130px] animate-pulse">
                      <div className="h-3 w-20 rounded mb-3" style={{ background: 'var(--bg-muted)' }} />
                      <div className="h-7 w-16 rounded mb-4" style={{ background: 'var(--bg-muted)' }} />
                      <div className="h-10 w-full rounded" style={{ background: 'var(--bg-subtle)' }} />
                    </div>
                  ))
                : kpiCards.slice(3, 6).map((card, i) => (
                    <KpiCard key={card.label} {...card} delay={(i + 3) * 0.04} />
                  ))}
            </div>

            {/* ── Row 3: User Growth (full width) ── */}
            <Card title="User Growth" delay={0.12}>
              {userLoading ? (
                <div className="h-52 rounded-lg animate-pulse" style={{ background: 'var(--bg-muted)' }} />
              ) : (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userAnalytics?.data || []}>
                      <defs>
                        <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={28} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--border-default)', strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="users" stroke="#10B981" fill="url(#ug)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* ── Row 4: Revenue (full width) ── */}
            <Card title="Revenue" delay={0.16}>
              {revenueLoading ? (
                <div className="h-48 rounded-lg animate-pulse" style={{ background: 'var(--bg-muted)' }} />
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueAnalytics?.data || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={28} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--border-default)', strokeWidth: 1 }} />
                      <Line type="monotone" dataKey="revenue" stroke="#22D3EE" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* ── Row 5: Bottom 4-col grid ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

              {/* Live Activity */}
              <Card title="Live Activity" delay={0.2} className="xl:col-span-1">
                <div className="space-y-0 overflow-y-auto" style={{ maxHeight: 280 }}>
                  {activityLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2 py-2 animate-pulse">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--bg-subtle)' }} />
                          <div className="flex-1 space-y-1">
                            <div className="h-2.5 rounded w-full" style={{ background: 'var(--bg-muted)' }} />
                            <div className="h-2 rounded w-16" style={{ background: 'var(--bg-subtle)' }} />
                          </div>
                        </div>
                      ))
                    : activityFeed?.length
                      ? activityFeed.map((a: AdminActivity) => (
                          <div
                            key={a.id}
                            className="flex items-start gap-2.5 py-2 border-b last:border-b-0"
                            style={{ borderColor: 'var(--border-subtle)' }}
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                              style={{ background: ACTIVITY_COLORS[a.type] || '#10B981' }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs leading-snug" style={{ color: 'var(--text-primary)' }}>
                                {a.description}
                              </p>
                              <p className="text-[10px] mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
                                {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))
                      : (
                          <p className="text-xs py-4" style={{ color: 'var(--text-muted)' }}>No recent activity</p>
                        )}
                </div>
              </Card>

              {/* Subscription Plans */}
              <Card title="Subscription Plans" delay={0.24}>
                {subLoading ? (
                  <div className="h-[280px] rounded-lg animate-pulse" style={{ background: 'var(--bg-muted)' }} />
                ) : plans.length ? (
                  <>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={plans}
                            dataKey="count"
                            cx="50%"
                            cy="50%"
                            innerRadius={46}
                            outerRadius={70}
                            paddingAngle={3}
                            strokeWidth={0}
                          >
                            {plans.map((_, i: number) => (
                              <Cell key={i} fill={PLAN_COLORS[i % PLAN_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={tooltipStyle}
                            formatter={(value: unknown, _name: unknown, payload: { payload?: { plan?: string } }) => [
                              `${payload.payload?.plan || 'Plan'}: ${String(value ?? '0')}`,
                              '',
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1.5 mt-2">
                      {plans.map((p, i: number) => (
                        <div key={p.plan} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PLAN_COLORS[i % PLAN_COLORS.length] }} />
                            <span className="capitalize" style={{ color: 'var(--text-secondary)' }}>{p.plan}</span>
                          </div>
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {formatNumber(p.count)}{totalPlanUsers > 0 ? ` (${Math.round((p.count / totalPlanUsers) * 100)}%)` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs py-4" style={{ color: 'var(--text-muted)' }}>No subscription data</p>
                )}
              </Card>

              {/* System Health */}
              <Card title="System Health" delay={0.28}>
                <div className="space-y-3">
                  <ProgressBar label="Response Time" value={systemHealth?.responseTime} unit="ms" color="#10B981" />
                  <ProgressBar label="CPU Usage"     value={systemHealth?.cpuUsage}     unit="%" color="#22D3EE" />
                  <ProgressBar label="Memory"        value={systemHealth?.memoryUsage}   unit="%" color="#14B8A6" />
                  <ProgressBar label="Cache Hit"     value={systemHealth?.cacheHitRate}  unit="%" color="#818CF8" />
                </div>

                <div className="mt-4 pt-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: '#10B981' }}
                  />
                  <span className="text-xs font-medium" style={{ color: '#10B981' }}>All systems operational</span>
                </div>

                {systemHealth?.uptime != null && (
                  <div className="mt-2 flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>Uptime</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{systemHealth.uptime}%</span>
                  </div>
                )}
              </Card>

              {/* Recent Signups */}
              <Card title="Recent Signups" delay={0.32}
                action={
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded badge-primary">
                    {recentUsers?.data?.length ?? 0} new
                  </span>
                }
              >
                <div className="space-y-2">
                  {recentUsers?.data?.length ? (
                    recentUsers.data.slice(0, 5).map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-2.5 py-1.5 border-b last:border-b-0"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        {/* Avatar initial */}
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, #047857, #10B981)`,
                          }}
                        >
                          {(u.firstName?.[0] || u.email[0]).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {u.firstName
                              ? `${u.firstName} ${u.lastName || ''}`.trim()
                              : u.email.split('@')[0]}
                          </p>
                          <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                            {u.email}
                          </p>
                        </div>
                        <Globe className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs py-4" style={{ color: 'var(--text-muted)' }}>No users yet</p>
                  )}
                </div>
              </Card>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
