// src/app/(app)/backtesting/session/[id]/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CandleData } from '@/components/backtesting/workbench/mockData';
import ChartEngine, { ChartEngineRef } from '@/components/backtesting/workbench/ChartEngine';
import ReplayControls from '@/components/backtesting/workbench/ReplayControls';
import OrderPanel from '@/components/backtesting/workbench/OrderPanel';
import { aggregateCandles } from '@/utils/candleAggregation';
import Link from 'next/link';
import { FaChevronLeft, FaCog, FaSave } from 'react-icons/fa';
import { SeriesMarker, SeriesMarkerPosition, SeriesMarkerShape, UTCTimestamp } from 'lightweight-charts';

export default function BacktestSessionPage({ params }: { params: { id: string } }) {
  // Session Configuration
  const [symbol, setSymbol] = useState('XAUUSD');
  const [timeframe, setTimeframe] = useState('1m');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-01-31');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // State
  const [fullData, setFullData] = useState<CandleData[]>([]);
  const [visibleData, setVisibleData] = useState<CandleData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000); // ms per candle

  // Trading State
  const [balance, setBalance] = useState(100000); // $100k demo
  const [trades, setTrades] = useState<any[]>([]); // Log of trades
  const [markers, setMarkers] = useState<SeriesMarker<any>[]>([]);
  const [openPosition, setOpenPosition] = useState<any | null>(null);

  // Refs
  const chartRef = useRef<ChartEngineRef>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Candles from Backend
  const fetchCandles = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/v1/backtesting/candles/${symbol}?timeframe=${timeframe}&startDate=${startDate}&endDate=${endDate}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch candles');
      }

      const candles = await response.json();

      // Transform to CandleData format (lightweight-charts expects 'time' as string)
      const formattedCandles: CandleData[] = candles.map((c: any) => ({
        time: new Date(c.time * 1000).toISOString().split('T')[0], // Convert timestamp to date string
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      setFullData(formattedCandles);

      // Start with first 50 candles visible to give context
      const initialView = Math.min(50, formattedCandles.length);
      setVisibleData(formattedCandles.slice(0, initialView));
      setCurrentIndex(initialView - 1); // 0-based index
    } catch (err: any) {
      setError(err.message || 'Failed to load candles');
      console.error('Error fetching candles:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Data
  useEffect(() => {
    fetchCandles();
  }, []);

  // Update chart when visible data changes (mostly for initial set)
  // Subsequent updates might use updateLastCandle for perf, but strict declarative is safer for MVP
  useEffect(() => {
     if (chartRef.current && visibleData.length > 0) {
        chartRef.current.setCandles(visibleData);
     }
  }, [visibleData]);

  // Replay Timer Logic
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        handleNextCandle();
      }, speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, currentIndex, fullData]); // Dependencies crucial for closure freshness

  // Handlers
  const handleNextCandle = () => {
    // Need to use functional state or ref to get latest if inside interval
    // But since this function is re-created on effect change, direct access is okay *if* deps are correct
    
    // Better: use functional update for state to ensure no race conditions
    setCurrentIndex(prev => {
       const nextIndex = prev + 1;
       if (nextIndex >= fullData.length) {
         setIsPlaying(false);
         return prev; // End of data
       }
       
       // Update visible data
       const newCandle = fullData[nextIndex];
       setVisibleData(prevData => [...prevData, newCandle]);
       
       return nextIndex;
    });
  };

  const handlePrevCandle = () => {
    if (currentIndex > 0) {
        setCurrentIndex(prev => {
            const nextIndex = prev - 1;
            setVisibleData(prevData => prevData.slice(0, -1));
            return nextIndex;
        });
    }
  };

  // Safe manual next helper
  const onNextClick = () => {
      if (currentIndex < fullData.length - 1) {
          const nextIndex = currentIndex + 1;
          const newCandle = fullData[nextIndex];
          setVisibleData(prev => [...prev, newCandle]);
          setCurrentIndex(nextIndex);
          
          processOpenPositions(newCandle);
      }
  };

  // Check Open Positions on every candle update
  useEffect(() => {
     if (visibleData.length > 0 && openPosition) {
         // Also check when auto-playing
         const lastCandle = visibleData[visibleData.length - 1];
         processOpenPositions(lastCandle);
     }
  }, [visibleData]);

  const processOpenPositions = (candle: CandleData) => {
      if (!openPosition) return;
      
      const price = candle.close;
      let closed = false;
      let pnl = 0;

      // Check SL/TP (simplified: uses 'close' price, real engine should check High/Low)
      if (openPosition.type === 'LONG') {
          if (price <= openPosition.sl) { // SL Hit
              pnl = (openPosition.sl - openPosition.entry) * openPosition.lotSize * 100;
              closed = true;
          } else if (price >= openPosition.tp) { // TP Hit
              pnl = (openPosition.tp - openPosition.entry) * openPosition.lotSize * 100;
              closed = true;
          }
      } else { // SHORT
          if (price >= openPosition.sl) { // SL Hit
              pnl = (openPosition.entry - openPosition.sl) * openPosition.lotSize * 100;
              closed = true;
          } else if (price <= openPosition.tp) { // TP Hit
              pnl = (openPosition.entry - openPosition.tp) * openPosition.lotSize * 100;
              closed = true;
          }
      }

      if (closed) {
          closeTrade(pnl, candle.time);
      }
  };

  const closeTrade = (pnl: number, time: string) => {
      setBalance(prev => prev + pnl);
      setOpenPosition(null);
      setTrades(prev => [...prev, { ...openPosition, pnl, exitTime: time }]);
      
      // Add exit marker
      setMarkers(prev => [...prev, {
          time: time,
          position: 'inBar',
          color: pnl >= 0 ? '#10B981' : '#EF4444',
          shape: 'circle',
          size: 1,
          text: pnl >= 0 ? `+$${pnl.toFixed(0)}` : `-$${Math.abs(pnl).toFixed(0)}`
      }]);
  };

  const handlePlaceOrder = (type: 'LONG' | 'SHORT', lotSize: number, sl: number, tp: number) => {
      if (openPosition) return; // Only 1 position for now

      const currentCandle = visibleData[visibleData.length - 1];
      const entryPrice = currentCandle.close; // Market Order

      const newTrade = {
          type,
          entry: entryPrice,
          sl,
          tp,
          lotSize,
          entryTime: currentCandle.time
      };

      setOpenPosition(newTrade);

      // Add Marker
      const marker: SeriesMarker<any> = {
          time: currentCandle.time,
          position: type === 'LONG' ? 'belowBar' : 'aboveBar',
          color: type === 'LONG' ? '#2196F3' : '#E91E63',
          shape: type === 'LONG' ? 'arrowUp' : 'arrowDown',
          text: `${type} @ ${entryPrice}`
      };

      setMarkers(prev => [...prev, marker]);
  };

  // Save Session
  const handleSaveSession = async () => {
    try {
      const totalTrades = trades.length;
      const winningTrades = trades.filter((t) => t.pnl > 0).length;
      const losingTrades = trades.filter((t) => t.pnl <= 0).length;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      const totalPnl = balance - 100000;

      const response = await fetch(`/api/v1/backtesting/sessions/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          trades,
          endingBalance: balance,
          totalPnl,
          totalTrades,
          winningTrades,
          losingTrades,
          winRate,
          status: 'in_progress',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save session');
      }

      alert('Session saved successfully!');
    } catch (err: any) {
      console.error('Error saving session:', err);
      alert('Failed to save session');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden">
        {/* Background FX */}
        <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-emerald-900/10 to-transparent"></div>
        </div>

        {/* Toolbar */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-sm z-30">
            <div className="flex items-center gap-4">
                <Link href="/backtesting" className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <FaChevronLeft />
                </Link>
                <div>
                   <h1 className="font-bold text-sm text-white">Replay Session</h1>
                   <p className="text-xs text-slate-500">{symbol} • {timeframe} • {startDate} to {endDate}</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right mr-4">
                    <div className="text-xs text-slate-400">Trades</div>
                    <div className="font-bold font-mono text-white">
                        {trades.length} ({trades.filter(t => t.pnl > 0).length}W / {trades.filter(t => t.pnl <= 0).length}L)
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-slate-400">Account Balance</div>
                    <div className={`font-bold font-mono ${openPosition ? 'text-amber-400' : balance >= 100000 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        {openPosition && <span className="text-xs ml-2 text-amber-500">(In Trade)</span>}
                    </div>
                </div>
                <button
                    onClick={handleSaveSession}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white transition-colors"
                >
                    <FaSave />
                    <span className="text-sm">Save</span>
                </button>
                <button className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white">
                    <FaCog />
                </button>
            </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative">
            {loading && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                        <p className="text-slate-400">Loading candle data...</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md">
                        <p className="text-red-400 text-center">{error}</p>
                        <button
                            onClick={fetchCandles}
                            className="mt-4 w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {!loading && !error && fullData.length > 0 && (
                <>
                    {/* Chart Area */}
                    <div className="flex-1 p-4 pb-24 relative flex gap-4">
                        <ChartEngine
                            ref={chartRef}
                            data={visibleData}
                            markers={markers}
                        />

                        {/* Floating Order Panel */}
                        <div className="absolute top-8 left-8 z-20">
                            <OrderPanel
                                currentPrice={visibleData[visibleData.length - 1]?.close || 0}
                                balance={balance}
                                onPlaceOrder={handlePlaceOrder}
                                disabled={!!openPosition}
                            />
                        </div>
                    </div>
                </>
            )}

            {!loading && !error && fullData.length > 0 && (
                <>
                    {/* Controls */}
                    <div className="absolute bottom-8 left-0 right-0 px-4 flex justify-center pointer-events-none">
                        <div className="pointer-events-auto w-full max-w-2xl">
                            <ReplayControls
                                isPlaying={isPlaying}
                                onPlayPause={() => setIsPlaying(!isPlaying)}
                                onNextCandle={onNextClick}
                                onPrevCandle={handlePrevCandle}
                                speed={speed}
                                onSpeedChange={setSpeed}
                                currentDate={visibleData[visibleData.length - 1]?.time as string}
                                totalCandles={fullData.length}
                                currentCandleIndex={currentIndex + 1}
                            />
                        </div>
                    </div>
                </>
            )}
        </main>
    </div>
  );
}
