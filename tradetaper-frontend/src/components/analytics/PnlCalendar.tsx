// src/components/analytics/PnlCalendar.tsx
"use client";
import { useState, useMemo } from 'react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay,
  startOfWeek, endOfWeek, addDays
} from 'date-fns';
import { PnlByDay } from '@/utils/analytics'; // Your aggregation type

interface PnlCalendarProps {
  dailyPnlData: PnlByDay;
  onDateClick?: (date: Date) => void; // Optional: for future drill-down
}

const PnlCalendar = ({ dailyPnlData, onDateClick }: PnlCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    // Get the first day of the week of the month's first day
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // 0 for Sunday
    // Get the last day of the week of the month's last day
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const getPnlClass = (pnl: number): string => {
    if (pnl > 200) return 'bg-green-700 hover:bg-green-600'; // Strong win
    if (pnl > 50) return 'bg-green-600 hover:bg-green-500';  // Moderate win
    if (pnl > 0) return 'bg-green-500 hover:bg-green-400';   // Small win
    if (pnl < -200) return 'bg-red-700 hover:bg-red-600';  // Strong loss
    if (pnl < -50) return 'bg-red-600 hover:bg-red-500';   // Moderate loss
    if (pnl < 0) return 'bg-red-500 hover:bg-red-400';    // Small loss
    return 'bg-gray-700 hover:bg-gray-600'; // Breakeven or no trades
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl text-white">
       <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded">← Prev</button> {/* CORRECTED */}
                <h2 className="text-xl font-semibold">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded">Next →</button> {/* CORRECTED */}
              </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
        {weekDays.map(day => <div key={day}>{day}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((day, index) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const pnlInfo = dailyPnlData[dayKey];
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <div
              key={dayKey}
              onClick={() => onDateClick && pnlInfo && onDateClick(day)}
              className={`p-2 h-20 md:h-24 rounded border transition-colors
                          ${isCurrentMonth ? 'border-gray-600' : 'border-gray-700 text-gray-500'}
                          ${pnlInfo ? getPnlClass(pnlInfo.pnl) : (isCurrentMonth ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-750')}
                          ${pnlInfo && onDateClick ? 'cursor-pointer' : ''}
                          flex flex-col justify-between items-center`} // For content alignment
            >
              <span className={`font-medium ${isSameDay(day, new Date()) && isCurrentMonth ? 'text-blue-400 font-bold' : ''}`}>
                {format(day, 'd')}
              </span>
              {isCurrentMonth && pnlInfo && (
                <div className="text-xs mt-1">
                  <p className="font-bold">{pnlInfo.pnl.toFixed(2)}</p>
                  <p className="text-gray-300">({pnlInfo.tradeCount}T)</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PnlCalendar;