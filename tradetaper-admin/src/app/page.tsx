'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import StatsCards from '@/components/StatsCards';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  Download,
  Users,
  TrendingUp,
  Activity as ActivityIcon,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatNumber, timeAgo } from '@/lib/utils';
import { adminApi } from '@/lib/api';

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Fetch real data from API
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: adminApi.getDashboardStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: userAnalytics } = useQuery({
    queryKey: ['user-analytics', timeRange],
    queryFn: () => adminApi.getUserAnalytics(timeRange),
    refetchInterval: 30000,
  });

  const { data: revenueAnalytics } = useQuery({
    queryKey: ['revenue-analytics', timeRange],
    queryFn: () => adminApi.getRevenueAnalytics(timeRange),
    refetchInterval: 30000,
  });

  const { data: tradeAnalytics } = useQuery({
    queryKey: ['trade-analytics', timeRange],
    queryFn: () => adminApi.getTradeAnalytics(timeRange),
    refetchInterval: 30000,
  });

  const { data: systemHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: adminApi.getSystemHealth,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const { data: activityFeed } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: () => adminApi.getActivityFeed(5), // Get 5 recent activities
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertCircle;
      case 'critical': return XCircle;
      default: return AlertCircle;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-400">Welcome to TradeTaper Admin Panel</p>
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

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats Cards */}
          <StatsCards 
            stats={{
              totalUsers: analytics?.totalUsers || 0,
              activeUsers: analytics?.activeUsers || 0,
              totalRevenue: analytics?.totalRevenue || 0,
              totalTrades: analytics?.totalTrades || 0,
              userGrowth: analytics?.userGrowth || 0,
              revenueGrowth: analytics?.revenueGrowth || 0,
              tradeGrowth: analytics?.tradeGrowth || 0,
              activeGrowth: analytics?.activeGrowth || 0,
            }}
            loading={analyticsLoading}
          />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Revenue Trend</h3>
                <div className="flex items-center space-x-2 text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">+{analytics?.revenueGrowth || 0}%</span>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueAnalytics?.dailyStats || []}>
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
                    stroke="#3B82F6" 
                    fill="url(#revenueGradient)" 
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* User Activity Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">User Activity</h3>
                <div className="flex items-center space-x-2 text-blue-400">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{formatNumber(analytics?.activeUsers || 0)} active</span>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userAnalytics?.dailyStats || []}>
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
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="signups" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* System Health */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">System Health</h3>
                {systemHealth && (
                  <div className={`flex items-center space-x-2 ${getStatusColor(systemHealth.status)}`}>
                    {(() => {
                      const StatusIcon = getStatusIcon(systemHealth.status);
                      return <StatusIcon className="w-4 h-4" />;
                    })()}
                    <span className="text-sm capitalize">{systemHealth.status}</span>
                  </div>
                )}
              </div>
              
              {systemHealth && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Uptime</span>
                    <span className="text-white font-medium">{systemHealth.uptime}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Response Time</span>
                    <span className="text-white font-medium">{systemHealth.responseTime}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">CPU Usage</span>
                    <span className="text-white font-medium">{systemHealth.cpuUsage}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Memory Usage</span>
                    <span className="text-white font-medium">{systemHealth.memoryUsage}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">API Calls (24h)</span>
                    <span className="text-white font-medium">{formatNumber(systemHealth.apiCalls24h)}</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Top Trading Pairs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-6">Top Trading Pairs</h3>
              
              <div className="space-y-4">
                {tradeAnalytics?.topTradingPairs?.slice(0, 4).map((pair) => (
                  <div key={pair.pair} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-white font-medium">{pair.pair}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{formatNumber(pair.count)}</div>
                      <div className="text-xs text-gray-400">${formatNumber(pair.volume / 1000000)}M</div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-4 text-gray-400">
                    No trading data available
                  </div>
                )}
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                <ActivityIcon className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {activityFeed?.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.userName} • {timeAgo(new Date(activity.timestamp))}
                      </p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-4 text-gray-400">
                    No recent activity
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
