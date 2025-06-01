"use client";

import { Trade, TradeStatus } from '@/types/trade';
import { Account } from '@/store/features/accountSlice'; // Assuming Account type is exported or define here
import { format, parseISO, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import React from 'react'; // Import React for React.ReactNode
import { usePagination } from '@/hooks/usePagination'; // Import pagination hook
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'; // Import icons for pagination
import { TableLoader } from '@/components/common/LoadingSpinner'; // Import loading component

interface TradesTableProps {
  trades: Trade[];
  accounts: Account[];
  onRowClick: (trade: Trade) => void;
  isLoading?: boolean; // Optional: to show a loading state
  itemsPerPage?: number; // Optional: default pagination size
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

export default function TradesTable({ trades, accounts, onRowClick, isLoading, itemsPerPage = 25 }: TradesTableProps) {
  // Use pagination hook
  const pagination = usePagination({
    data: trades,
    itemsPerPage: itemsPerPage,
    initialPage: 1
  });

  if (isLoading) {
    return <TableLoader text="Loading trades table..." />;
  }

  if (!trades || trades.length === 0) {
    // This case should ideally be handled by the parent page
    // but as a fallback:
    return <div className="text-center py-10">No trades to display.</div>;
  }

  const thClasses = "px-4 py-3 text-left text-xs font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary uppercase tracking-wider whitespace-nowrap";
  const tdClasses = "px-4 py-3 whitespace-nowrap text-sm";

  return (
    <div className="bg-[var(--color-light-primary)] dark:bg-dark-secondary shadow-md rounded-lg">
      {/* Pagination Controls - Top */}
      {pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-b border-[var(--color-light-border)] dark:border-dark-border flex justify-between items-center">
          <div className="text-sm text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, trades.length)} of {trades.length} trades
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={pagination.previousPage}
              disabled={!pagination.hasPreviousPage}
              className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={pagination.nextPage}
              disabled={!pagination.hasNextPage}
              className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
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
              <th className={thClasses}>P&L</th>
              <th className={thClasses}>R-Multiple</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-light-border)] dark:divide-dark-border">
            {pagination.currentData.map((trade) => (
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

      {/* Pagination Controls - Bottom */}
      {pagination.totalPages > 1 && (
        <div className="px-4 py-3 border-t border-[var(--color-light-border)] dark:border-dark-border flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">Items per page:</span>
            <select
              value={pagination.itemsPerPage}
              onChange={(e) => pagination.setItemsPerPage(Number(e.target.value))}
              className="border border-[var(--color-light-border)] dark:border-dark-border rounded-md px-2 py-1 text-sm bg-[var(--color-light-secondary)] dark:bg-dark-tertiary"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center space-x-1">
            {/* Page numbers - simplified for this example */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNumber = i + 1;
              return (
                <button
                  key={pageNumber}
                  onClick={() => pagination.goToPage(pageNumber)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    pagination.currentPage === pageNumber
                      ? 'bg-accent-blue text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 