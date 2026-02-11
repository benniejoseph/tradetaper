"use client";
import React, { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

// Reusable Components
const DataPill: React.FC<{ label: string; value: string; icon?: React.ReactNode; color?: string }> = ({ label, value, icon, color = 'emerald' }) => (
  <div className="flex flex-col gap-1 px-4 border-r border-zinc-200 dark:border-white/5 last:border-0 min-w-[100px]">
    <span className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">{label}</span>
    <div className="flex items-center gap-1.5">
      {icon && <span className={`text-${color}-500 w-3.5 h-3.5`}>{icon}</span>}
      <span className={`text-base font-bold ${color === 'red' ? 'text-red-500' : color === 'emerald' ? 'text-emerald-500' : 'text-zinc-900 dark:text-white'}`}>{value}</span>
    </div>
  </div>
);

const DetailItem: React.FC<{ label: string; value: React.ReactNode; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5">
    <div className="mt-0.5 text-zinc-400 dark:text-gray-500">
      {icon}
    </div>
    <div>
      <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">{label}</h4>
      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{value || <span className="text-zinc-400 italic">—</span>}</div>
    </div>
  </div>
);

const SectionHeader: React.FC<{ title: string; icon: React.ReactNode; color?: string }> = ({ title, icon, color = "emerald" }) => (
  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-100 dark:border-white/5">
    <div className={`p-1.5 rounded-lg bg-${color}-50 dark:bg-${color}-500/10 text-${color}-500`}>
      {icon}
    </div>
    <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight">{title}</h3>
  </div>
);

export default function ViewTradePage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
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

  const formatTradeDate = (dateValue: any): string | null => {
    if (!dateValue || dateValue === 'undefined' || dateValue === 'null') return null;
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return null;
      return formatDateFns(date, 'MMM dd, yyyy HH:mm');
    } catch {
      return null;
    }
  };

  if (isLoading && !trade) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-zinc-500 text-sm font-medium">Loading trade details...</p>
        </div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Trade Not Found</h2>
          <p className="text-zinc-500 mb-6 text-sm">{error || "The requested trade could not be loaded."}</p>
          <Link href="/journal" className="px-5 py-2.5 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
            Back to Journal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-20">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Link href="/journal" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors group">
              <div className="p-2 bg-white dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/5 group-hover:border-zinc-300 dark:group-hover:border-white/10 transition-colors shadow-sm">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm">Back to Journal</span>
            </Link>

            <div className="flex items-center gap-3">
               <button onClick={() => window.print()} className="p-2.5 bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-300 rounded-xl border border-zinc-200 dark:border-white/5 transition-all shadow-sm">
                  <Download className="w-4 h-4" />
               </button>
               <Link href={`/journal/edit/${trade.id}`} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 text-zinc-900 dark:text-white font-semibold rounded-xl border border-zinc-200 dark:border-white/5 transition-all shadow-sm">
                  <Edit3 className="w-4 h-4" />
                  <span className="text-sm">Edit Trade</span>
               </Link>
            </div>
        </div>

        {/* Title & Key Stats Card */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
           <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Symbol & Base Info */}
              <div className="flex items-center gap-4">
                 <div className={`p-4 rounded-2xl shadow-lg flex items-center justify-center ${trade.direction === 'Long' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-red-500 text-white shadow-red-500/20'}`}>
                    {trade.direction === 'Long' ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
                 </div>
                 <div>
                    <div className="flex items-center gap-3 mb-1">
                       <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{trade.symbol}</h1>
                       <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${trade.status === 'Closed' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-500/20' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-500/20'}`}>
                          {trade.status}
                       </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                       <span className={trade.direction === 'Long' ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}>{trade.direction}</span>
                       <span>•</span>
                       <span>{trade.assetType}</span>
                       <span>•</span>
                       <span>{formatTradeDate(trade.entryDate)}</span>
                    </div>
                 </div>
              </div>

              {/* Stats Grid */}
              <div className="flex flex-wrap items-center gap-y-4 p-4 bg-zinc-50 dark:bg-white/[0.02] rounded-xl border border-zinc-100 dark:border-white/5">
                  <DataPill label="Net P&L" value={trade.profitOrLoss !== undefined ? `${trade.profitOrLoss > 0 ? '+' : ''}$${Math.abs(trade.profitOrLoss).toFixed(2)}` : '—'} color={trade.profitOrLoss >= 0 ? 'emerald' : 'red'} />
                  <DataPill label="Return %" value={pnlPercentage !== null ? `${pnlPercentage > 0 ? '+' : ''}${pnlPercentage.toFixed(2)}%` : '—'} color={(pnlPercentage && pnlPercentage >= 0) ? 'emerald' : 'red'} />
                  <DataPill label="R Multiple" value={trade.rMultiple ? `${trade.rMultiple.toFixed(2)}R` : '—'} icon={<BarChart3 className="w-3.5 h-3.5" />} color="blue" />
                  <DataPill label="Risk Amount" value={trade.riskAmount ? `$${trade.riskAmount}` : '—'} icon={<AlertCircle className="w-3.5 h-3.5" />} color="orange" />
              </div>
           </div>
        </div>

        {/* Full Width Chart Section */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl p-1 shadow-md h-[600px]">
           <div className="h-full w-full rounded-xl overflow-hidden relative">
              <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 flex items-center gap-2">
                 <BarChart3 className="w-3.5 h-3.5 text-zinc-500" />
                 <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">Price Action</span>
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
        </div>

        {/* Chart Snapshot (if available) */}
        {trade.imageUrl && (
           <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
             <SectionHeader title="Chart Snapshot" icon={<Newspaper className="w-4 h-4" />} color="indigo" />
             <div className="border border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20 rounded-xl overflow-hidden">
                <img src={trade.imageUrl} alt="Trade Snapshot" className="max-h-[600px] w-full object-contain" />
             </div>
           </div>
        )}

        {/* Detailed Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           
           {/* Left Column: Analysis & Context (8 cols) */}
           <div className="lg:col-span-8 space-y-6">
              
              {/* Analysis Card */}
              <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                 <SectionHeader title="Trade Analysis" icon={<Brain className="w-4 h-4" />} color="purple" />
                 
                 <div className="space-y-6">
                    <div>
                       <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Entry Reasoning & Context</h4>
                       <div className="bg-zinc-50 dark:bg-white/[0.02] p-5 rounded-xl border border-zinc-100 dark:border-white/5 text-zinc-800 dark:text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
                          {trade.entryReason || <span className="text-zinc-400 italic">No entry analysis provided.</span>}
                       </div>
                    </div>
                    {/* Setup & Notes removed from here to reduce clutter if needed, but keeping them as is */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Setup Details</h4>
                          <div className="bg-zinc-50 dark:bg-white/[0.02] p-4 rounded-xl border border-zinc-100 dark:border-white/5 text-zinc-800 dark:text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap h-full">
                             {trade.setupDetails || <span className="text-zinc-400 italic">No setup details.</span>}
                          </div>
                       </div>
                       <div>
                          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Additional Notes</h4>
                          <div className="bg-zinc-50 dark:bg-white/[0.02] p-4 rounded-xl border border-zinc-100 dark:border-white/5 text-zinc-800 dark:text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap h-full">
                             {trade.notes || <span className="text-zinc-400 italic">No additional notes.</span>}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Review Card */}
              <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                 <SectionHeader title="Post-Trade Review" icon={<CheckCircle className="w-4 h-4" />} color="blue" />
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <div className="flex items-center gap-2 mb-2 text-red-500">
                          <XCircle className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">Mistakes Made</h4>
                       </div>
                       <div className="bg-red-50 dark:bg-red-500/5 p-4 rounded-xl border border-red-100 dark:border-red-500/10 text-red-900/80 dark:text-red-200/80 text-sm leading-relaxed">
                          {trade.mistakesMade || <span className="text-zinc-400 opacity-50 italic">None recorded. Good job!</span>}
                       </div>
                    </div>
                    <div>
                       <div className="flex items-center gap-2 mb-2 text-emerald-500">
                          <CheckCircle className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">Lessons Learned</h4>
                       </div>
                       <div className="bg-emerald-50 dark:bg-emerald-500/5 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/10 text-emerald-900/80 dark:text-emerald-200/80 text-sm leading-relaxed">
                          {trade.lessonsLearned || <span className="text-zinc-400 opacity-50 italic">None recorded.</span>}
                       </div>
                    </div>
                 </div>
              </div>

              {/* Context & Mindset - Moved Here, Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 
                 {/* Market Context */}
                 <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-sm h-full">
                    <SectionHeader title="Market Context" icon={<BarChart3 className="w-4 h-4" />} color="blue" />
                    <div className="space-y-3">
                       <DetailItem label="Session" value={trade.session} icon={<Clock className="w-4 h-4" />} />
                       <DetailItem label="Timeframe" value={trade.timeframe} icon={<Clock className="w-4 h-4" />} />
                       <DetailItem label="Market Condition" value={trade.marketCondition} icon={<TrendingUp className="w-4 h-4" />} />
                       <DetailItem label="HTF Bias" value={trade.htfBias} icon={<Target className="w-4 h-4" />} />
                    </div>
                    {/* Tags */}
                    {trade.tags && trade.tags.length > 0 && (
                       <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/5">
                          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                             {trade.tags.map((tag: any, i: number) => (
                                <span key={i} className="px-2.5 py-1 bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1">
                                   <Tag className="w-3 h-3" />
                                   {typeof tag === 'string' ? tag : tag.name}
                                </span>
                             ))}
                          </div>
                       </div>
                    )}
                 </div>

                 {/* Mindset & Psychology */}
                 <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-sm h-full">
                    <SectionHeader title="Mindset" icon={<Brain className="w-4 h-4" />} color="amber" />
                    
                    <div className="grid grid-cols-3 gap-2 mb-4">
                       <div className="text-center p-2 bg-zinc-50 dark:bg-white/[0.02] rounded-lg">
                          <span className="block text-[9px] uppercase text-zinc-400 font-bold mb-1">Alertness</span>
                          <span className="font-black text-lg text-emerald-500">{trade.energyLevel || '-'}/5</span>
                       </div>
                       <div className="text-center p-2 bg-zinc-50 dark:bg-white/[0.02] rounded-lg">
                          <span className="block text-[9px] uppercase text-zinc-400 font-bold mb-1">Focus</span>
                          <span className="font-black text-lg text-blue-500">{trade.distractionLevel ? 6 - trade.distractionLevel : '-'}/5</span>
                       </div>
                       <div className="text-center p-2 bg-zinc-50 dark:bg-white/[0.02] rounded-lg">
                          <span className="block text-[9px] uppercase text-zinc-400 font-bold mb-1">Conf.</span>
                          <span className="font-black text-lg text-amber-500">{trade.confidenceLevel || '-'}/5</span>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <DetailItem label="Before" value={trade.emotionBefore} icon={<Clock className="w-4 h-4" />} />
                       <DetailItem label="During" value={trade.emotionDuring} icon={<Clock className="w-4 h-4" />} />
                       <DetailItem label="After" value={trade.emotionAfter} icon={<Clock className="w-4 h-4" />} />
                       <div className="pt-2 border-t border-zinc-100 dark:border-white/5">
                           <div className="flex justify-between items-center p-2 bg-zinc-50 dark:bg-white/[0.02] rounded-xl border border-zinc-100 dark:border-white/5">
                              <span className="text-xs font-bold text-zinc-500 uppercase">Followed Plan?</span>
                              {trade.followedPlan !== undefined ? (
                                   <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold ${trade.followedPlan ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'}`}>
                                      {trade.followedPlan ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                      {trade.followedPlan ? 'YES' : 'NO'}
                                   </span>
                              ) : <span className="text-sm">—</span>}
                           </div>
                       </div>
                    </div>
                 </div>

              </div>

           </div>

           {/* Right Column: Details & Stats (4 cols) */}
           <div className="lg:col-span-4 space-y-6">
              
              {/* Execution Details - Only item remaining here */}
              <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-sm sticky top-6">
                 <SectionHeader title="Execution Details" icon={<Terminal className="w-4 h-4" />} color="zinc" />
                 <div className="space-y-3">
                    <DetailItem label="Account" value={trade.account?.name || trade.accountName} icon={<Layers className="w-4 h-4" />} />
                    <DetailItem label="Strategy" value={(trade as any).strategy?.name || (trade as any).strategyId} icon={<Brain className="w-4 h-4" />} />
                    <DetailItem label="Entry Price" value={formatPrice(trade.entryPrice)} icon={<DollarSign className="w-4 h-4" />} />
                    <DetailItem label="Exit Price" value={trade.exitPrice ? formatPrice(trade.exitPrice) : 'Open'} icon={<DollarSign className="w-4 h-4" />} />
                    <DetailItem label="Stop Loss" value={<span className="text-red-500 font-bold">{formatPrice(trade.stopLoss)}</span>} icon={<Target className="w-4 h-4" />} />
                    <DetailItem label="Take Profit" value={<span className="text-emerald-500 font-bold">{formatPrice(trade.takeProfit)}</span>} icon={<Target className="w-4 h-4" />} />
                    <DetailItem label="Quantity" value={trade.quantity?.toLocaleString()} icon={<Layers className="w-4 h-4" />} />
                    <div className="grid grid-cols-2 gap-3 mt-2">
                       <div className="p-3 bg-zinc-50 dark:bg-white/[0.02] rounded-xl border border-zinc-100 dark:border-white/5">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase">Comm.</span>
                          <p className="font-mono text-sm">${trade.commission?.toFixed(2) || '0.00'}</p>
                       </div>
                       <div className="p-3 bg-zinc-50 dark:bg-white/[0.02] rounded-xl border border-zinc-100 dark:border-white/5">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase">Swap</span>
                          <p className="font-mono text-sm">${trade.swap?.toFixed(2) || '0.00'}</p>
                       </div>
                    </div>
                 </div>
              </div>
              
           </div>
        </div>

      </div>
    </div>
  );
}