"use client";

import React, { memo } from 'react';
import { Trade, TradeDirection } from '@/types/trade';
import { Account } from '@/store/features/accountSlice';
import { format, parseISO } from 'date-fns';
import { formatPrice, formatPnl } from './TradesTable';

interface TradeTableRowProps {
  trade: Trade;
  accounts: Account[];
  isSelected: boolean;
  isEditing: boolean;
  onRowClick: (trade: Trade) => void;
  onSelectRow: (tradeId: string) => void;
  tdClasses: string;
}

// Memoized utility function to get account name
const getAccountName = (trade: Trade, accounts: Account[]): string => {
  if (trade.account?.name) return trade.account.name;
  if (!trade.accountId) return 'N/A';
  const account = accounts.find(acc => acc.id === trade.accountId);
  return account ? account.name : 'Unknown Account';
};

// Memoized TradeTableRow component - only re-renders when props change
export const TradeTableRow = memo<TradeTableRowProps>(({
  trade,
  accounts,
  isSelected,
  isEditing,
  onRowClick,
  onSelectRow,
  tdClasses,
}) => {
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectRow(trade.id);
  };

  const handleRowClick = () => {
    if (!isEditing) {
      onRowClick(trade);
    }
  };

  return (
    <tr
      onClick={handleRowClick}
      className={`
        border-b border-gray-100 dark:border-gray-800/50
        hover:bg-gray-50 dark:hover:bg-white/[0.02]
        cursor-pointer transition-colors
        ${isSelected ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''}
      `}
    >
      <td className={`${tdClasses} pl-4`}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          onClick={handleCheckboxClick}
          className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
        />
      </td>
      <td className={tdClasses}>{trade.symbol || '-'}</td>
      <td className={tdClasses}>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          trade.direction === TradeDirection.LONG
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {trade.direction || '-'}
        </span>
      </td>
      <td className={tdClasses}>{trade.quantity?.toFixed(2) || '-'}</td>
      <td className={tdClasses}>{formatPrice(trade.entryPrice)}</td>
      <td className={tdClasses}>{formatPrice(trade.exitPrice)}</td>
      <td className={tdClasses}>{formatPnl(trade.profitOrLoss)}</td>
      <td className={tdClasses}>
        {trade.entryDate
          ? format(parseISO(trade.entryDate as unknown as string), 'MMM dd, HH:mm')
          : '-'}
      </td>
      <td className={tdClasses}>
        {trade.exitDate
          ? format(parseISO(trade.exitDate as unknown as string), 'MMM dd, HH:mm')
          : '-'}
      </td>
      <td className={`${tdClasses} pr-4`}>{getAccountName(trade, accounts)}</td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.trade.id === nextProps.trade.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.trade.profitOrLoss === nextProps.trade.profitOrLoss &&
    prevProps.trade.status === nextProps.trade.status
  );
});

TradeTableRow.displayName = 'TradeTableRow';
