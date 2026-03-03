'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import {
  CreditCard,
  Download,
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  BarChart3,
  PieChart,
  RefreshCw,
  Gift,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatNumber, formatCurrency } from '@/lib/utils';
import { adminApi } from '@/lib/api';

export default function RevenueManagementPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'revenue' | 'analytics'>('overview');

  const { data: revenueAnalytics, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-analytics', timeRange],
    queryFn: () => adminApi.getRevenueAnalytics(timeRange),
    refetchInterval: 30000,
  });

  const { data: subscriptionAnalytics, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription-analytics', timeRange],
    queryFn: () => adminApi.getSubscriptionAnalytics(timeRange),
    refetchInterval: 30000,
  });

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => adminApi.getDashboardStats(),
    refetchInterval: 30000,
  });

  const subscriptionPlans = subscriptionAnalytics?.subscriptionDistribution || [];
  const totalSubscribers = subscriptionPlans.reduce((sum, plan) => sum + plan.count, 0);
  const totalRevenue = subscriptionPlans.reduce((sum, plan) => sum + (plan.revenue || 0), 0);
  const paidSubscribers = subscriptionPlans
    .filter((p) => p.plan !== 'Free')
    .reduce((sum, p) => sum + p.count, 0);

  const planColors = ['#6B7280', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'];

  const StatCard = ({
    label,
    value,
    icon: Icon,
    iconColor,
    bgColor,
    growth,
    loading,
  }: {
    label: string;
    value: string | number;
    icon: any;
    iconColor: string;
    bgColor: string;
    growth?: number | null;
    loading?: boolean;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl"
    >
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="flex justify-between">
            <div className={`w-10 h-10 rounded-xl ${bgColor}`} />
            <div className="w-12 h-4 bg-gray-700 rounded" />
          </div>
          <div className="h-8 w-24 bg-gray-700 rounded" />
          <div className="h-3 w-16 bg-gray-800 rounded" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 ${bgColor} rounded-xl`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            {growth != null ? (
              <div className={`flex items-center space-x-1 text-sm ${growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                <TrendingUp className="w-4 h-4" />
                <span>{growth >= 0 ? '+' : ''}{growth}%</span>
              </div>
            ) : null}
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
          <p className="text-gray-400 text-sm">{label}</p>
        </>
      )}
    </motion.div>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800/50 px-4 sm:px-6 py-4 sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-6 h-6 text-green-400" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Revenue & Subscription Management
                </h1>
                <p className="text-gray-400 text-sm mt-1">Real billing, subscription, and revenue data</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
                className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 flex-1 sm:flex-none"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>

              <button className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all">
                <RefreshCw className="w-4 h-4" />
              </button>

              <button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-all shadow-lg">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-6 mt-4 border-b border-gray-800/50 overflow-x-auto">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'subscriptions', label: 'Subscriptions', icon: Users },
              { key: 'revenue', label: 'Revenue', icon: DollarSign },
              { key: 'analytics', label: 'Analytics', icon: PieChart },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center space-x-2 py-2 px-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-green-400 text-green-400'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  label="Total Revenue"
                  value={totalRevenue > 0 ? `$${formatNumber(totalRevenue)}` : '—'}
                  icon={DollarSign}
                  iconColor="text-green-400"
                  bgColor="bg-green-500/10"
                  growth={dashboardStats?.revenueGrowth}
                  loading={subscriptionLoading}
                />
                <StatCard
                  label="Total Subscribers"
                  value={totalSubscribers > 0 ? formatNumber(totalSubscribers) : '—'}
                  icon={Users}
                  iconColor="text-blue-400"
                  bgColor="bg-blue-500/10"
                  loading={subscriptionLoading}
                />
                <StatCard
                  label="Paid Subscribers"
                  value={paidSubscribers > 0 ? formatNumber(paidSubscribers) : '—'}
                  icon={CreditCard}
                  iconColor="text-purple-400"
                  bgColor="bg-purple-500/10"
                  loading={subscriptionLoading}
                />
                <StatCard
                  label="Total Trades"
                  value={dashboardStats?.totalTrades != null ? formatNumber(dashboardStats.totalTrades) : '—'}
                  icon={BarChart3}
                  iconColor="text-orange-400"
                  bgColor="bg-orange-500/10"
                  growth={dashboardStats?.tradeGrowth}
                  loading={statsLoading}
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Revenue Over Time</h3>
                  {revenueLoading ? (
                    <div className="h-[360px] bg-gray-800 animate-pulse rounded-lg" />
                  ) : revenueAnalytics?.data && revenueAnalytics.data.length > 0 ? (
                    <div className="h-[360px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueAnalytics.data}>
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
                  ) : (
                    <div className="h-[360px] flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>No revenue data for this period</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Subscription Distribution</h3>
                  {subscriptionLoading ? (
                    <div className="h-[360px] bg-gray-800 animate-pulse rounded-lg" />
                  ) : subscriptionPlans.length > 0 ? (
                    <div className="h-[360px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            dataKey="count"
                            data={subscriptionPlans}
                            cx="50%"
                            cy="50%"
                            outerRadius={130}
                            label={({ plan, count }) => `${plan}: ${formatNumber(count)}`}
                          >
                            {subscriptionPlans.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={planColors[index % planColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(17, 24, 39, 0.95)',
                              border: '1px solid rgba(75, 85, 99, 0.5)',
                              borderRadius: '0.5rem',
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[360px] flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <PieChart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>No subscription data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  label="Total Subscribers"
                  value={totalSubscribers > 0 ? formatNumber(totalSubscribers) : '—'}
                  icon={Users}
                  iconColor="text-blue-400"
                  bgColor="bg-blue-500/10"
                  loading={subscriptionLoading}
                />
                <StatCard
                  label="Paid Subscribers"
                  value={paidSubscribers > 0 ? formatNumber(paidSubscribers) : '—'}
                  icon={CreditCard}
                  iconColor="text-green-400"
                  bgColor="bg-green-500/10"
                  loading={subscriptionLoading}
                />
                <StatCard
                  label="Conversion Rate"
                  value={
                    totalSubscribers > 0 && paidSubscribers > 0
                      ? `${Math.round((paidSubscribers / totalSubscribers) * 100)}%`
                      : '—'
                  }
                  icon={AlertCircle}
                  iconColor="text-yellow-400"
                  bgColor="bg-yellow-500/10"
                  loading={subscriptionLoading}
                />
              </div>

              {/* Plan Breakdown Table */}
              <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Plan Breakdown</h3>
                {subscriptionLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-16 bg-gray-800 animate-pulse rounded-xl" />
                    ))}
                  </div>
                ) : subscriptionPlans.length > 0 ? (
                  <div className="space-y-4">
                    {subscriptionPlans.map((plan, index) => {
                      const pct = totalSubscribers > 0 ? Math.round((plan.count / totalSubscribers) * 100) : 0;
                      return (
                        <div key={plan.plan} className="bg-gray-800/50 rounded-xl p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${planColors[index % planColors.length]}20` }}>
                                {plan.plan === 'Free' ? (
                                  <Gift className="w-5 h-5" style={{ color: planColors[index % planColors.length] }} />
                                ) : (
                                  <CreditCard className="w-5 h-5" style={{ color: planColors[index % planColors.length] }} />
                                )}
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">{plan.plan}</h4>
                                {plan.price != null && (
                                  <p className="text-xs text-gray-400">${plan.price}/month</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-semibold">{formatNumber(plan.count)} users</p>
                              {plan.revenue != null && plan.revenue > 0 && (
                                <p className="text-sm text-gray-400">{formatCurrency(plan.revenue)} revenue</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: planColors[index % planColors.length],
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-400 w-10 text-right">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No subscription data available for this period</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Revenue Over Time</h3>
                {revenueLoading ? (
                  <div className="h-[420px] bg-gray-800 animate-pulse rounded-lg" />
                ) : revenueAnalytics?.data && revenueAnalytics.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={420}>
                    <AreaChart data={revenueAnalytics.data}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
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
                      <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="url(#revenueGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[420px] flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>No revenue data for the selected period</p>
                      <p className="text-sm mt-1">Try selecting a different time range</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Plan Distribution</h3>
                {subscriptionLoading ? (
                  <div className="h-[360px] bg-gray-800 animate-pulse rounded-lg" />
                ) : subscriptionPlans.length > 0 ? (
                  <ResponsiveContainer width="100%" height={360}>
                    <RechartsPieChart>
                      <Pie
                        data={subscriptionPlans}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={130}
                        paddingAngle={4}
                        dataKey="count"
                      >
                        {subscriptionPlans.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={planColors[index % planColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(17, 24, 39, 0.95)',
                          border: '1px solid rgba(75, 85, 99, 0.5)',
                          borderRadius: '0.5rem',
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[360px] flex items-center justify-center text-gray-500">
                    <p>No subscription data available</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
                {revenueLoading ? (
                  <div className="h-[360px] bg-gray-800 animate-pulse rounded-lg" />
                ) : revenueAnalytics?.data && revenueAnalytics.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={360}>
                    <AreaChart data={revenueAnalytics.data}>
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
                      <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[360px] flex items-center justify-center text-gray-500">
                    <p>No revenue data available</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}