// src/components/trades/TradeFiltersComponent.tsx
"use client";
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { TradeFilters, setTradeFilters, resetTradeFilters } from '@/store/features/tradesSlice';
import { AssetType, TradeDirection, TradeStatus } from '@/types/trade'; // Ensure enums are correctly imported

export default function TradeFiltersComponent() {
  const dispatch = useDispatch<AppDispatch>();
  const filters = useSelector((state: RootState) => state.trades.filters);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    dispatch(setTradeFilters({ [name]: value }));
  };

  const handleReset = () => {
    dispatch(resetTradeFilters());
  };

  return (
    <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-semibold text-gray-200 mb-4">Filter Trades</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Date From */}
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-400">Date From (Entry)</label>
          <input type="date" name="dateFrom" id="dateFrom" value={filters.dateFrom || ''} onChange={handleChange}
                 className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        {/* Date To */}
        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-gray-400">Date To (Entry)</label>
          <input type="date" name="dateTo" id="dateTo" value={filters.dateTo || ''} onChange={handleChange}
                 className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        {/* Symbol */}
        <div>
          <label htmlFor="symbol" className="block text-sm font-medium text-gray-400">Symbol</label>
          <input type="text" name="symbol" id="symbol" placeholder="e.g., AAPL, BTCUSD" value={filters.symbol || ''} onChange={handleChange}
                 className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        {/* Asset Type */}
        <div>
          <label htmlFor="assetType" className="block text-sm font-medium text-gray-400">Asset Type</label>
          <select name="assetType" id="assetType" value={filters.assetType || ''} onChange={handleChange}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">All</option>
            {Object.values(AssetType).map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        {/* Direction */}
        <div>
          <label htmlFor="direction" className="block text-sm font-medium text-gray-400">Direction</label>
          <select name="direction" id="direction" value={filters.direction || ''} onChange={handleChange}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">All</option>
            {Object.values(TradeDirection).map(dir => <option key={dir} value={dir}>{dir}</option>)}
          </select>
        </div>
        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-400">Status</label>
          <select name="status" id="status" value={filters.status || ''} onChange={handleChange}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">All</option>
            {Object.values(TradeStatus).map(stat => <option key={stat} value={stat}>{stat}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button onClick={handleReset} className="px-4 py-2 border border-gray-500 text-gray-300 rounded-md hover:bg-gray-700 focus:outline-none">
          Reset Filters
        </button>
        {/* Apply button could be added if you don't want filtering on every change, but live filtering is often fine */}
      </div>
    </div>
  );
}