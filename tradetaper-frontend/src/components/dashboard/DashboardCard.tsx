"use client";
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { FaInfoCircle, FaEllipsisH } from 'react-icons/fa';
import { IconType } from 'react-icons';

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

export default function DashboardCard({
  title,
  children,
  className = "",
  icon: IconComponent,
  showInfoIcon = false,
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
  const infoButtonRef = useRef<HTMLButtonElement | null>(null);
  const infoTooltipRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!isInfoTooltipOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (infoButtonRef.current?.contains(target)) return;
      if (infoTooltipRef.current?.contains(target)) return;
      setIsInfoTooltipOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsInfoTooltipOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isInfoTooltipOpen]);

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
          {showInfoIcon && (
            <button
              ref={infoButtonRef}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsInfoTooltipOpen((previous) => !previous);
              }}
              className="group relative shrink-0 rounded-md p-1 text-gray-400 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-950/30"
              aria-label="Metric info"
              aria-expanded={isInfoTooltipOpen}
            >
              <FaInfoCircle className="w-3.5 h-3.5" />
              {infoContent && (
                <span
                  ref={infoTooltipRef}
                  className={`absolute top-full z-40 mt-2 w-[min(16rem,calc(100vw-2rem))] rounded-lg border border-gray-900 bg-gray-900 p-2 text-[11px] leading-relaxed text-white shadow-2xl transition-opacity duration-200 left-0 sm:left-1/2 sm:-translate-x-1/2 ${
                    isInfoTooltipOpen
                      ? 'visible opacity-100'
                      : 'invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100'
                  }`}
                >
                  {infoContent}
                  <span className="absolute left-2 top-0 h-2 w-2 -translate-y-1/2 rotate-45 bg-gray-900 sm:left-1/2 sm:-translate-x-1/2"></span>
                </span>
              )}
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
    </div>
  );
}
