"use client";

import React from 'react';
import { BookOpenText, CandlestickChart } from 'lucide-react';

const CANDLE_BARS = [
  { height: 26, bullish: true },
  { height: 38, bullish: true },
  { height: 22, bullish: false },
  { height: 46, bullish: true },
  { height: 30, bullish: false },
  { height: 42, bullish: true },
  { height: 28, bullish: true },
];

export default function TradingJournalLoader() {
  return (
    <div className="min-h-screen w-full bg-white text-slate-900 dark:bg-black dark:text-white transition-colors duration-200 flex items-center justify-center px-4">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white/85 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-neutral-950/90 dark:shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
        <div className="pointer-events-none absolute -left-24 -top-20 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl dark:bg-emerald-500/20" />
        <div className="pointer-events-none absolute -bottom-20 -right-16 h-52 w-52 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-400/15" />

        <div className="relative z-10">
          <div className="mb-8 flex items-center justify-center gap-3">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-emerald-500 dark:text-emerald-400">
              <BookOpenText className="h-5 w-5" />
            </div>
            <CandlestickChart className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
            <span className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600 dark:text-emerald-400">
              Trade Journal
            </span>
          </div>

          <div className="mx-auto flex h-28 items-end justify-center gap-3">
            {CANDLE_BARS.map((bar, index) => (
              <div key={index} className="flex h-full flex-col items-center justify-end gap-1">
                <span className="w-px rounded-full bg-slate-300/80 dark:bg-white/25" style={{ height: `${Math.max(10, Math.round(bar.height * 0.4))}px` }} />
                <span
                  className={`animate-tt-loader-candle block w-2.5 rounded-full ${
                    bar.bullish
                      ? 'bg-gradient-to-b from-emerald-300 to-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.45)]'
                      : 'bg-gradient-to-b from-rose-300 to-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.35)]'
                  }`}
                  style={{
                    height: `${bar.height}px`,
                    animationDelay: `${index * 110}ms`,
                  }}
                />
                <span className="w-px rounded-full bg-slate-300/80 dark:bg-white/25" style={{ height: `${Math.max(9, Math.round(bar.height * 0.35))}px` }} />
              </div>
            ))}
          </div>

          <div className="mt-8 space-y-3">
            <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <span className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-300 animate-tt-loader-write" />
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
              <span
                className="absolute inset-y-0 left-0 w-1/4 rounded-full bg-gradient-to-r from-emerald-300/90 to-emerald-500/90 animate-tt-loader-write"
                style={{ animationDelay: '240ms' }}
              />
            </div>
          </div>

          <p className="mt-6 text-center text-sm font-medium text-slate-600 dark:text-neutral-300">
            Preparing your journal workspace...
          </p>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-tt-loader-blink" />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-tt-loader-blink" style={{ animationDelay: '180ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-tt-loader-blink" style={{ animationDelay: '360ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
