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
import { downloadCsv } from '@/lib/csv';
import toast from 'react-hot-toast';

const PLAN_COLORS = [
  'var(--accent-neutral)',
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const ACTIVITY_COLORS: Record<string, string> = {
  trade_closed: 'var(--accent-success)',
  trade_created: 'var(--chart-4)',
  user_created: 'var(--chart-2)',
  subscription_changed: 'var(--accent-warning)',
};

/* ─── KPI Card ─────────────────────────────────────────── */
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
  icon: LucideIcon;
  color: string;
  growth?: number;
  delay?: number;
}) {
  const isPositive = growth == null || growth >= 0;
  const trendText = growth == null
    ? 'No trend data for selected range'
    : `${isPositive ? 'Up' : 'Down'} vs previous period`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.23, 1, 0.32, 1] }}
      className="admin-card dashboard-kpi-card"
    >
      <div className="dashboard-kpi-head items-start">
        <div className="dashboard-kpi-label-wrap">
          <div
            className="dashboard-kpi-icon"
            style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}
          >
            <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" style={{ color }} />
          </div>
          <p className="dashboard-kpi-label" style={{ color: 'var(--text-muted)' }}>
            {label}
          </p>
        </div>

        {growth != null && (
          <div
            className={`dashboard-kpi-trend flex items-center gap-0.5 flex-shrink-0 ${
              isPositive ? 'badge-success' : 'badge-danger'
            }`}
          >
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(growth)}%
          </div>
        )}
      </div>
      <p className="dashboard-kpi-value" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      <div className="dashboard-kpi-foot mt-auto border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <p className="dashboard-kpi-meta text-sm leading-snug">{trendText}</p>
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
      className={`admin-card dashboard-panel flex flex-col ${className}`}
    >
      <div className="dashboard-panel-head flex items-center justify-between flex-shrink-0 mb-4 sm:mb-5">
        <h3 className="admin-section-title">{title}</h3>
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
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  const {
    data: userAnalytics,
    isLoading: userLoading,
    isError: userError,
    refetch: refetchUserAnalytics,
  } = useQuery({
    queryKey: ['user-analytics', timeRange],
    queryFn: () => adminApi.getUserAnalytics(timeRange),
    refetchInterval: 60000,
    retry: 1,
    retryDelay: 750,
  });

  const {
    data: revenueAnalytics,
    isLoading: revenueLoading,
    isError: revenueError,
    refetch: refetchRevenueAnalytics,
  } = useQuery({
    queryKey: ['revenue-analytics', timeRange],
    queryFn: () => adminApi.getRevenueAnalytics(timeRange),
    refetchInterval: 60000,
    retry: 1,
    retryDelay: 750,
  });

  const {
    data: subscriptionAnalytics,
    isLoading: subLoading,
    isError: subError,
    refetch: refetchSubscriptionAnalytics,
  } = useQuery({
    queryKey: ['subscription-analytics', timeRange],
    queryFn: () => adminApi.getSubscriptionAnalytics(timeRange),
    refetchInterval: 60000,
    retry: 1,
    retryDelay: 750,
  });

  const {
    data: systemHealth,
    refetch: refetchSystemHealth,
  } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => adminApi.getSystemHealth(),
    refetchInterval: 30000,
  });

  const {
    data: activityFeed,
    isLoading: activityLoading,
    isError: activityError,
    refetch: refetchActivityFeed,
  } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: () => adminApi.getActivityFeed(20),
    refetchInterval: 15000,
    retry: 1,
    retryDelay: 750,
  });

  const {
    data: recentUsers,
    refetch: refetchRecentUsers,
  } = useQuery({
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

  const tooltipStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: 12,
  };

  const axisDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const isTimeRange = (value: string): value is TimeRange =>
    value === '7d' || value === '30d' || value === '90d' || value === '1y';

  const kpiCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers != null ? formatNumber(stats.totalUsers) : '—',
      icon: Users,
      color: 'var(--chart-1)',
      growth: stats?.userGrowth,
    },
    {
      label: 'Active Users',
      value: stats?.activeUsers != null ? formatNumber(stats.activeUsers) : '—',
      icon: Activity,
      color: 'var(--chart-4)',
      growth: stats?.activeGrowth,
    },
    {
      label: 'Total Trades',
      value: stats?.totalTrades != null ? formatNumber(stats.totalTrades) : '—',
      icon: BarChart3,
      color: 'var(--chart-3)',
      growth: stats?.tradeGrowth,
    },
    {
      label: 'Paid Subscribers',
      value: subscriptionAnalytics ? formatNumber(paidUsers) : '—',
      icon: CreditCard,
      color: 'var(--chart-2)',
    },
    {
      label: 'Total Revenue',
      value: stats?.totalRevenue != null ? `$${formatNumber(stats.totalRevenue)}` : '—',
      icon: DollarSign,
      color: 'var(--chart-4)',
      growth: stats?.revenueGrowth,
    },
    {
      label: 'Avg Trades/User',
      value: stats?.avgTradesPerUser != null ? stats.avgTradesPerUser.toFixed(2) : '—',
      icon: TrendingUp,
      color: 'var(--chart-5)',
    },
  ];

  const hasUserTrendData = (userAnalytics?.data?.length ?? 0) > 0;
  const hasRevenueTrendData = (revenueAnalytics?.data ?? []).some(
    (entry) => Number(entry.revenue ?? 0) > 0,
  );

  const refreshDashboard = async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      const results = await Promise.allSettled([
        refetchStats(),
        refetchUserAnalytics(),
        refetchRevenueAnalytics(),
        refetchSubscriptionAnalytics(),
        refetchSystemHealth(),
        refetchActivityFeed(),
        refetchRecentUsers(),
      ]);

      const failed = results.filter((result) => {
        if (result.status === 'rejected') {
          return true;
        }
        return Boolean(result.value.error);
      }).length;

      if (failed === 0) {
        toast.success('Dashboard refreshed');
      } else {
        toast.error(`Refreshed with ${failed} data source issue${failed > 1 ? 's' : ''}`);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportDashboard = () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);
    try {
      const headers = ['section', 'metric', 'value', 'context'];
      const rows: Array<Array<unknown>> = [];
      const exportDate = new Date().toISOString();

      rows.push(['meta', 'generated_at', exportDate, '']);
      rows.push(['meta', 'time_range', timeRange, '']);

      kpiCards.forEach((card) => {
        rows.push(['kpi', card.label, card.value, card.growth != null ? `${card.growth}%` : '']);
      });

      (userAnalytics?.data ?? []).forEach((entry) => {
        rows.push(['trend_users', entry.date, entry.users ?? 0, 'daily']);
      });

      (revenueAnalytics?.data ?? []).forEach((entry) => {
        rows.push(['trend_revenue', entry.date, entry.revenue ?? 0, 'daily']);
      });

      plans.forEach((plan) => {
        rows.push(['plans', plan.plan, plan.count, plan.revenue]);
      });

      if (systemHealth) {
        rows.push(['system', 'status', systemHealth.status, '']);
        rows.push(['system', 'response_time_ms', systemHealth.responseTime, '']);
        rows.push(['system', 'cpu_usage_pct', systemHealth.cpuUsage, '']);
        rows.push(['system', 'memory_usage_pct', systemHealth.memoryUsage, '']);
        rows.push(['system', 'cache_hit_pct', systemHealth.cacheHitRate, '']);
        rows.push(['system', 'uptime_pct', systemHealth.uptime, '']);
      }

      (activityFeed ?? []).forEach((item) => {
        rows.push(['activity', item.type, item.description, item.timestamp]);
      });

      const datePart = exportDate.slice(0, 10);
      downloadCsv(`dashboard-${timeRange}-${datePart}.csv`, headers, rows);
      toast.success('Dashboard CSV exported');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* ── Header ── */}
        <header className="admin-page-header dashboard-header">
          <div className="dashboard-shell dashboard-header-shell flex flex-wrap items-start justify-between gap-4 sm:gap-5">
            <div className="dashboard-title-wrap max-w-2xl">
              <h1 className="admin-page-title">Dashboard</h1>
              <p className="admin-page-subtitle">
                Platform overview and operations health
              </p>
            </div>

            <div className="dashboard-header-actions w-full sm:w-auto">
              <select
                value={timeRange}
                onChange={(e) => {
                  const next = e.target.value;
                  if (isTimeRange(next)) {
                    setTimeRange(next);
                  }
                }}
                className="admin-select dashboard-range-select min-w-[160px] flex-1 sm:flex-none"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button
                className="admin-btn-secondary"
                onClick={refreshDashboard}
                title="Refresh"
                aria-label="Refresh dashboard"
                type="button"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                className="admin-btn-primary"
                type="button"
                onClick={exportDashboard}
                disabled={isExporting}
              >
                <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-pulse' : ''}`} />
                <span>{isExporting ? 'Exporting...' : 'Export'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── Main ── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden admin-page-main dashboard-main">
          <div className="dashboard-shell admin-page-stack dashboard-main-stack">

            {/* Error banner */}
            {(statsError || userError || revenueError || subError || activityError) && (
              <div
                className="rounded-lg border px-4 py-3 text-sm sm:text-[15px]"
                style={{
                  background: 'var(--accent-warning-subtle)',
                  borderColor: 'var(--accent-warning-muted)',
                  color: 'var(--accent-warning)',
                }}
              >
                Some dashboard data could not be loaded. Retrying automatically.
              </div>
            )}

            {/* ── KPI cards ── */}
            <div className="dashboard-kpi-grid">
              {showKpiSkeleton
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="admin-card dashboard-kpi-card animate-pulse">
                      <div className="h-3 w-20 rounded mb-3" style={{ background: 'var(--bg-muted)' }} />
                      <div className="h-8 w-24 rounded" style={{ background: 'var(--bg-muted)' }} />
                    </div>
                  ))
                : kpiCards.map((card, i) => (
                    <KpiCard key={card.label} {...card} delay={i * 0.04} />
                  ))}
            </div>

            {/* ── Row 3: User Growth (full width) ── */}
            <Card title="User Growth" delay={0.12}>
              {userLoading ? (
                <div className="dashboard-chart-lg mt-1 rounded-lg animate-pulse" style={{ background: 'var(--bg-muted)' }} />
              ) : !hasUserTrendData ? (
                <div
                  className="dashboard-empty-state dashboard-chart-md mt-1 rounded-lg border border-dashed flex items-center justify-center text-sm"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
                >
                  No user growth events for this range
                </div>
              ) : (
                <div className="dashboard-chart-lg mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userAnalytics?.data || []}>
                      <defs>
                        <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="var(--chart-1)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="var(--text-muted)"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={axisDate}
                        minTickGap={28}
                        tickMargin={8}
                      />
                      <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={32} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--border-default)', strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="users" stroke="var(--chart-1)" fill="url(#ug)" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* ── Row 4: Revenue (full width) ── */}
            <Card title="Revenue" delay={0.16}>
              {revenueLoading ? (
                <div className="dashboard-chart-md mt-1 rounded-lg animate-pulse" style={{ background: 'var(--bg-muted)' }} />
              ) : !hasRevenueTrendData ? (
                <div
                  className="dashboard-empty-state dashboard-chart-sm mt-1 rounded-lg border border-dashed flex items-center justify-center text-sm"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}
                >
                  No revenue captured in this period
                </div>
              ) : (
                <div className="dashboard-chart-md mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueAnalytics?.data || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="var(--text-muted)"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={axisDate}
                        minTickGap={28}
                        tickMargin={8}
                      />
                      <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={32} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'var(--border-default)', strokeWidth: 1 }} />
                      <Line type="monotone" dataKey="revenue" stroke="var(--chart-4)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* ── Row 5: Bottom 4-col grid ── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-7">

              {/* Live Activity */}
              <Card title="Live Activity" delay={0.2}>
                <div className="overflow-y-auto pr-1" style={{ maxHeight: 380 }}>
                  {activityLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2.5 py-3 animate-pulse">
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
                            className="flex items-start gap-2.5 py-4 border-b last:border-b-0"
                            style={{ borderColor: 'var(--border-subtle)' }}
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                              style={{ background: ACTIVITY_COLORS[a.type] || 'var(--accent-neutral)' }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm sm:text-[15px] leading-snug" style={{ color: 'var(--text-primary)' }}>
                                {a.description}
                              </p>
                              <p className="text-xs sm:text-sm mt-1.5 font-mono" style={{ color: 'var(--text-muted)' }}>
                                {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))
                      : (
                          <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>No recent activity</p>
                        )}
                </div>
              </Card>

              {/* Subscription Plans */}
              <Card title="Subscription Plans" delay={0.24}>
                {subLoading ? (
                  <div className="h-[280px] rounded-lg animate-pulse" style={{ background: 'var(--bg-muted)' }} />
                ) : plans.length ? (
                  <>
                    <div className="h-[200px]">
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
                    <div className="admin-list-stack-tight mt-3">
                      {plans.map((p, i: number) => (
                        <div key={p.plan} className="flex items-center justify-between text-sm">
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
                  <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>No subscription data</p>
                )}
              </Card>

              {/* System Health */}
              <Card title="System Health" delay={0.28}>
                <div className="admin-list-stack">
                  <ProgressBar label="Response Time" value={systemHealth?.responseTime} unit="ms" color="var(--chart-1)" />
                  <ProgressBar label="CPU Usage"     value={systemHealth?.cpuUsage}     unit="%" color="var(--chart-4)" />
                  <ProgressBar label="Memory"        value={systemHealth?.memoryUsage}   unit="%" color="var(--chart-3)" />
                  <ProgressBar label="Cache Hit"     value={systemHealth?.cacheHitRate}  unit="%" color="var(--chart-2)" />
                </div>

                <div className="mt-4 pt-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: 'var(--accent-success)' }}
                  />
                  <span className="text-sm font-medium" style={{ color: 'var(--accent-success)' }}>All systems operational</span>
                </div>

                {systemHealth?.uptime != null && (
                  <div className="mt-2 flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
                    <span>Uptime</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{systemHealth.uptime}%</span>
                  </div>
                )}
              </Card>

              {/* Recent Signups */}
              <Card title="Recent Signups" delay={0.32}
                action={
                  <span className="text-sm font-semibold px-2 py-1 rounded badge-primary">
                    {recentUsers?.data?.length ?? 0} new
                  </span>
                }
              >
                <div className="space-y-0 overflow-y-auto pr-1" style={{ maxHeight: 380 }}>
                  {recentUsers?.data?.length ? (
                    recentUsers.data.slice(0, 5).map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 py-3 border-b last:border-b-0"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        {/* Avatar initial */}
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                          style={{
                            background: 'var(--gradient-brand)',
                          }}
                        >
                          {(u.firstName?.[0] || u.email[0]).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {u.firstName
                              ? `${u.firstName} ${u.lastName || ''}`.trim()
                              : u.email.split('@')[0]}
                          </p>
                          <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                            {u.email}
                          </p>
                        </div>
                        <Globe className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>No users yet</p>
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
