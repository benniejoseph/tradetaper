"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickData, Time, UTCTimestamp, IChartApi } from 'lightweight-charts';
import api from '@/services/api'; // Assuming you have an axios instance
import { FaSpinner, FaChartLine } from 'react-icons/fa';

interface Candle {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TradeCandleChartProps {
  tradeId: string;
  symbol: string;
  entryPrice?: number;
  exitPrice?: number;
  entryDate?: string;
  exitDate?: string;
  direction?: 'Long' | 'Short';
  stopLoss?: number;
  takeProfit?: number;
}

const MAX_POLL_RETRIES = 10; // Max 10 polls × 3s = 30s max wait

const TradeCandleChart: React.FC<TradeCandleChartProps> = ({
  tradeId,
  symbol,
  entryPrice,
  exitPrice,
  entryDate,
  exitDate,
  direction,
  stopLoss,
  takeProfit
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [rawCandles, setRawCandles] = useState<CandlestickData[]>([]); // Original 1m candles
  const [displayCandles, setDisplayCandles] = useState<CandlestickData[]>([]); // Aggregated for display
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [timeframe, setTimeframe] = useState<string>('1m');
  // Polling for queued data
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef<number>(0);
  const hasFetchedRef = useRef<boolean>(false);

  // Aggregate 1m candles into higher timeframes
  const aggregateCandles = (candles: CandlestickData[], targetTf: string): CandlestickData[] => {
    if (candles.length === 0) return [];
    
    // Get aggregation interval in minutes
    const intervalMap: Record<string, number> = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '1h': 60,
    };
    const interval = intervalMap[targetTf] || 1;
    
    if (interval === 1) return candles; // No aggregation needed for 1m
    
    const aggregated: CandlestickData[] = [];
    let bucket: CandlestickData[] = [];
    let bucketStartTime: number | null = null;
    
    for (const candle of candles) {
      const candleTime = candle.time as number;
      const candleMinute = Math.floor(candleTime / 60) * 60; // Normalize to minute
      const bucketTime = Math.floor(candleMinute / (interval * 60)) * (interval * 60);
      
      if (bucketStartTime === null) {
        bucketStartTime = bucketTime;
      }
      
      if (bucketTime === bucketStartTime) {
        bucket.push(candle);
      } else {
        // Flush bucket
        if (bucket.length > 0) {
          aggregated.push({
            time: bucketStartTime as UTCTimestamp,
            open: bucket[0].open,
            high: Math.max(...bucket.map(c => c.high)),
            low: Math.min(...bucket.map(c => c.low)),
            close: bucket[bucket.length - 1].close,
          });
        }
        // Start new bucket
        bucket = [candle];
        bucketStartTime = bucketTime;
      }
    }
    
    // Flush remaining bucket
    if (bucket.length > 0 && bucketStartTime !== null) {
      aggregated.push({
        time: bucketStartTime as UTCTimestamp,
        open: bucket[0].open,
        high: Math.max(...bucket.map(c => c.high)),
        low: Math.min(...bucket.map(c => c.low)),
        close: bucket[bucket.length - 1].close,
      });
    }
    
    return aggregated;
  };

  // Re-aggregate when timeframe changes
  useEffect(() => {
    if (rawCandles.length > 0) {
      const aggregated = aggregateCandles(rawCandles, timeframe);
      setDisplayCandles(aggregated);
    }
  }, [rawCandles, timeframe]);

  const fetchCandles = async () => {
    // Prevent duplicate initial fetches
    if (hasFetchedRef.current && !pollIntervalRef.current) return;
    hasFetchedRef.current = true;

    try {
      setLoading(true);
      const response = await api.get(`/trades/${tradeId}/candles?timeframe=${timeframe}`);
      
      const data = response.data;
      
      if (Array.isArray(data)) {
        if (data.length > 0 && 'status' in data[0] && data[0].status === 'queued') {
          pollCountRef.current += 1;
          
          if (pollCountRef.current >= MAX_POLL_RETRIES) {
            // Stop polling after max retries
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            setStatusMessage(null);
            setError('Candle data not available — MT5 terminal may be offline.');
            setLoading(false);
            return;
          }
          
          setStatusMessage(data[0].message || 'Waiting for candle data...');
          // Start polling only if not already polling
          if (!pollIntervalRef.current) {
            pollIntervalRef.current = setInterval(fetchCandles, 3000);
          }
        } else {
            // Data received — stop polling
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
            pollCountRef.current = 0;

            const formattedData = data
              .filter((c: any) => c && c.time)
              .map((c: any) => {
                let timestamp: number;
                
                if (typeof c.time === 'string') {
                  const date = new Date(c.time);
                  if (isNaN(date.getTime())) return null;
                  timestamp = date.getTime() / 1000;
                } else if (typeof c.time === 'number') {
                  timestamp = c.time;
                } else {
                  return null;
                }
                
                return {
                  time: timestamp as UTCTimestamp,
                  open: Number(c.open),
                  high: Number(c.high),
                  low: Number(c.low),
                  close: Number(c.close),
                };
              })
              .filter((c): c is NonNullable<typeof c> => c !== null);

            formattedData.sort((a, b) => (a.time as number) - (b.time as number));
            
            setRawCandles(formattedData);
            setStatusMessage(null);
        }
      } else {
        setError('Invalid data format received');
      }
    } catch (err: any) {
        // Stop polling on any error
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }

        const status = err.response?.status;
        if (status === 404) {
          setError('No candle data available for this trade.');
        } else if (status === 502 || status === 503) {
          setError('MT5 terminal is offline — candle data unavailable.');
        } else if (status >= 500) {
          setError('Server error loading chart data. Try again later.');
        } else {
          setError('Failed to load chart data.');
        }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hasFetchedRef.current = false;
    pollCountRef.current = 0;
    setError(null);
    setRawCandles([]);
    fetchCandles();
    
    return () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    };
  }, [tradeId]);

  useEffect(() => {
    if (!chartContainerRef.current || displayCandles.length === 0) return;

    // Cleanup previous chart
    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.1)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.1)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });
    
    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
        upColor: '#10b981', // emerald-500
        downColor: '#ef4444', // red-500
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
    });

    candleSeries.setData(displayCandles);

    // Helper: Find nearest candle time
    const findNearestCandleTime = (targetTs: number): UTCTimestamp | null => {
      if (displayCandles.length === 0) return null;
      let nearestCandle = displayCandles[0];
      let minDiff = Math.abs((nearestCandle.time as number) - targetTs);
      
      for (const candle of displayCandles) {
        const diff = Math.abs((candle.time as number) - targetTs);
        if (diff < minDiff) {
          minDiff = diff;
          nearestCandle = candle;
        }
      }
      return nearestCandle.time as UTCTimestamp;
    };

    // Get entry and exit timestamps - with null checks
    const entryTs = (entryDate && entryDate !== 'undefined') ? new Date(entryDate).getTime() / 1000 : null;
    const exitTs = (exitDate && exitDate !== 'undefined') ? new Date(exitDate).getTime() / 1000 : null;
    
    // Only proceed if dates are valid
    if (entryTs && !isNaN(entryTs)) {
      // Use entryTs safely
    }
    if (exitTs && !isNaN(exitTs)) {
      // Use exitTs safely
    }
    
    // Find nearest candle times for zones
    const entryCandle = (entryTs && !isNaN(entryTs)) ? findNearestCandleTime(entryTs) : null;
    const exitCandle = (exitTs && !isNaN(exitTs)) ? findNearestCandleTime(exitTs) : null;

    // --- PROFIT/LOSS ZONE RECTANGLES ---
    // Using area series for the colored zones (lightweight-charts approach)
    
    if (entryPrice && (takeProfit || stopLoss) && entryCandle && exitCandle) {
      const zoneStartIdx = displayCandles.findIndex((c: CandlestickData) => c.time === entryCandle);
      const zoneEndIdx = displayCandles.findIndex((c: CandlestickData) => c.time === exitCandle);
      
      if (zoneStartIdx >= 0 && zoneEndIdx >= 0) {
        const zoneCandles = displayCandles.slice(Math.min(zoneStartIdx, zoneEndIdx), Math.max(zoneStartIdx, zoneEndIdx) + 1);
        
        // Profit Zone (Entry to TP) - Green
        if (takeProfit) {
          const topPrice = Math.max(entryPrice, takeProfit);
          const bottomPrice = Math.min(entryPrice, takeProfit);
          
          // Create a baseline series for the profit zone
          const profitZone = chart.addCandlestickSeries({
            upColor: 'rgba(16, 185, 129, 0.2)',
            downColor: 'rgba(16, 185, 129, 0.2)',
            borderUpColor: 'transparent',
            borderDownColor: 'transparent',
            wickUpColor: 'transparent',
            wickDownColor: 'transparent',
          });
          
          // Create rectangle-like effect using fake candles
          profitZone.setData(zoneCandles.map((c: CandlestickData) => ({
            time: c.time,
            open: topPrice,
            high: topPrice,
            low: bottomPrice,
            close: bottomPrice,
          })));
        }
        
        // Loss Zone (Entry to SL) - Red
        if (stopLoss) {
          const topPrice = Math.max(entryPrice, stopLoss);
          const bottomPrice = Math.min(entryPrice, stopLoss);
          
          const lossZone = chart.addCandlestickSeries({
            upColor: 'rgba(239, 68, 68, 0.2)',
            downColor: 'rgba(239, 68, 68, 0.2)',
            borderUpColor: 'transparent',
            borderDownColor: 'transparent',
            wickUpColor: 'transparent',
            wickDownColor: 'transparent',
          });
          
          lossZone.setData(zoneCandles.map((c: CandlestickData) => ({
            time: c.time,
            open: topPrice,
            high: topPrice,
            low: bottomPrice,
            close: bottomPrice,
          })));
        }
      }
    }

    // --- PRICE LINES ---
    // Entry Price Line (Blue)
    if (entryPrice) {
      candleSeries.createPriceLine({
        price: entryPrice,
        color: '#3b82f6', // blue
        lineWidth: 2,
        lineStyle: 0, // Solid
        axisLabelVisible: true,
        title: 'ENTRY',
      });
    }

    // Exit Price Line (Orange)
    if (exitPrice) {
      candleSeries.createPriceLine({
        price: exitPrice,
        color: '#f59e0b', // orange
        lineWidth: 2,
        lineStyle: 0, // Solid
        axisLabelVisible: true,
        title: 'EXIT',
      });
    }

    // Stop Loss Line (Red Dotted)
    if (stopLoss) {
      candleSeries.createPriceLine({
        price: stopLoss,
        color: '#ef4444', // red
        lineWidth: 1,
        lineStyle: 1, // Dotted
        axisLabelVisible: true,
        title: `SL`,
      });
    }

    // Take Profit Line (Green Dotted)
    if (takeProfit) {
      candleSeries.createPriceLine({
        price: takeProfit,
        color: '#10b981', // green
        lineWidth: 1,
        lineStyle: 1, // Dotted
        axisLabelVisible: true,
        title: `TP`,
      });
    }

    // --- MARKERS REMOVED ---
    // User requested to keep only horizontal lines
    const markers: any[] = [];

    // Fit content
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null; // Important: Clear the reference
      }
    };
  }, [displayCandles, entryDate, exitDate, entryPrice, exitPrice, direction, stopLoss, takeProfit]);

  if (loading && rawCandles.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
            {statusMessage ? (
                <>
                    <FaSpinner className="animate-spin h-8 w-8 text-emerald-500 mb-2" />
                    <p className="text-sm text-gray-500 animate-pulse">{statusMessage}</p>
                    <p className="text-xs text-gray-400 mt-1">Waiting for MT5 Terminal...</p>
                </>
            ) : (
                <FaSpinner className="animate-spin h-6 w-6 text-gray-400" />
            )}
        </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-dashed border-red-200 dark:border-red-900/50">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }


  return (
    <div className="w-full bg-white dark:bg-[#0A0A0A] rounded-[2rem] border border-gray-200/50 dark:border-white/5 p-6 shadow-xl space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl">
             <FaChartLine className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{symbol} Analysis</h4>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Execution Details</p>
          </div>
        </div>
        
        {/* Timeframe Selector - aggregates 1m data */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200/30 dark:border-white/5">
          {['1m', '5m', '15m', '1h'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-200 ${
                timeframe === tf 
                  ? 'bg-white dark:bg-emerald-500 text-emerald-600 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      
      <div className="relative">
        <div ref={chartContainerRef} className="w-full h-[400px] cursor-crosshair" />
        {displayCandles.length > 0 && (
          <div className="absolute top-4 left-4 pointer-events-none bg-emerald-500/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-500/20">
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
              {displayCandles.length} Candles
            </p>
          </div>
        )}
        {/* Entry/Exit Legend */}
        <div className="absolute bottom-4 right-4 pointer-events-none flex gap-3 bg-white/80 dark:bg-black/60 backdrop-blur-md p-2 rounded-lg border border-gray-200/50 dark:border-white/10">
          {entryPrice && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-0.5 bg-blue-500" />
              <span className="text-[9px] font-bold text-gray-600 dark:text-gray-400">ENTRY</span>
            </div>
          )}
          {exitPrice && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-0.5 bg-orange-500" />
              <span className="text-[9px] font-bold text-gray-600 dark:text-gray-400">EXIT</span>
            </div>
          )}
          {stopLoss && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-0.5 bg-red-500" />
              <span className="text-[9px] font-bold text-gray-600 dark:text-gray-400">SL</span>
            </div>
          )}
          {takeProfit && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-0.5 bg-emerald-500" />
              <span className="text-[9px] font-bold text-gray-600 dark:text-gray-400">TP</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeCandleChart;
