// src/app/trades/new/page.tsx
"use client";
import TradeForm from '@/components/trades/TradeForm'; // Adjust path
import Link from 'next/link';

export default function NewTradePage() {
  return (
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
        <div className="container mx-auto">
            <div className="mb-6">
                <Link href="/trades" className="text-blue-400 hover:underline">← Back to Trades</Link>
            </div>
            <TradeForm />
        </div>
      </div>
  );
}