"use client";
import React, { useState } from 'react';
import { Trade, TradeStatus } from '@/types/trade';
import { exportTrades, downloadExportData, ExportOptions } from '@/utils/exportUtils';
import { FaTimes, FaDownload } from 'react-icons/fa';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  accountName?: string;
}

export default function ExportModal({ isOpen, onClose, trades, accountName }: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'json'>('csv');
  const [includeOpenTrades, setIncludeOpenTrades] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const options: ExportOptions = {
        format: exportFormat,
        includeOpenTrades,
        dateRange: dateRange.from || dateRange.to ? dateRange : undefined,
      };

      const exportData = exportTrades(trades, options);
      downloadExportData(exportData);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredTradesCount = trades.filter(trade => {
    // Apply the same filtering logic as the export utility
    if (!includeOpenTrades && trade.status !== TradeStatus.CLOSED) {
      return false;
    }
    
    if (dateRange.from || dateRange.to) {
      if (!trade.entryDate) return false;
      try {
        const entryDate = new Date(trade.entryDate);
        if (dateRange.from && entryDate < dateRange.from) return false;
        if (dateRange.to && entryDate > dateRange.to) return false;
      } catch {
        return false;
      }
    }
    
    return true;
  }).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-light-primary)] dark:bg-dark-secondary rounded-xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
            Export Trades
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        {/* Account Info */}
        {accountName && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Exporting data for: <span className="font-medium">{accountName}</span>
            </p>
          </div>
        )}

        {/* Export Format */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary mb-2">
            Export Format
          </label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'csv' | 'excel' | 'json')}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-[var(--color-light-secondary)] dark:bg-dark-tertiary focus:ring-2 focus:ring-accent-blue focus:border-accent-blue"
          >
            <option value="csv">CSV (Comma Separated Values)</option>
            <option value="excel">Excel (XLSX)</option>
            <option value="json">JSON (JavaScript Object Notation)</option>
          </select>
        </div>

        {/* Include Open Trades */}
        <div className="mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={includeOpenTrades}
              onChange={(e) => setIncludeOpenTrades(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-accent-blue focus:ring-accent-blue"
            />
            <span className="text-sm text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">
              Include open trades
            </span>
          </label>
        </div>

        {/* Date Range */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary mb-2">
            Date Range (Optional)
          </label>
          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From:</label>
              <DatePicker
                selected={dateRange.from}
                onChange={(date) => setDateRange(prev => ({ ...prev, from: date || undefined }))}
                selectsStart
                startDate={dateRange.from}
                endDate={dateRange.to}
                isClearable
                placeholderText="Start date"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-[var(--color-light-secondary)] dark:bg-dark-tertiary text-sm"
                dateFormat="yyyy-MM-dd"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To:</label>
              <DatePicker
                selected={dateRange.to}
                onChange={(date) => setDateRange(prev => ({ ...prev, to: date || undefined }))}
                selectsEnd
                startDate={dateRange.from}
                endDate={dateRange.to}
                minDate={dateRange.from}
                isClearable
                placeholderText="End date"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-[var(--color-light-secondary)] dark:bg-dark-tertiary text-sm"
                dateFormat="yyyy-MM-dd"
              />
            </div>
          </div>
        </div>

        {/* Export Summary */}
        <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-sm text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">
            <span className="font-medium">{filteredTradesCount}</span> trades will be exported
            {dateRange.from || dateRange.to ? ' for the selected date range' : ''}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-[var(--color-text-dark-primary)] dark:text-text-light-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || filteredTradesCount === 0}
            className="px-4 py-2 text-sm rounded-md bg-accent-blue hover:bg-accent-blue-darker text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FaDownload className="h-4 w-4" />
                <span>Export</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 