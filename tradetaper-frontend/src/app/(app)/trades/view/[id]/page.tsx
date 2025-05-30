/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
// src/app/trades/view/[id]/page.tsx
"use client";
import React, { useEffect, useState, useCallback } from 'react'; // Added useCallback
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTradeById } from '@/store/features/tradesSlice';
import Link from 'next/link';
import TradeChart from '@/components/charts/TradeChart';
import { fetchRealPriceData } from '@/services/priceDataService';
import { CandlestickData, LineData } from 'lightweight-charts';
import { format as formatDateFns } from 'date-fns';
import { TradeDirection, TradeStatus, Tag as TradeTagType } from '@/types/trade';
import { addDays, subDays, differenceInDays } from 'date-fns';

const SUPPORTED_INTERVALS = [
    { value: 'daily', label: 'Daily' },
    { value: 'hourly', label: 'Hourly' },
    { value: '15minute', label: '15 Minute' },
    { value: '5minute', label: '5 Minute' },
    { value: '1minute', label: '1 Minute' },
];

const DetailItem = ({ label, value, children }: { label: string; value?: string | number | null, children?: React.ReactNode }) => {
    if (value === undefined && !children) return null;
    if (value === null && !children) return null;
    if (value === '' && !children) return null;

    let displayValue = value;
    if (typeof value === 'number') {
        const lowerLabel = label.toLowerCase();
        if (lowerLabel.includes('price') || lowerLabel.includes('p&l') || lowerLabel.includes('stop') || lowerLabel.includes('take')) {
            displayValue = value.toFixed(4); // Typically 4 decimal places for prices
        } else if (lowerLabel.includes('commission')) {
            displayValue = value.toFixed(2);
        } else if (lowerLabel.includes('quantity') || lowerLabel.includes('r-multiple')) {
             // Default to 2, or be more specific if needed
            displayValue = Number.isInteger(value) ? value.toString() : value.toFixed(2);
        }
    }

    return (
        <div>
            <p className="text-sm font-medium text-gray-400">{label}</p>
            {children ? <div className="mt-1 text-md text-gray-100">{children}</div>
                      : <p className="mt-1 text-md text-gray-100 whitespace-pre-wrap">{displayValue}</p>
            }
        </div>
    );
};

export default function ViewTradePage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams();
  const tradeId = params.id as string;

  const { currentTrade, isLoading: tradeIsLoading, error: tradeError } = useSelector((state: RootState) => state.trades);
  const [priceData, setPriceData] = useState<(CandlestickData | LineData)[]>([]);
  const [priceDataLoading, setPriceDataLoading] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<string>(() => {
    return SUPPORTED_INTERVALS.length > 0 ? SUPPORTED_INTERVALS[0].value : 'daily';
  });

  useEffect(() => {
    if (tradeId) {
      if (!currentTrade || currentTrade.id !== tradeId) {
        console.log(`[ViewTradePage] Dispatching fetchTradeById for ID: ${tradeId}`);
        dispatch(fetchTradeById(tradeId));
      }
    }
  }, [dispatch, tradeId, currentTrade]);

  useEffect(() => {
    console.log(`[ViewTradePage - PriceDataEffect] Running. currentTrade ID: ${currentTrade?.id}, tradeId: ${tradeId}, selectedInterval: ${selectedInterval}`);

    if (currentTrade && currentTrade.id === tradeId && selectedInterval && selectedInterval.trim() !== '') {
      setPriceDataLoading(true);
      console.log(`[ViewTradePage - PriceDataEffect] Conditions met. Fetching for ${currentTrade.symbol}, interval: ${selectedInterval}`);

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

      if (fromDateForApi >= toDateForApi) {
          fromDateForApi = subDays(toDateForApi, 1);
          if(fromDateForApi >= toDateForApi) fromDateForApi = new Date(toDateForApi.getTime() - 86400000);
      }

      fetchRealPriceData(currentTrade.symbol, fromDateForApi, toDateForApi, selectedInterval)
        .then(data => {
          console.log(`[ViewTradePage - PriceDataEffect] Price data received for ${selectedInterval}:`, data.length);
          setPriceData(data);
        })
        .catch(err => {
          console.error(`[ViewTradePage - PriceDataEffect] Failed to fetch price data for ${currentTrade.symbol}, interval ${selectedInterval}:`, err);
          setPriceData([]);
        })
        .finally(() => {
            setPriceDataLoading(false);
            console.log(`[ViewTradePage - PriceDataEffect] Price data loading finished for ${selectedInterval}.`);
        });
    } else if (!currentTrade && tradeId) {
        console.log("[ViewTradePage - PriceDataEffect] No currentTrade but tradeId exists, clearing price data.");
        setPriceData([]);
        setPriceDataLoading(false);
    } else if (currentTrade && currentTrade.id === tradeId && (!selectedInterval || selectedInterval.trim() === '')) {
        console.warn("[ViewTradePage - PriceDataEffect] selectedInterval is invalid. Skipping price data fetch.");
        setPriceData([]);
        setPriceDataLoading(false);
    }
  }, [currentTrade, tradeId, selectedInterval, dispatch]);

  const isLoadingPage = tradeIsLoading || (priceDataLoading && !priceData.length && currentTrade);

  if (isLoadingPage && !currentTrade && !tradeError) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading trade details...</div>;
  }
  if (tradeError && !currentTrade) {
    return (<div className="min-h-screen bg-gray-900 text-white p-8 text-center"><p className="text-red-500">Error: {tradeError}</p><Link href="/trades" className="text-blue-400 hover:underline mt-4 block">Back to Trades</Link></div>);
  }
  if (!currentTrade && !tradeIsLoading) {
    return (<div className="min-h-screen bg-gray-900 text-white p-8 text-center"><p className="text-yellow-400">Trade not found.</p><Link href="/trades" className="text-blue-400 hover:underline mt-4 block">Back to Trades</Link></div>);
  }
  if (!currentTrade) return null;

  const pnlColor = (currentTrade.profitOrLoss ?? 0) >= 0 ? 'text-green-400' : 'text-red-400';
  const directionColor = currentTrade.direction === TradeDirection.LONG ? 'text-green-500' : 'text-red-500';

  return (
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
        <div className="container mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <Link href="/trades" className="text-blue-400 hover:underline">← Back to Trades List</Link>
            <button
                onClick={() => router.push(`/trades/edit/${tradeId}`)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
            >
                Edit Trade
            </button>
          </div>

          <div className="bg-gray-800 shadow-xl rounded-lg p-6 md:p-8 space-y-8">
            <div className="border-b border-gray-700 pb-6">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                    {currentTrade.symbol}
                    <span className={`text-xl md:text-2xl ml-3 ${directionColor}`}>({currentTrade.direction})</span>
                </h1>
                <p className={`text-xl md:text-2xl font-semibold ${pnlColor}`}>
                    P&L: {(typeof currentTrade.profitOrLoss === 'number') ? currentTrade.profitOrLoss.toFixed(2) : 'N/A'}
                    <span className="text-sm text-gray-400 ml-2">({currentTrade.status})</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">Asset Type: {currentTrade.assetType}</p>
            </div>

            <div>
              <div className="mb-4 flex items-center space-x-3">
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
              <TradeChart trade={currentTrade} priceData={priceData} />
              {priceDataLoading && <p className="text-center text-gray-400 mt-2">Loading chart data ({selectedInterval})...</p>}
               {!priceDataLoading && priceData.length === 0 && currentTrade && <p className="text-center text-gray-400 mt-2">No chart data available for {selectedInterval}.</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border-b border-gray-700 pb-6">
                <DetailItem label="Entry Date" value={currentTrade.entryDate ? formatDateFns(new Date(currentTrade.entryDate), 'MMM dd, yyyy HH:mm') : 'N/A'} />
                <DetailItem label="Entry Price" value={currentTrade.entryPrice} />
                <DetailItem label="Quantity" value={currentTrade.quantity} />
                <DetailItem label="Exit Date" value={currentTrade.exitDate ? formatDateFns(new Date(currentTrade.exitDate), 'MMM dd, yyyy HH:mm') : undefined} />
                <DetailItem label="Exit Price" value={currentTrade.exitPrice} />
                <DetailItem label="Commission" value={currentTrade.commission} />
                <DetailItem label="Stop Loss" value={currentTrade.stopLoss} />
                <DetailItem label="Take Profit" value={currentTrade.takeProfit} />
            </div>

            <div className="space-y-6">
              <DetailItem label="Strategy Quick Entry" value={currentTrade.strategyTag} />
              {currentTrade.tags && currentTrade.tags.length > 0 && (
                <DetailItem label="Tags">
                    <div className="flex flex-wrap gap-2 mt-1">
                        {currentTrade.tags.map((tag: TradeTagType) => (
                            <span key={tag.id} className="text-sm bg-sky-700 text-sky-100 px-3 py-1 rounded-full">
                                {tag.name}
                            </span>
                        ))}
                    </div>
                </DetailItem>
              )}
              <DetailItem label="Setup / Rationale" value={currentTrade.setupDetails} />
              <DetailItem label="Mistakes Made" value={currentTrade.mistakesMade} />
              <DetailItem label="Lessons Learned" value={currentTrade.lessonsLearned} />
            </div>

            {currentTrade.imageUrl && (
              <div className="border-t border-gray-700 pt-6">
                <h2 className="text-xl font-semibold text-gray-200 mb-3">Attached Image</h2>
                <a href={currentTrade.imageUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={currentTrade.imageUrl}
                    alt={`Trade snapshot for ${currentTrade.symbol}`}
                    className="max-w-full md:max-w-lg lg:max-w-xl h-auto rounded-md border border-gray-600 object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}