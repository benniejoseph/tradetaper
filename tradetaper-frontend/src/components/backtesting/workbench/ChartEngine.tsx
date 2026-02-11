// src/components/backtesting/workbench/ChartEngine.tsx
'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import type { IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';

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
  const resizeHandlerRef = useRef<(() => void) | null>(null);

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

    let isMounted = true;

    // Dynamically import lightweight-charts to avoid SSR issues
    import('lightweight-charts').then(({ createChart, ColorType }) => {
      if (!chartContainerRef.current || !isMounted) return;

      try {
        // Initialize Chart
        const chart = createChart(chartContainerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: '#020617' },
            textColor: '#94A3B8',
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
          console.error('Chart created but addCandlestickSeries not available');
          console.log('Chart object:', chart);
          console.log('Chart methods:', Object.keys(chart || {}));
          return;
        }

        const candleSeries = chart.addCandlestickSeries({
          upColor: '#10B981',
          downColor: '#EF4444',
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

        // Resize handler
        const handleResize = () => {
          if (chartContainerRef.current && chart) {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
          }
        };

        resizeHandlerRef.current = handleResize;
        window.addEventListener('resize', handleResize);

        console.log('Chart initialized successfully');
      } catch (error) {
        console.error('Error initializing chart:', error);
      }
    }).catch(error => {
      console.error('Error loading lightweight-charts:', error);
    });

    // Cleanup
    return () => {
      isMounted = false;

      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current);
      }

      if (chartApiRef.current) {
        try {
          chartApiRef.current.remove();
          chartApiRef.current = null;
        } catch (e) {
          console.error('Error removing chart:', e);
        }
      }
    };
  }, []); // Run once on mount

  // Update data if props change
  useEffect(() => {
    if (candleSeriesRef.current && props.data.length > 0) {
       const currentDataLength = candleSeriesRef.current.data?.()?.length || 0;
       if (props.data.length !== currentDataLength) {
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
