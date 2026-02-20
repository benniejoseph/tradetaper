import React, { useState } from 'react';
import { FaChartPie, FaArrowUp, FaArrowDown, FaMinus, FaSyncAlt } from 'react-icons/fa';
import { authApiClient as api } from '@/services/api';

interface PairAnalysisReport {
  symbol: string;
  timestamp: string;
  bias: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  summary: string;
  keyDrivers: string[];
  keyRisks: string[];
  scenarios: {
    bullish: string;
    bearish: string;
    neutral: string;
  };
  keyLevels: number[];
  tradePlan: {
    intraday: string[];
    swing: string[];
  };
  economicEvents: {
    id: string;
    title: string;
    currency: string;
    date: string;
    importance: string;
    actual?: string | number;
    forecast?: string | number;
    previous?: string | number;
  }[];
  news: {
    title: string;
    source: string;
    publishedAt: string;
    sentiment: string;
    impact: string;
    url: string;
  }[];
  quote?: {
    bid: number;
    ask: number;
    change: number;
    changePercent: number;
    source: string;
  };
}

const SentimentDashboard: React.FC = () => {
  const [symbol, setSymbol] = useState('EURUSD');
  const [report, setReport] = useState<PairAnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/market-intelligence/ai-analysis/pair', {
        params: { symbol },
      });
      setReport(response.data);
    } catch (err) {
      console.error('Failed to fetch AI analysis', err);
      setError('Failed to load AI analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-emerald-500';
      case 'bearish': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
 
  const getBiasIcon = (bias: string) => {
    switch(bias) {
      case 'bullish': return <FaArrowUp className="text-emerald-500" />;
      case 'bearish': return <FaArrowDown className="text-red-500" />;
      default: return <FaMinus className="text-gray-500" />;
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="bg-gradient-to-r from-black via-[#050505] to-emerald-950/40 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <FaChartPie className="mr-3 text-emerald-400" />
              AI Pair Intelligence
            </h2>
            <p className="text-sm text-emerald-100/80">
              Blend of economic calendar, news hub, and live pricing for the selected symbol.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="rounded-full bg-black/60 border border-emerald-800/60 px-4 py-2 text-sm text-emerald-100"
            >
              {['EURUSD','GBPUSD','USDJPY','XAUUSD','USDCAD','AUDUSD','NZDUSD','NAS100','SPX500'].map((sym) => (
                <option key={sym} value={sym}>{sym}</option>
              ))}
            </select>
            <button
              onClick={fetchAnalysis}
              className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold px-4 py-2 flex items-center gap-2"
              disabled={loading}
            >
              <FaSyncAlt className={loading ? 'animate-spin' : ''} />
              {loading ? 'Analyzing...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!report && !loading && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          Select a symbol and generate a fresh AI analysis.
        </div>
      )}

      {report && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-6">
            <div className="bg-white dark:bg-black/70 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-emerald-900/40">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{report.symbol}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Updated {new Date(report.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold uppercase ${getSentimentColor(report.bias)}`}>
                    {report.bias}
                  </span>
                  {getBiasIcon(report.bias)}
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {report.summary}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-emerald-950/40">
                  Confidence: {report.confidence}%
                </span>
                {report.quote && (
                  <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-emerald-950/40">
                    Quote: {report.quote.bid} / {report.quote.ask}
                  </span>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-black/70 rounded-xl p-5 border border-gray-100 dark:border-emerald-900/40">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Key Drivers</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 list-disc pl-4">
                  {report.keyDrivers.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white dark:bg-black/70 rounded-xl p-5 border border-gray-100 dark:border-emerald-900/40">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Key Risks</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2 list-disc pl-4">
                  {report.keyRisks.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white dark:bg-black/70 rounded-xl p-5 border border-gray-100 dark:border-emerald-900/40">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Scenarios</h4>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <div><span className="font-semibold text-emerald-500">Bullish:</span> {report.scenarios.bullish}</div>
                <div><span className="font-semibold text-red-500">Bearish:</span> {report.scenarios.bearish}</div>
                <div><span className="font-semibold text-gray-500">Neutral:</span> {report.scenarios.neutral}</div>
              </div>
            </div>

            <div className="bg-white dark:bg-black/70 rounded-xl p-5 border border-gray-100 dark:border-emerald-900/40">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Trade Plan</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
                <div>
                  <span className="font-semibold text-gray-500 uppercase text-xs">Intraday</span>
                  <ul className="mt-2 space-y-2 list-disc pl-4">
                    {report.tradePlan.intraday.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 uppercase text-xs">Swing</span>
                  <ul className="mt-2 space-y-2 list-disc pl-4">
                    {report.tradePlan.swing.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-black/70 rounded-xl p-5 border border-gray-100 dark:border-emerald-900/40">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Key Levels</h4>
              <div className="flex flex-wrap gap-2">
                {report.keyLevels.map((lvl, idx) => (
                  <span key={idx} className="px-2 py-1 rounded bg-gray-100 dark:bg-black/80 text-xs text-gray-700 dark:text-gray-300 font-mono">
                    {lvl}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-black/70 rounded-xl p-5 border border-gray-100 dark:border-emerald-900/40">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Upcoming Economic Events</h4>
              <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
                {report.economicEvents.map((event) => (
                  <div key={event.id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{event.title}</p>
                      <p>{event.currency} • {new Date(event.date).toLocaleString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] uppercase ${event.importance === 'high' ? 'bg-red-100 text-red-600' : event.importance === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {event.importance}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-black/70 rounded-xl p-5 border border-gray-100 dark:border-emerald-900/40">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Latest News Drivers</h4>
              <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
                {report.news.map((item, idx) => (
                  <a key={idx} href={item.url} target="_blank" rel="noreferrer" className="block hover:text-emerald-500">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{item.title}</p>
                    <p>{item.source} • {new Date(item.publishedAt).toLocaleString()}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SentimentDashboard;
