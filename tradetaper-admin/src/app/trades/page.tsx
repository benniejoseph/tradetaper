'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { 
  TrendingUp, 
  Search, 
  Filter,
  Download,
  DollarSign,
  BarChart3,
  Clock,
  Users,
  ArrowUpDown,
  Eye
} from 'lucide-react';
import { formatNumber, formatCurrency, timeAgo } from '@/lib/utils';
import { adminApi } from '@/lib/api';

export default function TradesPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: adminApi.getDashboardStats,
    refetchInterval: 30000,
  });

  const { data: tradeAnalytics } = useQuery({
    queryKey: ['trade-analytics', selectedTimeRange],
    queryFn: () => adminApi.getTradeAnalytics(selectedTimeRange),
    refetchInterval: 30000,
  });

  // Mock trades data (in real app, this would come from an API)
  const mockTrades = [
    { id: '1', userId: 'user-1', userName: 'John Doe', pair: 'EUR/USD', type: 'buy', amount: 1000, entryPrice: 1.0850, exitPrice: 1.0920, status: 'closed', pnl: 70, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: '2', userId: 'user-2', userName: 'Jane Smith', pair: 'GBP/USD', type: 'sell', amount: 1500, entryPrice: 1.2650, exitPrice: null, status: 'open', pnl: null, createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
    { id: '3', userId: 'user-3', userName: 'Mike Johnson', pair: 'USD/JPY', type: 'buy', amount: 2000, entryPrice: 149.50, exitPrice: 150.20, status: 'closed', pnl: 93.45, createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
    { id: '4', userId: 'user-4', userName: 'Sarah Williams', pair: 'AUD/USD', type: 'sell', amount: 800, entryPrice: 0.6720, exitPrice: null, status: 'open', pnl: null, createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
    { id: '5', userId: 'user-5', userName: 'Alex Brown', pair: 'EUR/GBP', type: 'buy', amount: 1200, entryPrice: 0.8540, exitPrice: 0.8580, status: 'closed', pnl: 56.28, createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
  ];

  const filteredTrades = mockTrades.filter(trade => {
    if (statusFilter !== 'all' && trade.status !== statusFilter) return false;
    if (searchQuery && !trade.pair.toLowerCase().includes(searchQuery.toLowerCase()) && !trade.userName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalVolume = mockTrades.reduce((sum, trade) => sum + trade.amount, 0);
  const totalPnL = mockTrades.filter(t => t.pnl).reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const winRate = mockTrades.filter(t => t.status === 'closed').length > 0 ? 
    (mockTrades.filter(t => t.status === 'closed' && (t.pnl || 0) > 0).length / mockTrades.filter(t => t.status === 'closed').length) * 100 : 0;

  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Trade Management</h1>
                <p className="text-gray-400">Monitor and analyze all trading activity</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Trades</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatNumber(dashboardStats?.totalTrades || 0)}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-green-400">
                  ↗ +{dashboardStats?.tradeGrowth || 0}% from last month
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
                  <p className="text-sm font-medium text-gray-400">Total Volume</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatCurrency(totalVolume)}
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-green-400">
                  ↗ +15.2% from last month
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
                  <p className="text-sm font-medium text-gray-400">Total P&L</p>
                  <p className={`text-2xl font-bold mt-1 ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                  </p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className={`text-xs ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalPnL >= 0 ? '↗' : '↘'} {Math.abs(totalPnL / 1000).toFixed(1)}K this month
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
                  <p className="text-sm font-medium text-gray-400">Win Rate</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {winRate.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-green-400">
                  ↗ +2.3% from last month
                </div>
              </div>
            </motion.div>
          </div>

          {/* Top Trading Pairs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Top Trading Pairs</h3>
              <div className="text-sm text-gray-400">Last {selectedTimeRange}</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tradeAnalytics?.topTradingPairs?.slice(0, 4).map((pair, index) => (
                <motion.div
                  key={pair.pair}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="bg-gray-700/50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">{pair.pair}</span>
                    <span className="text-xs text-gray-400">#{index + 1}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Trades:</span>
                      <span className="text-white">{formatNumber(pair.count)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Volume:</span>
                      <span className="text-white">${formatNumber(pair.volume / 1000000)}M</span>
                    </div>
                  </div>
                </motion.div>
              )) || (
                <div className="col-span-4 text-center py-8 text-gray-400">
                  No trading pairs data available
                </div>
              )}
            </div>
          </motion.div>

          {/* Trades Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6"
          >
            {/* Table Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Recent Trades</h3>
              
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search trades..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'open' | 'closed')}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
                
                <button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors">
                  <Filter className="w-4 h-4" />
                  <span>More Filters</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      <div className="flex items-center space-x-1">
                        <span>Trade ID</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Trader</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Pair</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Amount</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Entry Price</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">P&L</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Time</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.map((trade, index) => (
                    <motion.tr
                      key={trade.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="font-mono text-sm text-blue-400">#{trade.id}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-xs">
                              {trade.userName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{trade.userName}</p>
                            <p className="text-xs text-gray-400">ID: {trade.userId.slice(0, 6)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-white">{trade.pair}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          trade.type === 'buy' 
                            ? 'bg-green-500/10 text-green-400' 
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {trade.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-white font-medium">
                        {formatCurrency(trade.amount)}
                      </td>
                      <td className="py-4 px-4 text-right text-white">
                        {trade.entryPrice.toFixed(4)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {trade.pnl !== null ? (
                          <span className={`font-medium ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          trade.status === 'open' 
                            ? 'bg-yellow-500/10 text-yellow-400' 
                            : 'bg-gray-500/10 text-gray-400'
                        }`}>
                          {trade.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2 text-gray-300">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{timeAgo(new Date(trade.createdAt))}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button className="text-gray-400 hover:text-white transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
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