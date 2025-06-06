"use client";
import React from 'react';
import { Trade, TradeStatus, TradeDirection } from '@/types/trade';
import { FaStar, FaRegStar, FaEdit, FaEye, FaArrowUp, FaArrowDown, FaChartLine } from 'react-icons/fa';
import { format } from 'date-fns';
import Link from 'next/link';
import { CurrencyAmount } from '@/components/common/CurrencyAmount';

interface TradeCardProps {
  trade: Trade;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  showCheckbox?: boolean;
}

export default function TradeCard({ trade, isSelected = false, onSelect, showCheckbox = false }: TradeCardProps) {
  const profitOrLoss = trade.profitOrLoss || 0;
  const isProfit = profitOrLoss > 0;
  const isLoss = profitOrLoss < 0;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return '-';
    }
  };

  const getStatusStyle = (status: TradeStatus) => {
    switch (status) {
      case TradeStatus.OPEN:
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case TradeStatus.CLOSED:
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      case TradeStatus.CANCELLED:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  const DirectionIcon = trade.direction === TradeDirection.LONG ? FaArrowUp : FaArrowDown;

  return (
    <div className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group ${
      isSelected ? 'ring-2 ring-blue-500 bg-blue-50/90 dark:bg-blue-900/20' : ''
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-3">
          {showCheckbox && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect?.(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 backdrop-blur-sm"
            />
          )}
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl shadow-lg ${
              trade.direction === TradeDirection.LONG 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : 'bg-gradient-to-r from-red-500 to-red-600'
            }`}>
              <DirectionIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {trade.symbol}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {trade.assetType} • {trade.direction}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {trade.isStarred ? (
            <FaStar className="h-4 w-4 text-yellow-500" />
          ) : (
            <FaRegStar className="h-4 w-4 text-gray-400" />
          )}
          <span className={`px-3 py-1.5 text-xs font-semibold rounded-xl shadow-sm ${getStatusStyle(trade.status)}`}>
            {trade.status}
          </span>
        </div>
      </div>

      {/* P&L Highlight (if closed) */}
      {trade.status === TradeStatus.CLOSED && (
        <div className="mb-6 p-4 bg-gradient-to-br from-gray-50/80 to-white/80 dark:from-gray-800/40 dark:to-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-200/30 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isProfit ? (
                <FaChartLine className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <FaChartLine className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Net P&L</span>
            </div>
            <span className={`text-lg font-bold ${
              isProfit ? 'text-green-600 dark:text-green-400' : 
              isLoss ? 'text-red-600 dark:text-red-400' : 
              'text-gray-600 dark:text-gray-400'
            }`}>
              {profitOrLoss >= 0 ? '+' : ''}<CurrencyAmount 
                amount={profitOrLoss} 
                className="inline"
                showOriginal={false}
              />
            </span>
          </div>
        </div>
      )}

      {/* Trade Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl p-3 border border-gray-200/30 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/60 transition-all duration-200">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">ENTRY</div>
          <div className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
            {trade.entryPrice ? <CurrencyAmount amount={trade.entryPrice} className="inline" /> : '-'}
          </div>
        </div>

        {trade.status === TradeStatus.CLOSED && (
          <div className="bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl p-3 border border-gray-200/30 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/60 transition-all duration-200">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">EXIT</div>
            <div className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
              {trade.exitPrice ? <CurrencyAmount amount={trade.exitPrice} className="inline" /> : '-'}
            </div>
          </div>
        )}

        <div className="bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl p-3 border border-gray-200/30 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/60 transition-all duration-200">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">QUANTITY</div>
          <div className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
            {trade.quantity ? trade.quantity.toLocaleString() : '-'}
          </div>
        </div>

        {trade.rMultiple && (
          <div className="bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl p-3 border border-gray-200/30 dark:border-gray-700/30 hover:bg-white/80 dark:hover:bg-gray-800/60 transition-all duration-200">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">R-MULTIPLE</div>
            <div className={`text-sm font-mono font-semibold ${
              trade.rMultiple > 0 ? 'text-green-600 dark:text-green-400' : 
              trade.rMultiple < 0 ? 'text-red-600 dark:text-red-400' : 
              'text-gray-600 dark:text-gray-400'
            }`}>
              {trade.rMultiple.toFixed(2)}R
            </div>
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Entry Date:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatDate(trade.entryDate)}
          </span>
        </div>

        {trade.status === TradeStatus.CLOSED && trade.exitDate && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Exit Date:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatDate(trade.exitDate)}
            </span>
          </div>
        )}
      </div>

      {/* ICT Concept & Session */}
      {(trade.ictConcept || trade.session) && (
        <div className="mb-6 pt-4 border-t border-gray-200/30 dark:border-gray-700/30">
          <div className="flex flex-wrap gap-2">
            {trade.ictConcept && (
              <span className="inline-block px-3 py-1.5 text-xs font-medium bg-purple-100/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl backdrop-blur-sm">
                {trade.ictConcept}
              </span>
            )}
            {trade.session && (
              <span className="inline-block px-3 py-1.5 text-xs font-medium bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl backdrop-blur-sm">
                {trade.session}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Notes Preview */}
      {trade.notes && (
        <div className="mb-6 pt-4 border-t border-gray-200/30 dark:border-gray-700/30">
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {trade.notes}
          </p>
        </div>
      )}

      {/* Chart/Image Preview */}
      {trade.imageUrl && (
        <div className="mb-6 pt-4 border-t border-gray-200/30 dark:border-gray-700/30">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">Chart Preview</p>
          <div className="relative rounded-xl overflow-hidden bg-gray-100/80 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30">
            <img
              src={trade.imageUrl}
              alt={`${trade.symbol} trade chart`}
              className="w-full h-32 object-cover hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center space-x-3 pt-4 border-t border-gray-200/30 dark:border-gray-700/30">
        <Link
          href={`/journal/view/${trade.id}`}
          className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-blue-500 dark:hover:bg-blue-500 text-gray-600 dark:text-gray-400 hover:text-white rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm font-medium"
        >
          <FaEye className="h-4 w-4" />
          <span>View</span>
        </Link>
        
        <Link
          href={`/journal/edit/${trade.id}`}
          className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-lg font-medium"
        >
          <FaEdit className="h-4 w-4" />
          <span>Edit</span>
        </Link>
      </div>
    </div>
  );
} 