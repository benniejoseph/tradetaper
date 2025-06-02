"use client";

import { Trade } from '@/types/trade';
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
    return format(parseISO(dateString), 'EEE'); // Mon, Tue, etc.
  } catch {
    return '-';
  }
};

export const getHoldTime = (trade: Trade): string => {
  if (!trade.entryDate || !trade.exitDate) return '-';
  
  try {
    const entry = parseISO(trade.entryDate);
    const exit = parseISO(trade.exitDate);
    
    const minutes = differenceInMinutes(exit, entry);
    const hours = differenceInHours(exit, entry);
    const days = differenceInDays(exit, entry);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m`;
    }
  } catch {
    return '-';
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

  const thClasses = "px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap";
  const tdClasses = "px-6 py-4 whitespace-nowrap text-sm";

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden">
      {/* Pagination Controls - Top */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-b border-gray-200/30 dark:border-gray-700/30 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, trades.length)} of {trades.length} trades
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={pagination.previousPage}
              disabled={!pagination.hasPreviousPage}
              className="p-2 rounded-xl bg-white/80 dark:bg-gray-800/80 hover:bg-blue-500 dark:hover:bg-blue-500 text-gray-600 dark:text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 backdrop-blur-sm"
            >
              <FaChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-gray-900 dark:text-white px-3">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={pagination.nextPage}
              disabled={!pagination.hasNextPage}
              className="p-2 rounded-xl bg-white/80 dark:bg-gray-800/80 hover:bg-blue-500 dark:hover:bg-blue-500 text-gray-600 dark:text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 backdrop-blur-sm"
            >
              <FaChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <tr className="border-b border-gray-200/30 dark:border-gray-700/30">
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
          <tbody className="divide-y divide-gray-200/30 dark:divide-gray-700/30">
            {pagination.currentData.map((trade) => (
              <tr 
                  key={trade.id} 
                  onClick={() => onRowClick(trade)} 
                  className="group hover:bg-white/90 dark:hover:bg-gray-800/60 cursor-pointer transition-all duration-200 hover:shadow-md backdrop-blur-sm"
              >
                <td className={`${tdClasses} font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors`}>
                  {trade.symbol}
                </td>
                <td className={`${tdClasses} text-gray-700 dark:text-gray-300`}>
                  {trade.entryDate ? format(parseISO(trade.entryDate), 'dd MMM, HH:mm:ss') : '-'}
                </td>
                <td className={`${tdClasses} text-gray-700 dark:text-gray-300`}>
                  <span className="px-2 py-1 bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium">
                    {getAccountName(trade.accountId, accounts)}
                  </span>
                </td>
                <td className={`${tdClasses} text-gray-700 dark:text-gray-300`}>
                  {trade.session ? (
                    <span className="px-2 py-1 bg-purple-100/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium">
                      {trade.session}
                    </span>
                  ) : '-'}
                </td>
                <td className={`${tdClasses} text-gray-700 dark:text-gray-300`}>{getWeekday(trade.entryDate)}</td>
                <td className={`${tdClasses} text-gray-700 dark:text-gray-300`}>{getHoldTime(trade)}</td>
                <td className={`${tdClasses} font-mono text-gray-900 dark:text-white`}>{formatPrice(trade.entryPrice)}</td>
                <td className={`${tdClasses} font-mono text-gray-900 dark:text-white`}>{formatPrice(trade.exitPrice)}</td>
                <td className={`${tdClasses} font-mono`}>{formatPnl(trade.profitOrLoss)}</td>
                <td className={`${tdClasses} text-gray-700 dark:text-gray-300`}>
                  {trade.rMultiple !== undefined && trade.rMultiple !== null ? (
                    <span className={`font-semibold ${
                      trade.rMultiple > 0 ? 'text-green-600 dark:text-green-400' : 
                      trade.rMultiple < 0 ? 'text-red-600 dark:text-red-400' : 
                      'text-gray-500 dark:text-gray-400'
                    }`}>
                      {trade.rMultiple.toFixed(2)}R
                    </span>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls - Bottom */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200/30 dark:border-gray-700/30 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Items per page:</span>
            <select
              value={pagination.itemsPerPage}
              onChange={(e) => pagination.setItemsPerPage(Number(e.target.value))}
              className="appearance-none bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70"
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
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    pagination.currentPage === pageNumber
                      ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                      : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 backdrop-blur-sm'
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