/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchTrades } from '@/store/features/tradesSlice';
import { selectSelectedAccountId } from '@/store/features/accountSlice';
import { selectSelectedMT5AccountId } from '@/store/features/mt5AccountsSlice';
import { Trade, TradeStatus } from '@/types/trade';
import TradeCard from '@/components/trades/TradeCard';
import ExportModal from '@/components/common/ExportModal';
import BulkOperationsBar from '@/components/common/BulkOperationsBar';
import AdvancedFilters, { FilterOptions } from '@/components/common/AdvancedFilters';
import { useWebSocket } from '@/hooks/useWebSocket';
import { FaPlus, FaSearch, FaDownload, FaChartLine, FaFilter } from 'react-icons/fa';
import Link from 'next/link';

export default function TradesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { trades, isLoading, error } = useSelector((state: RootState) => state.trades);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const selectedAccountId = useSelector(selectSelectedAccountId);
  const selectedMT5AccountId = useSelector(selectSelectedMT5AccountId);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrades, setSelectedTrades] = useState<Trade[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});

  // Initialize WebSocket connection
  useWebSocket({
    enabled: true,
    onConnect: () => {/* Connected to trades WebSocket */},
    onDisconnect: () => {/* Disconnected from trades WebSocket */},
    onError: (error) => console.error('WebSocket error:', error),
  });

  useEffect(() => {
    if (isAuthenticated) {
      // Get the actual selected account ID (could be MT5 or regular account)
      const currentAccountId = selectedAccountId || selectedMT5AccountId;
      dispatch(fetchTrades(currentAccountId || undefined));
    }
  }, [dispatch, isAuthenticated, selectedAccountId, selectedMT5AccountId]);

  // Apply filters and search
  const filteredTrades = useMemo(() => {
    let filtered = [...trades];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(trade =>
        trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.setupDetails?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(trade => filters.status!.includes(trade.status));
    }
    
    if (filters.direction && filters.direction.length > 0) {
      filtered = filtered.filter(trade => filters.direction!.includes(trade.direction));
    }
    
    if (filters.assetType && filters.assetType.length > 0) {
      filtered = filtered.filter(trade => filters.assetType!.includes(trade.assetType));
    }

    if (filters.isStarred) {
      filtered = filtered.filter(trade => trade.isStarred);
    }

    if (filters.dateRange?.from || filters.dateRange?.to) {
      filtered = filtered.filter(trade => {
        if (!trade.entryDate) return false;
        const entryDate = new Date(trade.entryDate);
        
        if (filters.dateRange?.from && entryDate < filters.dateRange.from) return false;
        if (filters.dateRange?.to && entryDate > filters.dateRange.to) return false;
        
        return true;
      });
    }

    if (filters.profitRange?.min !== undefined || filters.profitRange?.max !== undefined) {
      filtered = filtered.filter(trade => {
        const profit = trade.profitOrLoss || 0;
        
        if (filters.profitRange?.min !== undefined && profit < filters.profitRange.min) return false;
        if (filters.profitRange?.max !== undefined && profit > filters.profitRange.max) return false;
        
        return true;
      });
    }

    if (filters.rMultipleRange?.min !== undefined || filters.rMultipleRange?.max !== undefined) {
      filtered = filtered.filter(trade => {
        const rMultiple = trade.rMultiple || 0;
        
        if (filters.rMultipleRange?.min !== undefined && rMultiple < filters.rMultipleRange.min) return false;
        if (filters.rMultipleRange?.max !== undefined && rMultiple > filters.rMultipleRange.max) return false;
        
        return true;
      });
    }

    return filtered;
  }, [trades, searchTerm, filters]);

  const handleSelectTrade = (trade: Trade, selected: boolean) => {
    if (selected) {
      setSelectedTrades(prev => [...prev, trade]);
    } else {
      setSelectedTrades(prev => prev.filter(t => t.id !== trade.id));
    }
  };

  const handleSelectAll = () => {
    if (selectedTrades.length === filteredTrades.length) {
      setSelectedTrades([]);
    } else {
      setSelectedTrades([...filteredTrades]);
    }
  };

  const handleBulkDelete = (_tradeIds: string[]) => {
    // TODO: Implement bulk delete logic
    // Dispatch bulk delete action here
  };

  const handleBulkUpdateStatus = (_tradeIds: string[], _status: TradeStatus) => {
    // TODO: Implement bulk status update logic
    // Dispatch bulk status update action here
  };

  const handleBulkToggleStar = (_tradeIds: string[], _starred: boolean) => {
    // TODO: Implement bulk star toggle logic
    // Dispatch bulk star toggle action here
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white">Loading trades...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaChartLine className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Trades</h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => {
              const currentAccountId = selectedAccountId || selectedMT5AccountId;
              dispatch(fetchTrades(currentAccountId || undefined));
            }}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <FaChartLine className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              All Trades
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage and analyze your trading positions
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center space-x-2 px-4 py-3 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-green-500 dark:hover:bg-green-500 text-gray-600 dark:text-gray-400 hover:text-white rounded-xl transition-all duration-200 hover:scale-105 backdrop-blur-sm shadow-lg"
          >
            <FaDownload className="h-4 w-4" />
            <span>Export</span>
          </button>
          <Link
            href="/journal/new"
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <FaPlus className="h-4 w-4" />
            <span>Add Trade</span>
          </Link>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search trades by symbol, notes, or setup details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Filter Toggle and Select All */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                showFilters 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                  : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <FaFilter className="h-4 w-4" />
              <span>Filters</span>
            </button>
            
            {filteredTrades.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="px-4 py-3 text-sm font-medium border border-gray-200/50 dark:border-gray-700/50 rounded-xl bg-white/60 dark:bg-gray-800/40 hover:bg-white/80 dark:hover:bg-gray-800/60 transition-all duration-200 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white backdrop-blur-sm"
              >
                {selectedTrades.length === filteredTrades.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mt-4 pt-4 border-t border-gray-200/30 dark:border-gray-700/30">
          <span>
            Showing {filteredTrades.length} of {trades.length} trades
            {selectedTrades.length > 0 && ` (${selectedTrades.length} selected)`}
          </span>
          {(searchTerm || Object.keys(filters).some(key => {
            const value = filters[key as keyof FilterOptions];
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'object' && value !== null) {
              return Object.values(value).some(v => v !== undefined && v !== null);
            }
            return value !== undefined && value !== null;
          })) && (
            <button
              onClick={clearFilters}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <AdvancedFilters
            isOpen={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={clearFilters}
            // availableSymbols={[]}
            // availableSessions={[]}
            // availableIctConcepts={[]}
            // availableTags={[]}
          />
        </div>
      )}

      {/* Trades Grid */}
      {filteredTrades.length === 0 ? (
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaChartLine className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {trades.length === 0 ? 'No trades found' : 'No trades match your filters'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {trades.length === 0 
                ? 'Create your first trade to start tracking your trading performance' 
                : 'Try adjusting your search criteria or clearing the current filters'
              }
            </p>
            {trades.length === 0 && (
              <Link
                href="/journal/new"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <FaPlus className="h-4 w-4" />
                <span>Create your first trade</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTrades.map((trade) => (
            <TradeCard
              key={trade.id}
              trade={trade}
              isSelected={selectedTrades.some(t => t.id === trade.id)}
              onSelect={(selected: boolean) => handleSelectTrade(trade, selected)}
              showCheckbox={true}
            />
          ))}
        </div>
      )}

      {/* Bulk Operations Bar */}
      <BulkOperationsBar
        selectedTrades={selectedTrades}
        onClearSelection={() => setSelectedTrades([])}
        onBulkDelete={handleBulkDelete}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        onBulkToggleStar={handleBulkToggleStar}
        isLoading={isLoading}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        trades={filteredTrades}
        accountName={selectedAccountId ? 'Selected Account' : 'All Accounts'}
      />
    </div>
  );
} 