// src/app/chart-test/page.tsx
"use client";
import TradeChart from '@/components/charts/TradeChart';
import { Trade, AssetType, TradeDirection, TradeStatus } from '@/types/trade';
import { CandlestickData, UTCTimestamp } from 'lightweight-charts';

const dummyTrade: Trade = {
    id: 'dummy1',
    userId: 'user1',
    assetType: AssetType.STOCK,
    symbol: 'DUMMY',
    direction: TradeDirection.LONG,
    status: TradeStatus.OPEN,
    entryDate: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    entryPrice: 100,
    quantity: 10,
    commission: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: []
};

const dummyPriceData: CandlestickData[] = [
    { time: (Date.now() / 1000 - 86400 * 4) as UTCTimestamp, open: 98, high: 100, low: 97, close: 99 },
    { time: (Date.now() / 1000 - 86400 * 3) as UTCTimestamp, open: 99, high: 102, low: 98, close: 101 },
    { time: (Date.now() / 1000 - 86400 * 2) as UTCTimestamp, open: 101, high: 103, low: 100, close: 100 },
    { time: (Date.now() / 1000 - 86400 * 1) as UTCTimestamp, open: 100, high: 101, low: 99, close: 101 },
    { time: (Date.now() / 1000) as UTCTimestamp, open: 101, high: 105, low: 101, close: 104 },
];

export default function ChartTestPage() {
    return (
        <div style={{ padding: '20px', backgroundColor: '#111827', minHeight: '100vh' }}>
            <h1 style={{ color: 'white', marginBottom: '20px' }}>Chart Test Page</h1>
            <div style={{ width: '800px', height: '450px', margin: 'auto' }}>
                 {/* Ensure TradeChart is imported correctly */}
                <TradeChart trade={dummyTrade} priceData={dummyPriceData} />
            </div>
        </div>
    );
}