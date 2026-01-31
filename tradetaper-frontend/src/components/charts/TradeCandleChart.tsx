"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickData, Time, UTCTimestamp, IChartApi, CandlestickSeries } from 'lightweight-charts';
import api from '@/services/api'; // Assuming you have an axios instance
import { FaSpinner } from 'react-icons/fa';

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
  entryTime?: string;
  exitTime?: string;
  direction?: 'LONG' | 'SHORT';
}

const TradeCandleChart: React.FC<TradeCandleChartProps> = ({
  tradeId,
  symbol,
  entryPrice,
  exitPrice,
  entryTime,
  exitTime,
  direction
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [candles, setCandles] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Polling for queued data
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCandles = async () => {
    try {
      setLoading(true);
      // We generally want '1m' or '5m' for execution accuracy, default to 5m for now
      // Backend handles "queued" status
      const response = await api.get(`/trades/${tradeId}/candles?timeframe=5m`);
      
      const data = response.data;
      
      if (Array.isArray(data)) {
        if (data.length > 0 && 'status' in data[0] && data[0].status === 'queued') {
          setStatusMessage(data[0].message);
          // Start polling
          if (!pollIntervalRef.current) {
            pollIntervalRef.current = setInterval(fetchCandles, 3000); // Poll every 3s
          }
        } else {
            // Data received
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }

            // Transform data if needed (MT5 sends time as unix timestamp (seconds))
            // Lightweight charts expects seconds for UTCTimestamp
            const formattedData = data.map((c: any) => ({
                time: (typeof c.time === 'string' ? new Date(c.time).getTime() / 1000 : c.time) as UTCTimestamp,
                open: Number(c.open),
                high: Number(c.high),
                low: Number(c.low),
                close: Number(c.close),
            }));

            // Sort by time just in case
            formattedData.sort((a, b) => (a.time as number) - (b.time as number));
            
            setCandles(formattedData);
            setStatusMessage(null);
        }
      } else {
        setError("Invalid data format received");
      }
    } catch (err: any) {
        if (err.response?.status === 404) {
             setError("No candle data available yet.");
        } else {
            console.error(err);
            setError("Failed to load chart data");
        }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandles();
    
    return () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }
    };
  }, [tradeId]);

  useEffect(() => {
    if (!chartContainerRef.current || candles.length === 0) return;

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

    const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981', // emerald-500
        downColor: '#ef4444', // red-500
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
    });

    candleSeries.setData(candles);

    // Markers for Entry and Exit
    const markers: any[] = [];
    
    if (entryTime && entryPrice) {
        const entryTs = new Date(entryTime).getTime() / 1000 as UTCTimestamp;
        // Find closest candle time
        // Lightweight markers need exact time matching a candle
        // Simple approximation:
        markers.push({
            time: entryTs,
            position: direction === 'LONG' ? 'belowBar' : 'aboveBar',
            color: '#3b82f6', // blue
            shape: direction === 'LONG' ? 'arrowUp' : 'arrowDown',
            text: 'Entry',
        });
    }

    if (exitTime && exitPrice) {
         const exitTs = new Date(exitTime).getTime() / 1000 as UTCTimestamp;
         markers.push({
            time: exitTs,
            position: direction === 'LONG' ? 'aboveBar' : 'belowBar',
            color: '#f59e0b', // orange
            shape: direction === 'LONG' ? 'arrowDown' : 'arrowUp', // Exit implies opposite action? Or just mark it
            text: 'Exit',
        });
    }

    // candleSeries.setMarkers(markers); // Note: timestamps must match exactly candle times, which is tricky. Skipping for now to avoid errors.

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
      }
    };
  }, [candles, entryTime, exitTime, direction]);

  if (loading && candles.length === 0) {
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
    <div className="w-full bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
      <div className="mb-4 flex justify-between items-center">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{symbol} - Execution</h4>
        <div className="text-xs text-gray-500">
            {candles.length} candles loaded
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full h-[400px]" />
    </div>
  );
};

export default TradeCandleChart;
