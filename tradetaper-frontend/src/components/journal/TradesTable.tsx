"use client";

import { Trade, AssetType, TradeDirection, TradeStatus } from '@/types/trade';
import { Account } from '@/store/features/accountSlice'; // Assuming Account type is exported or define here
import { format, parseISO, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import React, { useState, useMemo, useCallback } from 'react'; // Added useCallback
import { useDispatch } from 'react-redux';
import { updateTrade, deleteTrades, bulkUpdateTrades } from '@/store/features/tradesSlice';
import { FaChevronLeft, FaChevronRight, FaEdit, FaCheck, FaTimes, FaTrash, FaPen, FaExternalLinkAlt, FaEye } from 'react-icons/fa'; // Import icons for pagination
import { CurrencyAmount } from '@/components/common/CurrencyAmount';
import { AppDispatch } from '@/store/store';
import { FaSpinner } from 'react-icons/fa';
import AlertModal from '@/components/ui/AlertModal';

const TableLoader = ({ text }: { text: string }) => (
  <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400">
    <FaSpinner className="w-8 h-8 animate-spin mb-3 text-emerald-500" />
    <p>{text}</p>
  </div>
);

interface TradesTableProps {
  trades: Trade[];
  accounts: Account[];
  onRowClick: (trade: Trade) => void;
  isLoading?: boolean; // Optional: to show a loading state
  itemsPerPage?: number; // Optional: default pagination size
  totalItems?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

const getAccountName = (trade: Trade, accountMap: Map<string, string>): string => {
  if (trade.account?.name) return trade.account.name;
  if (!trade.accountId) return 'N/A';
  return accountMap.get(trade.accountId) || 'Unknown Account';
};

export const formatPrice = (price: number | undefined | null): string => {
  if (price === undefined || price === null) return '-';
  // Adjust decimals based on asset type or typical price precision if needed
  return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 });
};

export const formatPnl = (pnl: number | undefined | null): React.ReactNode => {
  if (pnl === undefined || pnl === null || typeof pnl !== 'number') {
    return <span className="text-gray-500 dark:text-gray-400">-</span>;
  }
  const textColor = pnl > 0 ? 'text-green-500' : pnl < 0 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400';
  return (
    <CurrencyAmount 
      amount={pnl} 
      className={`${textColor} ${pnl > 0 ? 'font-medium' : ''}`}
      showOriginal={false}
    />
  );
};



export default function TradesTable({
  trades,
  accounts,
  onRowClick,
  isLoading,
  itemsPerPage = 25,
  totalItems,
  currentPage,
  onPageChange,
  onPageSizeChange,
}: TradesTableProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Trade>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Bulk Edit State
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkUpdates, setBulkUpdates] = useState<Partial<Trade>>({});
  const [alertState, setAlertState] = useState({ isOpen: false, title: 'Notice', message: '' });
  const closeAlert = () => setAlertState((prev) => ({ ...prev, isOpen: false }));
  const showAlert = (message: string, title = 'Notice') =>
    setAlertState({ isOpen: true, title, message });

  const accountMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((account) => {
      map.set(account.id, account.name);
    });
    return map;
  }, [accounts]);

  // Simple inline pagination
  const [currentPageState, setCurrentPageState] = useState(1);
  const [rowsPerPageState, setRowsPerPageState] = useState(itemsPerPage || 25);
  const serverMode = typeof totalItems === 'number' && typeof onPageChange === 'function';
  const activePage = serverMode ? (currentPage || 1) : currentPageState;
  const activeRowsPerPage = serverMode ? (itemsPerPage || 25) : rowsPerPageState;
  
  const handleSelectAll = useCallback((e: React.ChangeEvent<HTMLInputElement>, currentData: Trade[]) => {
    if (e.target.checked) {
      const newSelected = new Set(selectedIds);
      currentData.forEach(trade => newSelected.add(trade.id));
      setSelectedIds(newSelected);
    } else {
      const newSelected = new Set(selectedIds);
      currentData.forEach(trade => newSelected.delete(trade.id));
      setSelectedIds(newSelected);
    }
  }, [selectedIds]);

  const handleSelectRow = useCallback((tradeId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(tradeId)) {
      newSelected.delete(tradeId);
    } else {
      newSelected.add(tradeId);
    }
    setSelectedIds(newSelected);
  }, [selectedIds]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;

    if (confirm(`Are you sure you want to delete ${selectedIds.size} trades?`)) {
      try {
        await dispatch(deleteTrades(Array.from(selectedIds))).unwrap();
        setSelectedIds(new Set());
      } catch (error) {
        console.error('Failed to delete trades:', error);
        showAlert('Failed to delete some trades. Please try again.', 'Delete Failed');
      }
    }
  }, [selectedIds, dispatch]);


  /* Bulk Edit Logic */
  const handleBulkUpdate = useCallback(async () => {
    if (selectedIds.size === 0 || Object.keys(bulkUpdates).length === 0) return;

    if (confirm(`Are you sure you want to update ${Object.keys(bulkUpdates).length} fields for ${selectedIds.size} trades?`)) {
      try {
        await dispatch(bulkUpdateTrades({
          ids: Array.from(selectedIds),
          data: bulkUpdates
        })).unwrap();
        setIsBulkEditing(false);
        setBulkUpdates({});
        setSelectedIds(new Set());
      } catch (error) {
        console.error('Failed to bulk update trades:', error);
        showAlert('Failed to update some trades. Please try again.', 'Update Failed');
      }
    }
  }, [selectedIds, bulkUpdates, dispatch]);

  const handleEditClick = useCallback((trade: Trade, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(trade.id);
    setEditForm({
      profitOrLoss: trade.profitOrLoss,
      rMultiple: trade.rMultiple,
      session: trade.session,
      commission: trade.commission,
      assetType: trade.assetType,
      direction: trade.direction,
      status: trade.status
    });
  }, []);

  const handleCancel = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditForm({});
  }, []);

  const handleSave = useCallback(async (tradeId: string) => {
    if (!tradeId) return;
    try {
      await dispatch(updateTrade({
        id: tradeId,
        payload: editForm
      })).unwrap();
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Failed to update trade:', error);
    }
  }, [dispatch, editForm]);

  const pagination = useMemo(() => {
    const totalCount = serverMode ? (totalItems || 0) : trades.length;
    const totalPages = Math.ceil(totalCount / activeRowsPerPage) || 1;
    const startIndex = (activePage - 1) * activeRowsPerPage;
    const endIndex = Math.min(startIndex + activeRowsPerPage, totalCount);
    const currentData = serverMode ? trades : trades.slice(startIndex, endIndex);

    return {
      currentPage: activePage,
      totalPages,
      currentData,
      goToPage: (page: number) => {
        const nextPage = Math.max(1, Math.min(page, totalPages));
        if (serverMode) {
          onPageChange?.(nextPage);
        } else {
          setCurrentPageState(nextPage);
        }
      },
      nextPage: () => {
        const nextPage = Math.min(activePage + 1, totalPages);
        if (serverMode) {
          onPageChange?.(nextPage);
        } else {
          setCurrentPageState(nextPage);
        }
      },
      prevPage: () => {
        const prevPage = Math.max(activePage - 1, 1);
        if (serverMode) {
          onPageChange?.(prevPage);
        } else {
          setCurrentPageState(prevPage);
        }
      },
      canGoNext: activePage < totalPages,
      canGoPrev: activePage > 1,
      startIndex: startIndex + 1,
      endIndex,
      totalItems: totalCount,
      itemsPerPage: activeRowsPerPage,
      setItemsPerPage: (size: number) => {
        if (serverMode) {
          onPageSizeChange?.(size);
        } else {
          setRowsPerPageState(size);
        }
      },
    };
  }, [trades, activePage, activeRowsPerPage, serverMode, totalItems, onPageChange, onPageSizeChange]);

  const allPageIdsSelected = pagination.currentData.length > 0 && pagination.currentData.every(t => selectedIds.has(t.id));

  if (isLoading) {
    return <TableLoader text="Loading trades table..." />;
  }

  if (!trades || trades.length === 0) {
    // This case should ideally be handled by the parent page
    // but as a fallback:
    return <div className="text-center py-10">No trades to display.</div>;
  }

  const thClasses = "px-3 py-2 text-left text-[10px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap";
  const tdClasses = "px-3 py-2 whitespace-nowrap text-xs";

  return (
    <>
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden">
      {/* Pagination Controls - Top */}
      {pagination.totalPages > 1 && (
        <div className="px-4 py-2 border-b border-gray-200/30 dark:border-gray-700/30 flex justify-between items-center bg-zinc-50 dark:bg-white/[0.02]">
          <div className="text-xs text-zinc-500 font-medium">
            Showing <span className="font-bold text-zinc-700 dark:text-zinc-300">{pagination.startIndex}-{pagination.endIndex}</span> of {pagination.totalItems}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={pagination.previousPage}
              disabled={!pagination.hasPreviousPage}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 hover:bg-emerald-500 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current transition-all"
            >
              <FaChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-gray-900 dark:text-white px-3">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={pagination.nextPage}
              disabled={!pagination.hasNextPage}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 hover:bg-emerald-500 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current transition-all"
            >
              <FaChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-1.5 flex flex-col gap-2 border-b border-emerald-100 dark:border-emerald-900/30 transition-all animate-in fade-in slide-in-from-top-2">
           <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                {selectedIds.size} trade{selectedIds.size > 1 ? 's' : ''} selected
              </span>
              
              <div className="flex items-center gap-2">
                {!isBulkEditing ? (
                  <>
                    <button
                      onClick={() => setIsBulkEditing(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <FaPen className="w-3.5 h-3.5" />
                      Bulk Edit
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <FaTrash className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleBulkUpdate}
                      disabled={Object.keys(bulkUpdates).length === 0}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Apply Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsBulkEditing(false);
                        setBulkUpdates({});
                      }}
                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
           </div>

           {/* Bulk Edit Inputs Row */}
           {isBulkEditing && (
             <div className="flex items-center gap-2 p-2 bg-white/50 dark:bg-black/20 rounded-lg overflow-x-auto pb-4">
                 <div className="flex flex-col gap-1 min-w-[120px]">
                   <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                   <select
                      value={bulkUpdates.status || ''}
                      onChange={(e) => setBulkUpdates({...bulkUpdates, status: e.target.value as TradeStatus || undefined})}
                      className="rounded border-emerald-300 dark:border-emerald-700 dark:bg-gray-800 text-xs py-1.5 focus:ring-emerald-500"
                    >
                      <option value="">(No Change)</option>
                      {Object.values(TradeStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>

                 <div className="flex flex-col gap-1 min-w-[120px]">
                   <label className="text-xs font-semibold text-gray-500 uppercase">Asset</label>
                   <select
                      value={bulkUpdates.assetType || ''}
                      onChange={(e) => setBulkUpdates({...bulkUpdates, assetType: e.target.value as AssetType || undefined})}
                      className="rounded border-emerald-300 dark:border-emerald-700 dark:bg-gray-800 text-xs py-1.5 focus:ring-emerald-500"
                    >
                      <option value="">(No Change)</option>
                      {Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                 </div>

                 <div className="flex flex-col gap-1 min-w-[120px]">
                   <label className="text-xs font-semibold text-gray-500 uppercase">Direction</label>
                   <select
                      value={bulkUpdates.direction || ''}
                      onChange={(e) => setBulkUpdates({...bulkUpdates, direction: e.target.value as TradeDirection || undefined})}
                      className="rounded border-emerald-300 dark:border-emerald-700 dark:bg-gray-800 text-xs py-1.5 focus:ring-emerald-500"
                    >
                      <option value="">(No Change)</option>
                      {Object.values(TradeDirection).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                 </div>

                 <div className="flex flex-col gap-1 min-w-[120px]">
                   <label className="text-xs font-semibold text-gray-500 uppercase">Session</label>
                   <select
                      value={bulkUpdates.session || ''}
                      onChange={(e) => setBulkUpdates({...bulkUpdates, session: e.target.value as TradingSession || undefined})}
                      className="rounded border-emerald-300 dark:border-emerald-700 dark:bg-gray-800 text-xs py-1.5 focus:ring-emerald-500"
                    >
                      <option value="">(No Change)</option>
                      <option value="Asian">Asian</option>
                      <option value="London">London</option>
                      <option value="New York">New York</option>
                    </select>
                 </div>

                 <div className="flex flex-col gap-1 min-w-[100px]">
                   <label className="text-xs font-semibold text-gray-500 uppercase">Commission</label>
                    <input
                      type="number"
                      step="0.01"
                      value={bulkUpdates.commission ?? ''}
                      onChange={(e) => setBulkUpdates({ ...bulkUpdates, commission: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="rounded border-emerald-300 dark:border-emerald-700 dark:bg-gray-800 text-xs py-1.5 focus:ring-emerald-500"
                      placeholder="(No Change)"
                    />
                 </div>
             </div>
           )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 backdrop-blur-sm">
            <tr className="border-b border-gray-200/30 dark:border-gray-700/30">
              <th className="px-3 py-2 w-8">
                 <input 
                   type="checkbox" 
                   checked={allPageIdsSelected}
                   onChange={(e) => handleSelectAll(e, pagination.currentData)}
                   className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                 />
              </th>
              <th className={thClasses}>Pair</th>
              <th className={thClasses}>Open Date</th>
              <th className={thClasses}>Account</th>
              <th className={thClasses}>Asset</th>
              <th className={thClasses}>Direction</th>
              <th className={thClasses}>Status</th>
              <th className={thClasses}>Session</th>
              <th className={thClasses}>Entry</th>
              <th className={thClasses}>Exit</th>
              <th className={thClasses}>P&L</th>
              <th className={thClasses}>Comm.</th>
              <th className={thClasses}>R-Multiple</th>
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
                        : selectedIds.has(trade.id)
                          ? 'bg-emerald-50/50 dark:bg-emerald-900/20'
                          : 'hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100 dark:hover:from-emerald-900/30 dark:hover:to-emerald-800/30 cursor-pointer hover:shadow-md'
                    }`}
                >
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox"
                      checked={selectedIds.has(trade.id)}
                      onChange={() => handleSelectRow(trade.id)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className={`${tdClasses} font-semibold text-gray-900 dark:text-white`}>
                    {trade.symbol}
                  </td>
                <td className={`${tdClasses} text-gray-700 dark:text-gray-300`}>
                  {trade.entryDate ? format(parseISO(trade.entryDate), 'dd MMM, HH:mm') : '-'}
                </td>
                <td className={`${tdClasses} text-gray-700 dark:text-gray-300`}>
                  <span className="px-2 py-1 bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-medium">
                    {getAccountName(trade, accountMap)}
                  </span>
                </td>

                {/* Editable Asset Type */}
                <td className={`${tdClasses} text-gray-700 dark:text-gray-300`} onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <select
                      value={editForm.assetType || ''}
                      onChange={(e) => setEditForm({ ...editForm, assetType: e.target.value as AssetType })}
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-24 focus:ring-2 focus:ring-emerald-500"
                    >
                      {Object.values(AssetType).map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {trade.assetType}
                    </span>
                  )}
                </td>

                {/* Editable Direction */}
                <td className={`${tdClasses} text-gray-700 dark:text-gray-300`} onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <select
                      value={editForm.direction || ''}
                      onChange={(e) => setEditForm({ ...editForm, direction: e.target.value as TradeDirection })}
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-20 focus:ring-2 focus:ring-emerald-500"
                    >
                      {Object.values(TradeDirection).map((dir) => (
                        <option key={dir} value={dir}>{dir}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`text-xs font-bold uppercase ${
                      trade.direction === TradeDirection.LONG 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {trade.direction}
                    </span>
                  )}
                </td>

                {/* Editable Status */}
                <td className={`${tdClasses} text-gray-700 dark:text-gray-300`} onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <select
                      value={editForm.status || ''}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TradeStatus })}
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-24 focus:ring-2 focus:ring-emerald-500"
                    >
                      {Object.values(TradeStatus).map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      trade.status === TradeStatus.OPEN ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                      trade.status === TradeStatus.PENDING ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      trade.status === TradeStatus.CANCELLED ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300'
                    }`}>
                      {trade.status}
                    </span>
                  )}
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

                {/* Editable Commission */}
                <td className={`${tdClasses} font-mono text-gray-700 dark:text-gray-300`} onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.commission ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, commission: parseFloat(e.target.value) })}
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-20 focus:ring-2 focus:ring-emerald-500 text-right"
                      placeholder="0.00"
                    />
                  ) : (
                    trade.commission ? `-$${Math.abs(trade.commission).toFixed(2)}` : '-'
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
                  <div className="flex items-center gap-1 justify-end">
                      {/* View Button - Always Visible */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/journal/view/${trade.id}`;
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                        title="View Details"
                      >
                        <FaExternalLinkAlt className="w-3.5 h-3.5" />
                      </button>

                      {/* Quick View Button - Always Visible */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick(trade);
                        }}
                        className="p-1.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                        title="Quick View"
                      >
                        <FaEye className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Button - Hover Only */}
                      <button
                        onClick={(e) => handleEditClick(trade, e)}
                        className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Quick Edit"
                      >
                        <FaEdit className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
          <div className="flex items-center bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-md">
            <span className="text-[10px] items-center uppercase font-bold text-gray-400 dark:text-gray-500 px-2 tracking-wider">Show</span>
            {[10, 25, 50, 100].map((size) => (
              <button
                key={size}
                onClick={() => pagination.setItemsPerPage(size)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  pagination.itemsPerPage === size
                    ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm scale-110 z-10'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {size}
              </button>
            ))}
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
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
      />
    </>
  );
} 
