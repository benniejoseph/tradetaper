// src/components/backtesting/workbench/SessionSidebar.tsx
'use client';

import React, { useMemo } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClosedTrade {
  type:      'LONG' | 'SHORT';
  entry:     number;
  exitPrice: number;
  sl:        number;
  tp:        number;
  lotSize:   number;
  entryTime: number;
  exitTime:  number;
  pnl:       number;
}

interface Props {
  openPosition:    any | null;
  currentPrice:    number;
  currentTime:     number;
  trades:          ClosedTrade[];
  balance:         number;
  startingBalance: number;
  symbol?:         string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtDate = (ts: number) => {
  if (!ts) return '—';
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
       + ' '
       + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const fmtDuration = (startTs: number, endTs: number) => {
  const secs = Math.max(0, endTs - startTs);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return '<1m';
};

const pipDist = (a: number, b: number, symbol?: string) => {
  const pip = symbol?.includes('JPY') || symbol === 'XAUUSD' ? 0.01 : 0.0001;
  return ((Math.abs(a - b)) / pip).toFixed(0) + 'p';
};

const clr = (val: number) =>
  val > 0 ? '#10B981' : val < 0 ? '#EF4444' : '#64748B';

const fmt$ = (val: number) =>
  (val >= 0 ? '+' : '') + '$' + Math.abs(val).toFixed(2);

// ── Component ─────────────────────────────────────────────────────────────────

export default function SessionSidebar({
  openPosition, currentPrice, currentTime,
  trades, balance, startingBalance, symbol,
}: Props) {

  // ── Session stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const wins      = trades.filter(t => t.pnl > 0);
    const losses    = trades.filter(t => t.pnl <= 0);
    const totalPnl  = trades.reduce((s, t) => s + t.pnl, 0);
    const winRate   = trades.length ? (wins.length / trades.length) * 100 : 0;
    const grossWin  = wins.reduce((s, t) => s + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
    const pf        = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 99 : 0;
    const avgWin    = wins.length   ? grossWin  / wins.length  : 0;
    const avgLoss   = losses.length ? grossLoss / losses.length : 0;
    return { totalPnl, winRate, pf, wins: wins.length, losses: losses.length, avgWin, avgLoss };
  }, [trades]);

  // ── Unrealized P&L ─────────────────────────────────────────────────────────
  const unrealized = useMemo(() => {
    if (!openPosition) return 0;
    return openPosition.type === 'LONG'
      ? (currentPrice - openPosition.entry) * openPosition.lotSize * 100
      : (openPosition.entry - currentPrice) * openPosition.lotSize * 100;
  }, [openPosition, currentPrice]);

  // ── Equity sparkline ───────────────────────────────────────────────────────
  const sparklinePath = useMemo(() => {
    if (trades.length < 2) return null;
    const pts: number[] = [startingBalance];
    let running = startingBalance;
    for (const t of trades) { running += t.pnl; pts.push(running); }
    const minV  = Math.min(...pts);
    const maxV  = Math.max(...pts);
    const range = maxV - minV || 1;
    const W = 200; const H = 30;
    return pts.map((v, i) => {
      const x = (i / (pts.length - 1)) * W;
      const y = H - ((v - minV) / range) * (H - 4) - 2;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }, [trades, startingBalance]);

  // ── R:R helper ─────────────────────────────────────────────────────────────
  const rr = openPosition
    ? (() => {
        const reward = Math.abs(openPosition.tp - openPosition.entry);
        const risk   = Math.abs(openPosition.entry - openPosition.sl);
        return risk > 0 ? (reward / risk).toFixed(2) : '—';
      })()
    : '—';

  const pfColor = stats.pf >= 1.5 ? '#10B981' : stats.pf >= 1 ? '#FBBF24' : '#EF4444';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <aside className="w-56 flex-shrink-0 border-l border-white/5 bg-slate-900/60 backdrop-blur-sm flex flex-col overflow-hidden">

      {/* ── Session stats ── */}
      <div className="p-3 border-b border-white/5">
        <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-2.5">
          Session
        </div>

        {/* 2-col stat grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">

          {/* Net P&L */}
          <div>
            <div className="text-[9px] text-slate-500 mb-0.5">Net P&L</div>
            <div className="text-[12px] font-bold font-mono" style={{ color: clr(stats.totalPnl) }}>
              {fmt$(stats.totalPnl)}
            </div>
          </div>

          {/* Win Rate */}
          <div>
            <div className="text-[9px] text-slate-500 mb-0.5">Win Rate</div>
            <div className="text-[12px] font-bold font-mono text-white">
              {stats.winRate.toFixed(0)}%
              <span className="text-[9px] font-normal text-slate-500 ml-1">
                {stats.wins}W / {stats.losses}L
              </span>
            </div>
          </div>

          {/* Profit Factor */}
          <div>
            <div className="text-[9px] text-slate-500 mb-0.5">Profit Factor</div>
            <div className="text-[12px] font-bold font-mono" style={{ color: pfColor }}>
              {stats.pf >= 99 ? '∞' : stats.pf.toFixed(2)}
            </div>
          </div>

          {/* Avg Win / Loss */}
          <div>
            <div className="text-[9px] text-slate-500 mb-0.5">Avg W / L</div>
            <div className="text-[11px] font-mono">
              <span className="text-emerald-400">${stats.avgWin.toFixed(0)}</span>
              <span className="text-slate-600 mx-0.5">/</span>
              <span className="text-red-400">${stats.avgLoss.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Equity sparkline */}
        {sparklinePath && (
          <div className="mt-3">
            <svg width="100%" height={30} viewBox="0 0 200 30" preserveAspectRatio="none">
              <path
                d={sparklinePath} fill="none"
                stroke={stats.totalPnl >= 0 ? '#10B981' : '#EF4444'}
                strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {/* No-trades placeholder */}
        {trades.length === 0 && !openPosition && (
          <div className="text-[10px] text-slate-600 mt-2 text-center">
            No trades yet
          </div>
        )}
      </div>

      {/* ── Open position card ── */}
      {openPosition && (
        <div className="p-3 border-b border-white/5">

          {/* Header: type badge + unrealized P&L */}
          <div className="flex items-center justify-between mb-2.5">
            <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${
              openPosition.type === 'LONG' ? 'text-blue-400' : 'text-pink-400'
            }`}>
              <span>{openPosition.type === 'LONG' ? '▲' : '▼'}</span>
              <span>{openPosition.type}</span>
              <span className="text-[8px] font-normal text-slate-600 normal-case tracking-normal">
                • open
              </span>
            </div>
            <div
              className="text-[11px] font-bold font-mono px-1.5 py-0.5 rounded"
              style={{ color: clr(unrealized), background: clr(unrealized) + '22' }}
            >
              {fmt$(unrealized)}
            </div>
          </div>

          {/* Entry / Current prices */}
          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Entry</span>
              <span className="font-mono text-slate-200">{openPosition.entry?.toFixed(5)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current</span>
              <span className="font-mono" style={{ color: clr(unrealized) }}>
                {currentPrice.toFixed(5)}
              </span>
            </div>
          </div>

          {/* SL / TP with pip distances */}
          <div className="mt-2 space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-red-400 font-semibold w-6">SL</span>
              <span className="font-mono text-slate-300">{openPosition.sl?.toFixed(5)}</span>
              <span className="text-[9px] text-slate-600 tabular-nums w-10 text-right">
                {pipDist(currentPrice, openPosition.sl, symbol)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 font-semibold w-6">TP</span>
              <span className="font-mono text-slate-300">{openPosition.tp?.toFixed(5)}</span>
              <span className="text-[9px] text-slate-600 tabular-nums w-10 text-right">
                {pipDist(currentPrice, openPosition.tp, symbol)}
              </span>
            </div>
          </div>

          {/* R:R + time in trade */}
          <div className="mt-2.5 flex items-center justify-between text-[9px] text-slate-500 border-t border-white/5 pt-2">
            <span>
              R:R{' '}
              <span className="text-slate-300 font-mono font-semibold">{rr}</span>
            </span>
            <span>
              {currentTime > 0 && openPosition.entryTime
                ? fmtDuration(openPosition.entryTime, currentTime)
                : '—'}{' '}
              in trade
            </span>
          </div>
        </div>
      )}

      {/* ── Trade log ── */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="px-3 py-2 border-b border-white/5 flex-shrink-0">
          <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">
            Trade Log
            {trades.length > 0 && (
              <span className="ml-1.5 text-slate-600 font-normal normal-case tracking-normal">
                {trades.length} closed
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">

          {trades.length === 0 && (
            <div className="flex flex-col items-center justify-center h-24 gap-1.5 px-4">
              <div className="text-slate-700 text-lg">○</div>
              <div className="text-[10px] text-slate-600 text-center">
                Closed trades will appear here
              </div>
            </div>
          )}

          {[...trades].reverse().map((t, i) => {
            const win    = t.pnl > 0;
            const pnlClr = clr(t.pnl);
            return (
              <div
                key={i}
                className="px-3 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
              >
                {/* Type + P&L */}
                <div className="flex items-center justify-between mb-1">
                  <div className={`text-[10px] font-bold uppercase flex items-center gap-1 ${
                    t.type === 'LONG' ? 'text-blue-400' : 'text-pink-400'
                  }`}>
                    <span>{t.type === 'LONG' ? '▲' : '▼'}</span>
                    <span>{t.type}</span>
                    <span className="text-[8px] text-slate-600 font-normal normal-case ml-0.5">
                      ×{t.lotSize?.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold font-mono" style={{ color: pnlClr }}>
                    {fmt$(t.pnl)}
                  </div>
                </div>

                {/* Entry → Exit */}
                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                  <span>{t.entry?.toFixed(5)}</span>
                  <span className="text-slate-700 mx-1">→</span>
                  <span className={win ? 'text-emerald-500' : 'text-red-500'}>
                    {t.exitPrice?.toFixed(5)}
                  </span>
                </div>

                {/* Timestamp + duration */}
                {t.exitTime && (
                  <div className="flex items-center justify-between mt-1 text-[9px] text-slate-600">
                    <span>{fmtDate(t.exitTime)}</span>
                    {t.entryTime && (
                      <span>{fmtDuration(t.entryTime, t.exitTime)}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
