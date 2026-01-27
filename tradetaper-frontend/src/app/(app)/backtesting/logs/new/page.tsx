'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { backtestingService } from '@/services/backtestingService';
import { 
  CreateMarketLogDto, 
  Timeframe, 
  TradingSession, 
  MarketMovementType, 
  MarketSentiment,
  TIMEFRAMES,
  SESSIONS,
  MARKET_MOVEMENTS,
  MARKET_SENTIMENTS
} from '@/types/backtesting';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import TagAutocomplete from '@/components/backtesting/TagAutocomplete';
import { FiSave, FiArrowLeft } from 'react-icons/fi';

export default function NewMarketLogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateMarketLogDto>({
    symbol: 'XAUUSD',
    tradeDate: new Date().toISOString().split('T')[0],
    timeframe: 'M15',
    session: 'New York',
    tags: [],
    observation: '',
    movementType: 'Expansion',
    significance: 3,
    sentiment: 'Neutral',
    screenshotUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await backtestingService.createLog({
        ...formData,
        significance: Number(formData.significance),
      });
      router.push('/backtesting?tab=logs');
    } catch (err: any) {
      setError(err.message || 'Failed to save observation');
      setLoading(false);
    }
  };



  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FiArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Log Market Observation</h1>
          <p className="text-gray-500 dark:text-gray-400">Record patterns and insights without taking a trade</p>
        </div>
      </div>

      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Symbol
              </label>
              <input
                type="text"
                required
                value={formData.symbol}
                onChange={e => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. BTCUSD"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={formData.tradeDate}
                onChange={e => setFormData({ ...formData, tradeDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timeframe
              </label>
              <select
                value={formData.timeframe}
                onChange={e => setFormData({ ...formData, timeframe: e.target.value as Timeframe })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {TIMEFRAMES.map(tf => (
                  <option key={tf.value} value={tf.value}>{tf.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Session
              </label>
              <select
                value={formData.session}
                onChange={e => setFormData({ ...formData, session: e.target.value as TradingSession })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Session...</option>
                {SESSIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Movement Type
              </label>
              <select
                value={formData.movementType}
                onChange={e => setFormData({ ...formData, movementType: e.target.value as MarketMovementType })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Movement...</option>
                {MARKET_MOVEMENTS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sentiment
              </label>
              <select
                value={formData.sentiment}
                onChange={e => setFormData({ ...formData, sentiment: e.target.value as MarketSentiment })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Sentiment...</option>
                {MARKET_SENTIMENTS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Significance (1-5)
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={formData.significance}
              onChange={e => setFormData({ ...formData, significance: Number(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Minor Detail</span>
              <span>Critical Pattern</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <TagAutocomplete
              tags={formData.tags || []}
              onTagsChange={(newTags: string[]) => setFormData((prev: typeof formData) => ({ ...prev, tags: newTags }))}
              placeholder="Add tags (e.g., fvg, sweep, ob)..."
              maxTags={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observation Notes
            </label>
            <textarea
              required
              rows={5}
              value={formData.observation}
              onChange={e => setFormData({ ...formData, observation: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Describe what you see..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Screenshot URL (Optional)
            </label>
            <input
              type="url"
              value={formData.screenshotUrl}
              onChange={e => setFormData({ ...formData, screenshotUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <LoadingSpinner size="sm" /> : <FiSave />}
              Save Observation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
