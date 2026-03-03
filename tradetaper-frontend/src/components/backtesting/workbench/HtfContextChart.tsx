// src/components/backtesting/workbench/HtfContextChart.tsx
'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  CandlestickData,
  IChartApi,
  ISeriesApi,
  createChart,
  UTCTimestamp,
  SeriesMarker,
} from 'lightweight-charts';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Props {
  data:        CandlestickData[];  // pre-aggregated HTF candles
  currentTime: number;             // snapped HTF candle timestamp for current replay position
  timeframe:   string;             // e.g. '4h', '1h'
  height?:     number;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function HtfContextChart({ data, currentTime, timeframe, height = 150 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const seriesRef    = useRef<ISeriesApi<'Candlestick'> | null>(null);

  // Incremented on chart scroll/zoom so SVG line recomputes position
  const [renderTick, setRenderTick] = useState(0);

  // ── Create chart once on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: 'solid' as any, color: 'transparent' },
        textColor:  '#475569',
        fontSize:   10,
      },
      grid: {
        vertLines: { color: '#0F172A80' },
        horzLines: { color: '#0F172A80' },
      },
      timeScale: {
        borderColor:    '#1E293B',
        timeVisible:    true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor:  '#1E293B',
        scaleMargins: { top: 0.08, bottom: 0.05 },
        minimumWidth: 60,
      },
      crosshair: {
        mode: 1 as any, // Normal crosshair
      },
      handleScroll: true,
      handleScale:  true,
    });

    const cs = chart.addCandlestickSeries({
      upColor:         '#10B981',
      downColor:       '#EF4444',
      borderUpColor:   '#10B981',
      borderDownColor: '#EF4444',
      wickUpColor:     '#10B981',
      wickDownColor:   '#EF4444',
    });

    chartRef.current  = chart;
    seriesRef.current = cs;

    // Force SVG line recompute on scroll / zoom
    chart.timeScale().subscribeVisibleLogicalRangeChange(() =>
      setRenderTick(t => t + 1)
    );

    return () => {
      chart.remove();
      chartRef.current  = null;
      seriesRef.current = null;
    };
  }, []);

  // ── Set candle data ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!seriesRef.current || !data.length) return;
    seriesRef.current.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  // ── Current-position marker (arrowDown on the active HTF candle) ───────────
  useEffect(() => {
    if (!seriesRef.current || !data.length || !currentTime) return;

    const markers: SeriesMarker<UTCTimestamp>[] = [{
      time:     currentTime as UTCTimestamp,
      position: 'aboveBar',
      color:    '#F59E0B',
      shape:    'arrowDown',
      size:     1,
    }];

    seriesRef.current.setMarkers(markers);
    setRenderTick(t => t + 1); // reposition line
  }, [currentTime, data]);

  // ── Amber vertical dashed line at current replay position ─────────────────
  const lineX = useMemo(() => {
    if (!chartRef.current || !currentTime) return null;
    try {
      const x = chartRef.current.timeScale().timeToCoordinate(currentTime as UTCTimestamp);
      return x !== null && x >= 0 ? x : null;
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, renderTick]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>

      {/* Timeframe + label badge */}
      <div className="absolute top-1.5 left-2.5 z-10 flex items-center gap-1.5 pointer-events-none select-none">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          {timeframe}
        </span>
        <span className="text-[8px] text-amber-500/60 font-mono tracking-wider">
          context
        </span>
      </div>

      {/* Current-time stat in top-right */}
      {currentTime > 0 && (
        <div className="absolute top-1.5 right-[66px] z-10 pointer-events-none select-none">
          <span className="text-[8px] font-mono text-amber-500/70">
            {new Date(currentTime * 1000).toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: '2-digit',
            })}
          </span>
        </div>
      )}

      {/* LC chart container — fills the whole box */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* SVG overlay: amber dashed vertical line + top dot */}
      <svg
        className="absolute inset-0 w-full overflow-hidden pointer-events-none"
        style={{ height }}
      >
        {lineX !== null && (
          <>
            {/* Dashed vertical line */}
            <line
              x1={lineX} y1={0}
              x2={lineX} y2={height}
              stroke="#F59E0B"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              opacity={0.45}
            />
            {/* Amber dot at the top of the line */}
            <circle
              cx={lineX} cy={7}
              r={3.5}
              fill="#F59E0B"
              opacity={0.85}
            />
          </>
        )}
      </svg>
    </div>
  );
}
