'use client';

import { useMemo } from 'react';
import { Trade, TradeStatus } from '@/types/trade';

export interface TiltSignal {
  isTilting: boolean;
  /** Human-readable reasons that triggered the signal. */
  reasons: string[];
}

const RAPID_FIRE_WINDOW_MIN = 60;
const RAPID_FIRE_COUNT = 3;

/**
 * Heuristic revenge-trading detector. Looks at today's trades for the
 * classic tilt signature: a loss followed by rapid-fire entries and/or
 * escalating position size. Purely client-side; intentionally
 * conservative to avoid nagging.
 */
export function useTiltDetection(trades: Trade[] | undefined): TiltSignal {
  return useMemo(() => {
    const reasons: string[] = [];
    if (!trades || trades.length === 0) return { isTilting: false, reasons };

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todays = trades
      .filter((t) => t.entryDate && new Date(t.entryDate) >= startOfToday)
      .sort(
        (a, b) =>
          new Date(a.entryDate!).getTime() - new Date(b.entryDate!).getTime(),
      );

    if (todays.length < RAPID_FIRE_COUNT) return { isTilting: false, reasons };

    // 1. Rapid-fire entries after a loss
    for (let i = 0; i < todays.length; i++) {
      const t = todays[i];
      const isLoss =
        t.status === TradeStatus.CLOSED && (t.profitOrLoss ?? 0) < 0;
      if (!isLoss) continue;

      const lossTime = new Date(t.exitDate || t.entryDate!).getTime();
      const after = todays.filter((x) => {
        const entry = new Date(x.entryDate!).getTime();
        return (
          entry > lossTime &&
          entry - lossTime < RAPID_FIRE_WINDOW_MIN * 60_000
        );
      });
      if (after.length >= RAPID_FIRE_COUNT) {
        reasons.push(
          `${after.length} trades within ${RAPID_FIRE_WINDOW_MIN} minutes of a loss`,
        );
        break;
      }
    }

    // 2. Escalating size while losing
    const closedToday = todays.filter(
      (t) => t.status === TradeStatus.CLOSED && t.quantity,
    );
    if (closedToday.length >= 3) {
      const last3 = closedToday.slice(-3);
      const losingStreak = last3.every((t) => (t.profitOrLoss ?? 0) < 0);
      const escalating =
        (last3[2].quantity ?? 0) > (last3[1].quantity ?? 0) &&
        (last3[1].quantity ?? 0) > (last3[0].quantity ?? 0);
      if (losingStreak && escalating) {
        reasons.push('position size increasing across 3 consecutive losses');
      }
    }

    return { isTilting: reasons.length > 0, reasons };
  }, [trades]);
}
