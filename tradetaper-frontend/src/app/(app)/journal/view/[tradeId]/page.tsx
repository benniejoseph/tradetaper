// src/app/(app)/journal/view/[tradeId]/page.tsx - Compact Redesign with Lucide Icons
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
  ArrowLeft,
  Edit3,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Clock,
  Brain,
  Tag,
  Target,
  Calendar,
  Layers,
  Cpu,
  Terminal,
  Home,
  Zap,
  Moon,
  CheckCircle,
  XCircle,
  Newspaper,
  MapPin,
  Star,
  AlertCircle,
  Loader2
} from 'lucide-react';

const DataPill: React.FC<{ label: string; value: string; icon?: React.ReactNode; color?: string }> = ({ label, value, icon, color = 'emerald' }) => (
  <div className="flex flex-col gap-1 px-4 border-r border-zinc-200 dark:border-white/5 last:border-0 min-w-[100px]">
    <span className="text-[9px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">{label}</span>
    <div className="flex items-center gap-1.5">
      {icon && <span className={`text-${color}-500 w-3 h-3`}>{icon}</span>}
      <span className="text-sm font-bold text-zinc-900 dark:text-white">{value}</span>
    </div>
  </div>
);

const SidebarField: React.FC<{ label: string; value: React.ReactNode; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 space-y-1">
    <div className="flex items-center gap-2 text-zinc-400 dark:text-gray-500">
      <span className="w-3 h-3">{icon}</span>
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-sm font-semibold text-zinc-900 dark:text-white pl-5">{value || <span className="text-zinc-400 dark:text-gray-600 italic text-xs">—</span>}</div>
  </div>
);

export default function ViewTradePage() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams();
  const tradeId = params.tradeId as string;

  const { currentTrade: trade, isLoading, error } = useSelector((state: RootState) => state.trades);

  useEffect(() => {
    if (tradeId) dispatch(fetchTradeById(tradeId));
  }, [dispatch, tradeId]);

  const pnlPercentage = useMemo(() => {
    if (!trade?.entryPrice || !trade?.quantity || !trade?.profitOrLoss) return null;
    return (trade.profitOrLoss / (trade.entryPrice * trade.quantity)) * 100;
  }, [trade]);

  const formatPrice = (price?: number) => price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 }) || '—';

  // Safe date formatting helper
  const formatTradeDate = (dateValue: any): string | null => {
    if (!dateValue || dateValue === 'undefined' || dateValue === 'null') return null;
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return null;
      return formatDateFns(date, 'MMM dd, HH:mm');
    } catch {
      return null;
    }
  };

  if (isLoading && !trade) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">Loading trade data...</p>
        </div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Trade Not Found</h2>
        <p className="text-gray-500 mb-6 text-sm">{error || "The requested trade could not be loaded."}</p>
        <Link href="/journal" className="px-4 py-2 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-all">
          Back to Journal
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 pb-12">
      {/* Compact Header */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="flex flex-col lg:flex-row items-stretch">
          {/* Symbol Banner */}
          <div className={`p-6 flex items-center gap-4 min-w-[280px] ${trade.direction === 'Long' ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
            <div className={`p-3 rounded-xl shadow-lg ${trade.direction === 'Long' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
              {trade.direction === 'Long' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{trade.symbol}</h1>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${trade.status === 'Closed' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600'}`}>
                  {trade.status}
                </span>
              </div>
              <p className="text-zinc-500 dark:text-gray-500 text-xs font-medium mt-0.5">{trade.direction} • {trade.assetType}</p>
            </div>
          </div>

          {/* Stats Strip */}
          <div className="flex-1 flex flex-wrap items-center p-4 border-l border-zinc-200 dark:border-white/5">
            <DataPill label="P&L" value={trade.profitOrLoss !== undefined ? `${trade.profitOrLoss > 0 ? '+' : ''}$${Math.abs(trade.profitOrLoss).toFixed(2)}` : '—'} color={trade.profitOrLoss >= 0 ? 'emerald' : 'red'} />
            <DataPill label="Return" value={pnlPercentage !== null ? `${pnlPercentage > 0 ? '+' : ''}${pnlPercentage.toFixed(1)}%` : '—'} color={(pnlPercentage && pnlPercentage >= 0) ? 'emerald' : 'red'} />
            <DataPill label="R:R" value={trade.rMultiple ? `${trade.rMultiple.toFixed(1)}R` : '—'} icon={<BarChart3 className="w-3 h-3" />} />
            <DataPill label="SL" value={formatPrice(trade.stopLoss)} icon={<Target className="w-3 h-3" />} color="red" />
            <DataPill label="TP" value={formatPrice(trade.takeProfit)} icon={<Target className="w-3 h-3" />} color="emerald" />
          </div>

          {/* Actions */}
          <div className="p-4 flex items-center gap-2 border-l border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
            <button onClick={() => window.print()} className="p-3 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl border border-zinc-200 dark:border-white/5 transition-all">
              <Download className="w-4 h-4 text-zinc-500" />
            </button>
            <Link href={`/journal/edit/${trade.id}`} className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all">
              <Edit3 className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Edit</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* Chart Area */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-[#0A0A0A] p-1 border border-zinc-200 dark:border-white/5 rounded-2xl shadow-xl relative">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                <Cpu className="w-3 h-3 text-emerald-500" />
              </div>
              <span className="text-[9px] font-bold text-zinc-600 dark:text-gray-400 uppercase tracking-wider">Chart</span>
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

          {/* Tags & Metadata */}
          <div className="bg-white/80 dark:bg-white/[0.02] backdrop-blur-md p-4 rounded-xl border border-zinc-200 dark:border-white/5 flex flex-wrap gap-2 items-center">
            <Tag className="w-3.5 h-3.5 text-zinc-400 mr-1" />
            {trade.ictConcept && (
              <span className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-lg">{trade.ictConcept}</span>
            )}
            {trade.session && (
              <span className="px-3 py-1.5 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg">{trade.session}</span>
            )}
            {trade.tags?.map((tag: any, i: number) => (
              <span key={i} className="px-3 py-1.5 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-gray-400 text-[10px] font-bold rounded-lg">{typeof tag === 'string' ? tag : tag.name}</span>
            ))}
          </div>

          {/* Psychology/Market/Environment Grid */}
          <div className="bg-white/80 dark:bg-white/[0.02] backdrop-blur-md p-5 rounded-xl border border-zinc-200 dark:border-white/5 space-y-6">
            
            {/* Psychology */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Psychology</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="px-3 py-1.5 bg-zinc-50 dark:bg-white/5 rounded-lg border border-zinc-100 dark:border-white/5">
                  <span className="text-[9px] text-zinc-400 block mb-0.5 uppercase">Before</span>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-gray-300">{trade.emotionBefore || "—"}</span>
                </div>
                <div className="px-3 py-1.5 bg-zinc-50 dark:bg-white/5 rounded-lg border border-zinc-100 dark:border-white/5">
                  <span className="text-[9px] text-zinc-400 block mb-0.5 uppercase">During</span>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-gray-300">{trade.emotionDuring || "—"}</span>
                </div>
                <div className="px-3 py-1.5 bg-zinc-50 dark:bg-white/5 rounded-lg border border-zinc-100 dark:border-white/5">
                  <span className="text-[9px] text-zinc-400 block mb-0.5 uppercase">After</span>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-gray-300">{trade.emotionAfter || "—"}</span>
                </div>
                <div className="px-3 py-1.5 bg-zinc-50 dark:bg-white/5 rounded-lg border border-zinc-100 dark:border-white/5">
                  <span className="text-[9px] text-zinc-400 block mb-0.5 uppercase">Confidence</span>
                  <div className="flex items-center gap-0.5 h-[18px]">
                    {trade.confidenceLevel ? (
                      [...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-2.5 h-2.5 ${i < trade.confidenceLevel! ? 'fill-amber-400 text-amber-400' : 'text-zinc-200 dark:text-zinc-700'}`} />
                      ))
                    ) : <span className="text-xs text-zinc-300">—</span>}
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-zinc-50 dark:bg-white/5 rounded-lg border border-zinc-100 dark:border-white/5">
                  <span className="text-[9px] text-zinc-400 block mb-0.5 uppercase">Followed Plan</span>
                  {trade.followedPlan !== undefined ? (
                    <span className={`text-xs font-bold flex items-center gap-1 ${trade.followedPlan ? 'text-emerald-500' : 'text-red-500'}`}>
                      {trade.followedPlan ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} {trade.followedPlan ? 'Yes' : 'No'}
                    </span>
                  ) : <span className="text-xs text-zinc-300">—</span>}
                </div>
                <div className="px-3 py-1.5 bg-zinc-50 dark:bg-white/5 rounded-lg border border-zinc-100 dark:border-white/5">
                  <span className="text-[9px] text-zinc-400 block mb-0.5 uppercase">Execution</span>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-gray-300">{trade.executionGrade ? `Grade ${trade.executionGrade}` : "—"}</span>
                </div>
              </div>
            </div>

            {/* Market Context */}
            <div className="pt-4 border-t border-dashed border-zinc-200 dark:border-white/5 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                <span className="text[10px] font-bold text-zinc-400 uppercase tracking-wider">Market Context</span>
              </div>
              <div className="flex flex-wrap gap-3">
                 <div className="px-3 py-1.5 bg-zinc-50 dark:bg-white/5 rounded-lg border border-zinc-100 dark:border-white/5">
                  <span className="text-[9px] text-zinc-400 block mb-0.5 uppercase">Condition</span>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-gray-300">{trade.marketCondition || "—"}</span>
                </div>
                <div className="px-3 py-1.5 bg-zinc-50 dark:bg-white/5 rounded-lg border border-zinc-100 dark:border-white/5">
                  <span className="text-[9px] text-zinc-400 block mb-0.5 uppercase">Timeframe</span>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-gray-300">{trade.timeframe || "—"}</span>
                </div>
                <div className="px-3 py-1.5 bg-zinc-50 dark:bg-white/5 rounded-lg border border-zinc-100 dark:border-white/5">
                  <span className="text-[9px] text-zinc-400 block mb-0.5 uppercase">HTF Bias</span>
                  <span className={`text-xs font-bold ${trade.htfBias === 'Bullish' ? 'text-emerald-500' : trade.htfBias === 'Bearish' ? 'text-red-500' : 'text-zinc-500'}`}>{trade.htfBias || "—"}</span>
                </div>
                <div className="px-3 py-1.5 bg-zinc-50 dark:bg-white/5 rounded-lg border border-zinc-100 dark:border-white/5">
                  <span className="text-[9px] text-zinc-400 block mb-0.5 uppercase">News</span>
                  <span className={`text-xs font-bold ${trade.newsImpact ? 'text-orange-500' : 'text-zinc-300'}`}>{trade.newsImpact ? 'Impact' : trade.newsImpact === false ? 'None' : "—"}</span>
                </div>
                <div className="px-3 py-1.5 bg-zinc-50 dark:bg-white/5 rounded-lg border border-zinc-100 dark:border-white/5">
                  <span className="text-[9px] text-zinc-400 block mb-0.5 uppercase">Planned R:R</span>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-gray-300">{trade.plannedRR ? `${trade.plannedRR}R` : "—"}</span>
                </div>
              </div>
            </div>

            {/* Environment */}
            <div className="pt-4 border-t border-dashed border-zinc-200 dark:border-white/5 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Home className="w-3.5 h-3.5 text-green-500" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Environment</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="px-3 py-1.5 bg-zinc-50 dark:bg-white/5 rounded-lg border border-zinc-100 dark:border-white/5">
                  <span className="text-[9px] text-zinc-400 block mb-0.5 uppercase">Sleep</span>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-gray-300 flex items-center gap-1">
                    {trade.sleepQuality ? <>{trade.sleepQuality}/5 <Moon className="w-2.5 h-2.5" /></> : "—"}
                  </span>
                </div>
                <div className="px-3 py-1.5 bg-zinc-50 dark:bg-white/5 rounded-lg border border-zinc-100 dark:border-white/5">
                  <span className="text-[9px] text-zinc-400 block mb-0.5 uppercase">Energy</span>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-gray-300 flex items-center gap-1">
                     {trade.energyLevel ? <>{trade.energyLevel}/5 <Zap className="w-2.5 h-2.5" /></> : "—"}
                  </span>
                </div>
                <div className="px-3 py-1.5 bg-zinc-50 dark:bg-white/5 rounded-lg border border-zinc-100 dark:border-white/5">
                  <span className="text-[9px] text-zinc-400 block mb-0.5 uppercase">Focus</span>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-gray-300 flex items-center gap-1">
                    {trade.distractionLevel ? <>{6 - trade.distractionLevel}/5 <Target className="w-2.5 h-2.5" /></> : "—"}
                  </span>
                </div>
                <div className="px-3 py-1.5 bg-zinc-50 dark:bg-white/5 rounded-lg border border-zinc-100 dark:border-white/5">
                  <span className="text-[9px] text-zinc-400 block mb-0.5 uppercase">Location</span>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-gray-300 flex items-center gap-1">
                    {trade.tradingEnvironment || "—"} <MapPin className="w-2.5 h-2.5 opacity-50" />
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <Terminal className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Trade Details</h3>
            </div>

            <div className="space-y-2">
              <SidebarField label="Account" value={trade.account?.name || trade.accountName} icon={<Layers className="w-3 h-3" />} />
              <SidebarField label="Strategy" value={(trade as any).strategy?.name || (trade as any).strategyId || "Manual"} icon={<Brain className="w-3 h-3" />} />
              <SidebarField label="Asset" value={trade.assetType} icon={<Target className="w-3 h-3" />} />
              <SidebarField 
                label="Entry" 
                value={(() => {
                  const dateStr = formatTradeDate(trade.entryDate);
                  return dateStr ? `${formatPrice(trade.entryPrice)} @ ${dateStr}` : formatPrice(trade.entryPrice);
                })()} 
                icon={<Clock className="w-3 h-3" />} 
              />
              <SidebarField 
                label="Exit" 
                value={(() => {
                  const dateStr = formatTradeDate(trade.exitDate);
                  if (dateStr) return `${formatPrice(trade.exitPrice)} @ ${dateStr}`;
                  if (trade.exitPrice) return formatPrice(trade.exitPrice);
                  return 'Open';
                })()} 
                icon={<Clock className="w-3 h-3" />} 
              />
              <SidebarField label="Quantity" value={trade.quantity?.toLocaleString()} icon={<DollarSign className="w-3 h-3" />} />
              {trade.externalId && <SidebarField label="Position ID" value={trade.externalId} icon={<Terminal className="w-3 h-3" />} />}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="p-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5 rounded-xl">
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">R:R</p>
                <p className="text-lg font-black text-zinc-900 dark:text-white">{trade.rMultiple ? trade.rMultiple.toFixed(1) : '—'}R</p>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5 rounded-xl">
                <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Status</p>
                <p className={`text-lg font-black ${trade.profitOrLoss >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{trade.profitOrLoss >= 0 ? 'Win' : 'Loss'}</p>
              </div>
              {trade.commission !== undefined && (
                <div className="p-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5 rounded-xl">
                  <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Commission</p>
                  <p className="text-lg font-black text-zinc-900 dark:text-white">${trade.commission.toFixed(2)}</p>
                </div>
              )}
              {trade.swap !== undefined && (
                <div className="p-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5 rounded-xl">
                  <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Swap</p>
                  <p className="text-lg font-black text-zinc-900 dark:text-white">${trade.swap.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>

          <Link href="/journal" className="flex items-center justify-center gap-2 p-4 bg-zinc-50 dark:bg-white/[0.02] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white font-bold rounded-xl border border-zinc-200 dark:border-white/5 transition-all text-xs uppercase tracking-wider">
            <ArrowLeft className="w-3 h-3" />
            Back to Journal
          </Link>
        </div>
      </div>

      {/* Uploaded Chart Snapshot */}
      {trade.imageUrl && (
         <div className="col-span-12">
            <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 rounded-lg text-indigo-500">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Snippet Snapshot</h3>
                </div>
                <div className="rounded-xl overflow-hidden border border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20">
                    <img src={trade.imageUrl} alt="Trade Snapshot" className="max-h-[500px] w-full object-contain" />
                </div>
            </div>
         </div>
      )}

      {/* Notes Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg text-emerald-500">
              <Brain className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Analysis</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Entry Reason</p>
              <div className="bg-zinc-50 dark:bg-white/[0.02] p-4 rounded-xl border border-zinc-100 dark:border-white/5">
                <p className="text-zinc-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{trade.entryReason || "No entry reason recorded."}</p>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Notes</p>
              <div className="bg-zinc-50 dark:bg-white/[0.02] p-4 rounded-xl border border-zinc-100 dark:border-white/5">
                <p className="text-zinc-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{trade.notes || "No notes."}</p>
              </div>
            </div>
            {trade.setupDetails && (
              <div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Setup Details</p>
                <div className="bg-zinc-50 dark:bg-white/[0.02] p-4 rounded-xl border border-zinc-100 dark:border-white/5">
                  <p className="text-zinc-700 dark:text-gray-300 text-sm leading-relaxed italic whitespace-pre-wrap">{trade.setupDetails}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-lg text-red-500">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Post-Trade Review</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Mistakes</p>
              <div className="bg-red-50 dark:bg-red-500/5 p-4 rounded-xl border border-red-100 dark:border-red-500/10">
                <p className="text-red-800/70 dark:text-gray-400 text-sm leading-relaxed italic whitespace-pre-wrap">{trade.mistakesMade || "None recorded."}</p>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Lessons Learned</p>
              <div className="bg-zinc-50 dark:bg-white/[0.02] p-4 rounded-xl border border-zinc-100 dark:border-white/5">
                <p className="text-zinc-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{trade.lessonsLearned || "None recorded."}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}