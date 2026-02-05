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
  FaPenToSquare, 
  FaCloudArrowDown,
  FaArrowUp,
  FaArrowDown,
  FaDollarSign,
  FaChartLine,
  FaClock,
  FaBrain,
  FaTag,
  FaBullseye,
  FaCalendarDays,
  FaLayerGroup,
  FaMicrochip,
  FaTerminal
} from 'react-icons/fa6';

const DataPill: React.FC<{ label: string; value: string; icon?: React.ReactNode; color?: string }> = ({ label, value, icon, color = 'emerald' }) => (
  <div className="flex flex-col gap-1 px-4 border-r border-zinc-200 dark:border-white/5 last:border-0 min-w-[120px]">
    <span className="text-[10px] font-black text-zinc-500 dark:text-gray-500 uppercase tracking-widest">{label}</span>
    <div className="flex items-center gap-2">
      {icon && <span className={`text-${color}-500 w-3 h-3`}>{icon}</span>}
      <span className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">{value}</span>
    </div>
  </div>
);

const SidebarField: React.FC<{ label: string; value: React.ReactNode; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 space-y-2">
    <div className="flex items-center gap-2 text-zinc-500 dark:text-gray-500">
      <span className="w-4 h-4">{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    </div>
    <div className="text-sm font-bold text-zinc-900 dark:text-white pl-6">{value || <span className="text-zinc-400 dark:text-gray-600 italic">Unassigned</span>}</div>
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
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <FaTerminal className="w-12 h-12 text-emerald-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Accessing Database Records...</p>
        </div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 bg-red-500/5 rounded-[3rem]">
        <FaTerminal className="w-10 h-10 text-red-500 mb-6" />
        <h2 className="text-2xl font-black text-white mb-2">IO_EXCEPTION: READ_FAILED</h2>
        <p className="text-gray-400 mb-8 font-mono text-sm">{error || "The requested execution record could not be found."}</p>
        <Link href="/journal" className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all border border-white/10 uppercase text-xs tracking-widest">
          Return to Terminal
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20">
      {/* Workstation Header */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row items-stretch">
          {/* Symbol & Direction Banner */}
          <div className={`p-8 flex items-center gap-6 min-w-[350px] ${trade.direction === 'Long' ? 'bg-emerald-500/10 dark:bg-emerald-500/20' : 'bg-red-500/10 dark:bg-red-500/20'}`}>
            <div className={`p-5 rounded-3xl shadow-2xl ${trade.direction === 'Long' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
              {trade.direction === 'Long' ? <FaArrowUp className="w-8 h-8" /> : <FaArrowDown className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">{trade.symbol}</h1>
                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${trade.status === 'Closed' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-blue-500/20 text-blue-500'}`}>
                  {trade.status}
                </span>
              </div>
              <p className="text-zinc-500 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Professional Terminal V2.0</p>
            </div>
          </div>

          {/* Quick Stats Horizontal Strip */}
          <div className="flex-1 flex flex-wrap items-center p-8 border-l border-zinc-200 dark:border-white/5">
            <DataPill label="Total P&L" value={trade.profitOrLoss !== undefined ? `${trade.profitOrLoss > 0 ? '+' : ''}$${Math.abs(trade.profitOrLoss).toLocaleString()}` : '-'} color={trade.profitOrLoss >= 0 ? 'emerald' : 'red'} />
            <DataPill label="Return %" value={pnlPercentage !== null ? `${pnlPercentage > 0 ? '+' : ''}${pnlPercentage.toFixed(2)}%` : '-'} color={(pnlPercentage && pnlPercentage >= 0) ? 'emerald' : 'red'} />
            <DataPill label="R-Efficiency" value={trade.rMultiple ? `${trade.rMultiple.toFixed(2)}R` : '-'} icon={<FaChartLine />} />
            <DataPill label="Stop Threshold" value={formatPrice(trade.stopLoss)} icon={<FaBullseye />} color="red" />
            <DataPill label="Profit Target" value={formatPrice(trade.takeProfit)} icon={<FaBullseye />} color="emerald" />
          </div>
 
          {/* Action Bar */}
          <div className="p-8 flex items-center gap-3 border-l border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/2">
            <button onClick={() => window.print()} className="p-4 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-2xl border border-zinc-200 dark:border-white/5 transition-all transition-transform active:scale-95">
              <FaCloudArrowDown className="w-4 h-4 text-zinc-500 dark:text-gray-400" />
            </button>
            <Link href={`/journal/edit/${trade.id}`} className="flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95">
              <FaPenToSquare className="w-4 h-4" />
              <span className="text-[11px] uppercase tracking-widest">Edit Execution</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Terminal Split */}
      <div className="grid grid-cols-12 gap-6">
        {/* Workspace: 70% Chart */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-[#0A0A0A] p-1 border border-zinc-200 dark:border-white/5 rounded-[3rem] shadow-2xl relative">
            <div className="absolute top-8 left-8 z-10 flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-lg">
                <FaMicrochip className="w-3 h-3 text-emerald-500" />
              </div>
              <span className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-widest">Live Execution Stream</span>
            </div>
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

          {/* Tags & Concepts Overlay */}
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-zinc-200 dark:border-white/5 flex flex-wrap gap-3">
            <div className="flex items-center gap-3 mr-4">
              <FaTag className="w-4 h-4 text-zinc-400 dark:text-gray-500" />
              <span className="text-[10px] font-black text-zinc-400 dark:text-gray-500 uppercase tracking-widest">Metadata</span>
            </div>
            {trade.ictConcept && (
              <span className="px-4 py-2 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-[10px] font-black rounded-xl border border-indigo-500/10 dark:border-indigo-500/20 uppercase tracking-widest">{trade.ictConcept}</span>
            )}
            {trade.session && (
              <span className="px-4 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-xl border border-amber-500/10 dark:border-amber-500/20 uppercase tracking-widest">{trade.session}</span>
            )}
            {trade.tags?.map((tag: any, i: number) => (
              <span key={i} className="px-4 py-2 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-gray-400 text-[10px] font-black rounded-xl border border-zinc-200 dark:border-white/10 uppercase tracking-widest">{typeof tag === 'string' ? tag : tag.name}</span>
            ))}
          </div>

          {/* Psychology, Context & Environment Badges */}
          {(trade.emotionBefore || trade.emotionDuring || trade.emotionAfter || trade.confidenceLevel || trade.marketCondition || trade.timeframe || trade.sleepQuality) && (
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md p-4 rounded-[2rem] border border-zinc-200 dark:border-white/5 space-y-3">
              {/* Psychology Row */}
              {(trade.emotionBefore || trade.emotionDuring || trade.emotionAfter || trade.confidenceLevel || trade.followedPlan !== undefined || trade.executionGrade) && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm mr-2">🧠</span>
                  {trade.emotionBefore && (
                    <span className="px-2 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[9px] font-bold rounded-lg">Before: {trade.emotionBefore}</span>
                  )}
                  {trade.emotionDuring && (
                    <span className="px-2 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[9px] font-bold rounded-lg">During: {trade.emotionDuring}</span>
                  )}
                  {trade.emotionAfter && (
                    <span className="px-2 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[9px] font-bold rounded-lg">After: {trade.emotionAfter}</span>
                  )}
                  {trade.confidenceLevel && (
                    <span className="px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-bold rounded-lg">{'★'.repeat(trade.confidenceLevel)}{'☆'.repeat(5 - trade.confidenceLevel)}</span>
                  )}
                  {trade.followedPlan !== undefined && (
                    <span className={`px-2 py-1 text-[9px] font-bold rounded-lg ${trade.followedPlan ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                      {trade.followedPlan ? '✓ Plan' : '✗ Plan'}
                    </span>
                  )}
                  {trade.executionGrade && (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[9px] font-black rounded-lg">Grade {trade.executionGrade}</span>
                  )}
                </div>
              )}

              {/* Market Context Row */}
              {(trade.marketCondition || trade.timeframe || trade.htfBias || trade.newsImpact !== undefined) && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm mr-2">📊</span>
                  {trade.marketCondition && (
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-bold rounded-lg">{trade.marketCondition}</span>
                  )}
                  {trade.timeframe && (
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-bold rounded-lg">{trade.timeframe}</span>
                  )}
                  {trade.htfBias && (
                    <span className={`px-2 py-1 text-[9px] font-bold rounded-lg ${trade.htfBias === 'Bullish' ? 'bg-emerald-500/10 text-emerald-600' : trade.htfBias === 'Bearish' ? 'bg-red-500/10 text-red-600' : 'bg-gray-500/10 text-gray-600'}`}>
                      {trade.htfBias === 'Bullish' ? '🟢' : trade.htfBias === 'Bearish' ? '🔴' : '⚪'} {trade.htfBias}
                    </span>
                  )}
                  {trade.newsImpact !== undefined && (
                    <span className={`px-2 py-1 text-[9px] font-bold rounded-lg ${trade.newsImpact ? 'bg-orange-500/10 text-orange-600' : 'bg-gray-500/10 text-gray-500'}`}>
                      {trade.newsImpact ? '📰 News' : 'No News'}
                    </span>
                  )}
                  {trade.plannedRR && (
                    <span className="px-2 py-1 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[9px] font-bold rounded-lg">R:R {trade.plannedRR}</span>
                  )}
                </div>
              )}

              {/* Environment Row */}
              {(trade.sleepQuality || trade.energyLevel || trade.distractionLevel || trade.tradingEnvironment) && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm mr-2">🏠</span>
                  {trade.sleepQuality && (
                    <span className="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 text-[9px] font-bold rounded-lg">😴 {trade.sleepQuality}/5</span>
                  )}
                  {trade.energyLevel && (
                    <span className="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 text-[9px] font-bold rounded-lg">⚡ {trade.energyLevel}/5</span>
                  )}
                  {trade.distractionLevel && (
                    <span className="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 text-[9px] font-bold rounded-lg">🎯 {6 - trade.distractionLevel}/5</span>
                  )}
                  {trade.tradingEnvironment && (
                    <span className="px-2 py-1 bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[9px] font-bold rounded-lg">📍 {trade.tradingEnvironment}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Workspace: 30% Desk Metadata */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-[3rem] p-8 space-y-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <FaTerminal className="w-4 h-4 text-emerald-500" />
              <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">Trading Desk</h3>
            </div>
 
            <div className="space-y-4">
              <SidebarField label="Account Instance" value={trade.account?.name || trade.accountName} icon={<FaLayerGroup />} />
              <SidebarField label="Asset Category" value={trade.assetType} icon={<FaBullseye />} />
              <SidebarField label="Entry Execution" value={`${formatPrice(trade.entryPrice)} @ ${formatDateFns(new Date(trade.entryDate), 'MMM dd, HH:mm')}`} icon={<FaClock />} />
              <SidebarField label="Exit Execution" value={trade.exitDate ? `${formatPrice(trade.exitPrice)} @ ${formatDateFns(new Date(trade.exitDate), 'MMM dd, HH:mm')}` : 'Position In Progress'} icon={<FaClock />} />
              <SidebarField label="Volume Units" value={trade.quantity?.toLocaleString()} icon={<FaDollarSign />} />
              {trade.externalId && <SidebarField label="Position ID" value={trade.externalId} icon={<FaTerminal />} />}
            </div>
 
            {/* Micro Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4">
               <div className="p-5 bg-zinc-50 dark:bg-white/2 border border-zinc-100 dark:border-white/5 rounded-3xl">
                 <p className="text-[9px] font-black text-zinc-400 dark:text-gray-500 uppercase tracking-widest mb-1">R:R Performance</p>
                 <p className="text-xl font-black text-zinc-900 dark:text-white">{trade.rMultiple ? trade.rMultiple.toFixed(2) : '-'}R</p>
               </div>
               <div className="p-5 bg-zinc-50 dark:bg-white/2 border border-zinc-100 dark:border-white/5 rounded-3xl">
                 <p className="text-[9px] font-black text-zinc-400 dark:text-gray-500 uppercase tracking-widest mb-1">Risk Status</p>
                 <p className={`text-xl font-black ${trade.profitOrLoss >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{trade.profitOrLoss >= 0 ? 'Secured' : 'Stopped'}</p>
               </div>
               {trade.commission !== undefined && (
                 <div className="p-5 bg-zinc-50 dark:bg-white/2 border border-zinc-100 dark:border-white/5 rounded-3xl">
                   <p className="text-[9px] font-black text-zinc-400 dark:text-gray-500 uppercase tracking-widest mb-1">Commission</p>
                   <p className="text-xl font-black text-zinc-900 dark:text-white">${trade.commission.toFixed(2)}</p>
                 </div>
               )}
               {trade.swap !== undefined && (
                 <div className="p-5 bg-zinc-50 dark:bg-white/2 border border-zinc-100 dark:border-white/5 rounded-3xl">
                   <p className="text-[9px] font-black text-zinc-400 dark:text-gray-500 uppercase tracking-widest mb-1">Swap</p>
                   <p className="text-xl font-black text-zinc-900 dark:text-white">${trade.swap.toFixed(2)}</p>
                 </div>
               )}
               {trade.marginUsed !== undefined && (
                 <div className="p-5 bg-zinc-50 dark:bg-white/2 border border-zinc-100 dark:border-white/5 rounded-3xl">
                   <p className="text-[9px] font-black text-zinc-400 dark:text-gray-500 uppercase tracking-widest mb-1">Margin Used</p>
                   <p className="text-xl font-black text-zinc-900 dark:text-white">${trade.marginUsed.toFixed(2)}</p>
                 </div>
               )}
            </div>
          </div>

          <Link href="/journal" className="flex items-center justify-center gap-3 p-6 bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white font-black rounded-3xl border border-zinc-200 dark:border-white/5 transition-all text-xs uppercase tracking-widest">
            <FaArrowLeft className="w-3 h-3" />
            Back to Journal
          </Link>
        </div>
      </div>

      {/* Analysis Workspace (Bottom) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-[3rem] p-10 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
              <FaBrain className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Strategic Thesis</h3>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black text-zinc-400 dark:text-gray-500 uppercase tracking-widest mb-3">Primary Analysis / Setup Notes</p>
              <div className="bg-zinc-50 dark:bg-white/2 p-6 rounded-2xl border border-zinc-100 dark:border-white/5">
                <p className="text-zinc-700 dark:text-gray-300 text-sm leading-relaxed font-medium whitespace-pre-wrap">{trade.notes || "No thesis provided."}</p>
              </div>
            </div>
            {trade.setupDetails && (
              <div>
                <p className="text-[10px] font-black text-zinc-400 dark:text-gray-500 uppercase tracking-widest mb-3">Configuration & Precision Details</p>
                <div className="bg-zinc-50 dark:bg-white/2 p-6 rounded-2xl border border-zinc-100 dark:border-white/5">
                  <p className="text-zinc-700 dark:text-gray-300 text-sm leading-relaxed font-medium italic whitespace-pre-wrap">{trade.setupDetails}</p>
                </div>
              </div>
            )}
          </div>
        </div>
 
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-[3rem] p-10 space-y-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
              <FaMicrochip className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Post-Execution Audit</h3>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black text-zinc-400 dark:text-gray-500 uppercase tracking-widest mb-3">Execution Mistakes & Anomalies</p>
              <div className="bg-red-500/5 p-6 rounded-2xl border border-red-500/10">
                <p className="text-red-900/60 dark:text-gray-400 text-sm leading-relaxed font-medium italic whitespace-pre-wrap">{trade.mistakesMade || "Zero anomalies detected in execution."}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 dark:text-gray-500 uppercase tracking-widest mb-3">Permanent Learning Outcome</p>
              <div className="bg-zinc-50 dark:bg-white/2 p-6 rounded-2xl border border-zinc-100 dark:border-white/5">
                <p className="text-zinc-700 dark:text-gray-300 text-sm leading-relaxed font-medium whitespace-pre-wrap">{trade.lessonsLearned || "Standard operational procedure confirmed."}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}