"use client";
import React, { ReactNode } from 'react';
import { FaInfoCircle, FaEllipsisH } from 'react-icons/fa';
import { IconType } from 'react-icons';

interface DashboardCardProps {
  title: string;
  children: ReactNode;
  className?: string; // For additional styling/grid positioning
  icon?: IconType;
  showInfoIcon?: boolean;
  showMenuIcon?: boolean;
  showTimeRangeSelector?: boolean;
  timeRangeOptions?: string[]; // e.g., ['7d', '1m', '3m']
  selectedTimeRange?: string;
  onTimeRangeChange?: (newRange: string) => void;
  gridSpan?: string; // e.g., 'col-span-1', 'col-span-2'
  // Add any other common props these cards might need
}

export default function DashboardCard({
  title,
  children,
  className = "",
  icon: IconComponent,
  showInfoIcon = false,
  showMenuIcon = false,
  showTimeRangeSelector = false,
  timeRangeOptions = ['7d', '1M', '3M', '1Y', 'All'], // Default options
  selectedTimeRange = '7d', // Default selected
  onTimeRangeChange,
  gridSpan = "col-span-1", // Default to single column span
}: DashboardCardProps) {

  const cardBaseClasses = "rounded-xl shadow-lg dark:shadow-card-modern flex flex-col";
  const cardThemeClasses = "bg-[var(--color-light-primary)] dark:bg-dark-secondary text-[var(--color-text-dark-primary)] dark:text-text-light-primary";
  const headerClasses = "flex items-center justify-between p-4 border-b border-[var(--color-light-border)] dark:border-dark-primary";
  const titleClasses = "text-md font-semibold";
  const iconButtonClasses = "text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary hover:text-accent-green dark:hover:text-accent-green transition-colors p-1";
  const headerIconClasses = "mr-2 text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary";
  const timeRangeButtonBase = "px-2.5 py-1 text-xs font-medium rounded-md transition-colors";
  const timeRangeButtonActive = "bg-accent-green text-dark-primary";
  const timeRangeButtonInactive = "bg-[var(--color-light-hover)] dark:bg-dark-primary hover:bg-[var(--color-light-border)] dark:hover:bg-gray-700";

  return (
    <div className={`${cardBaseClasses} ${cardThemeClasses} ${gridSpan} ${className}`}>
      {/* Card Header */}
      <div className={headerClasses}>
        <div className="flex items-center space-x-1.5">
          {IconComponent && <IconComponent className={headerIconClasses} size={16} />}
          <h3 className={titleClasses}>{title}</h3>
          {showInfoIcon && (
            <button className={iconButtonClasses} aria-label="More info">
              <FaInfoCircle />
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {showTimeRangeSelector && (
            <div className="flex items-center space-x-1 bg-[var(--color-light-secondary)] dark:bg-dark-primary p-0.5 rounded-md">
              {timeRangeOptions.map(range => (
                <button 
                  key={range}
                  onClick={() => onTimeRangeChange && onTimeRangeChange(range)}
                  className={`${timeRangeButtonBase} ${selectedTimeRange === range ? timeRangeButtonActive : timeRangeButtonInactive}`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
          {showMenuIcon && (
            <button className={iconButtonClasses} aria-label="Options menu">
              <FaEllipsisH />
            </button>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-grow">
        {children}
      </div>
    </div>
  );
} 