'use client';

import { useState, useEffect } from 'react';
import { Strategy } from '@/types/strategy';
import { strategiesService } from '@/services/strategiesService';
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiTrendingUp, FiTrendingDown, FiActivity } from 'react-icons/fi';
import { FaBullseye } from 'react-icons/fa';
import Link from 'next/link';
import { ContentHeader } from '@/components/layout/ContentHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleToggleActive = async (id: string) => {
    try {
      await strategiesService.toggleStrategyActive(id);
      await loadStrategies();
    } catch (err) {
      console.error('Error toggling strategy:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this strategy?')) {
      try {
        await strategiesService.deleteStrategy(id);
        await loadStrategies();
      } catch (err) {
        console.error('Error deleting strategy:', err);
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

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {strategies.length} {strategies.length === 1 ? 'strategy' : 'strategies'}
        </div>
        <Link 
          href="/strategies/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="mr-2" />
          New Strategy
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {strategies.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <FaBullseye className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No strategies yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Create your first trading strategy to start tracking performance
          </p>
          <Link 
            href="/strategies/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="mr-2" />
            Create Strategy
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategies.map((strategy) => (
            <StrategyCard 
              key={strategy.id} 
              strategy={strategy} 
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          ))}
        </div>
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
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
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
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
              {isProfit ? (
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
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <Link
              href={`/strategies/${strategy.id}`}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="View Details"
            >
              <FiEye className="w-4 h-4" />
            </Link>
            <Link
              href={`/strategies/${strategy.id}/edit`}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Edit Strategy"
            >
              <FiEdit2 className="w-4 h-4" />
            </Link>
            <button
              onClick={() => onDelete(strategy.id)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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