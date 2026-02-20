'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { backtestingService } from '@/services/backtestingService';
import { MarketPatternDiscovery } from '@/types/backtesting';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { FiArrowLeft, FiActivity, FiTarget, FiTag } from 'react-icons/fi';
import { FaBrain, FaChartPie } from 'react-icons/fa';

export default function PatternAnalysisPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ totalLogs: number; discoveries: MarketPatternDiscovery[] } | null>(null);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const result = await backtestingService.analyzePatterns();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 text-gray-900 dark:text-white">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FaBrain className="text-purple-500" />
            AI Pattern Discovery
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Analyzing your market logs to find recurring probabilities
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : !data || data.totalLogs === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <FaChartPie className="mx-auto w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium mb-2">Not Enough Data</h3>
          <p className="text-gray-500 mb-6">Log more observations to unlock AI pattern recognition.</p>
          <button
             onClick={() => router.push('/backtesting/logs/new')}
             className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start Logging
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-black p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Total Observations</div>
              <div className="text-3xl font-bold">{data.totalLogs}</div>
            </div>
            <div className="bg-white dark:bg-black p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Discovered Patterns</div>
              <div className="text-3xl font-bold text-purple-600">{data.discoveries.length}</div>
            </div>
            <div className="bg-white dark:bg-black p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="text-sm text-gray-500 mb-1">Top Insight</div>
              <div className="text-lg font-medium truncate">
                {data.discoveries[0]?.tag || 'N/A'} 
                <span className="text-gray-400 text-sm ml-2">
                  ({data.discoveries[0]?.dominantPattern || '-'})
                </span>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FiTarget className="text-blue-500" />
            Detected Correlations
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.discoveries.map((pattern) => (
              <div key={pattern.tag} className="bg-white dark:bg-black p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <FiActivity className="w-24 h-24" />
                </div>
                
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FiTag className="text-blue-500" />
                    {pattern.tag}
                  </h3>
                  <span className="bg-purple-100 dark:bg-emerald-900/30 text-purple-700 dark:text-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
                    {pattern.occurrences} matches
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Dominant Move</div>
                    <div className="font-medium text-lg">{pattern.dominantPattern}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sentiment</div>
                    <div className={`font-medium text-lg ${
                      pattern.dominantSentiment === 'Bullish' ? 'text-green-500' : 
                      pattern.dominantSentiment === 'Bearish' ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {pattern.dominantSentiment}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Confidence (Frequency)</span>
                    <span className="font-medium">{pattern.confidence}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${pattern.confidence}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-sm mt-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                    <span className="text-gray-500">Significance Rating</span>
                    <span className="font-medium">{pattern.avgSignificance}/5.0</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
