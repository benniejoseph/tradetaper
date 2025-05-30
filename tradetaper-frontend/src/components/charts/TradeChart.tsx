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
      height: 400,
      layout: { background: { color: '#1f2937' }, textColor: '#d1d5db' },
      grid: { vertLines: { color: '#374151' }, horzLines: { color: '#374151' } },
    });

    chartApiRef.current = chart;
  }, []);

  const updateChart = useCallback(() => {
    const container = chartContainerRef.current;
    const chart = chartApiRef.current;

    if (!container || !chart) return;

    chart.resize(container.clientWidth, 400);

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

      // Add price lines for entry and exit
      if (trade.entryDate && trade.entryPrice) {
        newSeries.createPriceLine({
          price: trade.entryPrice,
          color: '#22c55e',
          lineWidth: 2,
          lineStyle: 0,
          axisLabelVisible: true,
          title: `Entry @ ${trade.entryPrice.toFixed(2)}`,
        });
      }

      if (trade.exitDate && trade.exitPrice) {
        newSeries.createPriceLine({
          price: trade.exitPrice,
          color: '#9ca3af',
          lineWidth: 2,
          lineStyle: 0,
          axisLabelVisible: true,
          title: `Exit @ ${trade.exitPrice.toFixed(2)}`,
        });
      }

      // Add stop loss line if exists
      if (trade.stopLoss) {
        const stopLossLine = chart.addSeries({
          type: 'Line',
          isBuiltIn: true,
          defaultOptions: {
            color: '#ef4444',
            lineWidth: 2,
            lineStyle: 2,
            lineType: 0,
            lineVisible: true,
            pointMarkersVisible: false,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 4,
            crosshairMarkerBorderColor: '#ef4444',
            crosshairMarkerBackgroundColor: '#ef4444',
            crosshairMarkerBorderWidth: 1,
            lastPriceAnimation: 0,
          } as LineStyleOptions,
        }) as ISeriesApi<'Line'>;
        
        const stopLossData: LineData[] = priceData.map(candle => ({
          time: candle.time,
          value: trade.stopLoss!,
        }));
        
        stopLossLine.setData(stopLossData);
        stopLossLineRef.current = stopLossLine;
      }

      // Add take profit line if exists
      if (trade.takeProfit) {
        const takeProfitLine = chart.addSeries({
          type: 'Line',
          isBuiltIn: true,
          defaultOptions: {
            color: '#22c55e',
            lineWidth: 2,
            lineStyle: 2,
            lineType: 0,
            lineVisible: true,
            pointMarkersVisible: false,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 4,
            crosshairMarkerBorderColor: '#22c55e',
            crosshairMarkerBackgroundColor: '#22c55e',
            crosshairMarkerBorderWidth: 1,
            lastPriceAnimation: 0,
          } as LineStyleOptions,
        }) as ISeriesApi<'Line'>;
        
        const takeProfitData: LineData[] = priceData.map(candle => ({
          time: candle.time,
          value: trade.takeProfit!,
        }));
        
        takeProfitLine.setData(takeProfitData);
        takeProfitLineRef.current = takeProfitLine;
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
        chartApiRef.current.resize(chartContainerRef.current.clientWidth, 400);
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
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-100 mb-2">Chart: {trade.symbol}</h3>
      <div ref={chartContainerRef} className="w-full h-[400px] bg-gray-700 rounded">
        {(!priceData || priceData.length === 0) && (
          <div className="h-full flex items-center justify-center text-gray-400">
            Price data not available or loading...
          </div>
        )}
      </div>
    </div>
  );
});

TradeChart.displayName = 'TradeChart';
export default TradeChart;