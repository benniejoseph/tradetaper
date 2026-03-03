// src/components/backtesting/workbench/ChartEngine.tsx
'use client';

import React, {
  useEffect, useRef, useState, useMemo, forwardRef, useImperativeHandle, useCallback,
} from 'react';
import {
  IndicatorConfig, DEFAULT_INDICATORS,
  buildVolumeData,
} from '@/utils/indicators';
import {
  DrawingTool, Drawing,
  HorizontalLine, TrendLine, RectZone, FibRetracement,
  FIB_LEVELS, FIB_LABELS, FIB_COLORS, TOOL_COLOR,
} from '@/utils/drawings';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OpenPosition {
  type:     'LONG' | 'SHORT';
  entry:    number;
  sl:       number;
  tp:       number;
  lotSize?: number;
}

interface ChartEngineProps {
  data:               any[];
  markers?:           any[];
  indicators?:        IndicatorConfig;
  activeTool?:        DrawingTool;
  drawings?:          Drawing[];
  onDrawingComplete?: (drawing: Drawing) => void;
  onDrawingDelete?:   (id: string) => void;
  // Position lines
  openPosition?:      OpenPosition | null;
  onSlTpChange?:      (sl: number, tp: number) => void;
  // Theme
  isDark?:            boolean;
}

export interface ChartEngineRef {
  updateLastCandle: (candle: any) => void;
  setCandles:       (candles: any[]) => void;
}

// ── Theme ─────────────────────────────────────────────────────────────────────

const getChartOpts = (isDark: boolean): any => ({
  layout: {
    background: { type: 'solid', color: isDark ? '#000000' : '#FFFFFF' },
    textColor:  isDark ? '#6EE7B7' : '#374151',  // emerald-200 in dark
  },
  grid: {
    vertLines: { color: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(209,213,219,0.5)' },
    horzLines: { color: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(209,213,219,0.5)' },
  },
  crosshair: {
    vertLine: {
      color:                isDark ? 'rgba(52,211,153,0.5)' : 'rgba(107,114,128,0.4)',
      labelBackgroundColor: isDark ? '#052e16' : '#F3F4F6',
    },
    horzLine: {
      color:                isDark ? 'rgba(52,211,153,0.5)' : 'rgba(107,114,128,0.4)',
      labelBackgroundColor: isDark ? '#052e16' : '#F3F4F6',
    },
  },
});

const genId = () => Math.random().toString(36).slice(2, 9);

// SL/TP line styles
const POS_LINE = {
  entry: { color: '#60A5FA', label: 'Entry',  width: 1.5 },
  sl:    { color: '#EF4444', label: '● SL',   width: 2   },
  tp:    { color: '#10B981', label: '● TP',   width: 2   },
};

// ── Component ─────────────────────────────────────────────────────────────────

const ChartEngine = forwardRef<ChartEngineRef, ChartEngineProps>((props, ref) => {
  const indicators   = props.indicators   ?? DEFAULT_INDICATORS;
  const activeTool   = props.activeTool   ?? 'none';
  const drawings     = props.drawings     ?? [];
  const openPosition = props.openPosition ?? null;
  const isDark       = props.isDark       ?? true;

  // ── DOM refs ────────────────────────────────────────────────────────────────
  const mainDivRef = useRef<HTMLDivElement>(null);
  const svgRef     = useRef<SVGSVGElement>(null);

  // ── LC instances ────────────────────────────────────────────────────────────
  const chartRef     = useRef<any>(null);
  const chartLibRef  = useRef<any>(null);

  // ── Series refs ──────────────────────────────────────────────────────────────
  const candleSeriesRef = useRef<any>(null);
  const volumeRef       = useRef<any>(null);

  // ── Position price lines ─────────────────────────────────────────────────────
  const entryLineRef = useRef<any>(null);
  const slLineRef    = useRef<any>(null);
  const tpLineRef    = useRef<any>(null);

  // ── Drawing state ────────────────────────────────────────────────────────────
  const [renderTick, setRenderTick] = useState(0);
  const [pending,    setPending]    = useState<Partial<Drawing> | null>(null);

  // Stable refs
  const lastDataRef     = useRef<any[]>([]);
  const indicatorsRef   = useRef(indicators);
  indicatorsRef.current = indicators;
  const activeToolRef   = useRef<DrawingTool>('none');
  activeToolRef.current = activeTool;
  const onCompleteRef   = useRef(props.onDrawingComplete);
  onCompleteRef.current = props.onDrawingComplete;
  const onDeleteRef     = useRef(props.onDrawingDelete);
  onDeleteRef.current   = props.onDrawingDelete;
  const onSlTpRef       = useRef(props.onSlTpChange);
  onSlTpRef.current     = props.onSlTpChange;
  const openPosRef      = useRef(openPosition);
  openPosRef.current    = openPosition;

  // SL/TP drag state
  const [slTpDrag, setSlTpDrag] = useState<{
    target: 'sl' | 'tp';
    draftPrice: number;
  } | null>(null);
  const slTpDragRef = useRef(slTpDrag);
  slTpDragRef.current = slTpDrag;

  // Cancel pending drawing when tool changes to 'none'
  useEffect(() => {
    if (activeTool === 'none') setPending(null);
  }, [activeTool]);

  // ── Coordinate helpers ───────────────────────────────────────────────────────

  const priceToY = useCallback((price: number): number | null => {
    const y = candleSeriesRef.current?.priceToCoordinate(price);
    return y != null ? y as number : null;
  }, []);

  const timeToX = useCallback((time: number): number | null => {
    if (!chartRef.current) return null;
    const x = chartRef.current.timeScale().timeToCoordinate(time as any);
    return x != null ? x as number : null;
  }, []);

  const yToPrice = useCallback((y: number): number | null => {
    const p = candleSeriesRef.current?.coordinateToPrice(y);
    return p != null ? p as number : null;
  }, []);

  const xToTime = useCallback((x: number): number | null => {
    if (!chartRef.current) return null;
    const ts = chartRef.current.timeScale().coordinateToTime(x);
    return ts != null ? Number(ts) : null;
  }, []);

  const svgCoords = (e: MouseEvent | React.MouseEvent): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const r = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const cW = () => mainDivRef.current?.clientWidth  ?? 1000;
  const cH = () => mainDivRef.current?.clientHeight ?? 420;

  // ── Session / Kill-Zone bands ───────────────────────────────────────────────

  const SESSION_ZONES = [
    { startHour: 0,  endHour: 4,  color: '#8B5CF6', label: 'Asia' },
    { startHour: 7,  endHour: 10, color: '#3B82F6', label: 'London' },
    { startHour: 12, endHour: 15, color: '#10B981', label: 'NY' },
  ];

  const killZoneRects = useMemo(() => {
    if (!indicators.killZones || !chartRef.current) return [];
    const range = chartRef.current.timeScale().getVisibleRange();
    if (!range) return [];
    const from = range.from as number;
    const to   = range.to   as number;
    const w    = cW();

    const rects: { key: string; rx: number; rw: number; color: string }[] = [];
    const fromDay = Math.floor(from / 86400) * 86400;
    const toDay   = Math.ceil(to   / 86400) * 86400;

    for (let day = fromDay; day <= toDay; day += 86400) {
      for (let zi = 0; zi < SESSION_ZONES.length; zi++) {
        const zone = SESSION_ZONES[zi];
        const x1 = timeToX(day + zone.startHour * 3600);
        const x2 = timeToX(day + zone.endHour   * 3600);
        if (x1 == null || x2 == null || x2 < 0 || x1 > w) continue;
        const rx = Math.max(0, x1);
        const rw = Math.max(0, Math.min(w, x2) - rx);
        if (rw < 1) continue;
        rects.push({ key: `kz-${zi}-${day}`, rx, rw, color: zone.color });
      }
    }
    return rects;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indicators.killZones, renderTick, timeToX]);

  // ── Drawing: native document events (prevents mouse-leave cancellation) ──────

  const pendingRef = useRef<Partial<Drawing> | null>(null);
  pendingRef.current = pending;

  const handleChartMouseDown = useCallback((e: MouseEvent) => {
    const tool = activeToolRef.current;
    if (tool === 'none') {
      // Check SL/TP drag hit
      if (openPosRef.current) {
        const { x, y } = svgCoords(e);
        const slY = priceToY(openPosRef.current.sl);
        const tpY = priceToY(openPosRef.current.tp);
        if (slY != null && Math.abs(y - slY) < 8) {
          e.preventDefault();
          e.stopPropagation();
          setSlTpDrag({ target: 'sl', draftPrice: openPosRef.current.sl });
          return;
        }
        if (tpY != null && Math.abs(y - tpY) < 8) {
          e.preventDefault();
          e.stopPropagation();
          setSlTpDrag({ target: 'tp', draftPrice: openPosRef.current.tp });
          return;
        }
      }
      return;
    }

    const { x, y } = svgCoords(e);
    const price = yToPrice(y);
    const time  = xToTime(x);
    if (price == null || time == null) return;

    if (tool === 'horizontal') {
      onCompleteRef.current?.({
        type: 'horizontal', id: genId(), price, color: TOOL_COLOR.horizontal,
      } as HorizontalLine);
      return;
    }

    setPending({
      type:       tool as any,
      id:         genId(),
      startTime:  time,
      startPrice: price,
      endTime:    time,
      endPrice:   price,
      color:      TOOL_COLOR[tool],
      ...(tool === 'rectangle' ? { fillOpacity: 0.08 } : {}),
    });
  }, [priceToY, yToPrice, xToTime]);

  const handleChartMouseMove = useCallback((e: MouseEvent) => {
    // Handle SL/TP drag
    if (slTpDragRef.current) {
      const { y } = svgCoords(e);
      const newPrice = yToPrice(y);
      if (newPrice != null) {
        setSlTpDrag(prev => prev ? { ...prev, draftPrice: newPrice } : null);
        const target = slTpDragRef.current?.target;
        if (target === 'sl' && slLineRef.current) {
          try { slLineRef.current.applyOptions({ price: newPrice }); } catch {}
        }
        if (target === 'tp' && tpLineRef.current) {
          try { tpLineRef.current.applyOptions({ price: newPrice }); } catch {}
        }
      }
      return;
    }

    if (!pendingRef.current) return;
    const { x, y } = svgCoords(e);
    const price = yToPrice(y);
    const time  = xToTime(x);
    if (price == null || time == null) return;
    setPending(prev => prev ? { ...prev, endTime: time, endPrice: price } : null);
  }, [yToPrice, xToTime]);

  const handleChartMouseUp = useCallback((e: MouseEvent) => {
    // Commit SL/TP drag
    if (slTpDragRef.current) {
      const { target, draftPrice } = slTpDragRef.current;
      const pos = openPosRef.current;
      if (pos && onSlTpRef.current) {
        const newSl = target === 'sl' ? draftPrice : pos.sl;
        const newTp = target === 'tp' ? draftPrice : pos.tp;
        onSlTpRef.current(newSl, newTp);
      }
      setSlTpDrag(null);
      return;
    }

    if (!pendingRef.current) return;
    const { x, y } = svgCoords(e);
    const price = yToPrice(y);
    const time  = xToTime(x);
    const completed = {
      ...pendingRef.current,
      endTime:  time  ?? (pendingRef.current as any).endTime,
      endPrice: price ?? (pendingRef.current as any).endPrice,
    };
    setPending(null);
    onCompleteRef.current?.(completed as Drawing);
  }, [yToPrice, xToTime]);

  // ── SVG drawing renderers ────────────────────────────────────────────────────

  const delBtn = (id: string, cx: number, cy: number) => (
    <circle
      key={`del-${id}`}
      cx={cx} cy={cy} r={6}
      fill="rgba(239,68,68,0.8)" stroke="#EF4444" strokeWidth={1}
      style={{ pointerEvents: 'all', cursor: 'pointer' }}
      onMouseDown={(e) => { e.stopPropagation(); onDeleteRef.current?.(id); }}
    />
  );

  const drawHLine = (d: HorizontalLine, ghost: boolean): React.ReactNode => {
    const y = priceToY(d.price);
    if (y == null || y < -10 || y > cH() + 10) return null;
    const w = cW();
    return (
      <g key={d.id}>
        <line x1={0} y1={y} x2={w} y2={y}
          stroke={d.color} strokeWidth={1.5} strokeDasharray="6 3" />
        <rect x={4} y={y - 13} width={78} height={14} rx={2} fill={d.color + '22'} />
        <text x={7} y={y - 2} fill={d.color} fontSize={9}
          fontFamily="monospace" style={{ userSelect: 'none' }}>
          {d.price.toFixed(5)}
        </text>
        {!ghost && delBtn(d.id, w - 12, y - 6)}
      </g>
    );
  };

  const drawTrend = (d: TrendLine, ghost: boolean): React.ReactNode => {
    const x1 = timeToX(d.startTime); const y1 = priceToY(d.startPrice);
    const x2 = timeToX(d.endTime);   const y2 = priceToY(d.endPrice);
    if (x1 == null || y1 == null || x2 == null || y2 == null) return null;
    return (
      <g key={d.id}>
        <line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={d.color} strokeWidth={1.5} />
        <circle cx={x1} cy={y1} r={3} fill={d.color} />
        <circle cx={x2} cy={y2} r={3} fill={d.color} />
        {!ghost && delBtn(d.id, x2 + 8, y2 - 8)}
      </g>
    );
  };

  const drawRect = (d: RectZone, ghost: boolean): React.ReactNode => {
    const x1 = timeToX(d.startTime); const y1 = priceToY(d.startPrice);
    const x2 = timeToX(d.endTime);   const y2 = priceToY(d.endPrice);
    if (x1 == null || y1 == null || x2 == null || y2 == null) return null;
    const rx = Math.min(x1, x2); const ry = Math.min(y1, y2);
    const rw = Math.abs(x2 - x1); const rh = Math.abs(y2 - y1);
    return (
      <g key={d.id}>
        <rect x={rx} y={ry} width={rw} height={rh}
          fill={d.color} fillOpacity={(d as any).fillOpacity ?? 0.08}
          stroke={d.color} strokeWidth={1} />
        {!ghost && delBtn(d.id, rx + rw - 6, ry + 6)}
      </g>
    );
  };

  const drawFib = (d: FibRetracement, ghost: boolean): React.ReactNode => {
    const w     = cW();
    const range = d.endPrice - d.startPrice;
    const y0    = priceToY(d.startPrice) ?? 0;
    return (
      <g key={d.id}>
        {FIB_LEVELS.map((level, i) => {
          const price = d.startPrice + range * level;
          const y = priceToY(price);
          if (y == null || y < -10 || y > cH() + 10) return null;
          return (
            <g key={i}>
              <line x1={0} y1={y} x2={w} y2={y}
                stroke={FIB_COLORS[i]} strokeWidth={0.9} strokeDasharray="4 3" />
              <text x={w - 8} y={y - 2} fill={FIB_COLORS[i]} fontSize={8}
                fontFamily="monospace" textAnchor="end" style={{ userSelect: 'none' }}>
                {FIB_LABELS[i]}
              </text>
            </g>
          );
        })}
        {!ghost && delBtn(d.id, 14, y0)}
      </g>
    );
  };

  const renderDrawing = (d: Drawing, ghost = false): React.ReactNode => {
    switch (d.type) {
      case 'horizontal': return drawHLine(d as HorizontalLine, ghost);
      case 'trend':      return drawTrend(d as TrendLine, ghost);
      case 'rectangle':  return drawRect(d as RectZone, ghost);
      case 'fibonacci':  return drawFib(d as FibRetracement, ghost);
      default:           return null;
    }
  };

  // ── Position line overlays in SVG ───────────────────────────────────────────

  const renderPositionLines = (): React.ReactNode => {
    if (!openPosition) return null;
    const w = cW();

    const renderPosLine = (
      price: number,
      color: string,
      label: string,
      isDraggable: boolean,
      isDragging: boolean,
      draftPrice?: number,
    ) => {
      const displayPrice = isDragging && draftPrice != null ? draftPrice : price;
      const y = priceToY(displayPrice);
      if (y == null || y < -10 || y > cH() + 10) return null;

      return (
        <g key={label}>
          {isDraggable && (
            <rect
              x={0} y={y - 8} width={w} height={16}
              fill="transparent"
              style={{ pointerEvents: 'all', cursor: 'ns-resize' }}
            />
          )}
          <line
            x1={0} y1={y} x2={w} y2={y}
            stroke={color}
            strokeWidth={isDragging ? 2.5 : 1.5}
            strokeDasharray={label === 'Entry' ? 'none' : '5 3'}
            opacity={isDragging ? 1 : 0.85}
          />
          <rect
            x={w - 58} y={y - 10} width={56} height={18}
            rx={3} fill={color} fillOpacity={0.9}
          />
          <text
            x={w - 30} y={y + 4}
            fill="#fff" fontSize={9}
            fontFamily="monospace" fontWeight="bold"
            textAnchor="middle"
            style={{ userSelect: 'none' }}
          >
            {label} {displayPrice.toFixed(isDragging ? 4 : 5)}
          </text>
          {isDraggable && !isDragging && (
            <g>
              <circle cx={w - 72} cy={y} r={5}
                fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1} />
              <line x1={w - 74} y1={y - 2} x2={w - 70} y2={y - 2}
                stroke={color} strokeWidth={1} />
              <line x1={w - 74} y1={y + 2} x2={w - 70} y2={y + 2}
                stroke={color} strokeWidth={1} />
            </g>
          )}
        </g>
      );
    };

    const slDragging = slTpDrag?.target === 'sl';
    const tpDragging = slTpDrag?.target === 'tp';

    return (
      <g>
        {renderPosLine(openPosition.entry, POS_LINE.entry.color, 'Entry', false, false)}
        {renderPosLine(openPosition.sl, POS_LINE.sl.color, 'SL', true, slDragging, slTpDrag?.draftPrice)}
        {renderPosLine(openPosition.tp, POS_LINE.tp.color, 'TP', true, tpDragging, slTpDrag?.draftPrice)}
      </g>
    );
  };

  // ── Volume helpers ────────────────────────────────────────────────────────────

  const addVolumeSeries = useCallback(() => {
    if (!chartRef.current || volumeRef.current) return;
    const vol = chartRef.current.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      scaleMargins: { top: 0.8, bottom: 0 },
      lastValueVisible: false,
    });
    volumeRef.current = vol;
    if (lastDataRef.current.length > 0) vol.setData(buildVolumeData(lastDataRef.current));
  }, []);

  const removeVolumeSeries = useCallback(() => {
    if (!chartRef.current || !volumeRef.current) return;
    try { chartRef.current.removeSeries(volumeRef.current); } catch {}
    volumeRef.current = null;
  }, []);

  const applyVolumeToData = useCallback((candles: any[]) => {
    if (volumeRef.current && candles.length > 0) {
      volumeRef.current.setData(buildVolumeData(candles));
    }
  }, []);

  // ── Position price lines in LC ──────────────────────────────────────────────

  const removePosLines = useCallback(() => {
    if (!candleSeriesRef.current) return;
    if (entryLineRef.current) {
      try { candleSeriesRef.current.removePriceLine(entryLineRef.current); } catch {}
      entryLineRef.current = null;
    }
    if (slLineRef.current) {
      try { candleSeriesRef.current.removePriceLine(slLineRef.current); } catch {}
      slLineRef.current = null;
    }
    if (tpLineRef.current) {
      try { candleSeriesRef.current.removePriceLine(tpLineRef.current); } catch {}
      tpLineRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!candleSeriesRef.current) return;
    removePosLines();
    if (!openPosition) return;

    const LineStyle = chartLibRef.current?.LineStyle;
    const dashed    = LineStyle?.Dashed ?? 1;
    const solid     = LineStyle?.Solid  ?? 0;

    entryLineRef.current = candleSeriesRef.current.createPriceLine({
      price:            openPosition.entry,
      color:            POS_LINE.entry.color,
      lineWidth:        POS_LINE.entry.width,
      lineStyle:        solid,
      axisLabelVisible: true,
      title:            openPosition.type === 'LONG' ? 'Entry Long' : 'Entry Short',
    });

    slLineRef.current = candleSeriesRef.current.createPriceLine({
      price:            openPosition.sl,
      color:            POS_LINE.sl.color,
      lineWidth:        POS_LINE.sl.width,
      lineStyle:        dashed,
      axisLabelVisible: true,
      title:            'SL',
    });

    tpLineRef.current = candleSeriesRef.current.createPriceLine({
      price:            openPosition.tp,
      color:            POS_LINE.tp.color,
      lineWidth:        POS_LINE.tp.width,
      lineStyle:        dashed,
      axisLabelVisible: true,
      title:            'TP',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPosition?.entry, openPosition?.sl, openPosition?.tp]);

  // Sync LC price lines with drag
  useEffect(() => {
    if (!slTpDrag) return;
    if (slTpDrag.target === 'sl' && slLineRef.current) {
      try { slLineRef.current.applyOptions({ price: slTpDrag.draftPrice }); } catch {}
    }
    if (slTpDrag.target === 'tp' && tpLineRef.current) {
      try { tpLineRef.current.applyOptions({ price: slTpDrag.draftPrice }); } catch {}
    }
  }, [slTpDrag?.draftPrice]);

  // ── Imperative handle ────────────────────────────────────────────────────────

  useImperativeHandle(ref, () => ({
    updateLastCandle: (candle: any) => {
      candleSeriesRef.current?.update(candle);
    },
    setCandles: (candles: any[]) => {
      const valid = candles.filter(
        (c: any) => c.time && c.open != null && c.high != null && c.low != null && c.close != null
      );
      lastDataRef.current = valid;
      if (!candleSeriesRef.current) return;
      candleSeriesRef.current.setData(valid);
      applyVolumeToData(valid);
    },
  }));

  // ── Main chart init ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mainDivRef.current) return;
    let isMounted = true;

    import('lightweight-charts').then((LC) => {
      if (!mainDivRef.current || !isMounted) return;

      chartLibRef.current = LC;
      const { createChart } = LC;

      const chart = createChart(mainDivRef.current, {
        ...getChartOpts(isDark),
        width:  mainDivRef.current.clientWidth,
        height: mainDivRef.current.clientHeight || 420,
      });

      const candleSeries = chart.addCandlestickSeries({
        upColor:       '#10B981',
        downColor:     '#EF4444',
        borderVisible: false,
        wickUpColor:   '#10B981',
        wickDownColor: '#EF4444',
      });

      chartRef.current        = chart;
      candleSeriesRef.current = candleSeries;

      if (props.data.length > 0) {
        const valid = props.data.filter(
          (c: any) => c.time && c.open != null && c.high != null && c.low != null && c.close != null
        );
        lastDataRef.current = valid;
        candleSeries.setData(valid);
        chart.timeScale().fitContent();
      }

      if (props.markers?.length) {
        try { candleSeries.setMarkers(props.markers); } catch {}
      }

      const inds = indicatorsRef.current;
      if (inds.volume) addVolumeSeries();
      if (lastDataRef.current.length > 0) applyVolumeToData(lastDataRef.current);

      // Force SVG coord recalc on scroll/zoom
      chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
        setRenderTick(t => t + 1);
      });

      // Resize via ResizeObserver
      const ro = new ResizeObserver(() => {
        if (mainDivRef.current) {
          chart.applyOptions({ width: mainDivRef.current.clientWidth });
        }
      });
      if (mainDivRef.current) ro.observe(mainDivRef.current);

      return () => { ro.disconnect(); };
    });

    return () => {
      isMounted = false;
      removePosLines();
      chartRef.current?.remove();
      chartRef.current        = null;
      candleSeriesRef.current = null;
      volumeRef.current       = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Theme change ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions(getChartOpts(isDark));
  }, [isDark]);

  // ── Data changes ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!candleSeriesRef.current || props.data.length === 0) return;
    const valid = props.data.filter(
      (c: any) => c.time && c.open != null && c.high != null && c.low != null && c.close != null
    );
    lastDataRef.current = valid;
    candleSeriesRef.current.setData(valid);
    applyVolumeToData(valid);
  }, [props.data, applyVolumeToData]);

  // ── Marker changes ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!candleSeriesRef.current || !props.markers) return;
    try { candleSeriesRef.current.setMarkers(props.markers); } catch {}
  }, [props.markers]);

  // ── Volume toggle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chartRef.current) return;
    if (indicators.volume && !volumeRef.current) addVolumeSeries();
    if (!indicators.volume && volumeRef.current) removeVolumeSeries();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indicators.volume]);

  // Force re-render of kill zones when toggled
  useEffect(() => { setRenderTick(t => t + 1); }, [indicators.killZones]);

  // ── Document-level mouse events ──────────────────────────────────────────────
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    svgEl.addEventListener('mousedown', handleChartMouseDown as any);
    document.addEventListener('mousemove', handleChartMouseMove as any);
    document.addEventListener('mouseup', handleChartMouseUp as any);

    return () => {
      svgEl.removeEventListener('mousedown', handleChartMouseDown as any);
      document.removeEventListener('mousemove', handleChartMouseMove as any);
      document.removeEventListener('mouseup', handleChartMouseUp as any);
    };
  }, [handleChartMouseDown, handleChartMouseMove, handleChartMouseUp]);

  // ── Cursor ───────────────────────────────────────────────────────────────────
  const svgCursor = slTpDrag
    ? 'ns-resize'
    : activeTool !== 'none'
      ? 'crosshair'
      : 'default';

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className={`flex flex-col w-full rounded-xl overflow-hidden shadow-lg border ${
        isDark ? 'border-emerald-900/30 bg-black' : 'border-gray-200 bg-white'
      }`}
      style={{ height: '100%', minHeight: 420 }}
    >
      {/* Main chart + SVG overlay */}
      <div className="relative" style={{ flex: '1 1 auto', minHeight: 320 }}>
        {/* LC canvas target */}
        <div ref={mainDivRef} className="absolute inset-0" />

        {/* SVG Drawing + Position Overlay
            z-index 5 keeps it above LC canvas.
            pointer-events: none by default; specific children use pointer-events: all.
        */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full overflow-hidden"
          style={{ pointerEvents: 'none', zIndex: 5, cursor: svgCursor }}
        >
          {/* Full-area capture rect when tool active or SL/TP dragging */}
          {(activeTool !== 'none' || slTpDrag) && (
            <rect
              x={0} y={0} width="100%" height="100%"
              fill="transparent"
              style={{ pointerEvents: 'all', cursor: svgCursor }}
            />
          )}

          {/* Session bands */}
          {killZoneRects.map(z => (
            <rect
              key={z.key} x={z.rx} y={0}
              width={z.rw} height={cH()}
              fill={z.color} fillOpacity={0.07}
            />
          ))}

          {/* Position lines (entry, SL, TP) */}
          {renderTick >= 0 && renderPositionLines()}

          {/* Completed drawings */}
          {renderTick >= 0 && drawings.map(d => renderDrawing(d))}

          {/* Ghost while drawing */}
          {pending && (
            <g opacity={0.65}>
              {renderDrawing(pending as Drawing, true)}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
});

ChartEngine.displayName = 'ChartEngine';
export default ChartEngine;
export type { ChartEngineProps };
