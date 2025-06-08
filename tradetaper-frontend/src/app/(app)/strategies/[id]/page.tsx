'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Strategy } from '@/types/strategy';
import { strategiesService } from '@/services/strategiesService';
import { ContentHeader } from '@/components/layout/ContentHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { FiEdit2, FiTrash2, FiTrendingUp, FiTrendingDown, FiActivity, FiCalendar, FiTag } from 'react-icons/fi';
import { FaBullseye } from 'react-icons/fa';
import Link from 'next/link';

export default function StrategyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      loadStrategy(params.id as string);
    }
  }, [params.id]);

  const loadStrategy = async (id: string) => {
    try {
      setLoading(true);
      const data = await strategiesService.getStrategy(id);
      const stats = await strategiesService.getStrategyStats(id);
      setStrategy({ ...data, stats });
    } catch (err) {
      setError('Failed to load strategy');
      console.error('Error loading strategy:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!strategy) return;
    
    try {
      await strategiesService.toggleStrategyActive(strategy.id);
      setStrategy(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
    } catch (err) {
      console.error('Error toggling strategy:', err);
    }
  };

  const handleDelete = async () => {
    if (!strategy) return;
    
    if (window.confirm('Are you sure you want to delete this strategy? This action cannot be undone.')) {
      try {
        await strategiesService.deleteStrategy(strategy.id);
        router.push('/strategies');
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

  if (error || !strategy) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-4">{error || 'Strategy not found'}</div>
        <Link 
          href="/strategies"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          Back to Strategies
        </Link>
      </div>
    );
  }

  const stats = strategy.stats;
  const isProfit = stats && stats.totalPnl > 0;

  return (
    <div className="space-y-6">
      <ContentHeader 
        title={strategy.name}
        description={strategy.description || 'Trading strategy details and performance'}
      />

      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span 
            className={`px-3 py-1 text-sm rounded-full ${
              strategy.isActive 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            {strategy.isActive ? 'Active' : 'Inactive'}
          </span>
          {strategy.tradingSession && (
            <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full capitalize">
              {strategy.tradingSession} Session
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <Link
            href={`/strategies/${strategy.id}/edit`}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
          >
            <FiEdit2 className="mr-2 w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={handleToggleActive}
            className={`px-4 py-2 rounded-lg transition-colors ${
              strategy.isActive
                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30'
                : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
            }`}
          >
            {strategy.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <FiTrash2 className="mr-2 w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Stats */}
        <div className="lg:col-span-2 space-y-6">
          {stats && (
            <>
              {/* Key Metrics */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Overview</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalTrades}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Trades</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      ${stats.totalPnl.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total P&L</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.winRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Win Rate</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.profitFactor.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Profit Factor</div>
                  </div>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detailed Statistics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Closed Trades:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{stats.closedTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Winning Trades:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{stats.winningTrades}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Losing Trades:</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{stats.losingTrades}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Average P&L:</span>
                      <span className={`font-medium ${
                        stats.averagePnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        ${stats.averagePnl.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Average Win:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">${stats.averageWin.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Average Loss:</span>
                      <span className="font-medium text-red-600 dark:text-red-400">${stats.averageLoss.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Strategy Details */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Strategy Details</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FiCalendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Created</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(strategy.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              {strategy.tags && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FiTag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</span>
                  </div>
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
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: strategy.color }}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Color</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {strategy.color}
                </p>
              </div>
            </div>
          </div>

          {/* Checklist */}
          {strategy.checklist && strategy.checklist.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trading Checklist</h3>
              
              <div className="space-y-2">
                {strategy.checklist.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-2 rounded">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}