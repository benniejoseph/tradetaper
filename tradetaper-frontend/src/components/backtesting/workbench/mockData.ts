// src/components/backtesting/workbench/mockData.ts

// Helper to generate some realistic-looking candle data
export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export function generateMockData(count: number = 500): CandleData[] {
  const data: CandleData[] = [];
  let price = 150.0;
  // Start from 2023-01-01
  const date = new Date('2023-01-01T09:30:00Z');

  for (let i = 0; i < count; i++) {
    const volatility = 0.5;
    const change = (Math.random() - 0.5) * volatility;
    
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    // Format date as YYYY-MM-DD
    const dateStr = date.toISOString().split('T')[0];
    
    data.push({
      time: dateStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    });

    price = close;
    // Add 1 day
    date.setDate(date.getDate() + 1);
  }
  return data;
}
