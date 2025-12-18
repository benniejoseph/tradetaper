"use client";

import { useEffect, useRef, memo } from 'react';

interface TradeMarker {
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  direction: 'LONG' | 'SHORT';
  profitLoss?: number;
}

interface TradingViewChartProps {
  symbol: string;
  interval?: string; // TradingView intervals: 1, 5, 15, 60, 240, D, W, M
  theme?: 'light' | 'dark';
  height?: number;
  tradeMarker?: TradeMarker; // Optional trade data to display on chart
}

function TradingViewChart({ 
  symbol = 'XAUUSD', 
  interval = '240', // 4H = 240 minutes
  theme = 'dark',
  height = 600,
  tradeMarker
}: TradingViewChartProps) {
  const container = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    if (!container.current) return;

    // Clear existing content
    container.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => {
      try {
        console.log('TradingView script loaded successfully');
        if (typeof (window as any).TradingView !== 'undefined') {
          console.log('TradingView library available, initializing widget...');
          const widget = new (window as any).TradingView.widget({
          width: '100%',
          height: '100%',
          symbol: `OANDA:${symbol}`,
          interval: interval,
          timezone: 'Etc/UTC',
          theme: 'light', // Force light theme for white background
          style: '1', // Candlestick
          locale: 'en',
          enable_publishing: false,
          allow_symbol_change: true,
          save_image: true,
          container_id: container.current?.id,
          
          // Essential features with drawing tools
          enabled_features: [
            'left_toolbar',
            'header_widget',
            'timeframes_toolbar',
            'drawing_tools',
            'edit_buttons_in_legend',
            'border_around_the_chart',
            'main_series_scale_menu',
          ],
          
          disabled_features: [
            'header_symbol_search',
            'header_compare',
          ],
          
          // Clean ICT-style candles with white background
          overrides: {
            // Bullish candles (green)
            'mainSeriesProperties.candleStyle.upColor': '#22c55e',
            'mainSeriesProperties.candleStyle.borderUpColor': '#22c55e',
            'mainSeriesProperties.candleStyle.wickUpColor': '#22c55e',
            
            // Bearish candles (red)
            'mainSeriesProperties.candleStyle.downColor': '#ef4444',
            'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
            'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444',
            
            'mainSeriesProperties.candleStyle.drawBorder': true,
            'mainSeriesProperties.candleStyle.drawWick': true,
            
            // White background with no grid
            'paneProperties.background': '#ffffff',
            'paneProperties.backgroundType': 'solid',
            'paneProperties.vertGridProperties.color': '#ffffff', // Same as background
            'paneProperties.horzGridProperties.color': '#ffffff', // Same as background
            'paneProperties.vertGridProperties.style': 0, // No grid lines
            'paneProperties.horzGridProperties.style': 0, // No grid lines
            'paneProperties.vertGridProperties.visible': false, // Hide vertical grid
            'paneProperties.horzGridProperties.visible': false, // Hide horizontal grid
            
            // Scale settings for white background
            'scalesProperties.textColor': '#374151',
            'scalesProperties.lineColor': '#e5e7eb',
            
            // Additional grid hiding settings
            'paneProperties.vertGridProperties.lineStyle': 0,
            'paneProperties.horzGridProperties.lineStyle': 0,
            'paneProperties.vertGridProperties.lineWidth': 0,
            'paneProperties.horzGridProperties.lineWidth': 0,
          },
          
          // Load with these drawings available in toolbar
          toolbar_bg: '#f8fafc',
          loading_screen: { backgroundColor: '#ffffff' },
        });

        console.log('TradingView widget created successfully');
        widgetRef.current = widget;
        } else {
          console.error('TradingView library not loaded');
        }
      } catch (error) {
        console.error('Error initializing TradingView widget:', error);
      }
    };
    
    script.onerror = () => {
      console.error('Failed to load TradingView script');
    };
    
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol, interval, theme, tradeMarker]);

  return (
    <div 
      className="tradingview-widget-container w-full h-full" 
      style={height > 0 ? { height: `${height}px` } : { height: '100%' }}
    >
      <div id={`tradingview_${symbol}_${interval}`} ref={container} style={{ height: '100%' }} />
      <div className="tradingview-widget-copyright mt-2">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text text-xs text-gray-500">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
}

export default memo(TradingViewChart);

