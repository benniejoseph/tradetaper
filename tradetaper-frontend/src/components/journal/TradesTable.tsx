"use client";

import { Trade } from '@/types/trade';
import { Account } from '@/store/features/accountSlice'; // Assuming Account type is exported or define here
import { format, parseISO, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import React, { useState, useMemo } from 'react'; // Import React for React.ReactNode
import { FaChevronLeft, FaChevronRight, FaEdit, FaCheck, FaTimes } from 'react-icons/fa'; // Import icons for pagination
import { TableLoader } from '@/components/common/LoadingSpinner'; // Import loading component
import { CurrencyAmount } from '@/components/common/CurrencyAmount';
import { useDispatch } from 'react-redux';
import { updateTrade } from '@/store/features/tradesSlice';
import { AppDispatch } from '@/store/store';

interface TradesTableProps {
  trades: Trade[];
  accounts: Account[];
  onRowClick: (trade: Trade) => void;
  isLoading?: boolean; // Optional: to show a loading state
  itemsPerPage?: number; // Optional: default pagination size
}

const getAccountName = (trade: Trade, accounts: Account[]): string => {
  if (trade.account?.name) return trade.account.name;
  if (!trade.accountId) return 'N/A';
  const account = accounts.find(acc => acc.id === trade.accountId);
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
  const textColor = pnl > 0 ? 'text-accent-green' : pnl < 0 ? 'text-accent-red' : 'text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary';
  return (
    <CurrencyAmount 
      amount={pnl} 
      className={`${textColor} ${pnl > 0 ? 'font-medium' : ''}`}
      showOriginal={false}
    />
  );
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
  // Simple inline pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  const pagination = useMemo(() => {
    const totalItems = trades.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentData = trades.slice(startIndex, endIndex);
    
    return {
      currentPage,
      totalPages,
      currentData,
      goToPage: (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages))),
      nextPage: () => setCurrentPage(prev => Math.min(prev + 1, totalPages)),
      prevPage: () => setCurrentPage(prev => Math.max(prev - 1, 1)),
      canGoNext: currentPage < totalPages,
      canGoPrev: currentPage > 1,
      startIndex: startIndex + 1,
      endIndex,
      totalItems
    };
  }, [trades, currentPage, itemsPerPage]);

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
    <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden">
      {/* Pagination Controls - Top */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-b border-gray-200/30 dark:border-gray-700/30 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, trades.length)} of {trades.length} trades
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={pagination.previousPage}
              disabled={!pagination.hasPreviousPage}
              className="p-2 rounded-xl bg-gradient-to-r from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 hover:bg-emerald-500 dark:hover:bg-emerald-500 text-gray-600 dark:text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 backdrop-blur-sm"
            >
              <FaChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-gray-900 dark:text-white px-3">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={pagination.nextPage}
              disabled={!pagination.hasNextPage}
              className="p-2 rounded-xl bg-gradient-to-r from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 hover:bg-emerald-500 dark:hover:bg-emerald-500 text-gray-600 dark:text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 backdrop-blur-sm"
            >
              <FaChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 backdrop-blur-sm">
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
              <th className={thClasses}>Chart</th>
              <th className={thClasses}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/30 dark:divide-gray-700/30">
            {pagination.currentData.map((trade) => {
              const isEditing = editingId === trade.id;
              
              return (
              <tr 
                  key={trade.id} 
                  onClick={() => !isEditing && onRowClick(trade)} 
                  className={`group transition-all duration-200 backdrop-blur-sm ${
                    isEditing 
                      ? 'bg-yellow-50 dark:bg-yellow-900/10' 
                      : 'hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100 dark:hover:from-emerald-900/30 dark:hover:to-emerald-800/30 cursor-pointer hover:shadow-md'
                  }`}
              >
                <td className={`${tdClasses} font-semibold text-gray-900 dark:text-white`}>
                  {trade.symbol}
                </td>
                <td className={`${tdClasses} text-gray-700 dark:text-gray-300`}>
                  {trade.entryDate ? format(parseISO(trade.entryDate), 'dd MMM, HH:mm') : '-'}
                </td>
                <td className={`${tdClasses} text-gray-700 dark:text-gray-300`}>
                  <span className="px-2 py-1 bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-medium">
                    {getAccountName(trade, accounts)}
                  </span>
                </td>
                
                {/* Editable Session */}
                <td className={`${tdClasses} text-gray-700 dark:text-gray-300`} onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <select
                      value={editForm.session || ''}
                      onChange={(e) => setEditForm({ ...editForm, session: e.target.value })}
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-24 focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-</option>
                      <option value="Asian">Asian</option>
                      <option value="London">London</option>
                      <option value="New York">New York</option>
                    </select>
                  ) : (
                    trade.session ? (
                      <span className="px-2 py-1 bg-gradient-to-r from-emerald-200 to-emerald-300 dark:from-emerald-800/30 dark:to-emerald-700/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-medium">
                        {trade.session}
                      </span>
                    ) : '-'
                  )}
                </td>

                <td className={`${tdClasses} text-gray-700 dark:text-gray-300`}>{getWeekday(trade.entryDate)}</td>
                <td className={`${tdClasses} text-gray-700 dark:text-gray-300`}>{getHoldTime(trade)}</td>
                <td className={`${tdClasses} font-mono text-gray-900 dark:text-white`}>{formatPrice(trade.entryPrice)}</td>
                <td className={`${tdClasses} font-mono text-gray-900 dark:text-white`}>{formatPrice(trade.exitPrice)}</td>
                
                {/* Editable P&L */}
                <td className={`${tdClasses} font-mono`} onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.profitOrLoss ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, profitOrLoss: parseFloat(e.target.value) })}
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-24 focus:ring-2 focus:ring-emerald-500 text-right"
                      placeholder="0.00"
                    />
                  ) : (
                    formatPnl(trade.profitOrLoss)
                  )}
                </td>

                {/* Editable R-Multiple */}
                <td className={`${tdClasses} text-gray-700 dark:text-gray-300`} onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.rMultiple ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, rMultiple: parseFloat(e.target.value) })}
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-16 focus:ring-2 focus:ring-emerald-500 text-right"
                      placeholder="0.0R"
                    />
                  ) : (
                    trade.rMultiple !== undefined && trade.rMultiple !== null ? (
                      <span className={`font-semibold ${
                        trade.rMultiple > 0 ? 'text-green-600 dark:text-green-400' : 
                        trade.rMultiple < 0 ? 'text-red-600 dark:text-red-400' : 
                        'text-gray-500 dark:text-gray-400'
                      }`}>
                        {trade.rMultiple.toFixed(2)}R
                      </span>
                    ) : '-'
                  )}
                </td>

                <td className={`${tdClasses} text-center`}>
                  {trade.imageUrl ? (
                    <div className="flex justify-center">
                      <img
                        src={trade.imageUrl}
                        alt={`${trade.symbol} chart`}
                        className="w-12 h-8 object-cover rounded-lg shadow-sm hover:scale-110 transition-transform duration-200 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(trade.imageUrl, '_blank');
                        }}
                        onError={(e) => {
                          console.error('Table image failed to load:', trade.imageUrl);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-xs">No image</span>
                  )}
                </td>

                {/* Actions Column */}
                <td className={`${tdClasses} text-right`} onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleSave(trade.id)}
                        className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors"
                        title="Save"
                      >
                        <FaCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors"
                        title="Cancel"
                      >
                        <FaTimes className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => handleEditClick(trade, e)}
                      className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Quick Edit"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls - Bottom */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200/30 dark:border-gray-700/30 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Items per page:</span>
            <select
              value={pagination.itemsPerPage}
              onChange={(e) => pagination.setItemsPerPage(Number(e.target.value))}
              className="appearance-none bg-gradient-to-r from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 border border-gray-200/50 dark:border-gray-700/50 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70"
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
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md'
                      : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:from-emerald-100 hover:to-emerald-200 dark:hover:from-emerald-900/30 dark:hover:to-emerald-800/30 backdrop-blur-sm'
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