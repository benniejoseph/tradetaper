/* eslint-disable @typescript-eslint/no-unused-vars */
// src/utils/analytics.ts
import { Trade, TradeStatus, TradeDirection, AssetType } from '@/types/trade'; // Ensure AssetType is imported if used here
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay, // Used to get day of the week (0 for Sunday, 1 for Monday, etc.)
  // getWeekOfMonth, // Not used yet
  // getWeeksInMonth, // Not used yet
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
  addDays,
  differenceInCalendarDays, // For calculating duration
  differenceInHours,      // For intraday check
  differenceInMinutes,    // For very short trades if needed
} from 'date-fns';

export interface DashboardStats {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  totalNetPnl: number;
  totalCommissions: number;
  winRate: number; // Percentage
  lossRate: number; // Percentage
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  expectancy: number;
  maxDrawdown: number;
  currentBalance: number;
  averageRR: number;
  largestWin: number;
  largestLoss: number;
}

// This interface is generic for any breakdown where 'tag' is the grouping key
export interface StatsByTag extends DashboardStats {
  tag: string; // Will hold the Day Name, Asset Type, Symbol, or Strategy Tag
}

export interface PnlByDay {
  [date: string]: {
    pnl: number;
    tradeCount: number;
  };
}

function calculateMaxDrawdownFromPnlSeries(pnlSeries: number[]): number {
    if (pnlSeries.length === 0) {
        return 0;
    }

    let maxDrawdown = 0;
    let peak = 0; // Start with an initial peak of 0 (assuming starting equity is 0 for this calculation)
    let cumulativePnl = 0;

    for (const pnl of pnlSeries) {
        cumulativePnl += pnl;
        if (cumulativePnl > peak) {
            peak = cumulativePnl;
        }
        const drawdown = peak > 0 ? (peak - cumulativePnl) / peak : 0; // Percentage drawdown from peak
        // const drawdown = peak - cumulativePnl; // Absolute drawdown
        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }
    }
    return maxDrawdown * 100; // Return as percentage
    // return maxDrawdown; // If returning absolute drawdown
}

// Main stats calculator - REMAINS UNCHANGED from previous version that included Expectancy
export function calculateDashboardStats(trades: Trade[]): DashboardStats {
  const closedTrades = trades
    .filter(t => t.status === TradeStatus.CLOSED && t.profitOrLoss !== undefined && t.exitDate)
    .sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime()); // Sort by exitDate for drawdown calculation

  let totalNetPnl = 0;
  let totalCommissions = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  let sumOfWins = 0;
  let sumOfLosses = 0;
  const pnlSeriesForDrawdown: number[] = [];
  let sumOfRMultiples = 0;
  let countOfRMultiples = 0;
  let largestWin = 0;
  let largestLoss = 0;

  closedTrades.forEach(trade => {
    const pnl = trade.profitOrLoss!;
    pnlSeriesForDrawdown.push(pnl);

    totalNetPnl += pnl;
    totalCommissions += Math.abs(trade.commission || 0);

    if (pnl > 0) { 
      winningTrades++; 
      sumOfWins += pnl;
      if (pnl > largestWin) largestWin = pnl;
    } else if (pnl < 0) { 
      losingTrades++; 
      sumOfLosses += pnl; 
      if (pnl < largestLoss) largestLoss = pnl; // largestLoss will be negative
    } else { 
      breakevenTrades++; 
    }

    if (trade.rMultiple !== undefined && trade.rMultiple !== null) {
      sumOfRMultiples += trade.rMultiple;
      countOfRMultiples++;
    }
  });

  const totalClosedTradesWithPnl = winningTrades + losingTrades + breakevenTrades;
  const winRateDecimal = totalClosedTradesWithPnl > 0 ? (winningTrades / totalClosedTradesWithPnl) : 0;
  const lossRateDecimal = totalClosedTradesWithPnl > 0 ? (losingTrades / totalClosedTradesWithPnl) : 0;
  const averageWin = winningTrades > 0 ? sumOfWins / winningTrades : 0;
  const averageLoss = losingTrades > 0 ? sumOfLosses / losingTrades : 0; // This will be negative
  const expectancy = (winRateDecimal * averageWin) - (lossRateDecimal * Math.abs(averageLoss));
  const maxDrawdown = calculateMaxDrawdownFromPnlSeries(pnlSeriesForDrawdown);
  const averageRR = countOfRMultiples > 0 ? sumOfRMultiples / countOfRMultiples : 0;
  
  // Assuming currentBalance starts from 0 and is affected by P&L.
  // If an initial account balance is tracked, it should be: initialBalance + totalNetPnl.
  const currentBalance = totalNetPnl; 

  return {
    totalTrades: trades.length,
    openTrades: trades.filter(t => t.status === TradeStatus.OPEN || t.status === TradeStatus.PENDING).length,
    closedTrades: closedTrades.length,
    winningTrades,
    losingTrades,
    breakevenTrades,
    totalNetPnl,
    totalCommissions,
    winRate: winRateDecimal * 100,
    lossRate: lossRateDecimal * 100,
    averageWin,
    averageLoss, // Remains negative or zero
    profitFactor: sumOfLosses !== 0 ? Math.abs(sumOfWins / sumOfLosses) : (sumOfWins > 0 ? Infinity : 0),
    expectancy,
    maxDrawdown,
    currentBalance, // Added
    averageRR,      // Added
    largestWin,     // Added
    largestLoss,    // Added
  };
}


// Helper function (reused) - REMAINS UNCHANGED
function calculateSubsetStats(tradesForSubset: Trade[], subsetName: string): StatsByTag {
    const baseStats = calculateDashboardStats(tradesForSubset);
    return {
        tag: subsetName,
        ...baseStats,
    };
}

// PnlByDay interface and aggregatePnlByDay function - REMAINS UNCHANGED

export function aggregatePnlByDay(trades: Trade[]): PnlByDay {
  const dailyPnl: PnlByDay = {};
  trades.forEach(trade => {
    if (trade.status === TradeStatus.CLOSED && trade.profitOrLoss !== undefined && trade.exitDate) {
      const exitDateStr = format(new Date(trade.exitDate), 'yyyy-MM-dd');
      if (!dailyPnl[exitDateStr]) {
        dailyPnl[exitDateStr] = { pnl: 0, tradeCount: 0 };
      }
      dailyPnl[exitDateStr].pnl += trade.profitOrLoss;
      dailyPnl[exitDateStr].tradeCount++;
    }
  });
  return dailyPnl;
}

// calculateEquityCurveData function - REMAINS UNCHANGED
export function calculateEquityCurveData(trades: Trade[]): { date: string; value: number }[] {
    const closedSortedTrades = trades
        .filter(t => t.status === TradeStatus.CLOSED && t.profitOrLoss !== undefined && t.exitDate)
        .sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime());
    let cumulativePnl = 0;
    const equityData = closedSortedTrades.map(trade => {
        cumulativePnl += trade.profitOrLoss!;
        return { date: trade.exitDate!, value: cumulativePnl };
    });
    if (equityData.length > 0) {
        const firstTradeDate = new Date(equityData[0].date);
        const dayBeforeFirstTrade = new Date(firstTradeDate.setDate(firstTradeDate.getDate() -1)).toISOString();
        return [{ date: dayBeforeFirstTrade, value: 0 }, ...equityData];
    }
    return [{date: new Date().toISOString(), value: 0}];
}

// calculateStatsByStrategyTag function - REMAINS UNCHANGED
export function calculateStatsByStrategyTag(trades: Trade[]): StatsByTag[] {
  const tradesByIndividualTag: { [tagName: string]: Trade[] } = {};

  trades.forEach(trade => {
    if (trade.tags && trade.tags.length > 0) {
      trade.tags.forEach(tag => {
        const tagName = tag.name || 'Unnamed Tag';
        if (!tradesByIndividualTag[tagName]) {
          tradesByIndividualTag[tagName] = [];
        }
        tradesByIndividualTag[tagName].push(trade);
      });
    } else {
      const uncategorized = 'Uncategorized';
      if (!tradesByIndividualTag[uncategorized]) {
        tradesByIndividualTag[uncategorized] = [];
      }
      tradesByIndividualTag[uncategorized].push(trade);
    }
  });

  const result: StatsByTag[] = Object.entries(tradesByIndividualTag).map(([tag, tradesForTag]) => {
    return calculateSubsetStats(tradesForTag, tag);
  });

  return result.sort((a, b) => b.totalNetPnl - a.totalNetPnl);
}

// calculateStatsByAssetType function - REMAINS UNCHANGED
export function calculateStatsByAssetType(trades: Trade[]): StatsByTag[] {
    const tradesByAssetType: { [assetType: string]: Trade[] } = {};
    trades.forEach(trade => {
        const assetType = trade.assetType || 'Unknown Asset';
        if (!tradesByAssetType[assetType]) {
            tradesByAssetType[assetType] = [];
        }
        tradesByAssetType[assetType].push(trade);
    });
    const result: StatsByTag[] = Object.entries(tradesByAssetType).map(([assetType, tradesForAsset]) => {
        return calculateSubsetStats(tradesForAsset, assetType);
    });
    return result.sort((a,b) => b.totalNetPnl - a.totalNetPnl);
}

// calculateStatsBySymbol function - REMAINS UNCHANGED
export function calculateStatsBySymbol(trades: Trade[]): StatsByTag[] {
    const tradesBySymbol: { [symbol: string]: Trade[] } = {};
    trades.forEach(trade => {
        const symbol = trade.symbol?.toUpperCase() || 'Unknown Symbol';
        if (!tradesBySymbol[symbol]) {
            tradesBySymbol[symbol] = [];
        }
        tradesBySymbol[symbol].push(trade);
    });
    const result: StatsByTag[] = Object.entries(tradesBySymbol).map(([symbol, tradesForSymbol]) => {
        return calculateSubsetStats(tradesForSymbol, symbol);
    });
    return result.sort((a,b) => b.totalNetPnl - a.totalNetPnl);
}

// NEW: Function to calculate stats by Day of the Week (of exitDate)
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function calculateStatsByDayOfWeek(trades: Trade[]): StatsByTag[] {
    const tradesByDay: { [dayName: string]: Trade[] } = {};

    // Initialize for all days to ensure consistent order
    DAY_NAMES.forEach(dayName => {
        tradesByDay[dayName] = [];
    });

    const closedTrades = trades.filter(t => t.status === TradeStatus.CLOSED && t.exitDate);

    closedTrades.forEach(trade => {
        const exitDayIndex = getDay(new Date(trade.exitDate!)); // 0 for Sunday, 1 for Monday...
        const dayName = DAY_NAMES[exitDayIndex];
        tradesByDay[dayName].push(trade);
    });

    const result: StatsByTag[] = DAY_NAMES.map(dayName => {
        return calculateSubsetStats(tradesByDay[dayName], dayName);
    });

    // No specific sort needed here, as we want to maintain day order
    return result;
}
export enum TradeDurationBucket {
    INTRADAY = 'Intraday (<1 Day)',
    SHORT_TERM = 'Short-Term (1-7 Days)',
    MEDIUM_TERM = 'Medium-Term (1-4 Weeks)',
    LONG_TERM = 'Long-Term (1-3 Months)',
    VERY_LONG_TERM = 'Very Long-Term (>3 Months)',
    UNKNOWN = 'Unknown Duration' // For open trades or missing dates
}

const DURATION_BUCKET_ORDER = [
    TradeDurationBucket.INTRADAY,
    TradeDurationBucket.SHORT_TERM,
    TradeDurationBucket.MEDIUM_TERM,
    TradeDurationBucket.LONG_TERM,
    TradeDurationBucket.VERY_LONG_TERM,
    TradeDurationBucket.UNKNOWN,
];


export function getTradeDurationBucket(trade: Trade): TradeDurationBucket {
    if (trade.status !== TradeStatus.CLOSED || !trade.entryDate || !trade.exitDate) {
        return TradeDurationBucket.UNKNOWN;
    }

    const entry = new Date(trade.entryDate);
    const exit = new Date(trade.exitDate);

    if (isSameDay(entry, exit)) {
        // Could even check differenceInHours or differenceInMinutes for more granularity
        return TradeDurationBucket.INTRADAY;
    }

    const durationDays = differenceInCalendarDays(exit, entry);

    if (durationDays <= 0) return TradeDurationBucket.INTRADAY; // Should be caught by isSameDay, but as a fallback
    if (durationDays <= 7) return TradeDurationBucket.SHORT_TERM;
    if (durationDays <= 28) return TradeDurationBucket.MEDIUM_TERM; // Approx 4 weeks
    if (durationDays <= 90) return TradeDurationBucket.LONG_TERM;   // Approx 3 months
    return TradeDurationBucket.VERY_LONG_TERM;
}

export function calculateStatsByTradeDuration(trades: Trade[]): StatsByTag[] {
    const tradesByDuration: { [bucket in TradeDurationBucket]?: Trade[] } = {};

    // Initialize buckets to ensure order and presence
    DURATION_BUCKET_ORDER.forEach(bucket => {
        tradesByDuration[bucket] = [];
    });

    const closedTrades = trades.filter(t => t.status === TradeStatus.CLOSED && t.entryDate && t.exitDate);

    closedTrades.forEach(trade => {
        const bucket = getTradeDurationBucket(trade);
        // Ensure the bucket array exists (it should due to initialization)
        if (tradesByDuration[bucket]) {
            tradesByDuration[bucket]!.push(trade); // Use non-null assertion as we initialized
        }
    });

    const result: StatsByTag[] = DURATION_BUCKET_ORDER
        .map(bucketName => {
            const tradesInBucket = tradesByDuration[bucketName] || [];
            return calculateSubsetStats(tradesInBucket, bucketName);
        })
        .filter(bucketStats => bucketStats.totalTrades > 0 || bucketStats.tag === TradeDurationBucket.UNKNOWN); // Only show buckets with trades, unless it's "Unknown" which we might want to see if it has entries

    // No specific sort needed here if we want to maintain DURATION_BUCKET_ORDER
    return result;
}

export interface PnlDistributionBucket {
  name: string; // e.g., "-$100 to -$50", "+$50 to +$100"
  count: number;
  minPnl: number; // For sorting/ordering if needed
  maxPnl: number; // For sorting/ordering if needed
}

export function calculatePnlDistribution(
    trades: Trade[],
    numBuckets: number = 10, // Default number of buckets
    fixedBucketStep?: number // Optional: define a fixed P&L step for buckets
): PnlDistributionBucket[] {
    const closedTradesWithPnl = trades.filter(
        t => t.status === TradeStatus.CLOSED && typeof t.profitOrLoss === 'number'
    );

    if (closedTradesWithPnl.length === 0) {
        return [];
    }

    const pnlValues = closedTradesWithPnl.map(t => t.profitOrLoss!);

    let minPnl = Math.min(...pnlValues);
    let maxPnl = Math.max(...pnlValues);

    // Avoid issues if all P&L is 0 or very close
    if (minPnl === maxPnl) {
        // If all P&L values are the same, create a single bucket around that value
        if (maxPnl === 0) { // Handle all breakeven case
             minPnl = -1; // Create a small range around 0
             maxPnl = 1;
        } else {
             minPnl = maxPnl - Math.abs(maxPnl * 0.1 || 1); // Add a small range
             maxPnl = maxPnl + Math.abs(maxPnl * 0.1 || 1);
        }
    }
    
    // Ensure there's some range if min/max are too close to zero after adjustment for all-breakeven
    if (maxPnl - minPnl < 1 && maxPnl - minPnl > -1 && maxPnl - minPnl !== 0 ) { // very small range, not zero
        minPnl = Math.floor(minPnl) -1;
        maxPnl = Math.ceil(maxPnl) + 1;
    }


    const bucketStep = fixedBucketStep || (maxPnl - minPnl) / numBuckets;

    if (bucketStep <= 0) { // Only one distinct P&L value, or maxPnl somehow less than minPnl after adjustments
        return [{
            name: `${minPnl.toFixed(2)} to ${maxPnl.toFixed(2)}`,
            count: closedTradesWithPnl.length,
            minPnl: minPnl,
            maxPnl: maxPnl,
        }];
    }

    const buckets: PnlDistributionBucket[] = [];
    for (let i = 0; i < numBuckets; i++) {
        const bucketMin = minPnl + i * bucketStep;
        const bucketMax = minPnl + (i + 1) * bucketStep;
        buckets.push({
            name: `${bucketMin.toFixed(0)} to ${bucketMax.toFixed(0)}`, // Simpler names
            count: 0,
            minPnl: bucketMin,
            maxPnl: bucketMax,
        });
    }
    // Ensure the last bucket covers maxPnl if division wasn't perfect
    if (buckets.length > 0 && buckets[buckets.length-1].maxPnl < maxPnl ) {
        buckets[buckets.length-1].maxPnl = maxPnl;
        buckets[buckets.length-1].name = `${buckets[buckets.length-1].minPnl.toFixed(0)} to ${buckets[buckets.length-1].maxPnl.toFixed(0)}`;
    }


    pnlValues.forEach(pnl => {
        for (const bucket of buckets) {
            // Check if pnl falls into the current bucket
            // Special handling for the last bucket to include the max value
            if (pnl >= bucket.minPnl && (pnl < bucket.maxPnl || (bucket === buckets[buckets.length - 1] && pnl <= bucket.maxPnl))) {
                bucket.count++;
                break; // Move to next P&L value
            }
        }
    });

    return buckets.filter(b => b.count > 0); // Optionally filter out empty buckets
}