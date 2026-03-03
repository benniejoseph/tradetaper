'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Play } from 'lucide-react';

interface ReplayThisTradeButtonProps {
  symbol: string;
  timeframe?: string | null;
  openTime?: string | null;
  closeTime?: string | null;
  className?: string;
}

// Map journal timeframe codes → backtesting session timeframe strings
const TF_MAP: Record<string, string> = {
  M1: '1m',   M5: '5m',   M15: '15m', M30: '30m',
  H1: '1h',   H4: '4h',   D1: '1d',   W1: '1d',
  // numeric aliases (MT4/MT5 minutes)
  '1': '1m',  '5': '5m',  '15': '15m', '30': '30m',
  '60': '1h', '240': '4h','1440': '1d',
};

export default function ReplayThisTradeButton({
  symbol,
  timeframe,
  openTime,
  closeTime,
  className = '',
}: ReplayThisTradeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);

  const handleReplay = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

      // Build date window: 3 days before entry → 3 days after exit
      const entryMs = openTime ? new Date(openTime).getTime() : Date.now();
      const exitMs  = closeTime ? new Date(closeTime).getTime() : entryMs;
      const bufferMs = 3 * 24 * 60 * 60 * 1000; // 3 days
      const startDate = new Date(entryMs - bufferMs).toISOString().slice(0, 10);
      const endDate   = new Date(Math.max(exitMs, entryMs) + bufferMs).toISOString().slice(0, 10);

      // Map timeframe to backtesting format (default 15m if unknown)
      const tfKey = (timeframe || 'M15').toUpperCase().replace(/\s/g, '');
      const mappedTf = TF_MAP[tfKey] || '15m';

      // Get CSRF token
      const csrfRes = await fetch(`${apiUrl}/csrf-token`, { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      // Create replay session
      const res = await fetch(`${apiUrl}/backtesting/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          timeframe: mappedTf,
          startDate: new Date(startDate).toISOString(),
          endDate:   new Date(endDate).toISOString(),
          startingBalance: 100000,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'Failed to create replay session');
      }

      const session = await res.json();

      router.push(
        `/backtesting/session/${session.id}` +
        `?symbol=${symbol.toUpperCase()}` +
        `&timeframe=${mappedTf}` +
        `&startDate=${startDate}` +
        `&endDate=${endDate}` +
        `&balance=100000`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to start replay');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleReplay}
        disabled={loading}
        title="Replay this trade candle-by-candle in the backtesting workbench"
        className={`
          inline-flex items-center gap-2 px-4 py-2
          bg-violet-600 hover:bg-violet-500 active:bg-violet-700
          text-white font-semibold text-sm rounded-xl
          transition-all duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-[0_0_20px_rgba(139,92,246,0.25)]
          hover:shadow-[0_0_24px_rgba(139,92,246,0.4)]
          ${className}
        `}
      >
        {loading ? (
          <svg className="animate-spin w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <Play className="w-4 h-4 shrink-0" />
        )}
        {loading ? 'Loading…' : 'Replay This Trade'}
      </button>

      {error && (
        <span className="text-xs text-red-400 max-w-xs">{error}</span>
      )}
    </div>
  );
}
