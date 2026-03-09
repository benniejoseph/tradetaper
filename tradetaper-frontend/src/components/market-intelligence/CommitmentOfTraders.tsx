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
  FaChartLine,
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
  Legend,
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
  educationSignificance?: string;
  educationHowToRead?: string;
  confidence: number;
}

type CotCategory = 'Forex' | 'Indices' | 'Commodities';
type HistoryRange = '6M' | '1Y' | '3Y' | '5Y';

interface CotSupportedSymbol {
  symbol: string;
  label: string;
  category: CotCategory;
  type: 'tff' | 'disagg';
  aliases: string[];
  description: string;
}

const CATEGORY_ORDER: CotCategory[] = ['Forex', 'Indices', 'Commodities'];
const HISTORY_LIMITS: Record<HistoryRange, number> = {
  '6M': 26,
  '1Y': 52,
  '3Y': 156,
  '5Y': 260,
};

const FALLBACK_SYMBOLS: CotSupportedSymbol[] = [
  {
    symbol: 'EURUSD',
    label: 'Euro / US Dollar',
    category: 'Forex',
    type: 'tff',
    aliases: ['EURUSD'],
    description: 'CFTC leveraged funds positioning in Euro FX futures.',
  },
  {
    symbol: 'GBPUSD',
    label: 'British Pound / US Dollar',
    category: 'Forex',
    type: 'tff',
    aliases: ['GBPUSD'],
    description: 'CFTC leveraged funds positioning in British Pound futures.',
  },
  {
    symbol: 'USDJPY',
    label: 'US Dollar / Japanese Yen',
    category: 'Forex',
    type: 'tff',
    aliases: ['USDJPY'],
    description: 'CFTC leveraged funds positioning in JPY futures.',
  },
  {
    symbol: 'AUDUSD',
    label: 'Australian Dollar / US Dollar',
    category: 'Forex',
    type: 'tff',
    aliases: ['AUDUSD'],
    description: 'CFTC leveraged funds positioning in AUD futures.',
  },
  {
    symbol: 'USDCAD',
    label: 'US Dollar / Canadian Dollar',
    category: 'Forex',
    type: 'tff',
    aliases: ['USDCAD'],
    description: 'CFTC leveraged funds positioning in CAD futures.',
  },
  {
    symbol: 'USDCHF',
    label: 'US Dollar / Swiss Franc',
    category: 'Forex',
    type: 'tff',
    aliases: ['USDCHF'],
    description: 'CFTC leveraged funds positioning in CHF futures.',
  },
  {
    symbol: 'NZDUSD',
    label: 'New Zealand Dollar / US Dollar',
    category: 'Forex',
    type: 'tff',
    aliases: ['NZDUSD'],
    description: 'CFTC leveraged funds positioning in NZD futures.',
  },
  {
    symbol: 'ES',
    label: 'E-mini S&P 500',
    category: 'Indices',
    type: 'tff',
    aliases: ['ES', 'SPX', 'SP500', 'US500'],
    description: 'Institutional positioning in E-mini S&P 500 futures.',
  },
  {
    symbol: 'NQ',
    label: 'E-mini NASDAQ-100',
    category: 'Indices',
    type: 'tff',
    aliases: ['NQ', 'NDX', 'NAS100', 'US100'],
    description: 'Institutional positioning in NASDAQ-100 futures.',
  },
  {
    symbol: 'DOW',
    label: 'Dow Jones',
    category: 'Indices',
    type: 'tff',
    aliases: ['DOW', 'DJI', 'DJIA', 'US30'],
    description: 'Institutional positioning in DJIA futures.',
  },
  {
    symbol: 'XAUUSD',
    label: 'Gold',
    category: 'Commodities',
    type: 'disagg',
    aliases: ['XAUUSD', 'XAU', 'GOLD'],
    description: 'Managed money positioning in COMEX Gold futures.',
  },
  {
    symbol: 'XAGUSD',
    label: 'Silver',
    category: 'Commodities',
    type: 'disagg',
    aliases: ['XAGUSD', 'XAG', 'SILVER'],
    description: 'Managed money positioning in COMEX Silver futures.',
  },
  {
    symbol: 'WTI',
    label: 'WTI Crude Oil',
    category: 'Commodities',
    type: 'disagg',
    aliases: ['WTI', 'USOIL', 'CL', 'CRUDE'],
    description: 'Managed money positioning in NYMEX WTI futures.',
  },
  {
    symbol: 'NATGAS',
    label: 'Henry Hub Natural Gas',
    category: 'Commodities',
    type: 'disagg',
    aliases: ['NATGAS', 'NG', 'NATURALGAS'],
    description: 'Managed money positioning in Henry Hub natural gas futures.',
  },
];

export default function CommitmentOfTraders() {
  const [activeCategory, setActiveCategory] = useState<CotCategory>('Forex');
  const [activeSymbol, setActiveSymbol] = useState('EURUSD');
  const [historyRange, setHistoryRange] = useState<HistoryRange>('1Y');
  const [supportedSymbols, setSupportedSymbols] =
    useState<CotSupportedSymbol[]>(FALLBACK_SYMBOLS);

  const [history, setHistory] = useState<CotDataPoint[]>([]);
  const [aiSummary, setAiSummary] = useState<CotAiSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAccessDenied, setAiAccessDenied] = useState(false);

  const symbolsByCategory = useMemo(() => {
    const grouped: Record<CotCategory, CotSupportedSymbol[]> = {
      Forex: [],
      Indices: [],
      Commodities: [],
    };

    for (const symbol of supportedSymbols) {
      grouped[symbol.category].push(symbol);
    }

    return grouped;
  }, [supportedSymbols]);

  const visibleCategories = useMemo(
    () => CATEGORY_ORDER.filter((category) => symbolsByCategory[category].length > 0),
    [symbolsByCategory],
  );

  const activeCategorySymbols = symbolsByCategory[activeCategory] || [];

  const selectedSymbolMeta = useMemo(
    () => supportedSymbols.find((item) => item.symbol === activeSymbol),
    [supportedSymbols, activeSymbol],
  );

  useEffect(() => {
    const fetchSupportedSymbols = async () => {
      try {
        const { data } = await authApiClient.get('/market-intelligence/cot/symbols');
        if (Array.isArray(data) && data.length > 0) {
          setSupportedSymbols(data as CotSupportedSymbol[]);
        }
      } catch (err) {
        console.error('Failed to fetch COT symbols:', err);
      }
    };

    fetchSupportedSymbols();
  }, []);

  useEffect(() => {
    if (visibleCategories.length === 0) return;

    if (!visibleCategories.includes(activeCategory)) {
      setActiveCategory(visibleCategories[0]);
      return;
    }

    if (activeCategorySymbols.length === 0) return;

    const existsInCategory = activeCategorySymbols.some(
      (item) => item.symbol === activeSymbol,
    );

    if (!existsInCategory) {
      setActiveSymbol(activeCategorySymbols[0].symbol);
    }
  }, [
    activeCategory,
    activeCategorySymbols,
    activeSymbol,
    visibleCategories,
  ]);

  useEffect(() => {
    if (!activeSymbol) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await authApiClient.get(
          `/market-intelligence/cot/history/${activeSymbol}`,
          {
            params: {
              limit: HISTORY_LIMITS[historyRange],
              _ts: Date.now(),
            },
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          },
        );

        // Reverse so chronological left to right
        setHistory(Array.isArray(data) ? data.reverse() : []);
      } catch (err) {
        console.error(err);
        setError(
          'Failed to load CFTC historical data. The reporting source may be temporarily unavailable.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeSymbol, historyRange]);

  useEffect(() => {
    if (!activeSymbol) return;

    const fetchAi = async () => {
      setAiLoading(true);
      try {
        const { data } = await authApiClient.get(
          `/market-intelligence/cot/analysis/${activeSymbol}`,
        );
        setAiSummary(data);
        setAiAccessDenied(false);
      } catch (err) {
        console.error(err);
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (status === 403) {
          setAiAccessDenied(true);
        } else {
          setAiAccessDenied(false);
        }
        setAiSummary(null);
      } finally {
        setAiLoading(false);
      }
    };

    fetchAi();
  }, [activeSymbol]);

  const chartData = useMemo(() => {
    return history.map((item) => ({
      ...item,
      displayDate: new Date(item.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      smartMoney: item.netNonCommercial,
      retail: item.netNonReportable,
    }));
  }, [history]);

  const latestReportDate = useMemo(() => {
    if (history.length === 0) return null;
    const latest = history[history.length - 1]?.date;
    return latest ? new Date(latest) : null;
  }, [history]);

  const getSentimentStyling = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'bullish':
        return {
          text: 'text-emerald-500',
          border: 'border-emerald-500/30',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
        };
      case 'bearish':
        return {
          text: 'text-red-500',
          border: 'border-red-500/30',
          glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]',
        };
      case 'trap':
        return {
          text: 'text-orange-500',
          border: 'border-orange-500/30',
          glow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]',
        };
      case 'exhausted':
        return {
          text: 'text-purple-500',
          border: 'border-purple-500/30',
          glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]',
        };
      default:
        return {
          text: 'text-gray-400',
          border: 'border-gray-500/30',
          glow: '',
        };
    }
  };

  const sentimentStyles = getSentimentStyling(aiSummary?.sentiment);

  return (
    <div className="flex flex-col space-y-6">
      {/* 1. Header and Selectors */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex space-x-2 bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl">
          {visibleCategories.map((cat) => (
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
          {activeCategorySymbols.map((sym) => (
            <button
              key={sym.symbol}
              onClick={() => setActiveSymbol(sym.symbol)}
              title={sym.label}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                activeSymbol === sym.symbol
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'bg-white dark:bg-[#111] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-zinc-800'
              }`}
            >
              {sym.symbol}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <FaSpinner className="animate-spin text-3xl text-emerald-500 mb-4" />
          <p className="text-gray-500">Connecting to CFTC ledger...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl flex items-start gap-4">
          <FaExclamationTriangle className="text-red-500 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-800 dark:text-red-400">Data Source Error</h3>
            <p className="text-red-600 dark:text-red-500/80 text-sm mt-1">{error}</p>
          </div>
        </div>
      ) : history.length === 0 ? (
        <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl flex items-start gap-4">
          <FaInfoCircle className="text-amber-500 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-800 dark:text-amber-400">No COT Records Yet</h3>
            <p className="text-amber-700 dark:text-amber-500/80 text-sm mt-1">
              No CFTC rows were returned for {activeSymbol}. Try ES, NQ, DOW, XAUUSD, XAGUSD, WTI,
              or NATGAS, or check again after the next weekly CFTC release.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Chart Column */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#080808] border border-gray-200 dark:border-[#1A1A1A] p-5 rounded-xl shadow-sm">
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:justify-between md:items-end">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FaChartLine className="text-emerald-500" /> Net Institutional Positioning
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedSymbolMeta?.label || activeSymbol} | Smart money vs retail over {historyRange}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Latest report: {latestReportDate ? latestReportDate.toLocaleDateString() : 'N/A'} |
                    COT snapshots are taken on Tuesday and published on Friday.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(Object.keys(HISTORY_LIMITS) as HistoryRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setHistoryRange(range)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        historyRange === range
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-500/50'
                          : 'bg-white dark:bg-[#111] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-zinc-800'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="displayDate" stroke="#666" fontSize={11} tickMargin={10} />
                    <YAxis
                      stroke="#666"
                      fontSize={11}
                      axisLine={false}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111',
                        borderColor: '#222',
                        borderRadius: '8px',
                      }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: '#888', marginBottom: '4px' }}
                      formatter={(value: number) => [
                        `${new Intl.NumberFormat().format(value)} contracts`,
                        '',
                      ]}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line
                      name="Smart Money (Hedge Funds)"
                      type="monotone"
                      dataKey="smartMoney"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    />
                    <Line
                      name="Retail (Non-Reportable)"
                      type="monotone"
                      dataKey="retail"
                      stroke="#f59e0b"
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
                      contentStyle={{
                        backgroundColor: '#111',
                        borderColor: '#222',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [
                        new Intl.NumberFormat().format(value),
                        'Open Interest',
                      ]}
                      labelFormatter={() => ''}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Predictive Panel Column */}
          <div className="space-y-6">
            <div
              className={`p-6 rounded-2xl bg-white dark:bg-[#0a0a0a] border ${sentimentStyles.border} ${sentimentStyles.glow} transition-all duration-500`}
            >
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
                  <p className="text-xs text-gray-500">Live price vs CFTC positioning</p>
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
                    <div
                      className={`px-4 py-1.5 rounded-full text-sm font-bold border flex items-center gap-2 ${sentimentStyles.border} ${sentimentStyles.text} bg-white dark:bg-[#111]`}
                    >
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
                          aiSummary.biasRating > 70
                            ? 'bg-emerald-500'
                            : aiSummary.biasRating < 30
                              ? 'bg-red-500'
                              : 'bg-orange-500'
                        }`}
                        style={{ width: `${aiSummary.biasRating}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-1 uppercase tracking-wider text-emerald-500">
                        Smart Money
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {aiSummary.smartMoneyPositioning}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-1 uppercase tracking-wider text-amber-500">
                        Retail Flow
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {aiSummary.retailDivergence}
                      </p>
                    </div>

                    <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                      <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 mb-1 flex items-center gap-1">
                        <FaInfoCircle /> Data Lag Context
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        {aiSummary.laggingDataContext}
                      </p>
                    </div>

                    <div className="pt-2">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">
                        Projected Output
                      </h4>
                      <div className="text-sm text-gray-600 dark:text-gray-300 font-medium italic border-l-2 border-emerald-500 pl-3">
                        "{aiSummary.predictedImpact}"
                      </div>
                    </div>

                    <div className="pt-2 space-y-3">
                      <div className="p-3 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20">
                        <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1 uppercase tracking-wider">
                          AI Coach: Why COT Matters
                        </h4>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                          {aiSummary.educationSignificance ||
                            'COT helps you see where large speculative capital is concentrated and whether that concentration is becoming crowded.'}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/40">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-1 uppercase tracking-wider">
                          AI Coach: How to Read This Setup
                        </h4>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                          {aiSummary.educationHowToRead ||
                            'Use COT direction as context, then wait for technical confirmation. Avoid entries based only on one weekly print.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : aiAccessDenied ? (
                <div className="text-sm text-amber-600 dark:text-amber-400 text-center py-6">
                  AI COT analysis is premium-gated for this account. Historical COT chart data remains
                  available.
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-6">
                  Select an asset to generate AI COT analysis.
                </div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                How Traders Use COT in Practice
              </h3>
              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                <p>
                  1) Track multi-week trend in smart-money net positioning, not one isolated print.
                </p>
                <p>
                  2) Compare that trend against current price momentum for confirmation or divergence.
                </p>
                <p>
                  3) Treat extremes as context for risk management, then execute only on your chart setup.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
