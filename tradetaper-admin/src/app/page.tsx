'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Download,
  Users,
  Activity as ActivityIcon,
  Eye,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  BarChart3,
  CreditCard,
  Gift,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { adminApi } from '@/lib/api';
import ClientTimeDisplay from '@/components/ClientTimeDisplay';

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const { data: analytics, isLoading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => adminApi.getDashboardStats(),
    refetchInterval: 30000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });

  const { data: userAnalytics, isLoading: userAnalyticsLoading } = useQuery({
    queryKey: ['user-analytics', timeRange],
    queryFn: () => adminApi.getUserAnalytics(timeRange),
    refetchInterval: 30000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });

  const { data: revenueAnalytics, isLoading: revenueAnalyticsLoading } = useQuery({
    queryKey: ['revenue-analytics', timeRange],
    queryFn: () => adminApi.getRevenueAnalytics(timeRange),
    refetchInterval: 30000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });

  const { data: systemHealth, isLoading: systemHealthLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => adminApi.getSystemHealth(),
    refetchInterval: 10000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });

  const { data: activityFeed, isLoading: activityFeedLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: () => adminApi.getActivityFeed(10),
    refetchInterval: 5000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });

  const { data: subscriptionAnalytics, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription-analytics', timeRange],
    queryFn: () => adminApi.getSubscriptionAnalytics(timeRange),
    refetchInterval: 60000,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 3;
    },
  });

  const performanceData = [
    { metric: 'Uptime', value: systemHealth?.uptime || 0, fullMark: 100 },
    { metric: 'Cache Hit', value: systemHealth?.cacheHitRate || 0, fullMark: 100 },
    { metric: 'Response', value: 100 - Math.min((systemHealth?.responseTime || 0) / 10, 100), fullMark: 100 },
    { metric: 'CPU Usage', value: 100 - (systemHealth?.cpuUsage || 0), fullMark: 100 },
    { metric: 'Memory', value: 100 - (systemHealth?.memoryUsage || 0), fullMark: 100 },
  ];

  const SkeletonCard = () => (
    <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gray-700/10 rounded-xl w-10 h-10" />
        <div className="w-12 h-4 bg-gray-700 rounded" />
      </div>
      <div className="h-8 w-24 bg-gray-700 rounded mb-1" />
      <div className="h-4 w-16 bg-gray-800 rounded" />
    </div>
  );

  const SkeletonChart = () => (
    <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 sm:p-6 animate-pulse">
      <div className="h-4 w-32 bg-gray-700 rounded mb-4" />
      <div className="h-[300px] sm:h-[350px] w-full bg-gray-800 rounded" />
    </div>
  );

  const handleRefresh = () => {
    refetchAnalytics();
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800/50 px-4 sm:px-6 py-4 sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Real-time analytics • Last updated <ClientTimeDisplay />
              </p>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
                className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-none"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>

              <button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-all shadow-lg hover:shadow-blue-500/25">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {analyticsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            ) : analyticsError ? (
              <div className="col-span-4 bg-red-900/40 border border-red-700/50 text-red-300 rounded-xl p-4 text-sm">
                Failed to load dashboard stats. Check backend connectivity.
              </div>
            ) : (
              <>
                {/* Total Users */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className={`flex items-center space-x-1 text-sm ${(analytics?.userGrowth ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(analytics?.userGrowth ?? 0) >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      <span>{analytics?.userGrowth ?? 0}%</span>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-1">{formatNumber(analytics?.totalUsers ?? 0)}</h3>
                  <p className="text-gray-400 text-sm">Total Users</p>
                </motion.div>

                {/* Active Users */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500/10 rounded-xl">
                      <Eye className="w-6 h-6 text-green-400" />
                    </div>
                    <div className={`flex items-center space-x-1 text-sm ${(analytics?.activeGrowth ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(analytics?.activeGrowth ?? 0) >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      <span>{analytics?.activeGrowth ?? 0}%</span>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-1">{formatNumber(analytics?.activeUsers ?? 0)}</h3>
                  <p className="text-gray-400 text-sm">Active Users</p>
                </motion.div>

                {/* Revenue */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl">
                      <DollarSign className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className={`flex items-center space-x-1 text-sm ${(analytics?.revenueGrowth ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(analytics?.revenueGrowth ?? 0) >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      <span>{analytics?.revenueGrowth ?? 0}%</span>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-1">${formatNumber(analytics?.totalRevenue ?? 0)}</h3>
                  <p className="text-gray-400 text-sm">Total Revenue</p>
                </motion.div>

                {/* Total Trades */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-500/10 rounded-xl">
                      <BarChart3 className="w-6 h-6 text-orange-400" />
                    </div>
                    <div className={`flex items-center space-x-1 text-sm ${(analytics?.tradeGrowth ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(analytics?.tradeGrowth ?? 0) >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      <span>{analytics?.tradeGrowth ?? 0}%</span>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-1">{formatNumber(analytics?.totalTrades ?? 0)}</h3>
                  <p className="text-gray-400 text-sm">Total Trades</p>
                </motion.div>
              </>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {userAnalyticsLoading ? (
              <SkeletonChart />
            ) : (
              <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
                <div className="h-[300px] sm:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userAnalytics?.data || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(17, 24, 39, 0.95)',
                          border: '1px solid rgba(75, 85, 99, 0.5)',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {revenueAnalyticsLoading ? (
              <SkeletonChart />
            ) : (
              <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Revenue</h3>
                <div className="h-[300px] sm:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueAnalytics?.data || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(17, 24, 39, 0.95)',
                          border: '1px solid rgba(75, 85, 99, 0.5)',
                          borderRadius: '0.5rem',
                        }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Activity Feed + System Health + Subscriptions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Activity Feed */}
            {activityFeedLoading ? (
              <div className="lg:col-span-1 bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 animate-pulse">
                <div className="h-4 w-32 bg-gray-700 rounded mb-4" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start space-x-3 p-3 mb-2">
                    <div className="w-8 h-8 bg-gray-700 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-full bg-gray-700 rounded" />
                      <div className="h-3 w-16 bg-gray-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {activityFeed && activityFeed.length > 0 ? (
                    activityFeed.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-800/50">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <ActivityIcon className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ActivityIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* System Health Radar */}
            {systemHealthLoading ? (
              <SkeletonChart />
            ) : (
              <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">System Health</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    systemHealth?.status === 'healthy' ? 'bg-green-500/10 text-green-400' :
                    systemHealth?.status === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {systemHealth?.status ?? 'Unknown'}
                  </span>
                </div>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={performanceData}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="metric" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis stroke="#374151" tick={false} />
                      <Radar name="Performance" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Response Time</p>
                    <p className="text-white font-semibold">{systemHealth?.responseTime ?? '—'}ms</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">Memory Usage</p>
                    <p className="text-white font-semibold">{systemHealth?.memoryUsage ?? '—'}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Distribution */}
            {subscriptionLoading ? (
              <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 animate-pulse">
                <div className="h-4 w-40 bg-gray-700 rounded mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 bg-gray-800 rounded-lg" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Subscription Plans</h3>
                {subscriptionAnalytics?.subscriptionDistribution && subscriptionAnalytics.subscriptionDistribution.length > 0 ? (
                  <div className="space-y-3">
                    {subscriptionAnalytics.subscriptionDistribution.map((plan, i) => {
                      const total = subscriptionAnalytics.subscriptionDistribution.reduce((s, p) => s + p.count, 0);
                      const pct = total > 0 ? Math.round((plan.count / total) * 100) : 0;
                      const colors = ['#6B7280', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];
                      return (
                        <div key={plan.plan} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {plan.plan === 'Free' ? (
                                <Gift className="w-4 h-4 text-gray-400" />
                              ) : (
                                <CreditCard className="w-4 h-4" style={{ color: colors[i % colors.length] }} />
                              )}
                              <span className="text-sm text-white">{plan.plan}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm text-white font-medium">{formatNumber(plan.count)}</span>
                              <span className="text-xs text-gray-500 ml-1">({pct}%)</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No subscription data</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
