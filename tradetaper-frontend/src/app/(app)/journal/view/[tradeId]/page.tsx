"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTradeById } from '@/store/features/tradesSlice';
import Link from 'next/link';
import TradingViewChart from '@/components/market-intelligence/TradingViewChart';
import { format as formatDateFns, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { TradeDirection, TradeStatus } from '@/types/trade';
import { addDays, subDays } from 'date-fns';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaCopy,
  FaDownload,
  FaArrowUp,
  FaArrowDown,
  FaCalculator,
  FaPercentage,
  FaExchangeAlt,
  FaChartLine
} from 'react-icons/fa';



export default function ViewTradePage() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams();
  const tradeId = params.tradeId as string;

  const { currentTrade, isLoading: tradeIsLoading, error: tradeError } = useSelector((state: RootState) => state.trades);


  useEffect(() => {
    if (tradeId) {
        dispatch(fetchTradeById(tradeId));
    }
  }, [dispatch, tradeId]);

  // Calculate additional metrics
  const tradeDuration = useMemo(() => {
    if (!currentTrade?.entryDate) return null;
    const entry = new Date(currentTrade.entryDate);
    const exit = currentTrade.exitDate ? new Date(currentTrade.exitDate) : new Date();
    
    const minutes = differenceInMinutes(exit, entry);
    const hours = differenceInHours(exit, entry);
    const days = differenceInDays(exit, entry);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  }, [currentTrade]);

  const mfeMae = useMemo(() => {
    // Mock calculation - in real app, this would be calculated from price data
    if (!currentTrade?.entryPrice) return { mfe: 0, mae: 0 };
    
    // Mock values based on current P&L - replace with actual calculation
    const pnl = currentTrade.profitOrLoss || 0;
    const mfe = Math.abs(pnl) * 1.2; // Mock favorable excursion
    const mae = Math.abs(pnl) * 0.3; // Mock adverse excursion
    
    return { mfe, mae };
  }, [currentTrade]);

  const riskRewardRatio = useMemo(() => {
    if (!currentTrade?.entryPrice || !currentTrade?.stopLoss || !currentTrade?.takeProfit) return null;
    
    const risk = Math.abs(currentTrade.entryPrice - currentTrade.stopLoss);
    const reward = Math.abs(currentTrade.takeProfit - currentTrade.entryPrice);
    
    return reward / risk;
  }, [currentTrade]);

  if (tradeIsLoading && !currentTrade) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white">Loading trade details...</div>
        </div>
      </div>
    );
  }

  if (tradeError && !currentTrade) {
    return (
      <div className="space-y-8">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaArrowLeft className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Trade</h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{tradeError}</p>
          <Link href="/journal" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg">
            <FaArrowLeft className="mr-2" />
            Back to Journal
          </Link>
        </div>
      </div>
    );
  }

  if (!currentTrade) {
    return (
      <div className="space-y-8">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaArrowLeft className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Trade Not Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The trade you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/journal" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg">
            <FaArrowLeft className="mr-2" />
            Back to Journal
          </Link>
        </div>
      </div>
    );
  }

  const profitOrLoss = currentTrade.profitOrLoss || 0;
  const pnlColor = profitOrLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const directionIcon = currentTrade.direction === TradeDirection.LONG ? FaArrowUp : FaArrowDown;

  const pnlPercentage = currentTrade.entryPrice && currentTrade.quantity 
    ? (profitOrLoss / (currentTrade.entryPrice * currentTrade.quantity)) * 100 
    : 0;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center space-x-6">
          <Link
            href="/journal"
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-xl hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100 dark:hover:from-emerald-950/20 dark:hover:to-emerald-900/20"
          >
            <FaArrowLeft className="h-4 w-4" />
            <span>Back to Journal</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl shadow-lg ${currentTrade.direction === TradeDirection.LONG ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
              {React.createElement(directionIcon, { className: `h-6 w-6 text-white` })}
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                {currentTrade.symbol}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {currentTrade.direction} • {currentTrade.assetType}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* P&L Display */}
          <div className="text-right">
            <div className={`text-3xl font-bold ${pnlColor}`}>
              {profitOrLoss >= 0 ? '+' : ''}${Math.abs(profitOrLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-sm font-medium ${pnlColor}`}>
              {pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 hover:bg-emerald-500 dark:hover:bg-emerald-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105"
              title="Copy link"
            >
              <FaCopy className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => window.print()}
              className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 hover:bg-emerald-500 dark:hover:bg-emerald-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105"
              title="Export"
            >
              <FaDownload className="h-4 w-4" />
            </button>
            
            <Link
              href={`/journal/edit/${tradeId}`}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <FaEdit className="h-4 w-4" />
              <span>Edit Trade</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-lg ${
            currentTrade.status === TradeStatus.CLOSED 
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
              : currentTrade.status === TradeStatus.OPEN
              ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white'
              : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white'
          }`}>
            {currentTrade.status}
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span>Opened: {formatDateFns(new Date(currentTrade.entryDate), 'MMM dd, yyyy HH:mm')}</span>
            {currentTrade.exitDate && (
              <span className="ml-4">Closed: {formatDateFns(new Date(currentTrade.exitDate), 'MMM dd, yyyy HH:mm')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 shadow-lg">
        {/* Chart Header */}
        <div className="p-6 border-b border-emerald-200/30 dark:border-emerald-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-xl">
                <FaChartLine className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Price Chart - {currentTrade.symbol}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Interactive price analysis for trade execution
                </p>
              </div>
            </div>
            

          </div>
        </div>

        {/* Chart */}
        <div className="p-6">
          <div className="h-[700px] w-full rounded-xl overflow-hidden border-2 border-gray-700">
            <TradingViewChart 
              symbol={currentTrade.symbol || 'XAUUSD'}
              interval="60"
              theme="dark"
              height={700}
            />
          </div>
        </div>
      </div>

      {/* Trade Details Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-6 lg:grid-cols-4 gap-6">
        {/* Trade Execution Details */}
        <div className="xl:col-span-2 lg:col-span-2">
          <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-xl">
                <FaExchangeAlt className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Trade Execution
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Entry and exit details
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-emerald-50/50 to-white/50 dark:from-emerald-950/10 dark:to-emerald-900/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/30 dark:border-emerald-700/30 hover:from-emerald-100/60 hover:to-emerald-50/60 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 transition-all duration-200">
                <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">ENTRY PRICE</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  ${currentTrade.entryPrice?.toLocaleString() || 'N/A'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {formatDateFns(new Date(currentTrade.entryDate), 'MMM dd, yyyy HH:mm')}
                </div>
              </div>
              
              {currentTrade.exitPrice && (
                <div className="bg-gradient-to-br from-emerald-50/50 to-white/50 dark:from-emerald-950/10 dark:to-emerald-900/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/30 dark:border-emerald-700/30 hover:from-emerald-100/60 hover:to-emerald-50/60 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 transition-all duration-200">
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">EXIT PRICE</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    ${currentTrade.exitPrice.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {currentTrade.exitDate ? formatDateFns(new Date(currentTrade.exitDate), 'MMM dd, yyyy HH:mm') : 'N/A'}
                  </div>
                </div>
              )}
              
              <div className="bg-gradient-to-br from-emerald-50/50 to-white/50 dark:from-emerald-950/10 dark:to-emerald-900/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/30 dark:border-emerald-700/30 hover:from-emerald-100/60 hover:to-emerald-50/60 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 transition-all duration-200">
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">QUANTITY</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {currentTrade.quantity?.toLocaleString() || 'N/A'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {currentTrade.assetType || 'Units'}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-50/50 to-white/50 dark:from-emerald-950/10 dark:to-emerald-900/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/30 dark:border-emerald-700/30 hover:from-emerald-100/60 hover:to-emerald-50/60 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 transition-all duration-200">
                <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1">DURATION</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {tradeDuration || 'N/A'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {currentTrade.status}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Management */}
        <div className="xl:col-span-2 lg:col-span-2">
          <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl">
                <FaCalculator className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Risk Management
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Stop loss and take profit analysis
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              {currentTrade.stopLoss && (
                <div className="bg-gradient-to-br from-emerald-50/50 to-white/50 dark:from-emerald-950/10 dark:to-emerald-900/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/30 dark:border-emerald-700/30 hover:from-emerald-100/60 hover:to-emerald-50/60 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 transition-all duration-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">STOP LOSS</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        ${currentTrade.stopLoss.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600 dark:text-gray-400">Risk Amount</div>
                      <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                        ${currentTrade.entryPrice && currentTrade.quantity 
                          ? (Math.abs(currentTrade.entryPrice - currentTrade.stopLoss) * currentTrade.quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {currentTrade.takeProfit && (
                <div className="bg-gradient-to-br from-emerald-50/50 to-white/50 dark:from-emerald-950/10 dark:to-emerald-900/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/30 dark:border-emerald-700/30 hover:from-emerald-100/60 hover:to-emerald-50/60 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 transition-all duration-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">TAKE PROFIT</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        ${currentTrade.takeProfit.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600 dark:text-gray-400">Reward Amount</div>
                      <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                        ${currentTrade.entryPrice && currentTrade.quantity 
                          ? (Math.abs(currentTrade.takeProfit - currentTrade.entryPrice) * currentTrade.quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {riskRewardRatio && (
                <div className="bg-gradient-to-br from-emerald-50/50 to-white/50 dark:from-emerald-950/10 dark:to-emerald-900/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/30 dark:border-emerald-700/30 hover:from-emerald-100/60 hover:to-emerald-50/60 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 transition-all duration-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">RISK:REWARD</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        1:{riskRewardRatio.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                        riskRewardRatio >= 2 
                          ? 'bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : riskRewardRatio >= 1
                          ? 'bg-yellow-100/80 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {riskRewardRatio >= 2 ? 'Excellent' : riskRewardRatio >= 1 ? 'Good' : 'Poor'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="xl:col-span-2">
          <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-emerald-600/20 to-emerald-700/20 rounded-xl">
                <FaPercentage className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Performance
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  MFE, MAE, and R-Multiple analysis
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-50/50 to-white/50 dark:from-emerald-950/10 dark:to-emerald-900/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/30 dark:border-emerald-700/30 hover:from-emerald-100/60 hover:to-emerald-50/60 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 transition-all duration-200">
                <div className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">MFE (MAX FAVORABLE)</div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  +${mfeMae.mfe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="w-full bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-950/30 dark:to-emerald-900/30 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((mfeMae.mfe / Math.abs(profitOrLoss || 1)) * 50, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-50/50 to-white/50 dark:from-emerald-950/10 dark:to-emerald-900/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/30 dark:border-emerald-700/30 hover:from-emerald-100/60 hover:to-emerald-50/60 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 transition-all duration-200">
                <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">MAE (MAX ADVERSE)</div>
                <div className="text-xl font-bold text-red-600 dark:text-red-400">
                  -${mfeMae.mae.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="w-full bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-950/30 dark:to-emerald-900/30 rounded-full h-2 mt-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((mfeMae.mae / Math.abs(profitOrLoss || 1)) * 50, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {currentTrade.rMultiple && (
                <div className="bg-gradient-to-br from-emerald-50/50 to-white/50 dark:from-emerald-950/10 dark:to-emerald-900/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/30 dark:border-emerald-700/30 hover:from-emerald-100/60 hover:to-emerald-50/60 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20 transition-all duration-200">
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">R-MULTIPLE</div>
                  <div className={`text-xl font-bold ${currentTrade.rMultiple >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {currentTrade.rMultiple.toFixed(2)}R
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {currentTrade.rMultiple >= 1 ? 'Profitable' : 'Loss'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional sections can be added here following the same pattern */}
      
      {/* Chart Image */}
      {currentTrade.imageUrl && (
        <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-xl">
              <FaChartLine className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Trade Chart
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chart analysis and setup visualization
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50/50 to-white/50 dark:from-emerald-950/10 dark:to-emerald-900/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-200/30 dark:border-emerald-700/30">
            <div className="relative w-full rounded-xl overflow-hidden shadow-lg">
              <img
                src={currentTrade.imageUrl}
                alt={`${currentTrade.symbol} trade chart`}
                className="w-full h-auto max-h-[600px] object-contain hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() => window.open(currentTrade.imageUrl, '_blank')}
                onError={(e) => {
                  console.error('Image failed to load in journal view:', currentTrade.imageUrl);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                onLoad={() => console.log('Image loaded successfully in journal view:', currentTrade.imageUrl)}
              />
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => window.open(currentTrade.imageUrl, '_blank')}
                  className="px-3 py-2 bg-black/50 hover:bg-black/70 text-white text-sm font-medium rounded-lg backdrop-blur-sm transition-all duration-200"
                >
                  View Full Size
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trading Notes */}
      {currentTrade.notes && (
        <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-slate-500/20 to-gray-500/20 rounded-xl">
              <FaEdit className="h-6 w-6 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Trade Notes
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Personal observations and analysis
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50/50 to-white/50 dark:from-emerald-950/10 dark:to-emerald-900/10 backdrop-blur-sm rounded-xl p-6 border border-emerald-200/30 dark:border-emerald-700/30">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {currentTrade.notes}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Setup Details */}
      {currentTrade.setupDetails && (
        <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-emerald-700/20 to-emerald-800/20 rounded-xl">
              <FaChartLine className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Setup Details
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Trade setup and analysis
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50/50 to-white/50 dark:from-emerald-950/10 dark:to-emerald-900/10 backdrop-blur-sm rounded-xl p-6 border border-emerald-200/30 dark:border-emerald-700/30">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {currentTrade.setupDetails}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mistakes Made */}
      {currentTrade.mistakesMade && (
        <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl">
              <FaEdit className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Mistakes Made
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Areas for improvement
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50/50 to-white/50 dark:from-emerald-950/10 dark:to-emerald-900/10 backdrop-blur-sm rounded-xl p-6 border border-emerald-200/30 dark:border-emerald-700/30">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {currentTrade.mistakesMade}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lessons Learned */}
      {currentTrade.lessonsLearned && (
        <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-xl">
              <FaEdit className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Lessons Learned
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Key takeaways and insights
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50/50 to-white/50 dark:from-emerald-950/10 dark:to-emerald-900/10 backdrop-blur-sm rounded-xl p-6 border border-emerald-200/30 dark:border-emerald-700/30">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {currentTrade.lessonsLearned}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}