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
    <div className={`group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden ${gridSpan} ${className}`}>
      
      {/* Gradient overlay for hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Card Header */}
      <div className="relative z-10 flex items-center justify-between p-6 border-b border-gray-200/30 dark:border-gray-700/30">
        <div className="flex items-center space-x-3">
          {IconComponent && (
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-xl">
              <IconComponent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-green-500 mt-1"></div>
          </div>
          {showInfoIcon && (
            <button className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200">
              <FaInfoCircle className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {showTimeRangeSelector && (
            <div className="flex items-center bg-gray-100/80 dark:bg-gray-800/80 p-1 rounded-xl backdrop-blur-sm">
              {timeRangeOptions.map(range => (
                <button 
                  key={range}
                  onClick={() => onTimeRangeChange && onTimeRangeChange(range)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    selectedTimeRange === range 
                      ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-gray-700/80'
                  }`}>
                  {range}
                </button>
              ))}
            </div>
          )}
          
          {showMenuIcon && (
            <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200">
              <FaEllipsisH className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>
      
      {/* Subtle animated background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-green-400/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </div>
  );
} 