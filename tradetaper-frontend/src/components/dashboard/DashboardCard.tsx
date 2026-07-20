"use client";
import React, { CSSProperties, ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { FaInfoCircle, FaEllipsisH } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { createPortal } from 'react-dom';

interface DashboardCardProps {
  title: string;
  children: ReactNode;
  className?: string; // For additional styling/grid positioning
  icon?: IconType;
  showInfoIcon?: boolean;
  infoContent?: string;
  showMenuIcon?: boolean;
  showTimeRangeSelector?: boolean;
  timeRangeOptions?: string[]; // e.g., ['7d', '1m', '3m']
  selectedTimeRange?: string;
  onTimeRangeChange?: (newRange: string) => void;
  headerContent?: ReactNode;
  gridSpan?: string; // e.g., 'col-span-1', 'col-span-2'
  // Add any other common props these cards might need
}

const DEFAULT_CARD_INFO: Record<string, string> = {
  'Portfolio Balance': 'Tracks account equity progression and daily balance movement for the selected period.',
  'Personal Target': 'Shows progress toward your configured profit target so you can track execution against plan.',
  'Total Return': 'Summarizes net P&L and ROI for the active date range.',
  'Trade Quality': 'Combines expectancy and win rate signals to show whether your edge is stable.',
  'Performance Balance': 'Radar-style view of key metrics to quickly spot strong and weak areas.',
  'Trade Consistency': 'Highlights streaks, rolling return behavior, and volatility consistency.',
  'Win Rate Analysis': 'Breaks down win percentage and risk-reward context.',
  'Trade Statistics': 'Shows wins, losses, breakevens, and average activity pace.',
  'Trading Costs': 'Measures fee drag and commission impact on profitability.',
  'Long vs Short Analysis': 'Compares directional performance to reveal which side has stronger edge.',
  'Drawdown Curve': 'Displays depth and persistence of drawdowns over time.',
  'Rolling Return': 'Tracks rolling return values over the last N closed trades.',
  'Rolling Profit Factor': 'Tracks rolling profit-factor quality over the last N closed trades.',
  'Rolling Expectancy': 'Tracks rolling expectancy and average R over the last N closed trades.',
  'Trade Expectancy': 'Shows average expected value per trade from your current win/loss profile.',
  'Trade Win %': 'Compact read of win-rate distribution across outcomes.',
  'MAE vs MFE': 'Compares adverse and favorable excursion to evaluate stop and target quality.',
  'Equity Curve': 'Visualizes cumulative P&L progression over time.',
  'Live Positions': 'Shows currently open positions and their real-time P&L impact.',
  'Trader Score Breakdown': 'Breaks your trader score into underlying performance and discipline dimensions.',
  'Account Health': 'Summarizes account stability using balance, equity, and risk context.',
  'Performance by Hour': 'Shows which trading hours produce stronger or weaker outcomes.',
  'Session Performance': 'Compares P&L and win rate across trading sessions.',
  'Holding Time vs PnL': 'Shows relationship between trade duration and outcome quality.',
  'Top Performing Trades': 'Lists the strongest trades in the selected period by return contribution.',
  'P&L Calendar': 'Calendar view of daily profit and loss to spot streaks and clustering.',
  'Trading Activity Heatmap': 'Heatmap of trade frequency and outcome intensity across dates.',
};

const DEFAULT_INFO_FALLBACK =
  'Explains what this component measures and how to use it in your review workflow.';

export default function DashboardCard({
  title,
  children,
  className = "",
  icon: IconComponent,
  showInfoIcon = true,
  infoContent,
  showMenuIcon = false,
  showTimeRangeSelector = false,
  timeRangeOptions = ['7d', '1M', '3M', '1Y', 'All'], // Default options
  selectedTimeRange = '7d', // Default selected
  onTimeRangeChange,
  headerContent,
  gridSpan = "col-span-1", // Default to single column span
}: DashboardCardProps) {
  const [isInfoTooltipOpen, setIsInfoTooltipOpen] = useState(false);
  const [isInfoTooltipHovered, setIsInfoTooltipHovered] = useState(false);
  const [tooltipPlacement, setTooltipPlacement] = useState<'top' | 'bottom'>('bottom');
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
  const infoButtonRef = useRef<HTMLButtonElement | null>(null);
  const infoTooltipRef = useRef<HTMLSpanElement | null>(null);
  const infoTooltipId = useId();

  const resolvedInfoContent = useMemo(() => {
    if (infoContent && infoContent.trim().length > 0) {
      return infoContent.trim();
    }
    return DEFAULT_CARD_INFO[title] || `${title}. ${DEFAULT_INFO_FALLBACK}`;
  }, [infoContent, title]);

  const shouldShowInfoIcon = showInfoIcon || Boolean(resolvedInfoContent);
  const isInfoTooltipVisible = shouldShowInfoIcon && (isInfoTooltipOpen || isInfoTooltipHovered);

  const updateTooltipPosition = useCallback(() => {
    if (!isInfoTooltipVisible || !infoButtonRef.current) return;

    const rect = infoButtonRef.current.getBoundingClientRect();
    const viewportPadding = 12;
    const preferredWidth = 320;
    const maxWidth = Math.max(
      200,
      Math.min(preferredWidth, window.innerWidth - viewportPadding * 2),
    );
    const centerX = rect.left + rect.width / 2;
    const halfWidth = maxWidth / 2;
    const clampedCenterX = Math.min(
      window.innerWidth - viewportPadding - halfWidth,
      Math.max(viewportPadding + halfWidth, centerX),
    );

    const placeBelow = rect.top < 110;
    setTooltipPlacement(placeBelow ? 'bottom' : 'top');
    setTooltipStyle({
      left: clampedCenterX,
      top: placeBelow ? rect.bottom + 10 : rect.top - 10,
      maxWidth,
    });
  }, [isInfoTooltipVisible]);

  useEffect(() => {
    if (!isInfoTooltipVisible) return;

    updateTooltipPosition();

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (infoButtonRef.current?.contains(target)) return;
      if (infoTooltipRef.current?.contains(target)) return;
      setIsInfoTooltipOpen(false);
      setIsInfoTooltipHovered(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsInfoTooltipOpen(false);
        setIsInfoTooltipHovered(false);
      }
    };

    const handleViewportChange = () => {
      updateTooltipPosition();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isInfoTooltipVisible, updateTooltipPosition]);

  return (
    <div className={`group relative bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-visible ${gridSpan} ${className}`}>
      
      {/* Gradient overlay for hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      
      {/* Card Header */}
      <div className="relative z-10 flex flex-col gap-3 border-b border-gray-200/30 p-3 dark:border-gray-700/30 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {IconComponent && (
            <div className="rounded-lg bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 p-1.5">
              <IconComponent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-tight text-gray-900 dark:text-white sm:text-base">
              {title}
            </h3>
            {/* Removed the underline bar to save space and reduce clutter */}
          </div>
          {shouldShowInfoIcon && (
            <button
              ref={infoButtonRef}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsInfoTooltipOpen((previous) => {
                  const next = !previous;
                  if (next) {
                    setIsInfoTooltipHovered(true);
                  } else {
                    setIsInfoTooltipHovered(false);
                  }
                  return next;
                });
              }}
              onMouseEnter={() => setIsInfoTooltipHovered(true)}
              onMouseLeave={() => {
                if (!isInfoTooltipOpen) {
                  setIsInfoTooltipHovered(false);
                }
              }}
              onFocus={() => setIsInfoTooltipHovered(true)}
              onBlur={() => {
                if (!isInfoTooltipOpen) {
                  setIsInfoTooltipHovered(false);
                }
              }}
              className="group relative shrink-0 rounded-md p-1 text-gray-400 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-950/30"
              aria-label="Metric info"
              aria-expanded={isInfoTooltipVisible}
              aria-describedby={isInfoTooltipVisible ? infoTooltipId : undefined}
            >
              <FaInfoCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        
        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:justify-start">
          {headerContent}
          {showTimeRangeSelector && (
            <div className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-gray-100/80 p-0.5 backdrop-blur-sm dark:bg-[#141414]/80">
              {timeRangeOptions.map(range => (
                <button 
                  key={range}
                  onClick={() => onTimeRangeChange && onTimeRangeChange(range)}
                  className={`whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-medium transition-all duration-200 ${
                    selectedTimeRange === range 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-white/5'
                  }`}>
                  {range}
                </button>
              ))}
            </div>
          )}
          
          {showMenuIcon && (
            <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-white/10 transition-all duration-200">
              <FaEllipsisH className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="relative z-10 p-4">
        {children}
      </div>
      
      {/* Subtle animated background */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/10 to-emerald-600/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {typeof document !== 'undefined' &&
        isInfoTooltipVisible &&
        shouldShowInfoIcon &&
        createPortal(
          <span
            id={infoTooltipId}
            ref={infoTooltipRef}
            role="tooltip"
            className="pointer-events-auto fixed z-[140] rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-[11px] leading-relaxed text-white shadow-2xl"
            style={{
              ...tooltipStyle,
              transform:
                tooltipPlacement === 'bottom'
                  ? 'translate(-50%, 0)'
                  : 'translate(-50%, -100%)',
            }}
          >
            {resolvedInfoContent}
            <span
              className={`absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-gray-950 ${
                tooltipPlacement === 'bottom'
                  ? '-top-1.5 border-l border-t border-gray-700'
                  : '-bottom-1.5 border-r border-b border-gray-700'
              }`}
            />
          </span>,
          document.body,
        )}
    </div>
  );
}
