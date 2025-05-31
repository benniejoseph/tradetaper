"use client";

import { Trade, TradeStatus } from '@/types/trade';
import { Account } from '@/store/features/accountSlice'; // Assuming Account type is exported or define here
import { format, parseISO, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import React from 'react'; // Import React for React.ReactNode

interface TradesTableProps {
  trades: Trade[];
  accounts: Account[];
  onRowClick: (trade: Trade) => void;
  isLoading?: boolean; // Optional: to show a loading state
}

const getAccountName = (accountId: string | undefined, accounts: Account[]): string => {
  if (!accountId) return 'N/A';
  const account = accounts.find(acc => acc.id === accountId);
  return account ? account.name : 'Unknown Account';
};

export const formatPrice = (price: number | undefined | null): string => {
  if (price === undefined || price === null) return '-';
  // Adjust decimals based on asset type or typical price precision if needed
  return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 });
};

export const formatPnl = (pnl: number | undefined | null): React.ReactNode => {
  if (pnl === undefined || pnl === null || typeof pnl !== 'number') {
    return <span className="text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">-</span>;
  }
  const pnlValue = pnl.toFixed(2);
  const textColor = pnl > 0 ? 'text-accent-green' : pnl < 0 ? 'text-accent-red' : 'text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary';
  return <span className={textColor}>{pnl > 0 ? '+' : ''}{pnlValue}</span>;
};

export const getWeekday = (dateString: string | undefined): string => {
  if (!dateString) return '-';
  try {
    return format(parseISO(dateString), 'EEEE'); // e.g., Monday
  } catch {
    return '-';
  }
};

export const getHoldTime = (trade: Trade): string => {
  if (trade.status !== TradeStatus.CLOSED || !trade.entryDate || !trade.exitDate) {
    return '-';
  }
  try {
    const entry = parseISO(trade.entryDate);
    const exit = parseISO(trade.exitDate);
    const minutes = differenceInMinutes(exit, entry);

    if (minutes < 1) return '<1m';
    if (minutes < 60) return `${minutes}m`;
    
    const hours = differenceInHours(exit, entry);
    if (hours < 24) {
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }
    
    const days = differenceInDays(exit, entry);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;

  } catch {
    return 'Error';
  }
};

export default function TradesTable({ trades, accounts, onRowClick, isLoading }: TradesTableProps) {
  if (isLoading) {
    return <div className="text-center py-10">Loading trades table...</div>;
  }

  if (!trades || trades.length === 0) {
    // This case should ideally be handled by the parent page
    // but as a fallback:
    return <div className="text-center py-10">No trades to display.</div>;
  }

  const thClasses = "px-4 py-3 text-left text-xs font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary uppercase tracking-wider whitespace-nowrap";
  const tdClasses = "px-4 py-3 whitespace-nowrap text-sm";

  return (
    <div className="overflow-x-auto bg-[var(--color-light-primary)] dark:bg-dark-secondary shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-[var(--color-light-border)] dark:divide-dark-border">
        <thead className="bg-[var(--color-light-secondary)] dark:bg-dark-tertiary">
          <tr>
            <th className={thClasses}>Pair</th>
            <th className={thClasses}>Open Date</th>
            <th className={thClasses}>Account</th>
            <th className={thClasses}>Session</th>
            <th className={thClasses}>Weekday</th>
            <th className={thClasses}>Holdtime</th>
            <th className={thClasses}>Entry</th>
            <th className={thClasses}>Exit</th>
            <th className={thClasses}>P&L ($)</th>
            <th className={thClasses}>R-Multiple</th>
            {/* Add th for Actions (Edit/Delete) if icons are directly in table rows, or handle via onRowClick preview */}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-light-border)] dark:divide-dark-border">
          {trades.map((trade) => (
            <tr 
                key={trade.id} 
                onClick={() => onRowClick(trade)} 
                className="hover:bg-[var(--color-light-hover)] dark:hover:bg-dark-hover cursor-pointer transition-colors duration-150"
            >
              <td className={`${tdClasses} font-medium text-[var(--color-text-dark-primary)] dark:text-text-light-primary`}>{trade.symbol}</td>
              <td className={tdClasses}>{trade.entryDate ? format(parseISO(trade.entryDate), 'dd MMM, HH:mm:ss') : '-'}</td>
              <td className={tdClasses}>{getAccountName(trade.accountId, accounts)}</td>
              <td className={tdClasses}>{trade.session || '-'}</td>
              <td className={tdClasses}>{getWeekday(trade.entryDate)}</td>
              <td className={tdClasses}>{getHoldTime(trade)}</td>
              <td className={`${tdClasses} font-mono`}>{formatPrice(trade.entryPrice)}</td>
              <td className={`${tdClasses} font-mono`}>{formatPrice(trade.exitPrice)}</td>
              <td className={`${tdClasses} font-mono`}>{formatPnl(trade.profitOrLoss)}</td>
              <td className={tdClasses}>{trade.rMultiple !== undefined && trade.rMultiple !== null ? trade.rMultiple.toFixed(2) : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 