'use client';

import { useState, useEffect, useMemo } from 'react';
import { Strategy } from '@/types/strategy';
import { strategiesService } from '@/services/strategiesService';
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiTrendingUp, FiTrendingDown, FiSearch, FiFilter } from 'react-icons/fi';
import { FaBullseye } from 'react-icons/fa';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Simple content header component
function ContentHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
      )}
    </div>
  );
}

// Toast notification component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
      type === 'success' 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`}>
      {message}
    </div>
  );
}

type SortOption = 'newest' | 'oldest' | 'name' | 'performance';
type FilterOption = 'all' | 'active' | 'inactive';

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Search, filter, and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      setLoading(true);
      const data = await strategiesService.getStrategiesWithStats();
      setStrategies(data);
    } catch (err) {
      setError('Failed to load strategies');
      console.error('Error loading strategies:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered and sorted strategies
  const filteredStrategies = useMemo(() => {
    let result = [...strategies];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.tags?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (filterStatus === 'active') {
      result = result.filter(s => s.isActive);
    } else if (filterStatus === 'inactive') {
      result = result.filter(s => !s.isActive);
    }
    
    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'performance':
        result.sort((a, b) => (b.stats?.totalPnl || 0) - (a.stats?.totalPnl || 0));
        break;
    }
    
    return result;
  }, [strategies, searchQuery, filterStatus, sortBy]);

  const handleToggleActive = async (id: string) => {
    try {
      await strategiesService.toggleStrategyActive(id);
      await loadStrategies();
      setToast({ message: 'Strategy status updated', type: 'success' });
    } catch (err) {
      console.error('Error toggling strategy:', err);
      setToast({ message: 'Failed to update strategy', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this strategy?')) {
      try {
        await strategiesService.deleteStrategy(id);
        await loadStrategies();
        setToast({ message: 'Strategy deleted successfully', type: 'success' });
      } catch (err) {
        console.error('Error deleting strategy:', err);
        setToast({ message: 'Failed to delete strategy', type: 'error' });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ContentHeader 
        title="Trading Strategies"
        description="Manage your trading strategies and track their performance"
      />

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:flex-none md:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search strategies..."
              className="w-full pl-10 pr-4 py-2 border border-emerald-300 dark:border-emerald-600/30 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-black text-gray-900 dark:text-white"
            />
          </div>
          
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterOption)}
            className="px-3 py-2 border border-emerald-300 dark:border-emerald-600/30 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-black text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 border border-emerald-300 dark:border-emerald-600/30 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-black text-gray-900 dark:text-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
            <option value="performance">Best Performance</option>
          </select>
        </div>
        
        {/* Count and Add Button */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredStrategies.length} of {strategies.length} {strategies.length === 1 ? 'strategy' : 'strategies'}
          </div>
          <Link 
            href="/strategies/new"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <FiPlus className="mr-2" />
            New Strategy
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {strategies.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-full flex items-center justify-center mb-4 border-2 border-emerald-200 dark:border-emerald-700/30">
            <FaBullseye className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No strategies yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create your first trading strategy to start tracking performance
          </p>
          <Link 
            href="/strategies/new"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <FiPlus className="mr-2" />
            Create Strategy
          </Link>
        </div>
      ) : filteredStrategies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No strategies match your search criteria</p>
          <button 
            onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
            className="mt-4 text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStrategies.map((strategy) => (
            <StrategyCard 
              key={strategy.id} 
              strategy={strategy} 
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
      
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}

interface StrategyCardProps {
  strategy: Strategy;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
}

function StrategyCard({ strategy, onToggleActive, onDelete }: StrategyCardProps) {
  const stats = strategy.stats;
  const isProfit = stats && stats.totalPnl > 0;

  return (
    <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-xl shadow-sm border border-emerald-200/50 dark:border-emerald-700/30 overflow-hidden hover:shadow-lg hover:shadow-emerald-500/10 transition-all backdrop-blur-xl">
      {/* Header with color indicator */}
      <div 
        className="h-2"
        style={{ backgroundColor: strategy.color || '#3B82F6' }}
      />
      
      <div className="p-6">
        {/* Strategy Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {strategy.name}
              </h3>
              <span 
                className={`px-2 py-1 text-xs rounded-full ${
                  strategy.isActive 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-400'
                }`}
              >
                {strategy.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            {strategy.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {strategy.description}
              </p>
            )}
            {strategy.tradingSession && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 capitalize">
                {strategy.tradingSession} Session
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {stats.totalTrades}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Trades</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${
                  isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  ${stats.totalPnl.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total P&L</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {stats.winRate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {stats.profitFactor.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Profit Factor</div>
              </div>
            </div>

            {/* Performance Indicator */}
            <div className="flex items-center justify-center py-2">
              {stats.totalTrades === 0 ? (
                <div className="text-gray-500 dark:text-gray-400 text-sm">No trades yet</div>
              ) : isProfit ? (
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <FiTrendingUp className="mr-1" />
                  <span className="text-sm font-medium">Profitable</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600 dark:text-red-400">
                  <FiTrendingDown className="mr-1" />
                  <span className="text-sm font-medium">Unprofitable</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {strategy.tags && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {strategy.tags.split(',').map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 text-xs bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded border border-emerald-200 dark:border-emerald-700/30"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Checklist count */}
        {strategy.checklist && strategy.checklist.length > 0 && (
          <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            📋 {strategy.checklist.length} checklist items
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-emerald-200 dark:border-emerald-700/30">
          <div className="flex space-x-2">
            <Link
              href={`/strategies/${strategy.id}`}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100 dark:hover:from-emerald-950/20 dark:hover:to-emerald-900/20 rounded-lg transition-all"
              title="View Details"
            >
              <FiEye className="w-4 h-4" />
            </Link>
            <Link
              href={`/strategies/${strategy.id}/edit`}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100 dark:hover:from-emerald-950/20 dark:hover:to-emerald-900/20 rounded-lg transition-all"
              title="Edit Strategy"
            >
              <FiEdit2 className="w-4 h-4" />
            </Link>
            <button
              onClick={() => onDelete(strategy.id)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 dark:hover:from-red-950/20 dark:hover:to-red-900/20 rounded-lg transition-all"
              title="Delete Strategy"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={() => onToggleActive(strategy.id)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              strategy.isActive
                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30'
                : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
            }`}
          >
            {strategy.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}