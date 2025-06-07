"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { fetchTrades } from '@/store/features/tradesSlice';
import { selectSelectedAccountId } from '@/store/features/accountSlice';
import { format, parseISO, isValid, subDays, subMonths } from 'date-fns';
import { Trade, TradeStatus } from '@/types/trade';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid
} from 'recharts';
import { 
  FaTimes, FaPlus, FaChartLine, FaDownload, FaFilter, FaCalendarAlt, 
  FaTrophy, FaFire, FaShieldAlt, FaClock, FaBolt, FaChartBar,
  FaArrowUp, FaArrowDown, FaCoins, FaBalanceScale,
  FaEye, FaStar, FaPercentage, FaExclamationTriangle
} from 'react-icons/fa';
import { FaBullseye } from 'react-icons/fa';

interface ChartDataPoint {
  date: string;
  pnl: number;
  netPnl: number;
  mae: number;
}

interface PairStats {
  symbol: string;
  returnDollar: number;
  profitFactor: number;
  mae: number;
  winPercent: number;
  returnLoss: number;
  tradesCount: number;
}

type MetricType = 'pnl' | 'netPnl' | 'mae';
type TimeRange = '7D' | '1M' | 'All' | 'Custom';

export default function OverviewPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { trades, isLoading, error } = useSelector((state: RootState) => state.trades);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const selectedAccountId = useSelector(selectSelectedAccountId);
  
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>(['pnl', 'netPnl', 'mae']);
  const [timeRange, setTimeRange] = useState<TimeRange>('All');

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchTrades(selectedAccountId || undefined));
    }
  }, [dispatch, isAuthenticated, selectedAccountId]);

  // Filter trades based on time range
  const filteredTrades = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    const accountTrades = selectedAccountId 
      ? trades.filter(trade => trade.accountId === selectedAccountId)
      : trades;

    if (timeRange === 'All') return accountTrades;

    const now = new Date();
    let cutoffDate: Date;

    switch (timeRange) {
      case '7D':
        cutoffDate = subDays(now, 7);
        break;
      case '1M':
        cutoffDate = subMonths(now, 1);
        break;
      default:
        return accountTrades;
    }

    return accountTrades.filter(trade => {
      if (!trade.entryDate) return false;
      try {
        const entryDate = parseISO(trade.entryDate);
        return isValid(entryDate) && entryDate >= cutoffDate;
      } catch {
        return false;
      }
    });
  }, [trades, selectedAccountId, timeRange]);

  // Calculate chart data
  const chartData = useMemo((): ChartDataPoint[] => {
    const closedTrades = filteredTrades
      .filter(t => t.status === TradeStatus.CLOSED && t.exitDate)
      .sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime());

    if (closedTrades.length === 0) return [];

    let cumulativePnl = 0;
    let cumulativeNetPnl = 0;
    const dataPoints: ChartDataPoint[] = [];

    // Group trades by day for better visualization
    const dailyGroups: { [key: string]: Trade[] } = {};
    closedTrades.forEach(trade => {
      const dateKey = format(parseISO(trade.exitDate!), 'yyyy-MM-dd');
      if (!dailyGroups[dateKey]) {
        dailyGroups[dateKey] = [];
      }
      dailyGroups[dateKey].push(trade);
    });

    Object.entries(dailyGroups).forEach(([date, dayTrades]) => {
      const dayPnl = dayTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
      const dayCommissions = dayTrades.reduce((sum, t) => sum + (t.commission || 0), 0);
      
      cumulativePnl += dayPnl;
      cumulativeNetPnl += (dayPnl - dayCommissions);
      
      // Calculate simulated MAE (since we don't have tick data)
      // We'll use a negative value based on losing trades as a proxy
      const dayMAE = dayTrades.reduce((mae, trade) => {
        if ((trade.profitOrLoss || 0) < 0) {
          return mae + Math.abs(trade.profitOrLoss || 0) * 0.3; // Simulate MAE as 30% worse than final loss
        }
        return mae;
      }, 0);

      dataPoints.push({
        date: format(parseISO(date), 'MMM dd'),
        pnl: cumulativePnl,
        netPnl: cumulativeNetPnl,
        mae: -dayMAE, // Negative because MAE represents adverse movement
      });
    });

    return dataPoints;
  }, [filteredTrades]);

  // Calculate pairs performance
  const pairsPerformance = useMemo((): PairStats[] => {
    const closedTrades = filteredTrades.filter(t => t.status === TradeStatus.CLOSED);
    const symbolGroups: { [symbol: string]: Trade[] } = {};

    closedTrades.forEach(trade => {
      if (!symbolGroups[trade.symbol]) {
        symbolGroups[trade.symbol] = [];
      }
      symbolGroups[trade.symbol].push(trade);
    });

    const pairStats: PairStats[] = Object.entries(symbolGroups)
      .map(([symbol, symbolTrades]) => {
        const totalPnl = symbolTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
        const wins = symbolTrades.filter(t => (t.profitOrLoss || 0) > 0);
        const losses = symbolTrades.filter(t => (t.profitOrLoss || 0) < 0);
        
        const totalWins = wins.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
        const totalLosses = Math.abs(losses.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0));
        
        const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;
        const winPercent = symbolTrades.length > 0 ? (wins.length / symbolTrades.length) * 100 : 0;
        
        // Simulated MAE calculation
        const mae = losses.reduce((sum, t) => sum + Math.abs(t.profitOrLoss || 0) * 0.3, 0);

        return {
          symbol: symbol,
          returnDollar: totalPnl,
          profitFactor,
          mae: -mae,
          winPercent,
          returnLoss: totalLosses > 0 ? -totalLosses : 0,
          tradesCount: symbolTrades.length,
        };
      })
      .filter(stat => stat.tradesCount >= 1)
      .sort((a, b) => b.returnDollar - a.returnDollar)
      .slice(0, 10);

    return pairStats;
  }, [filteredTrades]);

  // Calculate comprehensive statistics
  const statistics = useMemo(() => {
    const closedTrades = filteredTrades.filter(t => t.status === TradeStatus.CLOSED);
    const openTrades = filteredTrades.filter(t => t.status === TradeStatus.OPEN);
    
    if (closedTrades.length === 0) {
      return {
        totalTrades: filteredTrades.length,
        totalPnL: 0,
        winRate: 0,
        totalWins: 0,
        totalLosses: 0,
        avgWin: 0,
        avgLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        profitFactor: 0,
        expectancy: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        avgHoldTime: 0,
        currentStreak: 0,
        longestWinStreak: 0,
        longestLossStreak: 0,
        totalCommissions: 0,
        netPnL: 0,
        riskRewardRatio: 0,
        openTrades: openTrades.length,
        totalVolume: 0
      };
    }

    const wins = closedTrades.filter(t => (t.profitOrLoss || 0) > 0);
    const losses = closedTrades.filter(t => (t.profitOrLoss || 0) < 0);
    
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
    const totalCommissions = closedTrades.reduce((sum, t) => sum + (t.commission || 0), 0);
    const totalWins = wins.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
    const totalLosses = Math.abs(losses.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0));
    
    const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
    const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;
    const largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.profitOrLoss || 0)) : 0;
    const largestLoss = losses.length > 0 ? Math.min(...losses.map(t => t.profitOrLoss || 0)) : 0;
    
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;
    const winRate = (wins.length / closedTrades.length) * 100;
    const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss;
    
    // Calculate streaks
    let currentStreak = 0;
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;
    
    for (let i = closedTrades.length - 1; i >= 0; i--) {
      const pnl = closedTrades[i].profitOrLoss || 0;
      if (i === closedTrades.length - 1) {
        currentStreak = pnl > 0 ? 1 : pnl < 0 ? -1 : 0;
      }
      
      if (pnl > 0) {
        tempWinStreak++;
        tempLossStreak = 0;
        longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
      } else if (pnl < 0) {
        tempLossStreak++;
        tempWinStreak = 0;
        longestLossStreak = Math.max(longestLossStreak, tempLossStreak);
      }
    }
    
    // Calculate average hold time
    const holdTimes = closedTrades
      .filter(t => t.entryDate && t.exitDate)
      .map(t => {
        const entry = new Date(t.entryDate!);
        const exit = new Date(t.exitDate!);
        return (exit.getTime() - entry.getTime()) / (1000 * 60 * 60); // hours
      });
    const avgHoldTime = holdTimes.length > 0 ? holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length : 0;
    
    // Calculate risk-reward ratio
    const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
    
    // Calculate total volume
    const totalVolume = closedTrades.reduce((sum, t) => sum + ((t.entryPrice || 0) * (t.quantity || 0)), 0);
    
    return {
      totalTrades: closedTrades.length,
      totalPnL,
      winRate,
      totalWins,
      totalLosses,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      profitFactor,
      expectancy,
      sharpeRatio: 0, // Would need more data for proper calculation
      maxDrawdown: 0, // Would need equity curve for proper calculation
      avgHoldTime,
      currentStreak,
      longestWinStreak,
      longestLossStreak,
      totalCommissions,
      netPnL: totalPnL - totalCommissions,
      riskRewardRatio,
      openTrades: openTrades.length,
      totalVolume
    };
  }, [filteredTrades]);

  const removeMetric = (metric: MetricType) => {
    setSelectedMetrics(prev => prev.filter(m => m !== metric));
  };

  const getMetricColor = (metric: MetricType): string => {
    switch (metric) {
      case 'pnl': return '#3B82F6'; // Blue
      case 'netPnl': return '#EC4899'; // Pink
      case 'mae': return '#10B981'; // Green/Teal
      default: return '#6B7280';
    }
  };

  const getMetricLabel = (metric: MetricType): string => {
    switch (metric) {
      case 'pnl': return 'P&L';
      case 'netPnl': return 'Net P&L';
      case 'mae': return 'MAE';
      default: return metric;
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading overview..." />;
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 dark:text-red-400">Error loading overview: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Performance Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Comprehensive analysis of your trading performance and metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-blue-500 dark:hover:bg-blue-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105">
            <FaFilter className="w-4 h-4" />
          </button>
          
          <button className="p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-green-500 dark:hover:bg-green-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105">
            <FaDownload className="w-4 h-4" />
          </button>
          
          <button className="p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-purple-500 dark:hover:bg-purple-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105">
            <FaChartLine className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Metrics Selection */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Metrics:</span>
            <div className="flex flex-wrap items-center gap-2">
              {selectedMetrics.map(metric => (
                <div key={metric} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100/80 dark:bg-gray-800/80 rounded-lg">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getMetricColor(metric) }}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {getMetricLabel(metric)}
                  </span>
                  <button 
                    onClick={() => removeMetric(metric)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button className="p-1.5 rounded-lg bg-gray-100/80 dark:bg-gray-800/80 hover:bg-blue-500 dark:hover:bg-blue-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200">
                <FaPlus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Time Range Buttons */}
          <div className="flex bg-gray-100/80 dark:bg-gray-800/80 p-1 rounded-xl">
            {(['7D', '1M', 'All', 'Custom'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  timeRange === range
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total P&L Card */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <FaCoins className="w-8 h-8 opacity-80" />
            <span className="text-green-100 text-sm font-medium">Total P&L</span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">${statistics.totalPnL.toFixed(2)}</p>
            <p className="text-green-100 text-sm">Net: ${statistics.netPnL.toFixed(2)}</p>
          </div>
        </div>

        {/* Win Rate Card */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <FaBullseye className="w-8 h-8 opacity-80" />
            <span className="text-blue-100 text-sm font-medium">Win Rate</span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">{statistics.winRate.toFixed(1)}%</p>
            <p className="text-blue-100 text-sm">{statistics.totalTrades} trades</p>
          </div>
        </div>

        {/* Profit Factor Card */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <FaBalanceScale className="w-8 h-8 opacity-80" />
            <span className="text-purple-100 text-sm font-medium">Profit Factor</span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">{statistics.profitFactor === 999 ? '∞' : statistics.profitFactor.toFixed(2)}</p>
            <p className="text-purple-100 text-sm">R:R {statistics.riskRewardRatio.toFixed(2)}</p>
          </div>
        </div>

        {/* Current Streak Card */}
        <div className={`bg-gradient-to-br ${statistics.currentStreak > 0 ? 'from-orange-500 to-red-500' : statistics.currentStreak < 0 ? 'from-red-500 to-pink-600' : 'from-gray-500 to-gray-600'} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
          <div className="flex items-center justify-between mb-4">
            <FaFire className="w-8 h-8 opacity-80" />
            <span className="text-white text-opacity-80 text-sm font-medium">Current Streak</span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">{Math.abs(statistics.currentStreak)}</p>
            <p className="text-white text-opacity-80 text-sm">{statistics.currentStreak > 0 ? 'Wins' : statistics.currentStreak < 0 ? 'Losses' : 'None'}</p>
          </div>
        </div>
      </div>

      {/* Advanced Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Metrics */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl">
              <FaChartBar className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Performance Metrics</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/80">
              <div className="flex items-center gap-3">
                <FaArrowUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Average Win</span>
              </div>
              <span className="font-bold text-green-600 dark:text-green-400">${statistics.avgWin.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/80">
              <div className="flex items-center gap-3">
                <FaArrowDown className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Average Loss</span>
              </div>
              <span className="font-bold text-red-600 dark:text-red-400">${statistics.avgLoss.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/80">
              <div className="flex items-center gap-3">
                <FaTrophy className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Largest Win</span>
              </div>
              <span className="font-bold text-green-600 dark:text-green-400">${statistics.largestWin.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/80">
              <div className="flex items-center gap-3">
                <FaExclamationTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Largest Loss</span>
              </div>
              <span className="font-bold text-red-600 dark:text-red-400">${Math.abs(statistics.largestLoss).toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/80">
              <div className="flex items-center gap-3">
                <FaBolt className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Expectancy</span>
              </div>
              <span className={`font-bold ${statistics.expectancy > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${statistics.expectancy.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Risk & Time Metrics */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl">
              <FaShieldAlt className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Risk & Time Analysis</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/80">
              <div className="flex items-center gap-3">
                <FaClock className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Hold Time</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">
                {statistics.avgHoldTime < 24 ? `${statistics.avgHoldTime.toFixed(1)}h` : `${(statistics.avgHoldTime / 24).toFixed(1)}d`}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/80">
              <div className="flex items-center gap-3">
                <FaEye className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Open Positions</span>
              </div>
              <span className="font-bold text-blue-600 dark:text-blue-400">{statistics.openTrades}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/80">
              <div className="flex items-center gap-3">
                <FaFire className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Longest Win Streak</span>
              </div>
              <span className="font-bold text-green-600 dark:text-green-400">{statistics.longestWinStreak}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/80">
              <div className="flex items-center gap-3">
                <FaExclamationTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Longest Loss Streak</span>
              </div>
              <span className="font-bold text-red-600 dark:text-red-400">{statistics.longestLossStreak}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/80">
              <div className="flex items-center gap-3">
                <FaPercentage className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Commissions</span>
              </div>
              <span className="font-bold text-orange-600 dark:text-orange-400">${statistics.totalCommissions.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-xl">
            <FaChartLine className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Performance Chart
          </h2>
        </div>
        
        <div className="h-96">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6B7280"
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#6B7280"
                  fontSize={12}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(229, 231, 235, 0.5)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, getMetricLabel(name as MetricType)]}
                />
                {selectedMetrics.includes('pnl') && (
                  <Line
                    type="monotone"
                    dataKey="pnl"
                    stroke={getMetricColor('pnl')}
                    strokeWidth={3}
                    dot={false}
                  />
                )}
                {selectedMetrics.includes('netPnl') && (
                  <Line
                    type="monotone"
                    dataKey="netPnl"
                    stroke={getMetricColor('netPnl')}
                    strokeWidth={3}
                    dot={false}
                  />
                )}
                {selectedMetrics.includes('mae') && (
                  <Line
                    type="monotone"
                    dataKey="mae"
                    stroke={getMetricColor('mae')}
                    strokeWidth={3}
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaChartLine className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Chart Data Available</h3>
                <p className="text-gray-600 dark:text-gray-400">Complete some trades to see your performance chart</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pairs Performance Table */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200/30 dark:border-gray-700/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl">
              <FaCalendarAlt className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Top Performing Pairs
            </h2>
          </div>
        </div>
        
        {pairsPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <tr className="border-b border-gray-200/30 dark:border-gray-700/30">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pairs
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Return $
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Profit Factor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    MAE
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Win %
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trades
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/30 dark:divide-gray-700/30">
                {pairsPerformance.map((pair) => (
                  <tr key={pair.symbol} className="group hover:bg-white/90 dark:hover:bg-gray-800/60 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {pair.symbol}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-bold ${
                        pair.returnDollar >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {pair.returnDollar >= 0 ? '+' : ''}${pair.returnDollar.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                      {pair.profitFactor === 999 ? '∞' : pair.profitFactor.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-red-600 dark:text-red-400">
                      ${Math.abs(pair.mae).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-semibold ${
                        pair.winPercent >= 50 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {pair.winPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {pair.tradesCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCalendarAlt className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Pairs Data Available</h3>
            <p className="text-gray-600 dark:text-gray-400">Complete some trades to see your pairs performance</p>
          </div>
        )}
      </div>
    </div>
  );
} 