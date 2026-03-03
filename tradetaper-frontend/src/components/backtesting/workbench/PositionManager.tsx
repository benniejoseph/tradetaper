'use client';

// src/components/backtesting/workbench/PositionManager.tsx
// Shown when a position is open — allows trade management:
//   • View unrealized P&L in real-time
//   • Adjust SL / TP via numeric inputs
//   • Move SL to Break-Even
//   • Close at market

import React, { useState, useEffect } from 'react';
import {
  FiArrowUp, FiArrowDown, FiX, FiShield, FiTarget,
  FiTrendingUp, FiTrendingDown,
} from 'react-icons/fi';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OpenPosition {
  type:       'LONG' | 'SHORT';
  entry:      number;
  sl:         number;
  tp:         number;
  lotSize:    number;
  entryTime?: number;
}

interface Props {
  position:      OpenPosition;
  currentPrice:  number;
  currentTime:   number;
  balance:       number;
  symbol?:       string;
  isDark?:       boolean;
  onClose:       () => void;          // Close at market
  onSlTpChange:  (sl: number, tp: number) => void; // Update SL/TP
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const getPipValue = (sym?: string) =>
  sym?.includes('JPY') || sym === 'XAUUSD' ? 0.01 : 0.0001;

const fmtDuration = (start: number, now: number) => {
  const s = Math.max(0, now - start);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m` : '<1m';
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function PositionManager({
  position, currentPrice, currentTime,
  balance, symbol, isDark = true, onClose, onSlTpChange,
}: Props) {
  const [slInput, setSlInput] = useState(position.sl.toFixed(5));
  const [tpInput, setTpInput] = useState(position.tp.toFixed(5));
  const [showConfirm, setShowConfirm] = useState(false);

  // Keep inputs in sync when position changes (e.g. drag from chart)
  useEffect(() => { setSlInput(position.sl.toFixed(5)); }, [position.sl]);
  useEffect(() => { setTpInput(position.tp.toFixed(5)); }, [position.tp]);

  const pip    = getPipValue(symbol);
  const isLong = position.type === 'LONG';

  // Unrealized P&L
  const unrealized = isLong
    ? (currentPrice - position.entry) * position.lotSize * 100
    : (position.entry - currentPrice) * position.lotSize * 100;

  const unrealizedPct = (unrealized / balance) * 100;
  const isPosUnreal   = unrealized >= 0;

  // Distances in pips
  const slPips = Math.abs(currentPrice - position.sl) / pip;
  const tpPips = Math.abs(currentPrice - position.tp) / pip;
  const rr     = (() => {
    const reward = Math.abs(position.tp - position.entry);
    const risk   = Math.abs(position.entry - position.sl);
    return risk > 0 ? (reward / risk).toFixed(2) : '—';
  })();

  const handleSlChange = () => {
    const v = parseFloat(slInput);
    if (!isNaN(v) && v !== position.sl) onSlTpChange(v, position.tp);
  };

  const handleTpChange = () => {
    const v = parseFloat(tpInput);
    if (!isNaN(v) && v !== position.tp) onSlTpChange(position.sl, v);
  };

  const handleMoveToBreakEven = () => {
    onSlTpChange(position.entry, position.tp);
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const card   = isDark
    ? 'bg-slate-900/90 border-white/10 text-white'
    : 'bg-white border-gray-200 text-gray-900';
  const input  = isDark
    ? 'bg-slate-800 border-white/10 text-white placeholder-slate-500 focus:border-emerald-500'
    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-emerald-500';
  const muted  = isDark ? 'text-slate-400' : 'text-gray-500';
  const border = isDark ? 'border-white/5' : 'border-gray-200';

  return (
    <div className={`rounded-xl border backdrop-blur-md w-72 flex flex-col gap-0 shadow-2xl overflow-hidden ${card}`}>

      {/* ── Header: type + unrealized ────────────────────────────────────────── */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b ${border} ${
        isLong ? 'bg-blue-500/10' : 'bg-pink-500/10'
      }`}>
        <div className={`flex items-center gap-2 font-bold text-sm ${
          isLong ? 'text-blue-400' : 'text-pink-400'
        }`}>
          {isLong ? <FiArrowUp className="w-4 h-4" /> : <FiArrowDown className="w-4 h-4" />}
          <span>{position.type}</span>
          <span className={`text-[10px] font-normal ${muted}`}>×{position.lotSize.toFixed(2)}</span>
        </div>

        {/* Unrealized */}
        <div className="text-right">
          <div className={`text-base font-bold font-mono ${isPosUnreal ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPosUnreal ? '+' : ''}${unrealized.toFixed(2)}
          </div>
          <div className={`text-[10px] font-mono ${isPosUnreal ? 'text-emerald-500' : 'text-red-500'}`}>
            {isPosUnreal ? '▲' : '▼'}{Math.abs(unrealizedPct).toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">

        {/* ── Price info ────────────────────────────────────────────────────── */}
        <div className={`grid grid-cols-2 gap-2 text-xs pb-2 border-b ${border}`}>
          <div>
            <span className={muted}>Entry</span>
            <div className="font-mono font-semibold">{position.entry.toFixed(5)}</div>
          </div>
          <div>
            <span className={muted}>Current</span>
            <div className={`font-mono font-semibold ${isPosUnreal ? 'text-emerald-400' : 'text-red-400'}`}>
              {currentPrice.toFixed(5)}
            </div>
          </div>
          <div>
            <span className={muted}>R:R</span>
            <div className="font-mono font-semibold text-amber-400">{rr}</div>
          </div>
          <div>
            <span className={muted}>In trade</span>
            <div className="font-mono font-semibold">
              {position.entryTime && currentTime
                ? fmtDuration(position.entryTime, currentTime)
                : '—'}
            </div>
          </div>
        </div>

        {/* ── SL / TP inputs ───────────────────────────────────────────────── */}
        <div className="space-y-2">
          {/* SL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-red-400 flex items-center gap-1">
                <FiShield className="w-3 h-3" /> Stop Loss
              </label>
              <span className={`text-[10px] font-mono ${muted}`}>{slPips.toFixed(0)}p away</span>
            </div>
            <div className="flex gap-1.5">
              <input
                type="number"
                step="0.00001"
                value={slInput}
                onChange={(e) => setSlInput(e.target.value)}
                onBlur={handleSlChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSlChange()}
                className={`flex-1 text-sm border rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-red-500 ${input}`}
              />
              <button
                onClick={handleMoveToBreakEven}
                title="Move SL to Break-Even"
                className="px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-semibold hover:bg-amber-500/25 transition-colors whitespace-nowrap"
              >
                BE
              </button>
            </div>
          </div>

          {/* TP */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <FiTarget className="w-3 h-3" /> Take Profit
              </label>
              <span className={`text-[10px] font-mono ${muted}`}>{tpPips.toFixed(0)}p away</span>
            </div>
            <input
              type="number"
              step="0.00001"
              value={tpInput}
              onChange={(e) => setTpInput(e.target.value)}
              onBlur={handleTpChange}
              onKeyDown={(e) => e.key === 'Enter' && handleTpChange()}
              className={`w-full text-sm border rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 ${input}`}
            />
          </div>
        </div>

        {/* Pip adjust buttons for SL */}
        <div className="flex gap-1.5">
          {[5, 10, 20].map(pips => (
            <button
              key={pips}
              onClick={() => {
                const newSl = isLong
                  ? position.sl - pips * pip
                  : position.sl + pips * pip;
                onSlTpChange(newSl, position.tp);
              }}
              className={`flex-1 text-[10px] py-1 rounded border ${muted} border-current/20 hover:text-red-400 hover:border-red-400/30 transition-colors`}
            >
              SL -{pips}p
            </button>
          ))}
        </div>

        {/* ── Close button ─────────────────────────────────────────────────── */}
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-600/30 hover:border-red-500/50 transition-all"
          >
            <FiX className="w-4 h-4" />
            Close at Market
          </button>
        ) : (
          <div className="space-y-1.5">
            <p className="text-center text-xs text-amber-400">
              Close at {currentPrice.toFixed(5)}? ({isPosUnreal ? '+' : ''}${unrealized.toFixed(2)})
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className={`flex-1 py-2 rounded-lg text-sm border ${border} ${muted} hover:bg-white/5 transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowConfirm(false); onClose(); }}
                className="flex-1 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
              >
                Confirm Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
