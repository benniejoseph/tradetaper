'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import WorldMap from '@/components/WorldMap';
import { 
  Globe, 
  MapPin, 
  Users, 
  TrendingUp, 
  DollarSign,
  Download
} from 'lucide-react';
import { formatNumber, formatCurrency, formatPercentage } from '@/lib/utils';

// Mock geographic data
const mockGeographicData = [
  { country: 'United States', users: 5432, trades: 12456, revenue: 78900, coordinates: [-95.7129, 37.0902] as [number, number] },
  { country: 'United Kingdom', users: 3456, trades: 8765, revenue: 56700, coordinates: [-3.4360, 55.3781] as [number, number] },
  { country: 'Germany', users: 2345, trades: 6789, revenue: 45600, coordinates: [10.4515, 51.1657] as [number, number] },
  { country: 'Canada', users: 1876, trades: 4567, revenue: 34500, coordinates: [-106.3468, 56.1304] as [number, number] },
  { country: 'Australia', users: 1543, trades: 3456, revenue: 23400, coordinates: [133.7751, -25.2744] as [number, number] },
  { country: 'Japan', users: 1234, trades: 2987, revenue: 19800, coordinates: [138.2529, 36.2048] as [number, number] },
  { country: 'France', users: 987, trades: 2345, revenue: 15600, coordinates: [2.2137, 46.2276] as [number, number] },
  { country: 'Netherlands', users: 756, trades: 1876, revenue: 12300, coordinates: [5.2913, 52.1326] as [number, number] },
];

export default function GeographicPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'trades' | 'revenue'>('users');

  const { data: geographicData, isLoading } = useQuery({
    queryKey: ['geographic-data'],
    queryFn: () => Promise.resolve(mockGeographicData),
    refetchInterval: 30000,
  });

  const sortedData = geographicData?.sort((a, b) => b[selectedMetric] - a[selectedMetric]) || [];
  const totalUsers = geographicData?.reduce((sum, country) => sum + country.users, 0) || 0;
  const totalTrades = geographicData?.reduce((sum, country) => sum + country.trades, 0) || 0;
  const totalRevenue = geographicData?.reduce((sum, country) => sum + country.revenue, 0) || 0;

  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Globe className="w-6 h-6 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Geographic Analytics</h1>
                <p className="text-gray-400">Global user distribution and regional insights</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as 'users' | 'trades' | 'revenue')}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="users">Users</option>
                <option value="trades">Trades</option>
                <option value="revenue">Revenue</option>
              </select>
              
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Global Users</p>
                  <p className="text-2xl font-bold text-white mt-1">{formatNumber(totalUsers)}</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-green-400">
                  ↗ +12.3% from last month
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
                  <p className="text-sm font-medium text-gray-400">Global Trades</p>
                  <p className="text-2xl font-bold text-white mt-1">{formatNumber(totalTrades)}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-green-400">
                  ↗ +8.7% from last month
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
                  <p className="text-sm font-medium text-gray-400">Global Revenue</p>
                  <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-green-400">
                  ↗ +15.2% from last month
                </div>
              </div>
            </motion.div>
          </div>

          {/* World Map */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <WorldMap data={geographicData || []} loading={isLoading} />
            </div>

            {/* Top Countries */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Top Countries</h3>
                <div className="flex items-center space-x-2 text-blue-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">By {selectedMetric}</span>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {sortedData.slice(0, 10).map((country, index) => {
                  const value = country[selectedMetric];
                  const total = selectedMetric === 'users' ? totalUsers : 
                               selectedMetric === 'trades' ? totalTrades : totalRevenue;
                  const percentage = (value / total) * 100;

                  return (
                    <motion.div
                      key={country.country}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-white">{country.country}</p>
                          <p className="text-xs text-gray-400">{formatPercentage(percentage)} of total</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-white">
                          {selectedMetric === 'revenue' 
                            ? formatCurrency(value) 
                            : formatNumber(value)
                          }
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Regional Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-6">Regional Performance</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Country</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Users</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Trades</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Revenue</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Avg/User</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((country, index) => (
                    <motion.tr
                      key={country.country}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 + index * 0.02 }}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-white font-medium">{country.country}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-white">{formatNumber(country.users)}</td>
                      <td className="text-right py-3 px-4 text-white">{formatNumber(country.trades)}</td>
                      <td className="text-right py-3 px-4 text-white">{formatCurrency(country.revenue)}</td>
                      <td className="text-right py-3 px-4 text-white">
                        {formatCurrency(country.revenue / country.users)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
} 