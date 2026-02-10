'use client';

import React, { useState } from 'react';
import { FaDownload, FaSpinner } from 'react-icons/fa';
import { backtestingService } from '@/services/backtestingService';

interface ExportButtonProps {
  variant: 'trades' | 'strategy';
  strategyId?: string;
  filters?: {
    strategyId?: string;
    symbol?: string;
    session?: string;
    timeframe?: string;
    outcome?: string;
    startDate?: string;
    endDate?: string;
  };
  className?: string;
  label?: string;
}

export default function ExportButton({
  variant,
  strategyId,
  filters,
  className = '',
  label,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      if (variant === 'trades') {
        // Export trades as CSV
        const blob = await backtestingService.exportTradesCSV(filters);
        const filename = `backtest-trades-${new Date().toISOString().split('T')[0]}.csv`;
        backtestingService.downloadCSV(blob, filename);
      } else if (variant === 'strategy' && strategyId) {
        // Export strategy report
        const { blob } = await backtestingService.exportStrategyReport(strategyId);
        const filename = `strategy-report-${strategyId}-${new Date().toISOString().split('T')[0]}.csv`;
        backtestingService.downloadCSV(blob, filename);
      }
    } catch (err: any) {
      console.error('Export failed:', err);
      setError(err.message || 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`
          inline-flex items-center gap-2 px-4 py-2
          bg-emerald-500 hover:bg-emerald-600
          text-white font-medium rounded-lg
          transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        type="button"
      >
        {isExporting ? (
          <>
            <FaSpinner className="w-4 h-4 animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <FaDownload className="w-4 h-4" />
            <span>{label || 'Export CSV'}</span>
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400 z-10">
          {error}
        </div>
      )}
    </div>
  );
}
