'use client';

import { useEffect, useState } from 'react';
import { FaHeart, FaTimes } from 'react-icons/fa';
import { Trade } from '@/types/trade';
import { useTiltDetection } from '@/hooks/useTiltDetection';

const DISMISS_KEY = 'tt_tilt_dismissed_on';

/**
 * Gentle cool-down prompt shown when today's trades match a
 * revenge-trading pattern. Dismissable once per day.
 */
export default function TiltGuardBanner({ trades }: { trades: Trade[] }) {
  const { isTilting, reasons } = useTiltDetection(trades);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const today = new Date().toDateString();
    setDismissed(localStorage.getItem(DISMISS_KEY) === today);
  }, []);

  if (!isTilting || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, new Date().toDateString());
    setDismissed(true);
  };

  return (
    <div
      role="status"
      className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-600/40 rounded-2xl p-4"
    >
      <FaHeart className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
      <div className="flex-1 text-sm">
        <p className="font-semibold text-amber-800 dark:text-amber-300">
          Quick check-in: your pace looks like tilt
        </p>
        <p className="text-amber-700 dark:text-amber-400/90 mt-1">
          We noticed {reasons.join(' and ')}. The best trade after a loss is
          often no trade. Consider a 15-minute break, a glass of water, and a
          one-line note on what happened — your future self will thank you.
        </p>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss for today"
        className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
      >
        <FaTimes className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
