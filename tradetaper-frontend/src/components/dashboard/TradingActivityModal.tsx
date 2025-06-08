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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <FaCalendarAlt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Trading Activity - {formatDate(parseISO(selectedDate.date), 'MMMM d, yyyy')}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <FaExchangeAlt className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedDate.count}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {selectedDate.count === 1 ? 'Trade' : 'Trades'}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <FaChartLine className={`w-5 h-5 ${selectedDate.totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
              </div>
              <div className={`text-2xl font-bold ${selectedDate.totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                <CurrencyAmount amount={selectedDate.totalPnl} className="inline" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Net P&L
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <FaChartLine className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
            {tradesForDate.map((trade, index) => (
              <div key={trade.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {trade.symbol}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.direction === 'Long' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {trade.direction}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.status === 'Closed' 
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {trade.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Entry: <CurrencyAmount amount={trade.entryPrice} className="inline" />
                      {trade.exitPrice && (
                        <> • Exit: <CurrencyAmount amount={trade.exitPrice} className="inline" /></>
                      )}
                      {trade.quantity && (
                        <> • Qty: {trade.quantity.toLocaleString()}</>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      (trade.profitOrLoss || 0) >= 0 
                        ? 'text-green-600 dark:text-green-400' 
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