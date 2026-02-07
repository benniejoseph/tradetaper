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

  return (
    <div className={`group relative bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden ${gridSpan} ${className}`}>
      
      {/* Gradient overlay for hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      
      {/* Card Header */}
      <div className="relative z-10 flex items-center justify-between p-4 border-b border-gray-200/30 dark:border-gray-700/30">
        <div className="flex items-center space-x-2.5">
          {IconComponent && (
            <div className="p-1.5 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-lg">
              <IconComponent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
              {title}
            </h3>
            {/* Removed the underline bar to save space and reduce clutter */}
          </div>
          {showInfoIcon && (
            <button className="p-1 rounded-md text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-200">
              <FaInfoCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {showTimeRangeSelector && (
            <div className="flex items-center bg-gray-100/80 dark:bg-[#141414]/80 p-0.5 rounded-lg backdrop-blur-sm">
              {timeRangeOptions.map(range => (
                <button 
                  key={range}
                  onClick={() => onTimeRangeChange && onTimeRangeChange(range)}
                  className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all duration-200 ${
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