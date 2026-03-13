'use client';

// src/app/(app)/backtesting/sessions/new/page.tsx
// Full-page form to configure and start a new Chart Replay session.
// Mirrors SessionConfigModal logic but as a routable page (no overlay).

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiChevronLeft,
  FiPlay,
  FiChevronDown,
  FiChevronUp,
  FiAlertTriangle,
} from 'react-icons/fi';

// ── Data ─────────────────────────────────────────────────────────────────────
const SYMBOLS = [
  { value: 'XAUUSD', label: 'Gold (XAU/USD)',         category: 'Commodities' },
  { value: 'EURUSD', label: 'Euro (EUR/USD)',          category: 'Forex' },
  { value: 'GBPUSD', label: 'British Pound (GBP/USD)',category: 'Forex' },
  { value: 'USDJPY', label: 'USD/Yen (USD/JPY)',      category: 'Forex' },
  { value: 'USDCAD', label: 'USD/CAD',                category: 'Forex' },
  { value: 'AUDUSD', label: 'AUD/USD',                category: 'Forex' },
  { value: 'BTCUSD', label: 'Bitcoin (BTC/USD)',      category: 'Crypto' },
  { value: 'ETHUSD', label: 'Ethereum (ETH/USD)',     category: 'Crypto' },
];

const TIMEFRAMES = [
  { value: '1m',  label: '1 Minute',   desc: 'Scalping · High frequency' },
  { value: '5m',  label: '5 Minutes',  desc: 'Scalping · ICT kill zones' },
  { value: '15m', label: '15 Minutes', desc: 'Intraday · Good for most' },
  { value: '30m', label: '30 Minutes', desc: 'Intraday · Swing entries' },
  { value: '1h',  label: '1 Hour',     desc: 'Intraday / Swing' },
  { value: '4h',  label: '4 Hours',    desc: 'Swing · HTF confirmation' },
  { value: '1d',  label: '1 Day',      desc: 'Position / Long-term' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function NewReplaySessionPage() {
  const router = useRouter();

  // Core fields
  const [symbol,          setSymbol]          = useState('XAUUSD');
  const [timeframe,       setTimeframe]       = useState('15m');
  const [startDate,       setStartDate]       = useState('2024-01-01');
  const [endDate,         setEndDate]         = useState('2024-01-31');
  const [startingBalance, setStartingBalance] = useState('100000');

  // Sim settings (collapsed by default)
  const [showSim,    setShowSim]    = useState(false);
  const [spreadPips, setSpreadPips] = useState('1.5');
  const [slippage,   setSlippage]   = useState('0');
  const [commission, setCommission] = useState('0');

  // UX state
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

      // 1. Fetch CSRF token
      const csrfRes = await fetch(`${apiUrl}/csrf-token`, { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      // 2. Create session
      const res = await fetch(`${apiUrl}/backtesting/sessions`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'X-CSRF-Token':  csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          symbol,
          timeframe,
          startDate:       new Date(startDate).toISOString(),
          endDate:         new Date(endDate).toISOString(),
          startingBalance: parseFloat(startingBalance),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to create session');
      }

      const session = await res.json();

      // 3. Redirect into the workbench
      router.push(
        `/backtesting/session/${session.id}` +
        `?symbol=${symbol}` +
        `&timeframe=${timeframe}` +
        `&startDate=${startDate}` +
        `&endDate=${endDate}` +
        `&balance=${startingBalance}` +
        `&spread=${spreadPips}` +
        `&slippage=${slippage}` +
        `&commission=${commission}`,
      );
    } catch (err: any) {
      console.error('Failed to create session:', err);
      setError(err.message || 'Failed to create replay session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-teal-900/15 rounded-full blur-3xl" />
      </div>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-white/5 flex items-center gap-4 px-6 bg-slate-900/60 backdrop-blur-sm relative z-10">
        <Link
          href="/backtesting"
          className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <FiChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-bold text-white leading-tight">New Replay Session</h1>
          <p className="text-xs text-slate-500">Configure and launch the Chart Replay Workbench</p>
        </div>
      </header>

      {/* ── Form card ───────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-xl">

          {/* Card */}
          <div className="bg-slate-900/70 border border-white/8 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">

            {/* Card header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <FiPlay className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Session Configuration</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Choose your market, timeframe &amp; date range</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

              {/* ── Symbol ──────────────────────────────────────────────────── */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">
                  Market / Symbol
                </label>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-slate-800/60 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
                >
                  {SYMBOLS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ── Timeframe ────────────────────────────────────────────────── */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Timeframe</label>
                <div className="grid grid-cols-4 gap-2">
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf.value}
                      type="button"
                      onClick={() => setTimeframe(tf.value)}
                      title={tf.desc}
                      className={`py-2 rounded-lg text-sm font-semibold transition-all border ${
                        timeframe === tf.value
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                          : 'bg-slate-800/50 border-white/8 text-slate-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {tf.value}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  {TIMEFRAMES.find(t => t.value === timeframe)?.desc}
                </p>
              </div>

              {/* ── Date Range ──────────────────────────────────────────────── */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">Date Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Start</p>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 bg-slate-800/60 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">End</p>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 bg-slate-800/60 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors [color-scheme:dark]"
                    />
                  </div>
                </div>
              </div>

              {/* ── Starting Balance ─────────────────────────────────────────── */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">
                  Starting Balance (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                  <input
                    type="number"
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(e.target.value)}
                    min="1000"
                    step="1000"
                    required
                    className="w-full pl-7 pr-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
                  />
                </div>
                {/* Quick presets */}
                <div className="flex gap-2 flex-wrap">
                  {[10000, 50000, 100000, 200000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setStartingBalance(String(v))}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                        startingBalance === String(v)
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-800/40 border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/15'
                      }`}
                    >
                      ${(v / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Simulation Settings (collapsible) ───────────────────────── */}
              <div className="border border-white/8 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSim(!showSim)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/40 hover:bg-slate-800/60 transition-colors text-sm text-slate-300 font-medium"
                >
                  <span className="flex items-center gap-2">
                    <span>⚙️</span>
                    <span>Simulation Settings</span>
                    <span className="text-xs text-slate-500 font-normal">spread · slippage · commission</span>
                  </span>
                  {showSim ? (
                    <FiChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <FiChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showSim && (
                  <div className="px-4 py-4 space-y-4 bg-slate-900/40">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Spread (pips)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={spreadPips}
                          onChange={(e) => setSpreadPips(e.target.value)}
                          placeholder="1.5"
                          className="w-full px-2.5 py-2 bg-slate-800/60 border border-white/8 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                        />
                        <p className="text-[10px] text-slate-600 mt-0.5">e.g. 1.5 for EUR</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Slippage (pips)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={slippage}
                          onChange={(e) => setSlippage(e.target.value)}
                          placeholder="0"
                          className="w-full px-2.5 py-2 bg-slate-800/60 border border-white/8 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                        />
                        <p className="text-[10px] text-slate-600 mt-0.5">Market impact</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Commission ($/side)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={commission}
                          onChange={(e) => setCommission(e.target.value)}
                          placeholder="0"
                          className="w-full px-2.5 py-2 bg-slate-800/60 border border-white/8 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                        />
                        <p className="text-[10px] text-slate-600 mt-0.5">×2 per trade</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-amber-500/8 border border-amber-500/20 rounded-lg">
                      <FiAlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-400/80">
                        Realistic spreads make backtests more accurate. Zero = perfect fills (optimistic).
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Error ───────────────────────────────────────────────────── */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* ── Submit ──────────────────────────────────────────────────── */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-semibold text-base transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating Session…
                    </>
                  ) : (
                    <>
                      <FiPlay className="w-4 h-4" />
                      Launch Replay Workbench
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-600 mt-3">
                  Candle data is fetched from TwelveData · Free account: 800 req/day
                </p>
              </div>
            </form>
          </div>

          {/* Info blurb */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[
              { icon: '📈', title: 'Real OHLCV', desc: 'Live market data via TwelveData' },
              { icon: '⏱️', title: 'Tick Replay', desc: 'Intra-candle animation mode' },
              { icon: '💰', title: 'Risk Sim', desc: 'Spread, slippage & commission' },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-slate-900/40 border border-white/5 rounded-xl p-3"
              >
                <div className="text-xl mb-1">{item.icon}</div>
                <div className="text-xs font-semibold text-slate-300">{item.title}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
