// src/components/backtesting/workbench/ChartEngine.tsx
'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface ChartEngineProps {
  data: any[];
  markers?: any[];
}

export interface ChartEngineRef {
  updateLastCandle: (candle: any) => void;
  setCandles: (candles: any[]) => void;
}

const ChartEngine = forwardRef<ChartEngineRef, ChartEngineProps>((props, ref) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
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
    import('lightweight-charts').then((LightweightCharts) => {
      if (!chartContainerRef.current || !isMounted) return;

      try {
        // v4 API uses default export
        const { createChart } = LightweightCharts;

        // Initialize Chart
        const chart = createChart(chartContainerRef.current, {
          layout: {
            backgroundColor: '#020617',
            textColor: '#94A3B8',
          },
          grid: {
            vertLines: { color: 'rgba(51, 65, 85, 0.2)' },
            horzLines: { color: 'rgba(51, 65, 85, 0.2)' },
          },
          width: chartContainerRef.current.clientWidth,
          height: 500,
        });

        console.log('Chart created:', chart);
        console.log('Available methods:', Object.keys(chart));

        // Add candlestick series
        const candleSeries = chart.addCandlestickSeries({
          upColor: '#10B981',
          downColor: '#EF4444',
          borderVisible: false,
          wickUpColor: '#10B981',
          wickDownColor: '#EF4444',
        });

        console.log('Candlestick series created:', candleSeries);

        if (props.data.length > 0) {
          console.log('Setting data:', props.data.length, 'candles');
          console.log('Sample candle:', props.data[0]);

          // Validate data before setting
          const validData = props.data.filter(candle => {
            if (!candle.time || candle.open == null || candle.high == null ||
                candle.low == null || candle.close == null) {
              console.warn('Invalid candle:', candle);
              return false;
            }
            return true;
          });

          console.log('Valid candles:', validData.length);

          if (validData.length > 0) {
            candleSeries.setData(validData);
          } else {
            console.error('No valid candles to display');
          }
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

        // Fit content
        chart.timeScale().fitContent();

        console.log('✅ Chart initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing chart:', error);
      }
    }).catch(error => {
      console.error('❌ Error loading lightweight-charts:', error);
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
       try {
         // Validate before updating
         const validData = props.data.filter(candle => {
           if (!candle.time || candle.open == null || candle.high == null ||
               candle.low == null || candle.close == null) {
             console.warn('Invalid candle in update:', candle);
             return false;
           }
           return true;
         });

         console.log('Updating chart with', validData.length, 'candles');

         if (validData.length > 0) {
           candleSeriesRef.current.setData(validData);
           chartApiRef.current?.timeScale().fitContent();
         }
       } catch (e) {
         console.error('Error updating data:', e);
         console.error('Data that caused error:', props.data);
       }
    }
  }, [props.data]);

  // Update Markers
  useEffect(() => {
     if (candleSeriesRef.current && props.markers) {
         try {
           candleSeriesRef.current.setMarkers(props.markers);
         } catch (e) {
           console.error('Error updating markers:', e);
         }
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
