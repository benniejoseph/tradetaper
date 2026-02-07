'use client';

import React, { useState } from 'react';
import { 
  FaBrain, 
  FaChartLine, 
  FaCalendarAlt,
  FaNewspaper,
  FaChartPie,
} from 'react-icons/fa';
import TradingViewChart from '@/components/market-intelligence/TradingViewChart';
import EconomicCalendar from '@/components/market-intelligence/EconomicCalendar';
import NewsFeed from '@/components/market-intelligence/NewsFeed';
import SentimentDashboard from '@/components/market-intelligence/SentimentDashboard';
import { FeatureGate } from '@/components/common/FeatureGate';

import { useRouter, useSearchParams } from 'next/navigation';

export default function MarketIntelligencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedSymbol, setSelectedSymbol] = useState('XAUUSD');
  
  const activeTab = searchParams.get('tab') || 'live-chart';

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.push(`?${params.toString()}`);
  };

  const majorSymbols = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'SPX500', 'NASDAQ100'];

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-black p-2 sm:p-4 lg:p-6 overflow-auto">
      <div className="w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                <FaBrain className="inline-block mr-2 sm:mr-3 text-emerald-600 dark:text-emerald-400" />
                Market Intelligence
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Live charts and economic calendar
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-4 sm:mb-6 overflow-x-auto">
          <nav className="flex space-x-2 sm:space-x-4 min-w-max pb-2">
            {[
              { id: 'live-chart', label: 'Live Chart', icon: FaChartLine },
              { id: 'economic-calendar', label: 'Economic Calendar', icon: FaCalendarAlt },
              { id: 'news', label: 'News Hub', icon: FaNewspaper },
              { id: 'ai-analysis', label: 'AI Analysis', icon: FaChartPie },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <tab.icon className="mr-1 sm:mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'live-chart' && (
          <FeatureGate feature="chartAnalysis">
            <div className="flex flex-col space-y-4">
              <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm overflow-hidden min-h-[600px]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      <FaChartLine className="inline-block mr-2 text-emerald-600 dark:text-emerald-400" />
                      Live {selectedSymbol} Chart - 4H Timeframe
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Professional TradingView chart with ICT analysis tools enabled
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Symbol:</label>
                    <select
                      value={selectedSymbol}
                      onChange={(e) => setSelectedSymbol(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    >
                      {majorSymbols.map(sym => (
                        <option key={sym} value={sym}>{sym}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* TradingView Chart */}
                <div className="flex-1 w-full overflow-hidden rounded-lg border-2 border-gray-700 min-h-[500px]">
                  <TradingViewChart 
                    symbol={selectedSymbol}
                    interval="240"
                    theme="dark"
                    height={0}
                  />
                </div>

                {/* ICT Concepts Reference */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-700">
                    <h5 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">Premium Zone</h5>
                    <p className="text-xs text-red-800 dark:text-red-300">Above 50% Fib - Look for shorts</p>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                    <h5 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 mb-1">Discount Zone</h5>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300">Below 50% Fib - Look for longs</p>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-700">
                    <h5 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 mb-1">Order Blocks</h5>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300">Last bullish/bearish candle</p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-700">
                    <h5 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-1">Fair Value Gaps</h5>
                    <p className="text-xs text-yellow-800 dark:text-yellow-300">Price imbalances to be filled</p>
                  </div>
                </div>
              </div>
            </div>
          </FeatureGate>
        )}

        {/* Economic Calendar Tab */}
        {activeTab === 'economic-calendar' && (
          <div className="space-y-6">
            <EconomicCalendar />
          </div>
        )}

        {/* News Tab */}
        {activeTab === 'news' && (
          <div className="space-y-6">
            <NewsFeed />
          </div>
        )}

        {/* AI Analysis Tab */}
        {activeTab === 'ai-analysis' && (
           <FeatureGate feature="aiAnalysis">
             <div className="space-y-6">
               <SentimentDashboard />
             </div>
           </FeatureGate>
        )}
      </div>
    </div>
  );
}