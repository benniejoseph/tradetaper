"use client";
import React, { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTradeById } from '@/store/features/tradesSlice';
import Link from 'next/link';
import TradeCandleChart from '@/components/charts/TradeCandleChart';
import { format as formatDateFns } from 'date-fns';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaDownload,
  FaArrowUp,
  FaArrowDown,
  FaDollarSign,
  FaChartLine,
  FaClock,
  FaBrain,
  FaTag,
  FaBullseye,
  FaCalendarAlt
} from 'react-icons/fa';

const MetricCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  subValue?: string;
}> = ({ label, value, icon, trend, subValue }) => (
  <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-gray-200/50 dark:border-white/5 hover:border-emerald-500/30 transition-all duration-300 group shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        {icon && <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">{icon}</div>}
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</span>
      </div>
      {trend && (
        <div className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
          trend === 'up' ? 'bg-emerald-500/20 text-emerald-500' :
          trend === 'down' ? 'bg-red-500/20 text-red-500' :
          'bg-gray-500/20 text-gray-500'
        }`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </div>
      )}
    </div>
    <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">{value}</div>
    {subValue && <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 font-bold uppercase tracking-wider">{subValue}</div>}
  </div>
);

export default function ViewTradePage() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams();
  const tradeId = params.tradeId as string;

  const { currentTrade: trade, isLoading, error } = useSelector((state: RootState) => state.trades);

  useEffect(() => {
    if (tradeId) {
        dispatch(fetchTradeById(tradeId));
    }
  }, [dispatch, tradeId]);

  const pnlPercentage = useMemo(() => {
    if (!trade?.entryPrice || !trade?.quantity || !trade?.profitOrLoss) return null;
    return (trade.profitOrLoss / (trade.entryPrice * trade.quantity)) * 100;
  }, [trade]);

  const formatPrice = (price?: number) => price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 }) || '-';

  if (isLoading && !trade) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Syncing Performance Data</p>
        </div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="p-6 bg-red-500/10 rounded-full mb-6">
          <FaArrowLeft className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Trade Synchronisation Error</h2>
        <p className="text-gray-400 mb-8 max-w-md">{error || "The requested execution record could not be found."}</p>
        <Link href="/journal" className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all">
          Return to Terminal
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
          <Link href="/journal" className="inline-flex items-center gap-2 text-gray-500 hover:text-emerald-500 transition-colors group">
            <div className="p-2 bg-white/5 rounded-xl group-hover:bg-emerald-500/10 transition-colors">
              <FaArrowLeft className="w-3 h-3" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Journal</span>
          </Link>
          <div className="flex items-center gap-6">
            <div className={`p-6 rounded-[2rem] shadow-2xl ${trade.direction === 'Long' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-500/20' : 'bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/20'}`}>
              {trade.direction === 'Long' ? <FaArrowUp className="w-10 h-10 text-white" /> : <FaArrowDown className="w-10 h-10 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-6xl font-black text-white tracking-tighter leading-none">{trade.symbol}</h1>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${trade.status === 'Closed' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-blue-500/20 text-blue-500'}`}>
                  {trade.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-gray-500">
                 <div className="flex items-center gap-2">
                   <FaCalendarAlt className="w-3 h-3" />
                   <span className="text-[11px] font-bold uppercase tracking-wider">{formatDateFns(new Date(trade.entryDate), 'MMM dd, yyyy · HH:mm')}</span>
                 </div>
                 <div className="h-1 w-1 rounded-full bg-gray-700" />
                 <div className="flex items-center gap-2">
                   <FaBullseye className="w-3 h-3" />
                   <span className="text-[11px] font-bold uppercase tracking-wider">{trade.assetType} · {trade.direction}</span>
                 </div>
                 {trade.accountName && (
                   <>
                     <div className="h-1 w-1 rounded-full bg-gray-700" />
                     <div className="flex items-center gap-2">
                       <FaChartLine className="w-3 h-3" />
                       <span className="text-[11px] font-bold uppercase tracking-wider">{trade.accountName}</span>
                     </div>
                   </>
                 )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => window.print()} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all">
            <FaDownload className="w-4 h-4 text-gray-400" />
          </button>
          <Link href={`/journal/edit/${trade.id}`} className="flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 transition-all">
            <FaEdit className="w-4 h-4" />
            <span className="text-[11px] uppercase tracking-widest">Modify Record</span>
          </Link>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column - Metrics */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* P&L Hero Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 p-10 rounded-[3rem] shadow-2xl shadow-emerald-500/20 group">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 transition-transform duration-700">
              <FaDollarSign className="w-40 h-40 -mr-16 -mt-16 rotate-12" />
            </div>
            <div className="relative z-10">
              <p className="text-emerald-100/70 text-[10px] font-black uppercase tracking-[0.4em] mb-6">Total Net Performance</p>
              <div className="flex flex-wrap items-baseline gap-6 max-w-full">
                <span 
                  className="font-black text-white tracking-tighter leading-none"
                  style={{ fontSize: 'clamp(2.5rem, 10vw, 4.5rem)' }}
                >
                  {trade.profitOrLoss !== undefined && trade.profitOrLoss !== null ? 
                    `${trade.profitOrLoss > 0 ? '+' : ''}$${Math.abs(trade.profitOrLoss).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 
                    '-'
                  }
                </span>
                {pnlPercentage !== null && (
                  <span className="text-xl font-bold text-emerald-200 bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md">
                    {pnlPercentage > 0 ? '+' : ''}{pnlPercentage.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Grid Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard 
              label="Execution Volume" 
              icon={<FaDollarSign />} 
              value={trade.entryPrice && trade.quantity ? `$${(trade.entryPrice * trade.quantity).toLocaleString(undefined, {maximumFractionDigits:0})}` : '-'} 
              subValue={`${trade.quantity?.toLocaleString()} Units`}
            />
            <MetricCard 
              label="Efficiency" 
              icon={<FaChartLine />} 
              value={trade.rMultiple ? `${trade.rMultiple.toFixed(2)}R` : '-'} 
              trend={trade.rMultiple && trade.rMultiple > 2 ? 'up' : 'neutral'}
            />
            <MetricCard 
              label="Risk Threshold" 
              icon={<FaBullseye className="text-red-500" />} 
              value={trade.stopLoss ? formatPrice(trade.stopLoss) : '-'} 
              subValue="Stop Loss"
            />
            <MetricCard 
              label="Objective" 
              icon={<FaBullseye className="text-emerald-500" />} 
              value={trade.takeProfit ? formatPrice(trade.takeProfit) : '-'} 
              subValue="Take Profit"
            />
          </div>

          {/* Execution Timeline */}
          <div className="bg-[#0A0A0A] p-8 rounded-[3rem] border border-white/5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/5 rounded-2xl text-gray-400">
                <FaClock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">Execution Timeline</h3>
            </div>
            
            <div className="space-y-6 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-gradient-to-b before:from-blue-500 before:via-purple-500 before:to-emerald-500">
              <div className="relative pl-12">
                <div className="absolute left-3 top-1.5 w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Entry Execution</p>
                <div className="flex justify-between items-end">
                  <p className="font-black text-white text-lg leading-none">{formatPrice(trade.entryPrice)}</p>
                  <p className="text-[11px] font-bold text-gray-500">{formatDateFns(new Date(trade.entryDate), 'HH:mm:ss')}</p>
                </div>
              </div>
              {trade.exitDate && (
                <div className="relative pl-12">
                  <div className="absolute left-3 top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Exit Execution</p>
                  <div className="flex justify-between items-end">
                    <p className="font-black text-white text-lg leading-none">{formatPrice(trade.exitPrice)}</p>
                    <p className="text-[11px] font-bold text-gray-500">{formatDateFns(new Date(trade.exitDate), 'HH:mm:ss')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Chart and Journal */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Enhanced Chart Component */}
          <div className="p-1 bg-[#0A0A0A] rounded-[3.5rem] border border-white/5 shadow-2xl overflow-hidden">
             <TradeCandleChart 
               tradeId={trade.id} 
               symbol={trade.symbol} 
               entryPrice={trade.entryPrice}
               exitPrice={trade.exitPrice}
               entryDate={trade.entryDate}
               exitDate={trade.exitDate}
               direction={trade.direction as 'Long' | 'Short'}
               stopLoss={trade.stopLoss}
               takeProfit={trade.takeProfit}
             />
          </div>

          {/* Tags & Concepts Section */}
          <div className="flex flex-wrap gap-3">
            {trade.ictConcept && (
              <div className="px-6 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-3">
                <FaBrain className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">{trade.ictConcept}</span>
              </div>
            )}
            {trade.tradingSession && (
              <div className="px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                <FaClock className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest">{trade.tradingSession}</span>
              </div>
            )}
            {trade.tags && trade.tags.map((tag: string, i: number) => (
              <div key={i} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                <FaTag className="w-3 h-3 text-gray-500" />
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{tag}</span>
              </div>
            ))}
          </div>

          {/* Journal Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#0A0A0A] p-10 rounded-[3rem] border border-white/5 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                  <FaEdit className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Trade Context</h3>
              </div>
              <div className="space-y-4">
                <div>
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 leading-none">Primary Thesis</p>
                   <p className="text-gray-300 text-sm leading-relaxed font-medium">{trade.notes || "No context provided."}</p>
                </div>
                {trade.setupDetails && (
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 leading-none">Setup Details</p>
                    <p className="text-gray-300 text-sm leading-relaxed font-medium">{trade.setupDetails}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#0A0A0A] p-10 rounded-[3rem] border border-white/5 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
                  <FaBrain className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Retrospective</h3>
              </div>
              <div className="space-y-4">
                <div>
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 leading-none">Mistakes Made</p>
                   <p className="text-gray-300 text-sm leading-relaxed font-medium italic">{trade.mistakesMade || "Disciplined execution."}</p>
                </div>
                <div>
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2 leading-none">Key Learning</p>
                   <p className="text-gray-300 text-sm leading-relaxed font-medium">{trade.lessonsLearned || "Standard protocol followed."}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}