"use client";

import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchMT5Accounts, selectMT5Accounts, MT5Account, selectSelectedMT5AccountId, setSelectedMT5Account } from '@/store/features/mt5AccountsSlice';
import { fetchAccounts, selectAvailableAccounts, selectSelectedAccountId, setSelectedAccount } from '@/store/features/accountSlice';
// ... imports

export default function TradesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const trades = useSelector((state: RootState) => selectAllTrades(state));
  const manualAccounts = useSelector((state: RootState) => selectAvailableAccounts(state));
  const mt5Accounts = useSelector((state: RootState) => selectMT5Accounts(state));
  const isLoading = useSelector((state: RootState) => selectTradesLoading(state));
  
  // Global Selection State
  const globalSelectedManualId = useSelector((state: RootState) => selectSelectedAccountId(state));
  const globalSelectedMT5Id = useSelector((state: RootState) => selectSelectedMT5AccountId(state));
  
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Local state initialized with global state if available
  const [selectedAccountId, setSelectedAccountId] = useState<string>(globalSelectedManualId || globalSelectedMT5Id || '');

  // Sync local state when global state changes
  useEffect(() => {
    const newId = globalSelectedManualId || globalSelectedMT5Id || '';
    if (newId !== selectedAccountId) {
      setSelectedAccountId(newId);
    }
  }, [globalSelectedManualId, globalSelectedMT5Id]);

  useEffect(() => {
    // Fetch accounts first
    dispatch(fetchAccounts());
    dispatch(fetchMT5Accounts());
  }, [dispatch]);

  // Fetch trades whenever selectedAccountId changes (which now responds to global changes)
  useEffect(() => {
    dispatch(fetchTrades({ 
      page: 1, 
      limit: 1000, 
      accountId: selectedAccountId || undefined 
    }));
  }, [dispatch, selectedAccountId]);

  // Merge and normalize accounts
  const allAccounts = useMemo(() => {
    const formattedManual = manualAccounts.map(acc => ({
      ...acc,
      type: 'Manual'
    }));
    
    const formattedMT5 = mt5Accounts.map(acc => ({
      id: acc.id,
      name: acc.accountName,
      balance: acc.balance || 0,
      currency: acc.currency || 'USD',
      createdAt: acc.createdAt || '',
      updatedAt: acc.updatedAt || '',
      type: 'MT5'
    }));

    return [...formattedManual, ...formattedMT5];
  }, [manualAccounts, mt5Accounts]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchTrades({ 
      page: 1, 
      limit: 1000, 
      accountId: selectedAccountId || undefined 
    }));
  }, [dispatch, selectedAccountId]);

  const handleAccountFilter = (accountId: string) => {
    // Update local state
    setSelectedAccountId(accountId);
    
    // Dispatch to global state
    if (!accountId) {
       dispatch(setSelectedAccount(null));
       dispatch(setSelectedMT5Account(null));
    } else {
       const isMT5 = mt5Accounts.find(acc => acc.id === accountId);
       if (isMT5) {
         dispatch(setSelectedMT5Account(accountId));
         dispatch(setSelectedAccount(null));
       } else {
         dispatch(setSelectedAccount(accountId));
         dispatch(setSelectedMT5Account(null));
       }
    }
  };

  const handleRowClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedTrade(null);
  };

  const filteredTrades = selectedAccountId 
    ? trades.filter((t: Trade) => t.accountId === selectedAccountId)
    : trades;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-gray-50 dark:from-gray-900 dark:via-emerald-950/20 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Trade History
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              View and analyze all your trades
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Account Filter */}
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500 w-4 h-4" />
              <select
                value={selectedAccountId}
                onChange={(e) => handleAccountFilter(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Accounts</option>
                {allAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type}) - ${account.balance.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50"
            >
              <FaSync className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Add Trade Button */}
            <Link
              href="/journal/new"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
            >
              <FaPlus className="w-4 h-4" />
              Add Trade
            </Link>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Trades</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredTrades.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Winning Trades</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {filteredTrades.filter((t: Trade) => (t.profitOrLoss ?? 0) > 0).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Losing Trades</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {filteredTrades.filter((t: Trade) => (t.profitOrLoss ?? 0) < 0).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total P&L</p>
            <p className={`text-2xl font-bold ${
              filteredTrades.reduce((sum: number, t: Trade) => sum + (t.profitOrLoss ?? 0), 0) >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              ${filteredTrades.reduce((sum: number, t: Trade) => sum + (t.profitOrLoss ?? 0), 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Net Balance</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {(() => {
                const selectedAccount = allAccounts.find(a => a.id === selectedAccountId);
                if (!selectedAccount) return 'N/A';
                
                // For MT5, balance is strictly what returns from API (includes closed PnL)
                // For Manual, we assume it's starting balance + calculated PnL
                const totalPnL = filteredTrades.reduce((sum, t) => sum + (t.profitOrLoss ?? 0), 0);
                const displayBalance = selectedAccount.type === 'MT5' 
                  ? selectedAccount.balance 
                  : selectedAccount.balance + totalPnL;
                  
                return `$${displayBalance.toFixed(2)}`;
              })()}
            </p>
          </div>
        </div>

        {/* Trades Table */}
        <TradesTable
          trades={filteredTrades}
          accounts={allAccounts}
          onRowClick={handleRowClick}
          isLoading={isLoading}
          itemsPerPage={25}
        />

        {/* Empty State */}
        {!isLoading && filteredTrades.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <FaPlus className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No trades found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedAccountId 
                ? "No trades for the selected account. Try a different filter or import trades."
                : "Start by adding your first trade or importing from your MT5 account."}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/journal/new"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                Add Trade Manually
              </Link>
              <Link
                href="/settings"
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                Import from MT5
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Trade Preview Drawer */}
      {selectedTrade && (
        <TradePreviewDrawer
          trade={selectedTrade}
          isOpen={isDrawerOpen}
          onClose={handleCloseDrawer}
        />
      )}
    </div>
  );
}
