"use client";

import React, { useMemo } from 'react';
import { Trade, TradeStatus } from '@/types/trade';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa'; // For P&L direction

/*
// Interface removed as topTrades array items are directly shaped in the map function
interface TopTradeDisplayData {
  id: string;
  symbol: string;
  profitOrLoss: number;
  rMultiple?: number;
  assetType?: string;
}
*/

interface TopTradesByReturnProps {
  trades: Trade[];
  topN?: number;
}

export default function TopTradesByReturn({ trades, topN = 3 }: TopTradesByReturnProps) {
  const topTrades = useMemo(() => {
    if (!trades || trades.length === 0) {
      return [];
    }

    const closedTrades = trades.filter(
      (trade) => trade.status === TradeStatus.CLOSED && trade.profitOrLoss !== undefined
    );

    closedTrades.sort((a, b) => (b.profitOrLoss ?? 0) - (a.profitOrLoss ?? 0));

    return closedTrades.slice(0, topN).map(trade => ({
      id: trade.id,
      symbol: trade.symbol,
      profitOrLoss: trade.profitOrLoss!,
      rMultiple: trade.rMultiple,
      // Assuming assetType or a similar field exists for the subtitle like "Ripple/Tether US"
      // This is a placeholder, adjust based on your actual Trade data structure
      assetType: trade.assetType?.toString() // Convert enum to string if needed
    }));
  }, [trades, topN]);

  const hasTradesData = trades && trades.length > 0;
  const hasTopTrades = topTrades.length > 0;

  // Function to format P&L with plus/minus and dollar sign
  const formatPnl = (pnl: number) => {
    const sign = pnl >= 0 ? '+' : '-';
    return `${sign}$${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Function to format rMultiple as percentage (assuming rMultiple is like 0.2055 for 20.55%)
  // Adjust this logic if rMultiple has a different meaning or scale
  const formatRMultipleAsPercentage = (rMultiple: number | undefined) => {
    if (rMultiple === undefined) return null;
    // If rMultiple is already a direct R value (e.g. 2.5R), this needs different handling.
    // Assuming here it's a decimal for percentage like in the image (e.g. 0.2055 for 20.55%)
    // The image shows "20.55%", so we multiply by 100.
    // If your rMultiple is already e.g. 20.55 for 20.55%, then just .toFixed(2)
    return `${((rMultiple || 0) * 100).toFixed(2)}%`; 
  };

  return (
    <div className="h-full flex flex-col min-h-[200px]">
      {!hasTradesData ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-sm text-center text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">
            No trading data available for the selected period.
          </p>
        </div>
      ) : !hasTopTrades ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-sm text-center text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">
            No closed trades with P&L found in the selected period.
          </p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-grow pr-1">
          {topTrades?.map((trade) => (
            <div 
              key={trade.id}
              className="flex items-center justify-between p-2 rounded-md bg-[var(--color-light-secondary)] dark:bg-dark-primary"
            >
              <div className="flex items-center">
                 {/* Placeholder for asset icon if desired - not in image, but common */}
                <div className={`w-1.5 h-6 rounded-full mr-2.5 ${trade.profitOrLoss >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-dark-primary)] dark:text-text-light-primary truncate">
                    {trade.symbol}
                  </p>
                  {/* Subtitle like in image e.g. Ripple/Tether US - depends on your data */}
                  {trade.assetType && (
                     <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {trade.assetType} {/* Or a more descriptive field if you have one */}
                     </p>
                  )}
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className={`text-sm font-semibold ${trade.profitOrLoss >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {formatPnl(trade.profitOrLoss)}
                </p>
                {trade.rMultiple !== undefined && (
                  <div className={`text-xs flex items-center ${trade.profitOrLoss >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {trade.profitOrLoss >= 0 ? <FaArrowUp className="mr-0.5 h-2.5 w-2.5"/> : <FaArrowDown className="mr-0.5 h-2.5 w-2.5"/>}
                    {/* The image shows a percentage. If rMultiple is e.g. 2.5 (for R), this calculation might be different */} 
                    {/* Assuming rMultiple is a decimal representation of percentage like 0.2055 for 20.55% */}
                    {formatRMultipleAsPercentage(trade.rMultiple) ?? 'N/A'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 