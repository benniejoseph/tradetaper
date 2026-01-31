"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickData, Time, UTCTimestamp, IChartApi, CandlestickSeries } from 'lightweight-charts';
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
  const [candles, setCandles] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [timeframe, setTimeframe] = useState<string>('5m');
  // Polling for queued data
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCandles = async () => {
    try {
      setLoading(true);
      // We generally want '1m' or '5m' for execution accuracy
      // Backend handles "queued" status
      const response = await api.get(`/trades/${tradeId}/candles?timeframe=${timeframe}`);
      
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
            pollIntervalRef.current = null;
        }
    };
  }, [tradeId, timeframe]);

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

    // Position Tool Simulation: Entry, SL, TP Lines
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

    if (stopLoss) {
      candleSeries.createPriceLine({
        price: stopLoss,
        color: '#ef4444', // red
        lineWidth: 1,
        lineStyle: 1, // Dotted
        axisLabelVisible: true,
        title: `SL: ${stopLoss.toLocaleString()}`,
      });
    }

    if (takeProfit) {
      candleSeries.createPriceLine({
        price: takeProfit,
        color: '#10b981', // green
        lineWidth: 1,
        lineStyle: 1, // Dotted
        axisLabelVisible: true,
        title: `TP: ${takeProfit.toLocaleString()}`,
      });
    }

    // candleSeries.setMarkers(markers);

    // Fit content
    chart.timeScale().fitContent();

    // Markers for Entry and Exit
    const markers: any[] = [];
    
    if (entryDate && entryPrice) {
        const entryTs = new Date(entryDate).getTime() / 1000 as UTCTimestamp;
        // Find closest candle time
        // Lightweight markers need exact time matching a candle
        // Simple approximation:
        markers.push({
            time: entryTs,
            position: direction === 'Long' ? 'belowBar' : 'aboveBar',
            color: '#3b82f6', // blue
            shape: direction === 'Long' ? 'arrowUp' : 'arrowDown',
            text: 'Entry',
        });
    }

    if (exitDate && exitPrice) {
         const exitTs = new Date(exitDate).getTime() / 1000 as UTCTimestamp;
         markers.push({
            time: exitTs,
            position: direction === 'Long' ? 'aboveBar' : 'belowBar',
            color: '#f59e0b', // orange
            shape: direction === 'Long' ? 'arrowDown' : 'arrowUp', // Exit implies opposite action? Or just mark it
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
        chartRef.current = null; // Important: Clear the reference
      }
    };
  }, [candles, entryDate, exitDate, direction, stopLoss, takeProfit]);

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
      
      <div className="relative group">
        <div ref={chartContainerRef} className="w-full h-[400px] cursor-crosshair" />
        {candles.length > 0 && (
          <div className="absolute top-4 left-4 pointer-events-none bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
              {candles.length} Data Points Synced
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeCandleChart;
