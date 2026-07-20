'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';
import {
  buildReplaySessionUrl,
  createReplaySession,
  normalizeReplayTimeframe,
} from '@/services/replaySessionClient';

interface ReplayThisTradeButtonProps {
  tradeId?: string;
  symbol: string;
  timeframe?: string | null;
  openTime?: string | null;
  closeTime?: string | null;
  className?: string;
}

const REPLAY_STARTING_BALANCE = 100000;
const DATE_BUFFER_MS = 3 * 24 * 60 * 60 * 1000;
const REPLAY_FETCH_BUFFER_SECONDS = 60 * 60;

const parseTimestamp = (raw: string | null | undefined): number | null => {
  if (!raw) return null;
  const parsed = new Date(raw).getTime();
  return Number.isFinite(parsed) ? parsed : null;
};

const buildReplayWindow = (
  openTime: string | null | undefined,
  closeTime: string | null | undefined,
): { startDate: string; endDate: string } => {
  const openMs = parseTimestamp(openTime);
  const closeMs = parseTimestamp(closeTime);

  const anchorOpenMs = openMs ?? closeMs ?? Date.now();
  const anchorCloseMs = closeMs ?? openMs ?? anchorOpenMs;
  const startMs = Math.min(anchorOpenMs, anchorCloseMs) - DATE_BUFFER_MS;
  const endMs = Math.max(anchorOpenMs, anchorCloseMs) + DATE_BUFFER_MS;

  return {
    startDate: new Date(startMs).toISOString().slice(0, 10),
    endDate: new Date(endMs).toISOString().slice(0, 10),
  };
};

export default function ReplayThisTradeButton({
  tradeId,
  symbol,
  timeframe,
  openTime,
  closeTime,
  className = '',
}: ReplayThisTradeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleReplay = async () => {
    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = buildReplayWindow(openTime, closeTime);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
      const mappedTf = normalizeReplayTimeframe(timeframe);
      const normalizedSymbol = symbol.toUpperCase();
      const openMs = parseTimestamp(openTime);
      const closeMs = parseTimestamp(closeTime);
      const anchorStartMs = openMs ?? closeMs ?? null;
      const anchorEndMs = closeMs ?? openMs ?? anchorStartMs;
      const entryTs = anchorStartMs != null ? Math.floor(anchorStartMs / 1000) : null;
      const exitTs = anchorEndMs != null ? Math.floor(anchorEndMs / 1000) : null;
      const rangeStartTs =
        entryTs != null && Number.isFinite(entryTs)
          ? Math.max(0, entryTs - REPLAY_FETCH_BUFFER_SECONDS)
          : null;
      const rangeEndTs =
        exitTs != null && Number.isFinite(exitTs)
          ? Math.max((rangeStartTs ?? 0) + 60, exitTs + REPLAY_FETCH_BUFFER_SECONDS)
          : null;

      const session = await createReplaySession(
        {
          symbol: normalizedSymbol,
          timeframe: mappedTf,
          startDate,
          endDate,
          startingBalance: REPLAY_STARTING_BALANCE,
        },
        apiUrl,
      );

      const replayParams: Record<string, string | number> = {
        symbol: normalizedSymbol,
        timeframe: mappedTf,
        startDate,
        endDate,
        balance: REPLAY_STARTING_BALANCE,
      };
      if (tradeId && tradeId.trim().length > 0) {
        replayParams.tradeId = tradeId.trim();
      }
      if (entryTs != null && Number.isFinite(entryTs)) {
        replayParams.entryTs = entryTs;
      }
      if (exitTs != null && Number.isFinite(exitTs)) {
        replayParams.exitTs = exitTs;
      }
      if (rangeStartTs != null && Number.isFinite(rangeStartTs)) {
        replayParams.startTs = rangeStartTs;
      }
      if (rangeEndTs != null && Number.isFinite(rangeEndTs)) {
        replayParams.endTs = rangeEndTs;
      }

      router.push(
        buildReplaySessionUrl(session.id, replayParams),
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message ? err.message : 'Failed to start replay';
      setError(message);
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
          bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700
          text-white font-semibold text-sm rounded-xl
          transition-all duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-[0_0_20px_rgba(16,185,129,0.25)]
          hover:shadow-[0_0_24px_rgba(16,185,129,0.38)]
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
