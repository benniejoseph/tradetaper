"use client";

import React from 'react';
import { Trade } from '@/types/trade';
import { parseISO, format as formatDate } from 'date-fns';
import { FaCalendarAlt, FaChartLine, FaExchangeAlt, FaTimes } from 'react-icons/fa';
import { CurrencyAmount } from '@/components/common/CurrencyAmount';

interface CustomHeatmapValue {
  date: string; // YYYY-MM-DD
  count: number; // Number of trades
  totalPnl: number;
}

interface TradingActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: CustomHeatmapValue | null;
  tradesForDate: Trade[];
}

export default function TradingActivityModal({ 
  isOpen, 
  onClose, 
  selectedDate, 
  tradesForDate 
}: TradingActivityModalProps) {
  if (!isOpen || !selectedDate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-black sm:rounded-xl">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-3 py-3 dark:border-emerald-600/30 dark:from-emerald-950/30 dark:to-emerald-900/30 sm:items-center sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-start gap-2 sm:items-center sm:space-x-3">
            <FaCalendarAlt className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white sm:text-xl">
              Trading Activity - {formatDate(parseISO(selectedDate.date), 'MMMM d, yyyy')}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
            aria-label="Close modal"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="max-h-[calc(90vh-132px)] overflow-y-auto p-3 sm:max-h-[calc(90vh-140px)] sm:p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <FaExchangeAlt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedDate.count}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedDate.count === 1 ? 'Trade' : 'Trades'}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <FaChartLine className={`w-5 h-5 ${selectedDate.totalPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
              </div>
              <div className={`text-2xl font-bold ${selectedDate.totalPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                <CurrencyAmount amount={selectedDate.totalPnl} className="inline" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Net P&L
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <FaChartLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                <CurrencyAmount amount={selectedDate.count > 0 ? selectedDate.totalPnl / selectedDate.count : 0} className="inline" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Avg P&L
              </div>
            </div>
          </div>
          
          {/* Individual Trades List */}
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Individual Trades
            </h4>
            {tradesForDate?.map((trade) => (
              <div key={trade.id} className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-lg p-4 hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-900/30 dark:hover:to-emerald-800/30 transition-colors">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {trade.symbol}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.direction === 'Long' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {trade.direction}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.status === 'Closed' 
                          ? 'bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 text-gray-800 dark:text-gray-200'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300'
                      }`}>
                        {trade.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 break-words">
                      Entry: <CurrencyAmount amount={trade.entryPrice} className="inline" />
                      {trade.exitPrice && (
                        <> • Exit: <CurrencyAmount amount={trade.exitPrice} className="inline" /></>
                      )}
                      {trade.quantity && (
                        <> • Qty: {trade.quantity.toLocaleString()}</>
                      )}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className={`text-lg font-bold ${
                      (trade.profitOrLoss || 0) >= 0 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {(trade.profitOrLoss || 0) >= 0 ? '+' : ''}<CurrencyAmount amount={trade.profitOrLoss || 0} className="inline" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
