'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaBrain, 
  FaSpinner, 
  FaInfoCircle, 
  FaExclamationTriangle,
  FaLevelUpAlt,
  FaLevelDownAlt,
  FaMinus,
  FaChartLine
} from 'react-icons/fa';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { authApiClient } from '@/services/api';

interface CotDataPoint {
  date: string;
  netNonCommercial: number;
  netNonReportable: number;
  openInterest: number;
  longNonCommercial: number;
  shortNonCommercial: number;
  longNonReportable: number;
  shortNonReportable: number;
}

interface CotAiSummary {
  symbol: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral' | 'Exhausted' | 'Trap';
  biasRating: number;
  smartMoneyPositioning: string;
  retailDivergence: string;
  laggingDataContext: string;
  predictedImpact: string;
  confidence: number;
}

const ASSET_CATEGORIES = {
  Forex: ['EURUSD', 'GBPUSD', 'AUDUSD', 'USDCAD', 'USDJPY', 'NZDUSD', 'USDCHF'],
  Indices: ['SPX', 'NDX', 'DOW'],
  Commodities: ['XAUUSD', 'XAGUSD', 'WTI', 'NATGAS'],
};

export default function CommitmentOfTraders() {
  const [activeCategory, setActiveCategory] = useState<keyof typeof ASSET_CATEGORIES>('Forex');
  const [activeSymbol, setActiveSymbol] = useState('EURUSD');
  const [history, setHistory] = useState<CotDataPoint[]>([]);
  const [aiSummary, setAiSummary] = useState<CotAiSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // When category changes, reset symbol to first in list
    setActiveSymbol(ASSET_CATEGORIES[activeCategory][0]);
  }, [activeCategory]);

  useEffect(() => {
    if (!activeSymbol) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await authApiClient.get(`/market-intelligence/cot/history/${activeSymbol}?limit=26`);
        // Reverse so chronological left to right
        setHistory(Array.isArray(data) ? data.reverse() : []);
      } catch (err) {
        console.error(err);
        setError('Failed to load CFTC Historical Data. The reporting system may be temporarily offline.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeSymbol]);

  useEffect(() => {
    if (!activeSymbol) return;

    const fetchAi = async () => {
      setAiLoading(true);
      try {
        const { data } = await authApiClient.get(`/market-intelligence/cot/analysis/${activeSymbol}`);
        setAiSummary(data);
      } catch (err) {
        console.error(err);
        setAiSummary(null);
      } finally {
        setAiLoading(false);
      }
    };

    fetchAi();
  }, [activeSymbol]);

  const chartData = useMemo(() => {
    return history.map(item => ({
      ...item,
      displayDate: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      smartMoney: item.netNonCommercial,
      retail: item.netNonReportable,
    }));
  }, [history]);

  const getSentimentStyling = (sentiment?: string) => {
    switch(sentiment?.toLowerCase()) {
      case 'bullish': return { text: 'text-emerald-500', border: 'border-emerald-500/30', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]' };
      case 'bearish': return { text: 'text-red-500', border: 'border-red-500/30', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]' };
      case 'trap': return { text: 'text-orange-500', border: 'border-orange-500/30', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]' };
      case 'exhausted': return { text: 'text-purple-500', border: 'border-purple-500/30', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]' };
      default: return { text: 'text-gray-400', border: 'border-gray-500/30', glow: '' };
    }
  };

  const sentimentStyles = getSentimentStyling(aiSummary?.sentiment);

  return (
    <div className="flex flex-col space-y-6">
      
      {/* 1. Header & Selectors */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex space-x-2 bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl">
          {(Object.keys(ASSET_CATEGORIES) as Array<keyof typeof ASSET_CATEGORIES>).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeCategory === cat 
                  ? 'bg-white dark:bg-[#111] text-gray-900 dark:text-white shadow'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-emerald-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex space-x-2 overflow-x-auto max-w-full hide-scrollbar pb-1">
          {ASSET_CATEGORIES[activeCategory].map(sym => (
            <button
              key={sym}
              onClick={() => setActiveSymbol(sym)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                activeSymbol === sym
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-white dark:bg-[#111] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-zinc-800'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <FaSpinner className="animate-spin text-3xl text-emerald-500 mb-4" />
          <p className="text-gray-500">Connecting to CFTC Ledger...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl flex items-start gap-4">
          <FaExclamationTriangle className="text-red-500 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-800 dark:text-red-400">Data Source Error</h3>
            <p className="text-red-600 dark:text-red-500/80 text-sm mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Main Chart Column */}
          <div className="xl:col-span-2 space-y-6">
            
            <div className="bg-white dark:bg-[#080808] border border-gray-200 dark:border-[#1A1A1A] p-5 rounded-xl shadow-sm">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FaChartLine className="text-emerald-500" /> Net Institutional Positioning
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Hedge Funds (Smart Money) vs Retail Traders Data over 6 Months</p>
                </div>
              </div>
              
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="#666" 
                      fontSize={11} 
                      tickMargin={10}
                    />
                    <YAxis 
                      stroke="#666" 
                      fontSize={11} 
                      axisLine={false}
                      tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', borderColor: '#222', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: '#888', marginBottom: '4px' }}
                      formatter={(value: number) => [new Intl.NumberFormat().format(value) + ' contracts', '']}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line 
                      name="Smart Money (Hedge Funds)" 
                      type="monotone" 
                      dataKey="smartMoney" 
                      stroke="#10b981" // emerald-500
                      strokeWidth={3} 
                      dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Line 
                      name="Retail (Non-Reportable)" 
                      type="monotone" 
                      dataKey="retail" 
                      stroke="#f59e0b" // amber-500
                      strokeWidth={2} 
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Open Interest Bar Chart */}
            <div className="bg-white dark:bg-[#080808] border border-gray-200 dark:border-[#1A1A1A] p-5 rounded-xl shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Total Open Interest</h3>
              <div className="h-[150px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <Bar dataKey="openInterest" fill="#3b82f6" opacity={0.3} radius={[4, 4, 0, 0]} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ backgroundColor: '#111', borderColor: '#222', borderRadius: '8px' }}
                      formatter={(value: number) => [new Intl.NumberFormat().format(value), 'Open Interest']}
                      labelFormatter={() => ''}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Predictive Panel Column */}
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl bg-white dark:bg-[#0a0a0a] border ${sentimentStyles.border} ${sentimentStyles.glow} transition-all duration-500`}>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-zinc-800">
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  {aiLoading ? (
                    <FaSpinner className="animate-spin text-emerald-500 text-xl" />
                  ) : (
                    <FaBrain className="text-emerald-500 text-xl" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI Alignment</h2>
                  <p className="text-xs text-gray-500">Live Price vs CFTC Ledger</p>
                </div>
              </div>

              {aiLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-5/6"></div>
                  <div className="h-10 bg-gray-200 dark:bg-zinc-800 rounded mt-6"></div>
                </div>
              ) : aiSummary ? (
                <div className="space-y-6">
                  
                  {/* Verdict Pill */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Institutional Bias</span>
                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold border flex items-center gap-2 ${sentimentStyles.border} ${sentimentStyles.text} bg-white dark:bg-[#111]`}>
                      {aiSummary.sentiment.toUpperCase()}
                      {aiSummary.sentiment === 'Bullish' && <FaLevelUpAlt />}
                      {aiSummary.sentiment === 'Bearish' && <FaLevelDownAlt />}
                      {aiSummary.sentiment === 'Neutral' && <FaMinus />}
                      {aiSummary.sentiment === 'Trap' && <FaExclamationTriangle />}
                    </div>
                  </div>

                  {/* Conviction Meter */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Conviction Score</span>
                      <span className="font-bold dark:text-white">{aiSummary.biasRating}/100</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          aiSummary.biasRating > 70 ? 'bg-emerald-500' : aiSummary.biasRating < 30 ? 'bg-red-500' : 'bg-orange-500'
                        }`} 
                        style={{ width: `${aiSummary.biasRating}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-1 uppercase tracking-wider text-emerald-500">Smart Money</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{aiSummary.smartMoneyPositioning}</p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-1 uppercase tracking-wider text-amber-500">Retail Flow</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{aiSummary.retailDivergence}</p>
                    </div>

                    <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                      <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 mb-1 flex items-center gap-1">
                        <FaInfoCircle /> The Lag Reality
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{aiSummary.laggingDataContext}</p>
                    </div>
                    
                    <div className="pt-2">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">Projected Output</h4>
                      <div className="text-sm text-gray-600 dark:text-gray-300 font-medium italic border-l-2 border-emerald-500 pl-3">
                        "{aiSummary.predictedImpact}"
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-6">
                  Select an asset to generate Institutional AI Analysis.
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
