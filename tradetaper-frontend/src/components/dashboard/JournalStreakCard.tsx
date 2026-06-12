'use client';

import { useMemo } from 'react';
import { Trade } from '@/types/trade';
import { StreakFlame } from '@/components/lottie';

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Computes the current and best consecutive-day journaling streak from
 * trade entry dates. A day counts if at least one trade was logged.
 * The current streak tolerates "today hasn't been journaled yet".
 */
export function computeStreaks(trades: Trade[]): {
  current: number;
  best: number;
} {
  const days = new Set<string>();
  for (const t of trades) {
    const d = t.entryDate || t.createdAt;
    if (d) days.add(dayKey(new Date(d)));
  }
  if (days.size === 0) return { current: 0, best: 0 };

  // Current streak: walk back from today (or yesterday if today is empty)
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let current = 0;
  while (days.has(dayKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Best streak: scan all journaled days
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of sorted) {
    const d = new Date(key);
    run =
      prev && d.getTime() - prev.getTime() === 86_400_000 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }

  return { current, best };
}

export default function JournalStreakCard({ trades }: { trades: Trade[] }) {
  const { current, best } = useMemo(() => computeStreaks(trades), [trades]);

  const message =
    current === 0
      ? 'Log a trade today to start a streak'
      : current === best
        ? 'Personal best — keep the chain alive!'
        : `Best: ${best} days`;

  return (
    <div className="flex items-center gap-4 bg-white dark:bg-card border border-gray-200/60 dark:border-border rounded-2xl px-5 py-4">
      <div className={current > 0 ? '' : 'grayscale opacity-40'}>
        <StreakFlame size={44} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
          {current}
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1.5">
            day{current === 1 ? '' : 's'} journaled
          </span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
          {message}
        </p>
      </div>
    </div>
  );
}
