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
  PieChart
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
  Cell
} from 'recharts';
import { formatNumber } from '@/lib/utils';
import { adminApi } from '@/lib/api';

export default function BillingPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'revenue' | 'analytics'>('overview');

  // Fetch data
  const { data: revenueAnalytics } = useQuery({
    queryKey: ['revenue-analytics', timeRange],
    queryFn: () => adminApi.getRevenueAnalytics(timeRange),
    refetchInterval: 30000,
  });

  // Additional data queries can be added here as needed
  // const { data: subscriptionAnalytics } = useQuery({
  //   queryKey: ['subscription-analytics', timeRange],
  //   queryFn: () => adminApi.getSubscriptionAnalytics(timeRange),
  //   refetchInterval: 30000,
  // });

  // const { data: dashboardStats } = useQuery({
  //   queryKey: ['dashboard-stats'],
  //   queryFn: adminApi.getDashboardStats,
  //   refetchInterval: 30000,
  // });

  // Mock advanced billing data
  const billingStats = {
    mrr: 45750,
    arr: 549000,
    churnRate: 3.2,
    ltv: 1890,
    avgRevenuePerUser: 24.50,
    conversionRate: 15.8,
    trialToConversion: 22.3,
    revenueGrowth: 12.5,
  };

  const subscriptionPlans = [
    { name: 'Free', users: 8500, revenue: 0, color: '#6B7280' },
    { name: 'Starter', users: 2340, revenue: 28080, color: '#3B82F6' },
    { name: 'Professional', users: 1890, revenue: 75600, color: '#10B981' },
    { name: 'Enterprise', users: 456, revenue: 91200, color: '#8B5CF6' },
  ];

  const recentTransactions = [
    { id: '1', user: 'John Doe', plan: 'Professional', amount: 49.99, status: 'paid', date: '2024-01-15' },
    { id: '2', user: 'Jane Smith', plan: 'Starter', amount: 19.99, status: 'paid', date: '2024-01-15' },
    { id: '3', user: 'Bob Johnson', plan: 'Enterprise', amount: 199.99, status: 'failed', date: '2024-01-14' },
    { id: '4', user: 'Alice Wilson', plan: 'Professional', amount: 49.99, status: 'pending', date: '2024-01-14' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-400 bg-green-500/10';
      case 'pending': return 'text-yellow-400 bg-yellow-500/10';
      case 'failed': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

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
                  Subscription & Billing Management
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Revenue analytics, subscription management, and billing insights
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
                className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent flex-1 sm:flex-none"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              
              <button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-all shadow-lg hover:shadow-green-500/25">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-6 mt-4 border-b border-gray-800/50">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'subscriptions', label: 'Subscriptions', icon: Users },
              { key: 'revenue', label: 'Revenue', icon: DollarSign },
              { key: 'analytics', label: 'Analytics', icon: PieChart },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'overview' | 'subscriptions' | 'revenue' | 'analytics')}
                className={`flex items-center space-x-2 py-2 px-4 text-sm font-medium border-b-2 transition-all ${
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

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* MRR */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500/10 rounded-xl">
                      <DollarSign className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-green-400">
                      <TrendingUp className="w-4 h-4" />
                      <span>+{billingStats.revenueGrowth}%</span>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-1">${formatNumber(billingStats.mrr)}</h3>
                  <p className="text-gray-400 text-sm">Monthly Recurring Revenue</p>
                </motion.div>

                {/* ARR */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <BarChart3 className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-green-400">
                      <TrendingUp className="w-4 h-4" />
                      <span>+18.2%</span>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-1">${formatNumber(billingStats.arr)}</h3>
                  <p className="text-gray-400 text-sm">Annual Recurring Revenue</p>
                </motion.div>

                {/* Churn Rate */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-red-500/10 rounded-xl">
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-red-400">
                      <span>-0.8%</span>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-1">{billingStats.churnRate}%</h3>
                  <p className="text-gray-400 text-sm">Churn Rate</p>
                </motion.div>

                {/* LTV */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl">
                      <Users className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-green-400">
                      <TrendingUp className="w-4 h-4" />
                      <span>+5.2%</span>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-1">${formatNumber(billingStats.ltv)}</h3>
                  <p className="text-gray-400 text-sm">Customer LTV</p>
                </motion.div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Revenue Chart */}
                <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Revenue Growth</h3>
                  <div className="h-[300px] sm:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueAnalytics?.data || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(17, 24, 39, 0.9)',
                            border: '1px solid rgba(75, 85, 99, 0.5)',
                            borderRadius: '0.5rem',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10B981"
                          fill="#10B981"
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Subscription Distribution */}
                <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Subscription Distribution</h3>
                  <div className="h-[300px] sm:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          dataKey="users"
                          data={subscriptionPlans}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          label={({ name, users }) => `${name}: ${users}`}
                        >
                          {subscriptionPlans.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'subscriptions' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscription Plans */}
              <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Subscription Plans</h3>
                <div className="space-y-4">
                  {subscriptionPlans.map((plan) => (
                    <div key={plan.name} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }}></div>
                        <div>
                          <h4 className="font-medium text-white">{plan.name}</h4>
                          <p className="text-sm text-gray-400">{formatNumber(plan.users)} users</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">${formatNumber(plan.revenue)}</p>
                        <p className="text-sm text-gray-400">monthly</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Recent Transactions</h3>
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div>
                        <p className="font-medium text-white">{transaction.user}</p>
                        <p className="text-sm text-gray-400">{transaction.plan}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">${transaction.amount}</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Similar tabs for revenue and analytics would be implemented here */}
        </main>
      </div>
    </div>
  );
}