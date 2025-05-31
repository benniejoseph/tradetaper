// src/components/analytics/PnlCalendar.tsx
"use client";
import { useState, useMemo } from 'react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay,
  startOfWeek, endOfWeek
} from 'date-fns';
import { PnlByDay } from '@/utils/analytics'; // Your aggregation type
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'; // Import icons
import { useTheme } from '@/context/ThemeContext'; // Import useTheme

interface PnlCalendarProps {
  dailyPnlData: PnlByDay;
  onDateClick?: (date: Date) => void; // Optional: for future drill-down
}

const PnlCalendar = ({ dailyPnlData, onDateClick }: PnlCalendarProps) => {
  const { theme } = useTheme(); // Get current theme
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // 0 for Sunday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const getPnlClass = (pnl: number): string => {
    // P&L classes are accent based, should work for both themes if text color is handled correctly
    // Text color for positive P&L days needs to be dark for contrast with green
    const positivePnlText = "text-dark-primary"; 
    // Text color for negative P&L days needs to be light for contrast with red
    const negativePnlText = "text-text-light-primary"; // Already light, good for dark red
    
    // Positive P&L
    if (pnl > 200) return `bg-accent-green/80 hover:bg-accent-green/100 ${positivePnlText}`;
    if (pnl > 50) return `bg-accent-green/60 hover:bg-accent-green/80 ${positivePnlText}`;
    if (pnl > 0) return `bg-accent-green/40 hover:bg-accent-green/60 ${positivePnlText}`;
    // Negative P&L
    if (pnl < -200) return `bg-accent-red/80 hover:bg-accent-red/100 ${negativePnlText}`;
    if (pnl < -50) return `bg-accent-red/60 hover:bg-accent-red/80 ${negativePnlText}`;
    if (pnl < 0) return `bg-accent-red/40 hover:bg-accent-red/60 ${negativePnlText}`;
    
    // Breakeven or no trades (for days that had activity)
    // Needs light/dark adaptation
    return 'bg-[var(--color-light-hover)] dark:bg-dark-primary hover:bg-[var(--color-light-border)] dark:hover:bg-dark-secondary';
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navButtonBase = "p-2 rounded-full transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent-green group";
  const navButtonTheme = "bg-[var(--color-light-hover)] hover:bg-accent-green-darker dark:bg-dark-primary dark:hover:bg-accent-green-darker";
  const navIconTheme = "text-[var(--color-text-dark-secondary)] group-hover:text-dark-primary dark:text-text-light-secondary dark:group-hover:text-dark-primary";
  
  const dayCellBorder = "border-[var(--color-light-border)] dark:border-gray-700";
  const dayCellNotInMonthBorder = "border-[var(--color-light-secondary)] dark:border-dark-primary opacity-50";
  const dayCellDefaultBg = "bg-[var(--color-light-primary)] hover:bg-[var(--color-light-hover)] dark:bg-dark-primary dark:hover:bg-dark-secondary";
  const dayCellNotInMonthBg = "bg-[var(--color-light-primary)] dark:bg-dark-primary opacity-30";

  return (
    <div className="bg-[var(--color-light-primary)] dark:bg-dark-secondary p-4 md:p-6 rounded-lg shadow-xl text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
       <div className="flex justify-between items-center mb-6">
            <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className={`${navButtonBase} ${navButtonTheme}`}
                aria-label="Previous month"
            >
                <FaChevronLeft className={`h-5 w-5 ${navIconTheme} transition-colors`} />
            </button>
            <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
                {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className={`${navButtonBase} ${navButtonTheme}`}
                aria-label="Next month"
            >
                <FaChevronRight className={`h-5 w-5 ${navIconTheme} transition-colors`} />
            </button>
        </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary mb-2">
        {weekDays.map(day => <div key={day}>{day}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const pnlInfo = dailyPnlData[dayKey];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const pnlValue = pnlInfo ? pnlInfo.pnl : 0;

          // Date text color logic
          let dateTextColor = isCurrentMonth 
            ? (pnlInfo ? (pnlValue > 0 ? 'text-dark-primary font-semibold' : 'text-[var(--color-text-dark-primary)] dark:text-text-light-primary font-medium') : 'text-[var(--color-text-dark-primary)] dark:text-text-light-primary font-medium')
            : 'text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary font-medium opacity-60';
          
          if (isSameDay(day, new Date()) && isCurrentMonth) {
            dateTextColor = 'text-accent-green ring-1 ring-accent-green rounded-full px-1.5 py-0.5 font-semibold';
          }

          // P&L and trade count text color within cell
          const pnlCellTextColor = pnlValue > 0 
            ? 'text-dark-primary' 
            : (pnlValue < 0 ? (theme === 'dark' ? 'text-text-light-primary' : 'text-text-light-primary') // Negative P&L values on red background often need light text
            : 'text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary');
          
          const tradeCountCellTextColor = pnlValue > 0
            ? 'text-dark-primary opacity-80'
            : (pnlValue < 0 ? (theme === 'dark' ? 'text-text-light-primary opacity-80' : 'text-text-light-primary opacity-80')
            : 'text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary');

          return (
            <div
              key={dayKey}
              onClick={() => onDateClick && pnlInfo && onDateClick(day)}
              className={`p-2 h-20 md:h-24 rounded border transition-colors
                          ${isCurrentMonth ? dayCellBorder : dayCellNotInMonthBorder}
                          ${pnlInfo ? getPnlClass(pnlValue) : (isCurrentMonth ? dayCellDefaultBg : dayCellNotInMonthBg)}
                          ${pnlInfo && onDateClick ? 'cursor-pointer' : ''}
                          flex flex-col justify-between items-center`}
            >
              <span className={`text-sm ${dateTextColor}`}>
                {format(day, 'd')}
              </span>
              {isCurrentMonth && pnlInfo && (
                <div className="text-center">
                  <p className={`text-xs font-semibold ${pnlCellTextColor}`}>{pnlInfo.pnl.toFixed(2)}</p>
                  <p className={`text-xxs ${tradeCountCellTextColor}`}>{pnlInfo.tradeCount} trade{pnlInfo.tradeCount > 1 ? 's' : ''}</p>
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