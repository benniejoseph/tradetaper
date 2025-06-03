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
  MapPin,
  Download,
  RefreshCw,
  Zap
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';

// Mock activity data
const mockActivityFeed = [
  {
    id: '1',
    userId: 'user-1',
    userName: 'John Doe',
    type: 'trade_created' as const,
    description: 'Created a new EUR/USD trade worth $5,000',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    metadata: { pair: 'EUR/USD', amount: 5000 },
    ipAddress: '192.168.1.1',
    location: 'New York, US',
  },
  {
    id: '2',
    userId: 'user-2',
    userName: 'Jane Smith',
    type: 'subscription_changed' as const,
    description: 'Upgraded to Premium plan',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    metadata: { from: 'Pro', to: 'Premium' },
    ipAddress: '10.0.0.1',
    location: 'London, UK',
  },
  {
    id: '3',
    userId: 'user-3',
    userName: 'Mike Johnson',
    type: 'login' as const,
    description: 'Logged in to the platform',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    metadata: {},
    ipAddress: '203.45.67.89',
    location: 'Sydney, AU',
  },
  {
    id: '4',
    userId: 'user-4',
    userName: 'Sarah Williams',
    type: 'trade_closed' as const,
    description: 'Closed GBP/USD trade with +$1,250 profit',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    metadata: { pair: 'GBP/USD', profit: 1250 },
    ipAddress: '45.123.89.12',
    location: 'Toronto, CA',
  },
  {
    id: '5',
    userId: 'user-5',
    userName: 'Alex Brown',
    type: 'image_uploaded' as const,
    description: 'Uploaded trade analysis chart',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    metadata: { fileSize: '2.3MB', fileType: 'PNG' },
    ipAddress: '67.89.123.45',
    location: 'Berlin, DE',
  },
  // Add more activities for demonstration
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `mock-${i}`,
    userId: `user-${i + 6}`,
    userName: `User ${i + 6}`,
    type: ['login', 'trade_created', 'trade_closed', 'subscription_changed', 'image_uploaded'][Math.floor(Math.random() * 5)] as 'login' | 'trade_created' | 'trade_closed' | 'subscription_changed' | 'image_uploaded',
    description: `Activity ${i + 1} - Sample user action`,
    timestamp: new Date(Date.now() - (20 + i * 5) * 60 * 1000).toISOString(),
    metadata: {},
    ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    location: ['New York, US', 'London, UK', 'Tokyo, JP', 'Paris, FR', 'Sydney, AU'][Math.floor(Math.random() * 5)],
  })),
];

const mockActivityStats = {
  totalEvents24h: 1245,
  activeUsers24h: 456,
  topLocations: [
    { location: 'United States', count: 324 },
    { location: 'United Kingdom', count: 189 },
    { location: 'Germany', count: 156 },
    { location: 'Canada', count: 123 },
    { location: 'Australia', count: 98 },
  ],
  eventTypes: [
    { type: 'login', count: 445, percentage: 35.7 },
    { type: 'trade_created', count: 298, percentage: 23.9 },
    { type: 'trade_closed', count: 276, percentage: 22.2 },
    { type: 'subscription_changed', count: 156, percentage: 12.5 },
    { type: 'image_uploaded', count: 70, percentage: 5.6 },
  ],
};

export default function ActivityPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: activityFeed, isLoading, refetch } = useQuery({
    queryKey: ['activity-feed-detailed'],
    queryFn: () => Promise.resolve(mockActivityFeed),
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const { data: activityStats } = useQuery({
    queryKey: ['activity-stats'],
    queryFn: () => Promise.resolve(mockActivityStats),
    refetchInterval: 30000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };

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
                <p className="text-gray-400">Real-time user activities and system events</p>
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
          {/* Activity Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Events (24h)</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatNumber(activityStats?.totalEvents24h || 0)}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-green-400">
                  ↗ +12.5% from yesterday
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
                  <p className="text-sm font-medium text-gray-400">Active Users</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatNumber(activityStats?.activeUsers24h || 0)}
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-green-400">
                  ↗ +8.3% from yesterday
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
                  <p className="text-sm font-medium text-gray-400">Avg Response</p>
                  <p className="text-2xl font-bold text-white mt-1">145ms</p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-green-400">
                  ↗ -5.2% faster
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
                  <p className="text-sm font-medium text-gray-400">Locations</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {activityStats?.topLocations.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <MapPin className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-blue-400">
                  ↗ 3 new countries
                </div>
              </div>
            </motion.div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Activity Feed */}
            <div className="lg:col-span-2">
              <LiveActivityFeed 
                activities={activityFeed || []} 
                loading={isLoading}
                onRefresh={handleRefresh}
              />
            </div>

            {/* Activity Breakdown */}
            <div className="space-y-6">
              {/* Event Types */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-6">Event Types</h3>
                
                <div className="space-y-4">
                  {activityStats?.eventTypes.map((eventType, index) => (
                    <div key={eventType.type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500" 
                             style={{ backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index] }}></div>
                        <span className="text-white font-medium capitalize">{eventType.type.replace('_', ' ')}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">{formatNumber(eventType.count)}</div>
                        <div className="text-xs text-gray-400">{eventType.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Top Locations */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gray-800 border border-gray-700 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-6">Top Locations</h3>
                
                <div className="space-y-4">
                  {activityStats?.topLocations.map((location, index) => (
                    <div key={location.location} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded">
                          {index + 1}
                        </div>
                        <span className="text-white font-medium">{location.location}</span>
                      </div>
                      <div className="text-white font-medium">{formatNumber(location.count)}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 