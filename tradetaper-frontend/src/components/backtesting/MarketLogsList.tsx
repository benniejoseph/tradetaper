'use client';

import React from 'react';

import { useState, useEffect } from 'react';
import { MarketLog } from '@/types/backtesting';
import { backtestingService } from '@/services/backtestingService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { FiClock, FiTag, FiTrash2, FiActivity, FiImage, FiFilter } from 'react-icons/fi';

export function MarketLogsList() {
  const [logs, setLogs] = useState<MarketLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState('');

  useEffect(() => {
    loadLogs();
  }, [filterTag]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await backtestingService.getLogs({
        tags: filterTag ? [filterTag] : undefined,
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load logs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this observation?')) return;
    try {
      await backtestingService.deleteLog(id);
      loadLogs();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by tag..."
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No observations found. Start logging!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {logs.map(log => (
            <div 
              key={log.id}
              className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-gray-900 dark:text-white">
                    {log.symbol}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded text-xs text-gray-600 dark:text-gray-400">
                    {log.timeframe}
                  </span>
                  {log.sentiment && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      log.sentiment === 'Bullish' ? 'bg-green-100 text-green-700' :
                      log.sentiment === 'Bearish' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {log.sentiment}
                    </span>
                  )}
                  {log.movementType && (
                    <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-emerald-400">
                      <FiActivity />
                      {log.movementType}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {new Date(log.tradeDate).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={() => handleDelete(log.id)}
                    className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                {log.observation}
              </p>

              <div className="flex flex-wrap gap-2 items-center">
                {log.tags?.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-emerald-900/20 text-blue-600 dark:text-emerald-400 rounded-lg text-xs">
                    <FiTag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
                
                {log.screenshotUrl && (
                  <a 
                    href={log.screenshotUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white underline"
                  >
                    <FiImage /> View Screenshot
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
