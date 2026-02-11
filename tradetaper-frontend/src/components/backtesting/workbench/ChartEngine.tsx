// src/components/backtesting/workbench/ChartEngine.tsx
'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, ColorType } from 'lightweight-charts';

interface ChartEngineProps {
  data: CandlestickData[];
  markers?: any[]; // For trade markers later
}

export interface ChartEngineRef {
  updateLastCandle: (candle: CandlestickData) => void;
  setCandles: (candles: CandlestickData[]) => void;
}

const ChartEngine = forwardRef<ChartEngineRef, ChartEngineProps>((props, ref) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | any>(null);

  useImperativeHandle(ref, () => ({
    updateLastCandle: (candle) => {
      candleSeriesRef.current?.update(candle);
    },
    setCandles: (candles) => {
      candleSeriesRef.current?.setData(candles);
    }
  }));

  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      // Initialize Chart
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#020617' }, // Matches bg-slate-950
          textColor: '#94A3B8', // Matches text-slate-400
        },
        grid: {
          vertLines: { color: 'rgba(51, 65, 85, 0.2)' },
          horzLines: { color: 'rgba(51, 65, 85, 0.2)' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 500,
      });

      // Verify chart was created successfully
      if (!chart || typeof chart.addCandlestickSeries !== 'function') {
        console.error('Failed to create chart or addCandlestickSeries not available');
        return;
      }

      const candleSeries = chart.addCandlestickSeries({
        upColor: '#10B981', // Emerald 500
        downColor: '#EF4444', // Red 500
        borderVisible: false,
        wickUpColor: '#10B981',
        wickDownColor: '#EF4444',
      });

      if (props.data.length > 0) {
        candleSeries.setData(props.data);
      }

      // Markers Support
      if (props.markers && props.markers.length > 0) {
          candleSeries.setMarkers(props.markers);
      }

      chartApiRef.current = chart;
      candleSeriesRef.current = candleSeries;

      // Resize observer
      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        try {
          chart.remove();
        } catch (e) {
          console.error('Error removing chart:', e);
        }
      };
    } catch (error) {
      console.error('Error initializing chart:', error);
    }
  }, []); // Run once on mount

  // Update data if props change significantly (though we mostly use refs for perf)
  useEffect(() => {
    if (candleSeriesRef.current && props.data.length > 0) {
       // Only perform full setData if completely different? 
       // For backtesting, we usually modify the "tail" so we might rely on the parent driving updates via ref.
       // But initial load needs this.
       if (props.data.length !== candleSeriesRef.current.data().length) {
         candleSeriesRef.current.setData(props.data);
       }
    }
  }, [props.data]);

  // Update Markers
  useEffect(() => {
     if (candleSeriesRef.current && props.markers) {
         candleSeriesRef.current.setMarkers(props.markers);
     }
  }, [props.markers]);

  return (
    <div 
        ref={chartContainerRef} 
        className="w-full h-[500px] border border-white/5 rounded-xl overflow-hidden glass-card shadow-lg"
    />
  );
});

ChartEngine.displayName = 'ChartEngine';

export default ChartEngine;
