'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import LiveActivityFeed from '@/components/LiveActivityFeed';
import {
  Activity,
  Users,
  Clock,
  Download,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { adminApi } from '@/lib/api';

export default function ActivityPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: activityFeed, isLoading, refetch } = useQuery({
    queryKey: ['activity-feed-detailed'],
    queryFn: () => adminApi.getActivityFeed(50),
    refetchInterval: 5000,
  });

  const { data: systemHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => adminApi.getSystemHealth(),
    refetchInterval: 30000,
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => adminApi.getDashboardStats(),
    refetchInterval: 30000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Compute event type breakdown from real events
  const eventTypeCounts = (activityFeed || []).reduce<Record<string, number>>((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {});

  const totalEvents = activityFeed?.length || 0;

  const eventTypeList = Object.entries(eventTypeCounts).map(([type, count]) => ({
    type,
    count,
    percentage: totalEvents > 0 ? Math.round((count / totalEvents) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  const eventColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Live Activity Monitor</h1>
                <p className="text-gray-400 text-sm">Real-time user activities and system events</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Events Loaded</p>
                  <p className="text-2xl font-bold text-white mt-1">{formatNumber(totalEvents)}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">Auto-refreshes every 5s</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Active Users</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatNumber(dashboardStats?.activeUsers ?? 0)}
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">From dashboard stats</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Avg Response</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {systemHealth?.responseTime != null ? `${systemHealth.responseTime}ms` : '—'}
                  </p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">System health data</p>
            </motion.div>
          </div>

          {/* Main Grid: Live Feed + Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Activity Feed — takes 2 columns */}
            <div className="lg:col-span-2">
              <LiveActivityFeed
                activities={(activityFeed || []).map((activity) => ({
                  ...activity,
                  userId: activity.user?.id || 'unknown',
                  userName: activity.user?.name || 'Unknown User',
                  type: activity.type as 'login' | 'trade_created' | 'trade_closed' | 'subscription_changed' | 'image_uploaded',
                }))}
                loading={isLoading}
                onRefresh={handleRefresh}
              />
            </div>

            {/* Event Types Breakdown */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-5">Event Breakdown</h3>

                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between animate-pulse">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-gray-600 rounded-full" />
                          <div className="h-3 w-24 bg-gray-700 rounded" />
                        </div>
                        <div className="h-3 w-12 bg-gray-700 rounded" />
                      </div>
                    ))}
                  </div>
                ) : eventTypeList.length > 0 ? (
                  <div className="space-y-4">
                    {eventTypeList.map((eventType, index) => (
                      <div key={eventType.type}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: eventColors[index % eventColors.length] }}
                            />
                            <span className="text-white text-sm font-medium capitalize">
                              {eventType.type.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-white text-sm font-medium">{formatNumber(eventType.count)}</span>
                            <span className="text-xs text-gray-400 ml-1">({eventType.percentage}%)</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${eventType.percentage}%`,
                              backgroundColor: eventColors[index % eventColors.length],
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No events yet</p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}