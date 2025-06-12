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
  Calendar,
  Star,
  Gift,
  RefreshCw
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
  BarChart,
  Bar
} from 'recharts';
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';
import { adminApi } from '@/lib/api';

export default function RevenueManagementPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'revenue' | 'analytics' | 'transactions'>('overview');

  // Fetch data
  const { data: revenueAnalytics } = useQuery({
    queryKey: ['revenue-analytics', timeRange],
    queryFn: () => adminApi.getRevenueAnalytics(timeRange),
    refetchInterval: 30000,
  });

  const { data: subscriptionAnalytics } = useQuery({
    queryKey: ['subscription-analytics', timeRange],
    queryFn: () => adminApi.getSubscriptionAnalytics(timeRange),
    refetchInterval: 30000,
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: adminApi.getDashboardStats,
    refetchInterval: 30000,
  });

  // Enhanced billing and subscription data
  const billingStats = {
    mrr: 45750,
    arr: 549000,
    churnRate: 3.2,
    ltv: 1890,
    avgRevenuePerUser: 24.50,
    conversionRate: 15.8,
    trialToConversion: 22.3,
    revenueGrowth: dashboardStats?.revenueGrowth || 12.5,
    totalSubscribers: 13186,
    paidSubscribers: 4686,
    freeUsers: 8500,
  };

  const subscriptionPlans = subscriptionAnalytics?.subscriptionDistribution || [
    { plan: 'Free', count: 8500, revenue: 0, color: '#6B7280', price: 0 },
    { plan: 'Starter', count: 2340, revenue: 28080, color: '#3B82F6', price: 12 },
    { plan: 'Professional', count: 1890, revenue: 75600, color: '#10B981', price: 40 },
    { plan: 'Enterprise', count: 456, revenue: 91200, color: '#8B5CF6', price: 200 },
  ];

  const monthlyRevenueData = [
    { month: 'Jan', revenue: 45000, subscribers: 850, mrr: 42000 },
    { month: 'Feb', revenue: 52000, subscribers: 920, mrr: 48000 },
    { month: 'Mar', revenue: 48000, subscribers: 890, mrr: 45000 },
    { month: 'Apr', revenue: 61000, subscribers: 1050, mrr: 58000 },
    { month: 'May', revenue: 58000, subscribers: 1020, mrr: 55000 },
    { month: 'Jun', revenue: 67000, subscribers: 1180, mrr: 63000 },
  ];

  const recentTransactions = [
    { id: '1', user: 'John Doe', plan: 'Professional', amount: 49.99, status: 'paid', date: '2024-01-15', email: 'john@example.com' },
    { id: '2', user: 'Jane Smith', plan: 'Starter', amount: 19.99, status: 'paid', date: '2024-01-15', email: 'jane@example.com' },
    { id: '3', user: 'Bob Johnson', plan: 'Enterprise', amount: 199.99, status: 'failed', date: '2024-01-14', email: 'bob@example.com' },
    { id: '4', user: 'Alice Wilson', plan: 'Professional', amount: 49.99, status: 'pending', date: '2024-01-14', email: 'alice@example.com' },
    { id: '5', user: 'Charlie Brown', plan: 'Starter', amount: 19.99, status: 'paid', date: '2024-01-13', email: 'charlie@example.com' },
  ];

  const totalSubscribers = subscriptionPlans.reduce((sum, plan) => sum + plan.count, 0);
  const totalRevenue = subscriptionPlans.reduce((sum, plan) => sum + plan.revenue, 0);
  const averageRevenuePerUser = totalSubscribers > 0 ? totalRevenue / totalSubscribers : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-400 bg-green-500/10';
      case 'pending': return 'text-yellow-400 bg-yellow-500/10';
      case 'failed': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const colors = ['#6B7280', '#3B82F6', '#10B981', '#8B5CF6'];

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
                <p className="text-gray-400 text-sm mt-1">
                  Comprehensive billing, subscriptions, and revenue analytics
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
              
              <button className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all">
                <RefreshCw className="w-4 h-4" />
              </button>
              
              <button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-all shadow-lg hover:shadow-green-500/25">
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
              { key: 'transactions', label: 'Transactions', icon: CreditCard },
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
                      <AreaChart data={revenueAnalytics?.data || monthlyRevenueData}>
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
                          dataKey="count"
                          data={subscriptionPlans}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          label={({ plan, count }) => `${plan}: ${count}`}
                        >
                          {subscriptionPlans.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index]} />
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
            <div className="space-y-6">
              {/* Subscription Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total Subscribers</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {formatNumber(totalSubscribers)}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-xs text-green-400">
                      ↗ +8.3% from last month
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Paid Subscribers</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {formatNumber(billingStats.paidSubscribers)}
                      </p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <CreditCard className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-xs text-green-400">
                      ↗ +12.5% from last month
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">ARPU</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {formatCurrency(averageRevenuePerUser)}
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-500/10 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-yellow-400" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-xs text-green-400">
                      ↗ +12.5% from last month
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Conversion Rate</p>
                      <p className="text-2xl font-bold text-white mt-1">{billingStats.conversionRate}%</p>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-xs text-green-400">
                      ↗ +2.1% from last month
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Subscription Plans */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {subscriptionPlans.map((plan, index) => (
                  <motion.div
                    key={plan.plan}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="bg-gray-700/50 rounded-lg p-6 relative overflow-hidden"
                  >
                    {plan.plan === 'Enterprise' && (
                      <div className="absolute top-4 right-4">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`p-2 rounded-lg ${
                        plan.plan === 'Free' ? 'bg-gray-500/10' :
                        plan.plan === 'Starter' ? 'bg-blue-500/10' :
                        plan.plan === 'Professional' ? 'bg-green-500/10' : 'bg-purple-500/10'
                      }`}>
                        {plan.plan === 'Free' ? (
                          <Gift className="w-5 h-5 text-gray-400" />
                        ) : (
                          <CreditCard className={`w-5 h-5 ${
                            plan.plan === 'Starter' ? 'text-blue-400' :
                            plan.plan === 'Professional' ? 'text-green-400' : 'text-purple-400'
                          }`} />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{plan.plan}</h4>
                        <p className="text-sm text-gray-400">
                          ${plan.price}/month
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Subscribers</span>
                        <span className="text-white font-medium">{formatNumber(plan.count)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Revenue</span>
                        <span className="text-white font-medium">{formatCurrency(plan.revenue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Share</span>
                        <span className="text-white font-medium">
                          {formatPercentage((plan.count / totalSubscribers) * 100)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            plan.plan === 'Free' ? 'bg-gray-400' :
                            plan.plan === 'Starter' ? 'bg-blue-400' :
                            plan.plan === 'Professional' ? 'bg-green-400' : 'bg-purple-400'
                          }`}
                          style={{ width: `${(plan.count / totalSubscribers) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'revenue' && (
            <div className="space-y-6">
              {/* Monthly Revenue Breakdown */}
              <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Monthly Revenue & MRR</h3>
                  <div className="flex items-center space-x-2 text-blue-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Last 6 months</span>
                  </div>
                </div>
                
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }} 
                    />
                    <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} name="Total Revenue" />
                    <Bar dataKey="mrr" fill="#3B82F6" radius={[4, 4, 0, 0]} name="MRR" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6">
              {/* Recent Transactions */}
              <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Recent Transactions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Plan</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map((transaction, index) => (
                        <motion.tr
                          key={transaction.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-white">{transaction.user}</p>
                              <p className="text-sm text-gray-400">{transaction.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-white">{transaction.plan}</td>
                          <td className="text-right py-3 px-4 text-white font-medium">
                            ${transaction.amount}
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="text-right py-3 px-4 text-gray-300">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Revenue Trend</h3>
                  <div className="flex items-center space-x-2 text-green-400">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">+{billingStats.revenueGrowth}%</span>
                  </div>
                </div>
                
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueAnalytics?.data || monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10B981" 
                      fill="url(#revenueGradient)" 
                      strokeWidth={2}
                    />
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Plan Distribution */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Plan Distribution</h3>
                  <div className="text-sm text-gray-400">{formatNumber(totalSubscribers)} total</div>
                </div>
                
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={subscriptionPlans}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {subscriptionPlans.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}