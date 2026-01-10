"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi, UTCTimestamp, CandlestickSeries, AreaSeries } from 'lightweight-charts';
import { Trade, TradeDirection } from '@/types/trade';
import { FaSpinner } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

// MetaApi timeframes
const TIMEFRAMES = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1d', value: '1d' },
];

interface TradeExecutionChartProps {
  trade: Trade;
  height?: number;
}

export default function TradeExecutionChart({ trade, height = 600 }: TradeExecutionChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  
  const [timeframe, setTimeframe] = useState('1h');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { token } = useSelector((state: RootState) => state.auth);

  // Calculate start/end times for fetching context
  const fetchCandles = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/trades/${trade.id}/candles?` + 
        new URLSearchParams({
          timeframe,
        }),
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch candle data');
      }

      const data = await response.json();
      
      // Transform data for Lightweight Charts
      // MetaApi returns candles as objects with time, open, high, low, close
      // Ensure time is in seconds (UTCTimestamp)
      const candles = data.map((c: any) => ({
        time: (new Date(c.time).getTime() / 1000) as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })).sort((a: any, b: any) => a.time - b.time);

      if (seriesRef.current) {
        seriesRef.current.setData(candles);
        
        if (candles.length === 0) return;

        // Add markers
        const markers: any[] = [];
        
        // Handle property name mismatch (Frontend type vs Backend entity)
        const entryDateStr = trade.entryDate || (trade as any).openTime;
        const exitDateStr = trade.exitDate || (trade as any).closeTime;
        const direction = trade.direction || (trade as any).side;

        if (entryDateStr) {
            // Entry Marker
            const entryTime = (new Date(entryDateStr).getTime() / 1000) as UTCTimestamp;
            // Find closest candle time
            const closestEntry = candles.reduce((prev: any, curr: any) => 
               Math.abs(curr.time - entryTime) < Math.abs(prev.time - entryTime) ? curr : prev
            );
            
            markers.push({
               time: closestEntry.time,
               position: direction === TradeDirection.LONG ? 'belowBar' : 'aboveBar',
               color: '#2196F3',
               shape: direction === TradeDirection.LONG ? 'arrowUp' : 'arrowDown',
               text: `Entry: ${trade.entryPrice}`,
            });
        }

        // Exit Marker
        if (exitDateStr && trade.exitPrice) {
          const exitTime = (new Date(exitDateStr).getTime() / 1000) as UTCTimestamp;
           const closestExit = candles.reduce((prev: any, curr: any) => 
             Math.abs(curr.time - exitTime) < Math.abs(prev.time - exitTime) ? curr : prev
          );
          
          markers.push({
            time: closestExit.time,
            position: direction === TradeDirection.LONG ? 'aboveBar' : 'belowBar',
            color: trade.profitOrLoss && trade.profitOrLoss > 0 ? '#4CAF50' : '#F44336',
            shape: direction === TradeDirection.LONG ? 'arrowDown' : 'arrowUp',
            text: `Exit: ${trade.exitPrice} (${trade.profitOrLoss && trade.profitOrLoss > 0 ? '+' : ''}$${trade.profitOrLoss?.toFixed(2)})`,
          });
        }

        if (typeof (seriesRef.current as any).setMarkers === 'function') {
           (seriesRef.current as any).setMarkers(markers);
        }
        
        // Fit content
        chartRef.current?.timeScale().fitContent();

        // ----------------------------------------------------
        // VISUALIZE TRADE POSITION (Area Highlight)
        // ----------------------------------------------------
        if (entryDateStr && exitDateStr && (chartRef.current as any).areaSeries) {
             const entryTime = (new Date(entryDateStr).getTime() / 1000);
             const exitTime = (new Date(exitDateStr).getTime() / 1000);
             const isWin = trade.profitOrLoss && trade.profitOrLoss > 0;
             const color = isWin ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'; // Green/Red
             const lineColor = isWin ? '#4CAF50' : '#F44336';

             // Update Area Series options based on PnL
             (chartRef.current as any).areaSeries.applyOptions({
                 topColor: color,
                 bottomColor: color.replace('0.3', '0.05'),
                 lineColor: lineColor,
             });

             // Create data for the area (from Entry to Exit)
             // We map existing candles that overlap with the trade duration
             const tradeAreaCalls = candles
                .filter((c: any) => c.time >= entryTime && c.time <= exitTime)
                .map((c: any) => ({
                    time: c.time,
                    value: (c.high + c.low) / 2, // Midpoint
                }));
             
             if (tradeAreaCalls.length > 0) {
                 (chartRef.current as any).areaSeries.setData(tradeAreaCalls);
             }
        }
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading chart');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      grid: {
        vertLines: { color: '#334155' }, // dark:border-slate-700
        horzLines: { color: '#334155' },
      },
      timeScale: {
        borderColor: '#475569',
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    // Add Area Series for Trade Duration Visualization
    const areaSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(33, 150, 243, 0.2)',
        bottomColor: 'rgba(33, 150, 243, 0.0)',
        lineColor: 'rgba(33, 150, 243, 0.5)',
        lineWidth: 1,
    });
    // Store in ref or attach to chart object if needed for cleanup, 
    // but lightweight-charts cleans up all series on chart.remove()
    (chartRef.current as any).areaSeries = areaSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  useEffect(() => {
    fetchCandles();
  }, [timeframe, trade]);

  return (
    <div className="relative w-full">
      {/* Timeframe Selector */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2 bg-slate-900/50 backdrop-blur-sm p-1 rounded-lg border border-slate-700">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setTimeframe(tf.value)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              timeframe === tf.value
                ? 'bg-emerald-500 text-white font-medium'
                : 'text-gray-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <FaSpinner className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      )}

      {error && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-red-900/80 border border-red-500 text-white px-4 py-2 rounded-lg max-w-md text-center">
                <p className="font-semibold">Unable to load chart data</p>
                <p className="text-sm mt-1 opacity-80">{error}</p>
                <button 
                  onClick={fetchCandles}
                  className="mt-3 text-xs bg-red-700 hover:bg-red-600 px-3 py-1 rounded transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
      )}

      <div ref={chartContainerRef} className="w-full rounded-xl overflow-hidden" />
    </div>
  );
}
