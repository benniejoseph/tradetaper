'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { 
  DollarSign, 
  Users, 
  TrendingUp,
  Download,
  CreditCard,
  Star,
  Gift,
  Calendar,
  BarChart3
} from 'lucide-react';
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';
import { adminApi } from '@/lib/api';
import { 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export default function SubscriptionsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const { data: subscriptionAnalytics } = useQuery({
    queryKey: ['subscription-analytics', timeRange],
    queryFn: () => adminApi.getSubscriptionAnalytics(timeRange),
    refetchInterval: 30000,
  });

  const { data: revenueAnalytics } = useQuery({
    queryKey: ['revenue-analytics', timeRange],
    queryFn: () => adminApi.getRevenueAnalytics(timeRange),
    refetchInterval: 30000,
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: adminApi.getDashboardStats,
    refetchInterval: 30000,
  });

  // Mock subscription data
  const mockSubscriptionData = subscriptionAnalytics?.subscriptionDistribution || [
    { plan: 'Free', count: 8500, revenue: 0, color: '#6B7280' },
    { plan: 'Pro', count: 4500, revenue: 135000, color: '#3B82F6' },
    { plan: 'Premium', count: 2234, revenue: 99567, color: '#8B5CF6' },
  ];

  const totalSubscribers = mockSubscriptionData.reduce((sum, plan) => sum + plan.count, 0);
  const totalRevenue = mockSubscriptionData.reduce((sum, plan) => sum + plan.revenue, 0);
  const averageRevenuePerUser = totalSubscribers > 0 ? totalRevenue / totalSubscribers : 0;

  // Mock monthly revenue data
  const monthlyRevenueData = [
    { month: 'Jan', revenue: 45000, subscribers: 850 },
    { month: 'Feb', revenue: 52000, subscribers: 920 },
    { month: 'Mar', revenue: 48000, subscribers: 890 },
    { month: 'Apr', revenue: 61000, subscribers: 1050 },
    { month: 'May', revenue: 58000, subscribers: 1020 },
    { month: 'Jun', revenue: 67000, subscribers: 1180 },
  ];

  const colors = ['#6B7280', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];

  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-6 h-6 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Subscription Analytics</h1>
                <p className="text-gray-400">Revenue insights and subscription management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Revenue Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatCurrency(dashboardStats?.totalRevenue || 0)}
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-green-400">
                  ↗ +{dashboardStats?.revenueGrowth || 0}% from last month
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
                  <p className="text-sm font-medium text-gray-400">Subscribers</p>
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
                  <p className="text-sm font-medium text-gray-400">Churn Rate</p>
                  <p className="text-2xl font-bold text-white mt-1">2.3%</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-red-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-red-400">
                  ↗ +0.5% from last month
                </div>
              </div>
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Revenue Trend</h3>
                <div className="flex items-center space-x-2 text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">+{dashboardStats?.revenueGrowth || 0}%</span>
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
            </motion.div>

            {/* Subscription Distribution */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Plan Distribution</h3>
                <div className="text-sm text-gray-400">{formatNumber(totalSubscribers)} total</div>
              </div>
              
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockSubscriptionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {mockSubscriptionData.map((entry, index) => (
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
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Plan Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-6">Subscription Plans</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mockSubscriptionData.map((plan, index) => (
                <motion.div
                  key={plan.plan}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="bg-gray-700/50 rounded-lg p-6 relative overflow-hidden"
                >
                  {plan.plan === 'Premium' && (
                    <div className="absolute top-4 right-4">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-2 rounded-lg ${
                      plan.plan === 'Free' ? 'bg-gray-500/10' :
                      plan.plan === 'Pro' ? 'bg-blue-500/10' : 'bg-purple-500/10'
                    }`}>
                      {plan.plan === 'Free' ? (
                        <Gift className={`w-5 h-5 ${
                          plan.plan === 'Free' ? 'text-gray-400' :
                          plan.plan === 'Pro' ? 'text-blue-400' : 'text-purple-400'
                        }`} />
                      ) : (
                        <CreditCard className={`w-5 h-5 ${
                          plan.plan === 'Free' ? 'text-gray-400' :
                          plan.plan === 'Pro' ? 'text-blue-400' : 'text-purple-400'
                        }`} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{plan.plan}</h4>
                      <p className="text-sm text-gray-400">
                        {plan.plan === 'Free' ? 'Basic features' :
                         plan.plan === 'Pro' ? 'Advanced features' : 'Premium features'}
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
                          plan.plan === 'Pro' ? 'bg-blue-400' : 'bg-purple-400'
                        }`}
                        style={{ width: `${(plan.count / totalSubscribers) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Monthly Revenue Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Monthly Revenue & Subscribers</h3>
              <div className="flex items-center space-x-2 text-blue-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Last 6 months</span>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
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
                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </main>
      </div>
    </div>
  );
} 