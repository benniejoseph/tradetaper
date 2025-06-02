/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useEffect, useRef, memo, useCallback } from 'react';
import {
    createChart,
    IChartApi,
    ISeriesApi,
    CandlestickData,
    UTCTimestamp,
    SeriesMarker,
    Time,
    CandlestickSeriesOptions,
    DeepPartial,
    CandlestickSeries,
    LineSeriesOptions,
    LineData,
    SeriesMarkerPosition,
    SeriesMarkerShape,
    ISeriesMarkersPluginApi,
    LineStyleOptions,
} from 'lightweight-charts';
import { Trade } from '@/types/trade';

interface TradeChartProps {
  trade: Trade;
  priceData?: CandlestickData[];
}

const SERIES_OPTIONS: DeepPartial<CandlestickSeriesOptions> = {
    upColor: '#22c55e',
    downColor: '#ef4444',
    borderVisible: false,
    wickUpColor: '#22c55e',
    wickDownColor: '#ef4444',
};

const TradeChart = memo(({ trade, priceData = [] }: TradeChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const candlestickSeriesApiRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const stopLossLineRef = useRef<ISeriesApi<'Line'> | null>(null);
  const takeProfitLineRef = useRef<ISeriesApi<'Line'> | null>(null);

  const initializeChart = useCallback(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: { background: { color: 'transparent' }, textColor: '#d1d5db' },
      grid: { vertLines: { color: '#374151' }, horzLines: { color: '#374151' } },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
      },
      crosshair: {
        mode: 0,
      },
    });

    chartApiRef.current = chart;
  }, []);

  const updateChart = useCallback(() => {
    const container = chartContainerRef.current;
    const chart = chartApiRef.current;

    if (!container || !chart) return;

    chart.resize(container.clientWidth, container.clientHeight);

    if (candlestickSeriesApiRef.current) {
      try {
        chart.removeSeries(candlestickSeriesApiRef.current);
      } catch (e) {
        console.warn("Error removing candlestick series:", e);
      }
      candlestickSeriesApiRef.current = null;
    }

    if (stopLossLineRef.current) {
      try {
        chart.removeSeries(stopLossLineRef.current);
      } catch (e) {
        console.warn("Error removing stop loss line:", e);
      }
      stopLossLineRef.current = null;
    }

    if (takeProfitLineRef.current) {
      try {
        chart.removeSeries(takeProfitLineRef.current);
      } catch (e) {
        console.warn("Error removing take profit line:", e);
      }
      takeProfitLineRef.current = null;
    }

    if (priceData.length > 0) {
      // Create candlestick series
      const newSeries = chart.addSeries(CandlestickSeries, {
        ...SERIES_OPTIONS,
        markers: [],
      } as DeepPartial<CandlestickSeriesOptions & { markers: SeriesMarker<Time>[] }>) as ISeriesApi<'Candlestick'> & { setMarkers: (markers: SeriesMarker<Time>[]) => void };
      newSeries.setData(priceData);
      candlestickSeriesApiRef.current = newSeries;

      // Add price lines for entry, stop loss, take profit, and exit
      if (trade.entryDate && trade.entryPrice) {
        newSeries.createPriceLine({
          price: trade.entryPrice,
          color: '#3b82f6', // Blue for entry
          lineWidth: 2,
          lineStyle: 0,
          axisLabelVisible: true,
          title: `Entry @ ${trade.entryPrice.toFixed(2)}`,
        });
      }

      // Add stop loss line if exists
      if (trade.stopLoss) {
        newSeries.createPriceLine({
          price: trade.stopLoss,
          color: '#ef4444', // Red for stop loss
          lineWidth: 2,
          lineStyle: 2, // Dashed line
          axisLabelVisible: true,
          title: `Stop Loss @ ${trade.stopLoss.toFixed(2)}`,
        });
      }

      // Add take profit line if exists
      if (trade.takeProfit) {
        newSeries.createPriceLine({
          price: trade.takeProfit,
          color: '#22c55e', // Green for take profit
          lineWidth: 2,
          lineStyle: 2, // Dashed line
          axisLabelVisible: true,
          title: `Take Profit @ ${trade.takeProfit.toFixed(2)}`,
        });
      }

      // Add exit line if exists and different from take profit
      if (trade.exitDate && trade.exitPrice) {
        const isSameAsTakeProfit = trade.takeProfit && Math.abs(trade.exitPrice - trade.takeProfit) < 0.01;
        
        if (!isSameAsTakeProfit) {
          newSeries.createPriceLine({
            price: trade.exitPrice,
            color: '#8b5cf6', // Purple for exit
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title: `Exit @ ${trade.exitPrice.toFixed(2)}`,
          });
        }
      }

      chart.timeScale().fitContent();
    }
  }, [priceData, trade]);

  useEffect(() => {
    if (!chartApiRef.current) initializeChart();
    updateChart();
  }, [initializeChart, updateChart]);

  useEffect(() => {
    const handleResize = () => {
      if (chartApiRef.current && chartContainerRef.current) {
        chartApiRef.current.resize(chartContainerRef.current.clientWidth, chartContainerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (chartApiRef.current) {
        chartApiRef.current.remove();
        chartApiRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={chartContainerRef} className="w-full h-full bg-transparent rounded">
      {(!priceData || priceData.length === 0) && (
        <div className="h-full flex items-center justify-center text-gray-400">
          Price data not available or loading...
        </div>
      )}
    </div>
  );
});

TradeChart.displayName = 'TradeChart';
export default TradeChart;