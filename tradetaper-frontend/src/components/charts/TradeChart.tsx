/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useEffect, useRef, memo, useCallback, useState } from 'react';
import {
    createChart,
    IChartApi,
    ISeriesApi,
    CandlestickData,
    UTCTimestamp,
    CandlestickSeriesOptions,
    DeepPartial,
    CandlestickSeries,
    LineSeriesOptions,
    LineData,
    AreaSeries,
    LineSeries,
    ColorType,
    PriceScaleMode,
    ChartOptions,
    CrosshairMode,
    LineStyle,
    HistogramSeries,
    AreaSeriesOptions,
    HistogramSeriesOptions,
    HistogramData,
} from 'lightweight-charts';
import { Trade } from '@/types/trade';
import { useTheme } from '@/context/ThemeContext';

interface TradeChartProps {
  trade: Trade;
  priceData?: CandlestickData[];
  volumeData?: HistogramData[];
  showVolume?: boolean;
  showMovingAverages?: boolean;
  enableInteraction?: boolean;
  height?: number;
}

const TradeChart = memo(({ 
  trade, 
  priceData = [], 
  volumeData = [],
  showVolume = true,
  showMovingAverages = true,
  enableInteraction = true,
  height = 400
}: TradeChartProps) => {
  const { theme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area'>('candlestick');
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const candlestickSeriesApiRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesApiRef = useRef<ISeriesApi<'Line'> | null>(null);
  const areaSeriesApiRef = useRef<ISeriesApi<'Area'> | null>(null);
  const volumeSeriesApiRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ma20SeriesApiRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma50SeriesApiRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Dynamic colors based on theme
  const getThemeColors = useCallback(() => {
    const isDark = theme === 'dark';
    return {
      background: isDark ? '#1f2937' : '#ffffff',
      textColor: isDark ? '#e5e7eb' : '#374151',
      gridColor: isDark ? '#374151' : '#e5e7eb',
      upColor: '#10b981',
      downColor: '#ef4444',
      volumeUpColor: 'rgba(16, 185, 129, 0.3)',
      volumeDownColor: 'rgba(239, 68, 68, 0.3)',
      ma20Color: '#3b82f6',
      ma50Color: '#f59e0b',
    };
  }, [theme]);

  const SERIES_OPTIONS: DeepPartial<CandlestickSeriesOptions> = {
    upColor: getThemeColors().upColor,
    downColor: getThemeColors().downColor,
    borderVisible: false,
    wickUpColor: getThemeColors().upColor,
    wickDownColor: getThemeColors().downColor,
  };

  // Calculate moving averages
  const calculateMovingAverage = useCallback((data: CandlestickData[], period: number): LineData[] => {
    const result: LineData[] = [];
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      result.push({
        time: data[i].time,
        value: sum / period
      });
    }
    return result;
  }, []);

  // Convert candlestick data to line data
  const convertToLineData = useCallback((data: CandlestickData[]): LineData[] => {
    return data.map(candle => ({
      time: candle.time,
      value: candle.close
    }));
  }, []);

  const initializeChart = useCallback(() => {
    try {
      if (!chartContainerRef.current) return;

    const colors = getThemeColors();
    const chartOptions: DeepPartial<ChartOptions> = {
      width: chartContainerRef.current.clientWidth,
      height: isFullscreen ? window.innerHeight : height,
      layout: { 
        background: { 
          type: ColorType.Solid, 
          color: colors.background 
        }, 
        textColor: colors.textColor,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        fontSize: 12
      },
      grid: { 
        vertLines: { color: colors.gridColor, style: LineStyle.Dotted }, 
        horzLines: { color: colors.gridColor, style: LineStyle.Dotted } 
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: showVolume ? 0.1 : 0.05,
          bottom: showVolume ? 0.4 : 0.05,
        },
        mode: PriceScaleMode.Normal,
      },
      leftPriceScale: {
        visible: showVolume,
        borderVisible: false,
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: true,
        tickMarkFormatter: (time: UTCTimestamp) => {
          const date = new Date(time * 1000);
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        },
      },
      crosshair: {
        mode: showCrosshair ? CrosshairMode.Normal : CrosshairMode.Hidden,
        vertLine: {
          labelVisible: true,
          style: LineStyle.Solid,
          width: 1,
          color: colors.textColor,
        },
        horzLine: {
          labelVisible: true,
          style: LineStyle.Solid,
          width: 1,
          color: colors.textColor,
        },
      },
      handleScroll: enableInteraction,
      handleScale: enableInteraction,
      kineticScroll: {
        touch: enableInteraction,
        mouse: enableInteraction,
      },
    };

    const chart = createChart(chartContainerRef.current, chartOptions);
    chartApiRef.current = chart;
    } catch (error) {
      console.error('Error initializing chart:', error);
      // Graceful fallback - just log the error
    }
  }, [getThemeColors, height, isFullscreen, showCrosshair, showVolume, enableInteraction]);

  const clearAllSeries = useCallback((chart: IChartApi) => {
    const seriesToClear = [
      candlestickSeriesApiRef,
      lineSeriesApiRef,
      areaSeriesApiRef,
      volumeSeriesApiRef,
      ma20SeriesApiRef,
      ma50SeriesApiRef
    ];

    seriesToClear.forEach(seriesRef => {
      if (seriesRef.current) {
        try {
          chart.removeSeries(seriesRef.current);
        } catch (e) {
          console.warn("Error removing series:", e);
        }
        seriesRef.current = null;
      }
    });
  }, []);

  const updateChart = useCallback(() => {
    try {
      const container = chartContainerRef.current;
      const chart = chartApiRef.current;

      if (!container || !chart) return;

      chart.resize(container.clientWidth, isFullscreen ? window.innerHeight : height);
      clearAllSeries(chart);

      if (priceData.length === 0) return;

    const colors = getThemeColors();
    let mainSeries: ISeriesApi<any> | null = null;

    // Create main price series based on chart type
    if (chartType === 'candlestick') {
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        ...SERIES_OPTIONS,
        priceScaleId: 'right',
      });
      candlestickSeries.setData(priceData);
      candlestickSeriesApiRef.current = candlestickSeries;
      mainSeries = candlestickSeries;
    } else if (chartType === 'line') {
      const lineData = convertToLineData(priceData);
      const lineSeries = chart.addSeries(LineSeries, {
        color: colors.upColor,
        lineWidth: 2,
        priceScaleId: 'right',
      });
      lineSeries.setData(lineData);
      lineSeriesApiRef.current = lineSeries;
      mainSeries = lineSeries;
    } else if (chartType === 'area') {
      const lineData = convertToLineData(priceData);
      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: `${colors.upColor}33`,
        bottomColor: `${colors.upColor}00`,
        lineColor: colors.upColor,
        lineWidth: 2,
        priceScaleId: 'right',
      } as DeepPartial<AreaSeriesOptions>);
      areaSeries.setData(lineData);
      areaSeriesApiRef.current = areaSeries;
      mainSeries = areaSeries;
    }

    // Add volume series if enabled and data available
    if (showVolume && volumeData.length > 0 && mainSeries) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: colors.volumeUpColor,
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'left',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      } as DeepPartial<HistogramSeriesOptions>);
      volumeSeries.setData(volumeData);
      volumeSeriesApiRef.current = volumeSeries;
    }

    // Add moving averages if enabled
    if (showMovingAverages && priceData.length >= 50 && mainSeries) {
      const ma20Data = calculateMovingAverage(priceData, 20);
      const ma50Data = calculateMovingAverage(priceData, 50);

      if (ma20Data.length > 0) {
        const ma20Series = chart.addSeries(LineSeries, {
          color: colors.ma20Color,
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          priceScaleId: 'right',
        });
        ma20Series.setData(ma20Data);
        ma20SeriesApiRef.current = ma20Series;
      }

      if (ma50Data.length > 0) {
        const ma50Series = chart.addSeries(LineSeries, {
          color: colors.ma50Color,
          lineWidth: 1,
          lineStyle: LineStyle.Solid,
          priceScaleId: 'right',
        });
        ma50Series.setData(ma50Data);
        ma50SeriesApiRef.current = ma50Series;
      }
    }

    // Add trade price lines (works reliably across all series types)
    if (mainSeries) {
      // Entry price line
      if (trade.entryPrice) {
        mainSeries.createPriceLine({
          price: trade.entryPrice,
          color: '#3b82f6',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `Entry @ ${trade.entryPrice.toFixed(4)}`,
        });
      }

      // Exit price line
      if (trade.exitPrice) {
        const isProfit = trade.profitOrLoss && trade.profitOrLoss > 0;
        mainSeries.createPriceLine({
          price: trade.exitPrice,
          color: isProfit ? '#10b981' : '#ef4444',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `Exit @ ${trade.exitPrice.toFixed(4)}`,
        });
      }

      // Stop loss line
      if (trade.stopLoss) {
        mainSeries.createPriceLine({
          price: trade.stopLoss,
          color: '#ef4444',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `SL @ ${trade.stopLoss.toFixed(4)}`,
        });
      }

      // Take profit line
      if (trade.takeProfit) {
        mainSeries.createPriceLine({
          price: trade.takeProfit,
          color: '#10b981',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `TP @ ${trade.takeProfit.toFixed(4)}`,
        });
      }
    }

    // Auto-fit chart content
    chart.timeScale().fitContent();
    } catch (error) {
      console.error('Error updating chart:', error);
      // Graceful fallback - just log the error and continue
    }
  }, [
    priceData, 
    volumeData, 
    trade, 
    chartType, 
    showVolume, 
    showMovingAverages, 
    height, 
    isFullscreen,
    getThemeColors,
    clearAllSeries,
    calculateMovingAverage,
    convertToLineData,
    SERIES_OPTIONS
  ]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Chart controls handlers
  const handleChartTypeChange = useCallback((newType: 'candlestick' | 'line' | 'area') => {
    setChartType(newType);
  }, []);

  const handleResetZoom = useCallback(() => {
    if (chartApiRef.current) {
      chartApiRef.current.timeScale().fitContent();
    }
  }, []);

  const handleToggleCrosshair = useCallback(() => {
    setShowCrosshair(!showCrosshair);
  }, [showCrosshair]);

  useEffect(() => {
    if (!chartApiRef.current) initializeChart();
    updateChart();
  }, [initializeChart, updateChart]);

  useEffect(() => {
    const handleResize = () => {
      if (chartApiRef.current && chartContainerRef.current) {
        chartApiRef.current.resize(
          chartContainerRef.current.clientWidth, 
          isFullscreen ? window.innerHeight : height
        );
      }
    };
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isFullscreen, height]);

  useEffect(() => {
    return () => {
      if (chartApiRef.current) {
        chartApiRef.current.remove();
        chartApiRef.current = null;
      }
    };
  }, []);

  // Chart controls toolbar
  const renderControls = () => (
    <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-2">
      {/* Chart Type Selector */}
      <div className="flex bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50">
        {(['candlestick', 'line', 'area'] as const).map((type) => (
          <button
            key={type}
            onClick={() => handleChartTypeChange(type)}
            className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 first:rounded-l-lg last:rounded-r-lg ${
              chartType === type
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Feature Toggles */}
      <div className="flex gap-1">
        <button
          onClick={handleToggleCrosshair}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg backdrop-blur-sm border transition-all duration-200 ${
            showCrosshair
              ? 'bg-blue-500/20 border-blue-500/50 text-blue-600 dark:text-blue-400'
              : 'bg-white/90 dark:bg-gray-800/90 border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-300'
          }`}
          title="Toggle Crosshair"
        >
          ✚
        </button>
        
        <button
          onClick={handleResetZoom}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          title="Reset Zoom"
        >
          🔍
        </button>
        
        {enableInteraction && (
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            title={isFullscreen ? "Exit Fullscreen (ESC)" : "Fullscreen"}
          >
            {isFullscreen ? '⤵' : '⤴'}
          </button>
        )}
      </div>
    </div>
  );

  // Legend component
  const renderLegend = () => (
    <div className="absolute top-2 right-2 z-10">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-3">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {trade.symbol} - {trade.direction}
        </div>
        <div className="space-y-1 text-xs">
          {showMovingAverages && priceData.length >= 50 && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-blue-500"></div>
                <span className="text-gray-600 dark:text-gray-400">MA(20)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-amber-500"></div>
                <span className="text-gray-600 dark:text-gray-400">MA(50)</span>
              </div>
            </>
          )}
          {trade.profitOrLoss !== undefined && (
            <div className={`font-medium ${trade.profitOrLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              P&L: {trade.profitOrLoss >= 0 ? '+' : ''}{trade.profitOrLoss?.toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`relative w-full bg-transparent rounded-lg overflow-hidden ${
      isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''
    }`} style={{ height: isFullscreen ? '100vh' : height }}>
      {enableInteraction && renderControls()}
      {renderLegend()}
      
      <div ref={chartContainerRef} className="w-full h-full">
        {(!priceData || priceData.length === 0) && (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-4">📈</div>
              <div className="text-lg font-medium">No price data available</div>
              <div className="text-sm">Chart will display when price data is loaded</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

TradeChart.displayName = 'TradeChart';
export default TradeChart;