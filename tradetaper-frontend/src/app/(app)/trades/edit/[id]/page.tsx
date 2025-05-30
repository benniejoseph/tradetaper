/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/trades/edit/[id]/page.tsx
"use client";
import { useEffect, useState, useCallback } from 'react'; // Added useCallback
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTradeById } from '@/store/features/tradesSlice';
// import ProtectedRoute from '@/components/auth/ProtectedRoute';
import TradeForm from '@/components/trades/TradeForm';
import Link from 'next/link';
import TradeChart from '@/components/charts/TradeChart'; // Using direct import for now
import { fetchRealPriceData } from '@/services/priceDataService';
import { CandlestickData, LineData } from 'lightweight-charts';
import { addDays, subDays, differenceInDays, format as formatDateFns } from 'date-fns'; // Ensure format is imported if used here

const SUPPORTED_INTERVALS = [
    { value: 'daily', label: 'Daily' },
    { value: 'hourly', label: 'Hourly' },
    { value: '15minute', label: '15 Minute' },
    { value: '5minute', label: '5 Minute' },
    { value: '1minute', label: '1 Minute' },
];

export default function EditTradePage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter(); // Re-added router if needed for navigation from this page
  const params = useParams();
  const tradeId = params.id as string;

  const { currentTrade, isLoading: tradeIsLoading, error: tradeError } = useSelector((state: RootState) => state.trades);
  const [priceData, setPriceData] = useState<(CandlestickData | LineData)[]>([]);
  const [priceDataLoading, setPriceDataLoading] = useState(false);
  
  // Ensure selectedInterval has a default and is robustly initialized
  const [selectedInterval, setSelectedInterval] = useState<string>(() => {
    return SUPPORTED_INTERVALS.length > 0 ? SUPPORTED_INTERVALS[0].value : 'daily';
  });

  // Fetch the specific trade details
  useEffect(() => {
    if (tradeId) {
      if (!currentTrade || currentTrade.id !== tradeId) {
        console.log(`[EditTradePage] Dispatching fetchTradeById for ID: ${tradeId}`);
        dispatch(fetchTradeById(tradeId));
      }
    }
  }, [dispatch, tradeId, currentTrade]);

  // Effect to fetch price data when currentTrade or selectedInterval changes
  useEffect(() => {
    console.log(`[EditTradePage - PriceDataEffect] Running. currentTrade ID: ${currentTrade?.id}, tradeId: ${tradeId}, selectedInterval: ${selectedInterval}`);
    
    if (currentTrade && currentTrade.id === tradeId && selectedInterval && selectedInterval.trim() !== '') {
      setPriceDataLoading(true);
      console.log(`[EditTradePage - PriceDataEffect] Conditions met. Fetching price data for ${currentTrade.symbol}, interval: ${selectedInterval}`);

      const entryDateObj = new Date(currentTrade.entryDate);
      let fromDateForApi = subDays(entryDateObj, 60);
      let conceptualEndDateForChart = entryDateObj;
      if (currentTrade.exitDate) {
        conceptualEndDateForChart = new Date(currentTrade.exitDate);
      }
      conceptualEndDateForChart = addDays(conceptualEndDateForChart, 15);

      const today = new Date();
      let toDateForApi = conceptualEndDateForChart > today ? today : conceptualEndDateForChart;

      if (selectedInterval.includes('minute')) {
        fromDateForApi = subDays(entryDateObj, Math.min(7, Math.max(1, differenceInDays(toDateForApi, entryDateObj) + 2)));
        toDateForApi = addDays(currentTrade.exitDate ? new Date(currentTrade.exitDate) : entryDateObj, 2);
        if (toDateForApi > today) toDateForApi = today;
      } else if (selectedInterval === 'hourly') {
        fromDateForApi = subDays(entryDateObj, Math.min(30, Math.max(1, differenceInDays(toDateForApi, entryDateObj) + 7)));
        toDateForApi = addDays(currentTrade.exitDate ? new Date(currentTrade.exitDate) : entryDateObj, 7);
        if (toDateForApi > today) toDateForApi = today;
      }
      
      if (fromDateForApi >= toDateForApi) { // Ensure from is before to
          fromDateForApi = subDays(toDateForApi, 1); // Make it at least one day before
          if(fromDateForApi >= toDateForApi) fromDateForApi = new Date(toDateForApi.getTime() - 86400000); // Ensure it's valid
      }


      fetchRealPriceData(currentTrade.symbol, fromDateForApi, toDateForApi, selectedInterval)
        .then(data => {
          console.log(`[EditTradePage - PriceDataEffect] Price data received for ${selectedInterval}:`, data.length);
          setPriceData(data);
        })
        .catch(err => {
          console.error(`[EditTradePage - PriceDataEffect] Failed to fetch price data for ${currentTrade.symbol}, interval ${selectedInterval}:`, err);
          setPriceData([]);
        })
        .finally(() => {
          setPriceDataLoading(false);
          console.log(`[EditTradePage - PriceDataEffect] Price data loading finished for ${selectedInterval}.`);
        });
    } else if (!currentTrade && tradeId) {
        console.log("[EditTradePage - PriceDataEffect] No currentTrade but tradeId exists, clearing price data.");
        setPriceData([]);
        setPriceDataLoading(false); // Ensure loading stops
    } else if (currentTrade && currentTrade.id === tradeId && (!selectedInterval || selectedInterval.trim() === '')) {
        console.warn("[EditTradePage - PriceDataEffect] selectedInterval is invalid. Skipping price data fetch.");
        setPriceData([]);
        setPriceDataLoading(false);
    }
  }, [currentTrade, tradeId, selectedInterval, dispatch]); // dispatch added, good practice

  const isLoadingDisplay = tradeIsLoading || (priceDataLoading && (!currentTrade || priceData.length ===0));

  if (isLoadingDisplay && !currentTrade && !tradeError) { // Only show main loading if no trade and no error yet
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading trade data...</div>;
  }

  if (tradeError && !currentTrade) { // If there's an error fetching the trade itself
    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 text-center">
          <p className="text-red-500">Error loading trade: {tradeError}</p>
          <Link href="/trades" className="text-blue-400 hover:underline mt-4 block">Back to Trades</Link>
        </div>
    );
  }

  if (!currentTrade && !tradeIsLoading) { // If fetching trade finished and it's not found
      return (
            <div className="min-h-screen bg-gray-900 text-white p-8 text-center">
                <p className="text-yellow-400">Trade not found.</p>
                <Link href="/trades" className="text-blue-400 hover:underline mt-4 block">Back to Trades</Link>
            </div>
      );
  }
  
  return (
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
        <div className="container mx-auto">
            <div className="mb-6 flex justify-between items-center">
                <Link href="/trades" className="text-blue-400 hover:underline">← Back to Trades</Link>
                 {/* Interval Selector - Moved here for context when currentTrade is available */}
                {currentTrade && (
                     <div className="flex items-center space-x-3">
                        <label htmlFor="intervalSelect" className="text-sm font-medium text-gray-300">Interval:</label>
                        <select
                        id="intervalSelect"
                        value={selectedInterval}
                        onChange={(e) => setSelectedInterval(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white text-sm rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                        {SUPPORTED_INTERVALS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                        </select>
                    </div>
                )}
            </div>
            {currentTrade && currentTrade.id === tradeId ? (
                <div className="space-y-8">
                    <TradeChart trade={currentTrade} priceData={priceData} />
                    {priceDataLoading && <p className="text-center text-gray-400">Loading chart data ({selectedInterval})...</p>}
                    {!priceDataLoading && priceData.length === 0 && currentTrade && <p className="text-center text-gray-400">No chart data available for {selectedInterval}.</p>}

                    <TradeForm initialData={currentTrade} isEditMode={true} />
                </div>
            ) : (
                <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading trade details...</div>
            )}
        </div>
      </div>
  );
}