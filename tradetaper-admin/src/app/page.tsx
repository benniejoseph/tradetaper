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
  Radar
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
  ShoppingCart
} from 'lucide-react';
import { formatNumber, timeAgo } from '@/lib/utils';
import { adminApi } from '@/lib/api';

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Fetch real data from API
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => adminApi.getDashboardStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: userAnalytics, isLoading: userAnalyticsLoading, error: userAnalyticsError } = useQuery({
    queryKey: ['user-analytics', timeRange],
    queryFn: () => adminApi.getUserAnalytics(timeRange),
    refetchInterval: 30000,
  });

  const { data: revenueAnalytics, isLoading: revenueAnalyticsLoading, error: revenueAnalyticsError } = useQuery({
    queryKey: ['revenue-analytics', timeRange],
    queryFn: () => adminApi.getRevenueAnalytics(timeRange),
    refetchInterval: 30000,
  });

  const { data: systemHealth, isLoading: systemHealthLoading, error: systemHealthError } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => adminApi.getSystemHealth(),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const { data: activityFeed, isLoading: activityFeedLoading, error: activityFeedError } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: () => adminApi.getActivityFeed(5), // Get 5 recent activities
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Performance metrics for radar chart
  const performanceData = [
    { metric: 'Uptime', value: systemHealth?.uptime || 0, fullMark: 100 },
    { metric: 'Cache Hit', value: systemHealth?.cacheHitRate || 0, fullMark: 100 },
    { metric: 'Response', value: 100 - (systemHealth?.responseTime || 0) / 10, fullMark: 100 },
    { metric: 'CPU Usage', value: 100 - (systemHealth?.cpuUsage || 0), fullMark: 100 },
    { metric: 'Memory', value: 100 - (systemHealth?.memoryUsage || 0), fullMark: 100 },
  ];

  // Skeleton Card
  const SkeletonCard = () => (
    <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gray-700/10 rounded-xl w-10 h-10" />
        <div className="w-12 h-4 bg-gray-700 rounded" />
      </div>
      <div className="h-8 w-24 bg-gray-700 rounded mb-1" />
      <div className="h-4 w-16 bg-gray-800 rounded mb-2" />
      <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 w-1/2"></div>
      </div>
    </div>
  );

  // Skeleton Chart
  const SkeletonChart = () => (
    <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 sm:p-6 animate-pulse">
      <div className="h-[300px] sm:h-[400px] w-full bg-gray-800 rounded" />
    </div>
  );

  // Error Message
  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="bg-red-900/80 border border-red-700 text-red-200 rounded-lg p-4 my-2">
      <span className="font-bold">Error:</span> {message}
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="flex-1 overflow-hidden">
        {/* Header with Glassmorphism */}
        <header className="bg-gray-900/50 backdrop-blur-xl border-b border-gray-800/50 px-4 sm:px-6 py-4 sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Real-time analytics and insights • Last updated {new Date().toLocaleTimeString()}
              </p>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <button className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all">
                <RefreshCw className="w-4 h-4" />
              </button>
              
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
                className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-1 sm:flex-none"
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
        <main className="flex-1 scrollable-content p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {analyticsLoading
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
              : analyticsError
                ? <ErrorMessage message="Failed to load dashboard stats." />
                : (
                  <>
                    {/* Total Users Card */}
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
                        <div className={`flex items-center space-x-1 text-sm ${(analytics?.userGrowth ?? 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(analytics?.userGrowth ?? 0) > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          <span>{analytics?.userGrowth || 0}%</span>
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-1">{formatNumber(analytics?.totalUsers || 0)}</h3>
                      <p className="text-gray-400 text-sm">Total Users</p>
                      <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400" style={{ width: '75%' }}></div>
                      </div>
                    </motion.div>

                    {/* Active Users Card */}
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
                        <div className={`flex items-center space-x-1 text-sm ${(analytics?.activeGrowth ?? 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(analytics?.activeGrowth ?? 0) > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          <span>{analytics?.activeGrowth || 0}%</span>
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-1">{formatNumber(analytics?.activeUsers || 0)}</h3>
                      <p className="text-gray-400 text-sm">Active Users</p>
                      <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-green-400" style={{ width: '65%' }}></div>
                      </div>
                    </motion.div>

                    {/* Revenue Card */}
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
                        <div className={`flex items-center space-x-1 text-sm ${(analytics?.revenueGrowth ?? 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(analytics?.revenueGrowth ?? 0) > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          <span>{analytics?.revenueGrowth ?? 0}%</span>
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-1">${formatNumber(analytics?.totalRevenue || 0)}</h3>
                      <p className="text-gray-400 text-sm">Total Revenue</p>
                      <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400" style={{ width: '85%' }}></div>
                      </div>
                    </motion.div>

                    {/* Total Trades Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-xl"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-500/10 rounded-xl">
                          <ShoppingCart className="w-6 h-6 text-orange-400" />
                        </div>
                        <div className={`flex items-center space-x-1 text-sm ${(analytics?.tradeGrowth ?? 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(analytics?.tradeGrowth ?? 0) > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          <span>{analytics?.tradeGrowth ?? 0}%</span>
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-1">{formatNumber(analytics?.totalTrades || 0)}</h3>
                      <p className="text-gray-400 text-sm">Total Trades</p>
                      <div className="mt-4 h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400" style={{ width: '70%' }}></div>
                      </div>
                    </motion.div>
                  </>
                )
            }
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* User Growth Chart */}
            {userAnalyticsLoading
              ? <SkeletonChart />
              : userAnalyticsError
                ? <ErrorMessage message="Failed to load user analytics." />
                : (
                  <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">User Growth</h3>
                    <div className="h-[300px] sm:h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={userAnalytics?.data || []}>
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
                          <Line
                            type="monotone"
                            dataKey="users"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
            }

            {/* Revenue Chart */}
            {revenueAnalyticsLoading
              ? <SkeletonChart />
              : revenueAnalyticsError
                ? <ErrorMessage message="Failed to load revenue analytics." />
                : (
                  <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Revenue</h3>
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
                )
            }
          </div>
              
          {/* Activity Feed and System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Activity Feed */}
            {activityFeedLoading
              ? <SkeletonChart />
              : activityFeedError
                ? <ErrorMessage message="Failed to load activity feed." />
                : (
                  <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                      {activityFeed?.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start space-x-3 p-3 rounded-lg bg-gray-800/50"
                        >
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                              <ActivityIcon className="w-4 h-4 text-blue-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white">{activity.description}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {timeAgo(new Date(activity.timestamp))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
            }

            {/* System Health */}
            {systemHealthLoading
              ? <SkeletonChart />
              : systemHealthError
                ? <ErrorMessage message="Failed to load system health." />
                : (
                  <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
                    <div className="h-[300px] sm:h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={performanceData}>
                          <PolarGrid stroke="#374151" />
                          <PolarAngleAxis dataKey="metric" stroke="#9CA3AF" />
                          <PolarRadiusAxis stroke="#9CA3AF" />
                          <Radar
                            name="Performance"
                            dataKey="value"
                            stroke="#3B82F6"
                            fill="#3B82F6"
                            fillOpacity={0.2}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
            }
          </div>

          {/* Additional Dashboard Content for Scrolling */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">User activity #{i + 1}</p>
                      <p className="text-gray-400 text-xs">{timeAgo(new Date(Date.now() - i * 300000))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">System Alerts</h3>
              <div className="space-y-3">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${
                      i % 3 === 0 ? 'bg-green-400' : i % 3 === 1 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-white text-sm">System alert #{i + 1}</p>
                      <p className="text-gray-400 text-xs">
                        {i % 3 === 0 ? 'Info' : i % 3 === 1 ? 'Warning' : 'Error'} • {timeAgo(new Date(Date.now() - i * 600000))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* More Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Metric #{i + 1}</p>
                  <p className="text-white text-xl font-bold">{Math.floor(Math.random() * 100)}%</p>
                  <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${Math.floor(Math.random() * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
                     </motion.div>

          {/* Extra Content to Force Scrolling */}
          <div className="space-y-6">
            {Array.from({ length: 5 }, (_, sectionIndex) => (
              <motion.div
                key={sectionIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 + sectionIndex * 0.1 }}
                className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Additional Section {sectionIndex + 1}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 9 }, (_, i) => (
                    <div key={i} className="bg-gray-800/50 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Item {i + 1}</p>
                      <p className="text-white text-xl font-bold">{Math.floor(Math.random() * 1000)}</p>
                      <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full" 
                          style={{ width: `${Math.floor(Math.random() * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-gray-500 text-xs mt-2">
                        Updated {Math.floor(Math.random() * 60)} minutes ago
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Final Section to Ensure Scrolling */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
            className="bg-gradient-to-r from-blue-900/50 to-green-900/50 backdrop-blur-xl border border-blue-700/50 rounded-2xl p-8 text-center"
          >
            <h3 className="text-2xl font-bold text-white mb-4">🎉 You've reached the bottom!</h3>
            <p className="text-gray-300">This confirms that scrolling is working properly on the dashboard.</p>
            <div className="mt-4 text-sm text-gray-400">
              Dashboard loaded at {new Date().toLocaleString()}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
