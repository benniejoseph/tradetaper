/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/trades/page.tsx
"use client";
import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTrades } from '@/store/features/tradesSlice';
import TradeListItem from '@/components/trades/TradeListItem'; // Adjust path
import Link from 'next/link';
import TradeFiltersComponent from '@/components/trades/TradeFiltersComponent'; // Import filter component
import { calculateDashboardStats } from '@/utils/analytics'; // Import stats calculator
import { Trade } from '@/types/trade'; // Import TradeFilters type

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  positiveIsGood?: boolean; // For coloring P/L values
  isCurrency?: boolean;
  isPercentage?: boolean;
}
const StatCard = ({ title, value, description, positiveIsGood, isCurrency, isPercentage }: StatCardProps) => {
    let valueColor = 'text-white';
    if (typeof value === 'number' && positiveIsGood !== undefined) {
        if (value > 0 && positiveIsGood) valueColor = 'text-green-400';
        else if (value < 0 && positiveIsGood) valueColor = 'text-red-400';
        else if (value < 0 && !positiveIsGood) valueColor = 'text-green-400';
        else if (value > 0 && !positiveIsGood) valueColor = 'text-red-400';
    }
    const displayValue = typeof value === 'number'
        ? (isCurrency ? value.toFixed(2) : (isPercentage ? value.toFixed(2) + '%' : value.toFixed(2)))
        : value;
    return (
        <div className="bg-gray-700 p-4 rounded-md shadow">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</h3>
        <p className={`text-2xl font-semibold mt-1 ${valueColor}`}>{displayValue}</p>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
    );
};

export default function TradesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { trades: allTrades, isLoading, error, filters } = useSelector((state: RootState) => state.trades);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Fetch trades only if authenticated and trades are not already loaded (or to refresh)
    // This check might be more sophisticated depending on your caching strategy
    if (isAuthenticated && allTrades.length === 0) {
      dispatch(fetchTrades());
    }
  }, [dispatch, isAuthenticated, allTrades.length]);

  // Memoized function to filter trades
  const filteredTrades = useMemo(() => {
    return allTrades.filter(trade => {
      let match = true;
      if (filters.dateFrom) {
        match = match && new Date(trade.entryDate) >= new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        // Add 1 day to dateTo to make it inclusive of the selected day
        const toDate = new Date(filters.dateTo);
        toDate.setDate(toDate.getDate() + 1);
        match = match && new Date(trade.entryDate) < toDate;
      }
      if (filters.assetType && trade.assetType !== filters.assetType) match = false;
      if (filters.symbol && !trade.symbol.toLowerCase().includes(filters.symbol.toLowerCase())) match = false;
      if (filters.direction && trade.direction !== filters.direction) match = false;
      if (filters.status && trade.status !== filters.status) match = false;
      return match;
    });
  }, [allTrades, filters]);

  // Memoized calculation for stats based on filtered trades
  const filteredStats = useMemo(() => {
    if (filteredTrades.length > 0) {
      return calculateDashboardStats(filteredTrades);
    }
    return null;
  }, [filteredTrades]);

  return (
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">My Trades</h1>
            <Link href="/trades/new" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
              Add New Trade
            </Link>
          </div>
          
          <TradeFiltersComponent />
          {/* Display Stats for Filtered Trades */}
          {filteredStats && (
            <div className="mb-8 p-4 bg-gray-800 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">Filtered Performance</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <StatCard title="Net P&L" value={filteredStats.totalNetPnl} isCurrency positiveIsGood={true} />
                <StatCard title="Win Rate" value={filteredStats.winRate} isPercentage positiveIsGood={true} />
                <StatCard title="Trades" value={filteredStats.closedTrades} description={`(Total: ${filteredStats.totalTrades})`}/>
                <StatCard title="Avg Win" value={filteredStats.averageWin} isCurrency positiveIsGood={true} />
                <StatCard title="Avg Loss" value={filteredStats.averageLoss} isCurrency positiveIsGood={false}/>
                <StatCard title="Profit Factor" value={filteredStats.profitFactor} positiveIsGood={true}/>
              </div>
            </div>
          )}

          {isLoading && <p className="text-center">Loading trades...</p>}
          {error && <p className="text-red-500 text-center">Error fetching trades: {error}</p>}

          {!isLoading && !error && filteredTrades.length === 0 && (
            <p className="text-center text-gray-400 mt-6">
              {allTrades.length > 0 ? "No trades match the current filters." : "No trades recorded yet. Add your first one!"}
            </p>
          )}

          {!isLoading && filteredTrades.length > 0 && (
            <div className="space-y-4">
              {filteredTrades.map((trade: Trade) => (
                <TradeListItem key={trade.id} trade={trade} />
              ))}
            </div>
          )}
        </div>
      </div>
  );
}