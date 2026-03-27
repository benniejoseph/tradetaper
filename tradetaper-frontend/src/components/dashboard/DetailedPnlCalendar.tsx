"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Trade, TradeStatus } from '@/types/trade';
import Modal from '@/components/ui/Modal';

interface DailyStats {
  dateKey: string;
  pnl: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  avgR: number | null;
  rTotal: number;
  rCount: number;
  winRate: number;
}

interface DetailedPnlCalendarProps {
  trades: Trade[];
}

const formatCurrencyCompact = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
  if (abs >= 1000) return `${(value / 1000).toFixed(2)}K`;
  return value.toFixed(2);
};

const formatCurrency = (value: number) => {
  const abs = Math.abs(value);
  return `${value < 0 ? '-' : ''}$${abs.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function DetailedPnlCalendar({ trades }: DetailedPnlCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const updateIsMobile = () => setIsMobileView(mediaQuery.matches);
    updateIsMobile();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateIsMobile);
      return () => mediaQuery.removeEventListener('change', updateIsMobile);
    }

    mediaQuery.addListener(updateIsMobile);
    return () => mediaQuery.removeListener(updateIsMobile);
  }, []);

  useEffect(() => {
    if (!isMobileView && selectedDateKey) {
      setSelectedDateKey(null);
    }
  }, [isMobileView, selectedDateKey]);

  const dailyStatsMap = useMemo(() => {
    const map = new Map<string, DailyStats>();
    if (!trades) return map;

    trades.forEach(trade => {
      if (trade.status !== TradeStatus.CLOSED || !trade.exitDate) return;
      const date = startOfDay(parseISO(trade.exitDate));
      const dateKey = format(date, 'yyyy-MM-dd');

      if (!map.has(dateKey)) {
        map.set(dateKey, {
          dateKey,
          pnl: 0,
          tradeCount: 0,
          winCount: 0,
          lossCount: 0,
          breakevenCount: 0,
          avgR: null,
          rTotal: 0,
          rCount: 0,
          winRate: 0,
        });
      }

      const stats = map.get(dateKey)!;
      const pnl = trade.profitOrLoss || 0;
      stats.pnl += pnl;
      stats.tradeCount += 1;

      if (pnl > 0) stats.winCount += 1;
      else if (pnl < 0) stats.lossCount += 1;
      else stats.breakevenCount += 1;

      if (typeof trade.rMultiple === 'number') {
        stats.rTotal += trade.rMultiple;
        stats.rCount += 1;
        stats.avgR = stats.rCount > 0 ? stats.rTotal / stats.rCount : null;
      }

      const total = stats.winCount + stats.lossCount + stats.breakevenCount;
      stats.winRate = total > 0 ? (stats.winCount / total) * 100 : 0;
    });

    return map;
  }, [trades]);

  const dailyTradesMap = useMemo(() => {
    const map = new Map<string, Trade[]>();
    if (!trades) return map;

    trades.forEach((trade) => {
      if (trade.status !== TradeStatus.CLOSED || !trade.exitDate) return;
      const dateKey = format(startOfDay(parseISO(trade.exitDate)), 'yyyy-MM-dd');
      const dayTrades = map.get(dateKey) ?? [];
      dayTrades.push(trade);
      map.set(dateKey, dayTrades);
    });

    map.forEach((dayTrades) => {
      dayTrades.sort((a, b) => {
        const aTime = a.exitDate ?? a.updatedAt ?? a.createdAt;
        const bTime = b.exitDate ?? b.updatedAt ?? b.createdAt;
        return bTime.localeCompare(aTime);
      });
    });

    return map;
  }, [trades]);

  const daysGrid = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let cursor = startDate;
    while (cursor <= endDate) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return days;
  }, [currentMonth]);

  const weeklyStats = useMemo(() => {
    const weeks: { label: string; pnl: number; tradingDays: number }[] = [];
    let weekIndex = 0;
    for (let i = 0; i < daysGrid.length; i += 7) {
      const weekDays = daysGrid.slice(i, i + 7);
      const pnl = weekDays.reduce((sum, day) => {
        const key = format(day, 'yyyy-MM-dd');
        return sum + (dailyStatsMap.get(key)?.pnl || 0);
      }, 0);
      const tradingDays = weekDays.filter(day => {
        const key = format(day, 'yyyy-MM-dd');
        return (dailyStatsMap.get(key)?.tradeCount || 0) > 0;
      }).length;
      weekIndex += 1;
      weeks.push({
        label: `Week ${weekIndex}`,
        pnl,
        tradingDays,
      });
    }
    return weeks;
  }, [daysGrid, dailyStatsMap]);

  const monthlyStats = useMemo(() => {
    const monthKey = format(currentMonth, 'yyyy-MM');
    let pnl = 0;
    let tradingDays = 0;

    Array.from(dailyStatsMap.values()).forEach(stats => {
      if (stats.dateKey.startsWith(monthKey)) {
        pnl += stats.pnl;
        if (stats.tradeCount > 0) tradingDays += 1;
      }
    });

    return { pnl, tradingDays };
  }, [currentMonth, dailyStatsMap]);

  const selectedDayStats = selectedDateKey ? dailyStatsMap.get(selectedDateKey) : undefined;
  const selectedDayTrades = useMemo(() => {
    if (!selectedDateKey) return [];
    return dailyTradesMap.get(selectedDateKey) ?? [];
  }, [dailyTradesMap, selectedDateKey]);

  return (
    <div className="rounded-2xl border border-gray-200/50 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-xl p-4 shadow-lg">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="p-2 rounded-lg border border-gray-200/60 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0A0A0A]"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            aria-label="Previous month"
          >
            <FaChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            className="px-3 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
          >
            Today
          </button>
          <button
            className="p-2 rounded-lg border border-gray-200/60 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0A0A0A]"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            aria-label="Next month"
          >
            <FaChevronRight className="w-3.5 h-3.5" />
          </button>
          <div className="ml-1 text-base font-semibold text-gray-900 dark:text-white sm:ml-2 sm:text-lg">
            {format(currentMonth, 'MMMM yyyy')}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">Monthly stats:</span>
            <span className={`font-semibold ${monthlyStats.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              ${formatCurrencyCompact(monthlyStats.pnl)}
            </span>
            <span>{monthlyStats.tradingDays} days</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-7 gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 sm:gap-2 lg:grid-cols-[repeat(7,minmax(0,1fr))_220px]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center py-1.5 sm:py-2 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-[#0A0A0A]">
              {day}
            </div>
          ))}
          <div className="hidden lg:block" />
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 lg:grid-cols-[repeat(7,minmax(0,1fr))_220px]">
          {weeklyStats.map((week, weekIndex) => {
            const weekDays = daysGrid.slice(weekIndex * 7, weekIndex * 7 + 7);
            return (
              <React.Fragment key={week.label}>
                {weekDays.map(day => {
                  const key = format(day, 'yyyy-MM-dd');
                  const stats = dailyStatsMap.get(key);
                  const hasTrades = Boolean(stats?.tradeCount);
                  const canOpenMobileDetails = isMobileView && hasTrades;
                  const isCurrent = isSameMonth(day, currentMonth);
                  const isWin = stats && stats.pnl > 0;
                  const isLoss = stats && stats.pnl < 0;

                  return (
                    <div
                      key={key}
                      onClick={() => {
                        if (canOpenMobileDetails) setSelectedDateKey(key);
                      }}
                      onKeyDown={(event) => {
                        if (!canOpenMobileDetails) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedDateKey(key);
                        }
                      }}
                      role={canOpenMobileDetails ? 'button' : undefined}
                      tabIndex={canOpenMobileDetails ? 0 : undefined}
                      aria-label={canOpenMobileDetails ? `Open trade details for ${format(day, 'MMMM d, yyyy')}` : undefined}
                      className={`min-h-[84px] sm:min-h-[110px] rounded-2xl border transition-all duration-200 p-1.5 sm:p-2 flex min-w-0 flex-col justify-between ${
                        isCurrent
                          ? 'border-gray-200/70 dark:border-gray-800 bg-white/90 dark:bg-[#070707]'
                          : 'border-gray-100/50 dark:border-gray-900 bg-gray-50/50 dark:bg-[#050505] text-gray-400'
                      } ${isWin ? 'ring-1 ring-emerald-300/60 dark:ring-emerald-600/50' : ''} ${isLoss ? 'ring-1 ring-red-300/60 dark:ring-red-600/50' : ''} ${canOpenMobileDetails ? 'cursor-pointer active:scale-[0.99]' : ''}`}
                    >
                      <div className="flex items-center justify-between text-xs gap-1">
                        <span className="font-semibold text-gray-500 dark:text-gray-400">{format(day, 'd')}</span>
                        {stats?.tradeCount ? (
                          <span className={`shrink-0 text-[9px] sm:text-[10px] font-semibold px-1 py-0.5 rounded-full ${isWin ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : isLoss ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                            {stats.tradeCount}
                            <span className="hidden sm:inline"> trades</span>
                          </span>
                        ) : null}
                      </div>

                      {stats && stats.tradeCount > 0 ? (
                        <div className="text-center space-y-0.5 sm:space-y-1 min-w-0">
                          <div className={`truncate leading-tight text-[13px] sm:text-base lg:text-lg font-bold ${stats.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                            {stats.pnl >= 0 ? '' : '-'}${formatCurrencyCompact(Math.abs(stats.pnl))}
                          </div>
                          <div className="hidden sm:block truncate text-[11px] text-gray-500 dark:text-gray-400">
                            {stats.avgR !== null ? `${stats.avgR.toFixed(2)}R` : '—'} • {stats.winRate.toFixed(0)}%
                          </div>
                          <div className="sm:hidden truncate text-[10px] text-gray-500 dark:text-gray-400">
                            {stats.winRate.toFixed(0)}%
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1" />
                      )}
                    </div>
                  );
                })}

                <div className="hidden lg:flex flex-col justify-center rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white/90 dark:bg-[#070707] p-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{week.label}</div>
                  <div className={`text-lg font-bold ${week.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    ${formatCurrencyCompact(week.pnl)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{week.tradingDays} days</div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 lg:hidden">
          {weeklyStats.map(week => (
            <div
              key={`${week.label}-mobile`}
              className="rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white/90 dark:bg-[#070707] p-3"
            >
              <div className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{week.label}</div>
              <div className={`text-lg font-bold ${week.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                ${formatCurrencyCompact(week.pnl)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{week.tradingDays} days</div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={Boolean(isMobileView && selectedDateKey)}
        onClose={() => setSelectedDateKey(null)}
        title={selectedDateKey ? `Trades • ${format(parseISO(selectedDateKey), 'MMMM d, yyyy')}` : 'Trades'}
        description={
          selectedDayStats
            ? `${selectedDayStats.tradeCount} ${selectedDayStats.tradeCount === 1 ? 'trade' : 'trades'} • Win rate ${selectedDayStats.winRate.toFixed(0)}%`
            : undefined
        }
        size="md"
      >
        {selectedDayStats ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-gray-200/70 dark:border-gray-800 bg-gray-50/70 dark:bg-[#0A0A0A] p-3">
                <div className="text-[11px] text-gray-500 dark:text-gray-400">Net P&L</div>
                <div className={`text-base font-semibold ${selectedDayStats.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {formatCurrency(selectedDayStats.pnl)}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200/70 dark:border-gray-800 bg-gray-50/70 dark:bg-[#0A0A0A] p-3">
                <div className="text-[11px] text-gray-500 dark:text-gray-400">Average R</div>
                <div className="text-base font-semibold text-gray-900 dark:text-white">
                  {selectedDayStats.avgR !== null ? `${selectedDayStats.avgR.toFixed(2)}R` : '—'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {selectedDayTrades.map((trade) => {
                const pnl = trade.profitOrLoss ?? 0;
                return (
                  <div
                    key={trade.id}
                    className="rounded-xl border border-gray-200/70 dark:border-gray-800 bg-white/90 dark:bg-[#070707] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{trade.symbol}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              trade.direction === 'Long'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                            }`}
                          >
                            {trade.direction}
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                          Entry {trade.entryPrice.toLocaleString()}
                          {typeof trade.exitPrice === 'number' ? ` • Exit ${trade.exitPrice.toLocaleString()}` : ''}
                          {typeof trade.quantity === 'number' ? ` • Qty ${trade.quantity.toLocaleString()}` : ''}
                        </div>
                      </div>
                      <div className={`text-sm font-semibold ${pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                        {formatCurrency(pnl)}
                      </div>
                    </div>
                    {typeof trade.rMultiple === 'number' && (
                      <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                        R multiple: {trade.rMultiple.toFixed(2)}R
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">No closed trades for this day.</div>
        )}
      </Modal>
    </div>
  );
}
