"use client";
import React, { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTradeById } from '@/store/features/tradesSlice';
import Link from 'next/link';
import TradeCandleChart from '@/components/charts/TradeCandleChart';
import { format as formatDateFns, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { 
  ArrowLeft, Edit3, Download, TrendingUp, TrendingDown, DollarSign,
  BarChart3, Clock, Brain, Tag, Target, Calendar, Layers, Terminal,
  CheckCircle, XCircle, Newspaper, Star, AlertCircle, Loader2,
  Shield, Eye, Zap, Moon, Activity, Crosshair, MessageSquare, Flame, ChevronDown
} from 'lucide-react';

// ────────────────────────────────────────────────
// Reusable Components
// ────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string; value: React.ReactNode; icon: React.ReactNode;
  color?: string; large?: boolean;
}> = ({ label, value, icon, color = 'emerald', large }) => (
  <div className={`flex flex-col gap-1 p-3 bg-zinc-50 dark:bg-white/[0.02] rounded-xl border border-zinc-100 dark:border-white/5 ${large ? 'col-span-2' : ''}`}>
    <div className="flex items-center gap-1.5">
      <span className={`text-${color}-500 w-3.5 h-3.5 shrink-0`}>{icon}</span>
      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{label}</span>
    </div>
    <span className="text-sm font-bold text-zinc-900 dark:text-white">{value || <span className="text-zinc-400 italic font-normal">—</span>}</span>
  </div>
);

const SectionCard: React.FC<{
  title: string; icon: React.ReactNode; color?: string; children: React.ReactNode;
}> = ({ title, icon, color = 'emerald', children }) => (
  <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-100 dark:border-white/5">
      <div className={`p-1.5 rounded-lg bg-${color}-50 dark:bg-${color}-500/10 text-${color}-500`}>{icon}</div>
      <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight">{title}</h3>
    </div>
    {children}
  </div>
);

const TextBlock: React.FC<{
  label: string; content?: string; color?: string;
}> = ({ label, content, color }) => (
  <div>
    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{label}</h4>
    <div className={`${color ? `bg-${color}-50 dark:bg-${color}-500/10 border-${color}-100 dark:border-${color}-500/20 text-${color}-900 dark:text-${color}-100 font-medium` : 'bg-zinc-50 dark:bg-white/[0.02] border-zinc-100 dark:border-white/5 text-zinc-800 dark:text-zinc-100'} p-4 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap`}>
      {content || <span className="text-zinc-400 italic">Not recorded</span>}
    </div>
  </div>
);

const RatingBar: React.FC<{ label: string; value?: number; max: number; color: string }> = ({ label, value, max, color }) => (
  <div className="flex items-center gap-3">
    <span className="text-[10px] font-bold text-zinc-400 uppercase w-20 shrink-0">{label}</span>
    <div className="flex-1 flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className={`h-2 flex-1 rounded-full ${i < (value || 0) ? `bg-${color}-500` : 'bg-zinc-200 dark:bg-white/10'}`} />
      ))}
    </div>
    <span className="text-xs font-bold text-zinc-500 w-8 text-right">{value || '—'}/{max}</span>
  </div>
);

// ────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────

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

  const holdTime = useMemo(() => {
    if (!trade?.entryDate || !trade?.exitDate) return null;
    try {
      const entry = new Date(trade.entryDate);
      const exit = new Date(trade.exitDate);
      if (isNaN(entry.getTime()) || isNaN(exit.getTime())) return null;
      const mins = differenceInMinutes(exit, entry);
      if (mins < 60) return `${mins}m`;
      const hrs = differenceInHours(exit, entry);
      if (hrs < 24) return `${hrs}h ${mins % 60}m`;
      const days = differenceInDays(exit, entry);
      return `${days}d ${hrs % 24}h`;
    } catch { return null; }
  }, [trade]);

  const formatPrice = (price?: number) =>
    price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 }) || '—';

  const formatDate = (dateValue: any): string | null => {
    if (!dateValue || dateValue === 'undefined' || dateValue === 'null') return null;
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return null;
      return formatDateFns(date, 'MMM dd, yyyy HH:mm');
    } catch { return null; }
  };

  if (isLoading && !trade) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-zinc-500 text-sm font-medium">Loading trade details...</p>
        </div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
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

  const isWin = (trade.profitOrLoss ?? 0) >= 0;

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4 space-y-4">
      
      {/* ═══ NAV & ACTIONS ═══ */}
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
          <Link href={`/journal/edit/${trade.id}`} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20">
            <Edit3 className="w-4 h-4" />
            <span className="text-sm">Edit Trade</span>
          </Link>
        </div>
      </div>

      {/* ═══ HERO: Symbol + Key Stats ═══ */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
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
                {trade.isStarred && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                <span className={trade.direction === 'Long' ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}>{trade.direction}</span>
                <span>•</span>
                <span>{trade.assetType}</span>
                {holdTime && <><span>•</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{holdTime}</span></>}
              </div>
            </div>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full lg:w-auto">
            <div className={`p-3 rounded-xl border text-center ${isWin ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'}`}>
              <span className="text-[9px] font-bold text-zinc-400 uppercase block">Net P&L</span>
              <span className={`text-xl font-black ${isWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {trade.profitOrLoss !== undefined ? `${trade.profitOrLoss > 0 ? '+' : ''}$${Math.abs(trade.profitOrLoss).toFixed(2)}` : '—'}
              </span>
            </div>
            <div className="p-3 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.02] text-center">
              <span className="text-[9px] font-bold text-zinc-400 uppercase block">R Multiple</span>
              <span className="text-xl font-black text-zinc-900 dark:text-white">{trade.rMultiple ? `${trade.rMultiple.toFixed(2)}R` : '—'}</span>
            </div>
            <div className="p-3 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.02] text-center">
              <span className="text-[9px] font-bold text-zinc-400 uppercase block">Return %</span>
              <span className={`text-xl font-black ${pnlPercentage && pnlPercentage >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {pnlPercentage !== null ? `${pnlPercentage > 0 ? '+' : ''}${pnlPercentage.toFixed(2)}%` : '—'}
              </span>
            </div>
            <div className="p-3 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/[0.02] text-center">
              <span className="text-[9px] font-bold text-zinc-400 uppercase block">Planned R:R</span>
              <span className="text-xl font-black text-zinc-900 dark:text-white">{trade.plannedRR ? `${trade.plannedRR.toFixed(1)}R` : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ EXECUTION DETAILS STRIP ═══ */}
      <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <StatCard label="Entry Price" value={formatPrice(trade.entryPrice)} icon={<DollarSign className="w-3.5 h-3.5" />} color="emerald" />
          <StatCard label="Exit Price" value={trade.exitPrice ? formatPrice(trade.exitPrice) : 'Open'} icon={<DollarSign className="w-3.5 h-3.5" />} color="blue" />
          <StatCard label="Stop Loss" value={<span className="text-red-500">{formatPrice(trade.stopLoss)}</span>} icon={<Target className="w-3.5 h-3.5" />} color="red" />
          <StatCard label="Take Profit" value={<span className="text-emerald-500">{formatPrice(trade.takeProfit)}</span>} icon={<Target className="w-3.5 h-3.5" />} color="emerald" />
          <StatCard label="Quantity" value={trade.quantity?.toLocaleString()} icon={<Layers className="w-3.5 h-3.5" />} color="blue" />
          <StatCard label="Commission" value={`$${trade.commission?.toFixed(2) || '0.00'}`} icon={<DollarSign className="w-3.5 h-3.5" />} color="zinc" />
          <StatCard label="Swap" value={`$${(trade as any).swap?.toFixed(2) || '0.00'}`} icon={<DollarSign className="w-3.5 h-3.5" />} color="zinc" />
          <StatCard label="Account" value={trade.account?.name || trade.accountId?.slice(0, 8)} icon={<Layers className="w-3.5 h-3.5" />} color="indigo" />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <StatCard label="Entry Date" value={formatDate(trade.entryDate)} icon={<Calendar className="w-3.5 h-3.5" />} color="emerald" />
          <StatCard label="Exit Date" value={formatDate(trade.exitDate) || 'Still Open'} icon={<Calendar className="w-3.5 h-3.5" />} color="blue" />
        </div>
      </div>



      {/* ═══ 2-COLUMN GRID: Analysis & Psychology ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* LEFT: Analysis & Review */}
        <div className="space-y-4">
          {/* Entry Reasoning */}
          <SectionCard title="Trade Analysis" icon={<Brain className="w-4 h-4" />} color="purple">
            <div className="space-y-4">
              <TextBlock label="Entry Reasoning" content={trade.entryReason} />
              {trade.confirmations && trade.confirmations.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Confirmations</h4>
                  <div className="flex flex-wrap gap-2">
                    {trade.confirmations.map((c: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-300 rounded-lg text-xs font-semibold border border-purple-100 dark:border-purple-500/20">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextBlock label="Setup Details" content={trade.setupDetails} />
                <TextBlock label="Notes" content={trade.notes} />
              </div>
            </div>
          </SectionCard>

          {/* Post-Trade Review */}
          <SectionCard title="Post-Trade Review" icon={<CheckCircle className="w-4 h-4" />} color="blue">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextBlock label="Mistakes Made" content={trade.mistakesMade} color="red" />
              <TextBlock label="Lessons Learned" content={trade.lessonsLearned} color="emerald" />
            </div>
          </SectionCard>

          {/* Market Context & Environment */}
          <SectionCard title="Environment & Context" icon={<BarChart3 className="w-4 h-4" />} color="blue">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <StatCard label="Strategy" value={trade.strategy?.name} icon={<Target className="w-3.5 h-3.5" />} color="purple" />
              <StatCard label="Session" value={trade.session} icon={<Clock className="w-3.5 h-3.5" />} color="blue" />
              <StatCard label="Timeframe" value={trade.timeframe} icon={<Clock className="w-3.5 h-3.5" />} color="indigo" />
              <StatCard label="Market" value={trade.marketCondition} icon={<TrendingUp className="w-3.5 h-3.5" />} color="emerald" />
              <StatCard label="HTF Bias" value={trade.htfBias} icon={<Target className="w-3.5 h-3.5" />} color="amber" />
            </div>
            {trade.newsImpact !== undefined && (
              <div className="mt-3 flex items-center gap-2 p-2 bg-zinc-50 dark:bg-white/[0.02] rounded-xl border border-zinc-100 dark:border-white/5">
                <Zap className="w-3.5 h-3.5 text-yellow-500" />
                <span className="text-xs font-bold text-zinc-500 uppercase">News Impact</span>
                <span className={`ml-auto text-xs font-bold ${trade.newsImpact ? 'text-yellow-500' : 'text-zinc-400'}`}>
                  {trade.newsImpact ? 'YES' : 'NO'}
                </span>
              </div>
            )}
            {trade.tags && trade.tags.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-white/5">
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
          </SectionCard>
        </div>

        {/* RIGHT: Psychology & Environment */}
        <div className="space-y-4">
          {/* Psychology */}
          <SectionCard title="Mindset & Psychology" icon={<Brain className="w-4 h-4" />} color="amber">
            {/* Emotion Timeline */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Before', value: trade.emotionBefore, icon: <Eye className="w-4 h-4" /> },
                { label: 'During', value: trade.emotionDuring, icon: <Activity className="w-4 h-4" /> },
                { label: 'After', value: trade.emotionAfter, icon: <MessageSquare className="w-4 h-4" /> },
              ].map((e, i) => (
                <div key={i} className="text-center p-3 bg-zinc-50 dark:bg-white/[0.02] rounded-xl border border-zinc-100 dark:border-white/5">
                  <div className="text-zinc-400 mb-1 flex justify-center">{e.icon}</div>
                  <span className="block text-[9px] uppercase text-zinc-400 font-bold mb-1">{e.label}</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">{e.value || '—'}</span>
                </div>
              ))}
            </div>

            {/* Ratings */}
            <div className="space-y-3 mb-4">
              <RatingBar label="Confidence" value={trade.confidenceLevel} max={5} color="amber" />
              <RatingBar label="Energy" value={trade.energyLevel} max={5} color="emerald" />
              <RatingBar label="Focus" value={trade.distractionLevel ? 6 - trade.distractionLevel : undefined} max={5} color="blue" />
              <RatingBar label="Sleep" value={trade.sleepQuality} max={5} color="indigo" />
            </div>

            {/* Boolean Checks */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Followed Plan', value: trade.followedPlan },
                { label: 'Hesitated', value: trade.hesitated },
                { label: 'Prepared to Lose', value: trade.preparedToLose },
              ].filter(item => item.value !== undefined).map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2.5 bg-zinc-50 dark:bg-white/[0.02] rounded-xl border border-zinc-100 dark:border-white/5">
                  <span className="text-xs font-bold text-zinc-500 uppercase">{item.label}</span>
                  <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold ${item.value ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'}`}>
                    {item.value ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {item.value ? 'YES' : 'NO'}
                  </span>
                </div>
              ))}
            </div>

            {trade.ruleViolations && trade.ruleViolations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-white/5">
                <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Rule Violations</h4>
                <div className="flex flex-wrap gap-2">
                  {trade.ruleViolations.map((v: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 rounded-lg text-xs font-semibold border border-red-100 dark:border-red-500/20">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* Environment */}
          {(trade.tradingEnvironment || trade.executionGrade) && (
            <SectionCard title="Environment & Execution" icon={<Terminal className="w-4 h-4" />} color="zinc">
              <div className="space-y-3">
                {trade.tradingEnvironment && (
                  <StatCard label="Trading Environment" value={trade.tradingEnvironment} icon={<Terminal className="w-3.5 h-3.5" />} color="zinc" large />
                )}
                {trade.executionGrade && (
                  <StatCard label="Execution Grade" value={trade.executionGrade} icon={<Crosshair className="w-3.5 h-3.5" />} color="emerald" />
                )}
              </div>
            </SectionCard>
          )}

          {/* Strategy */}
          {(trade as any).strategy && (
            <SectionCard title="Strategy" icon={<Crosshair className="w-4 h-4" />} color="indigo">
              <StatCard label="Strategy" value={(trade as any).strategy?.name} icon={<Brain className="w-3.5 h-3.5" />} color="indigo" large />
            </SectionCard>
          )}
        </div>
      </div>

      {/* ═══ COLLAPSIBLE CHARTS & MEDIA ═══ */}
      <div className="space-y-4">
        <details className="group bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden" open={false}>
          <summary className="p-4 flex items-center justify-between cursor-pointer select-none bg-zinc-50/50 dark:bg-white/[0.02] hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-colors">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Trading Chart</h3>
            </div>
            <ChevronDown className="w-5 h-5 text-zinc-400 group-open:-rotate-180 transition-transform duration-200" />
          </summary>
          <div className="p-1 border-t border-zinc-100 dark:border-white/5 h-[500px]">
            <div className="h-full w-full rounded-b-xl overflow-hidden relative">
              <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">Price Action</span>
              </div>
              <TradeCandleChart 
                tradeId={trade.id} symbol={trade.symbol} 
                entryPrice={trade.entryPrice} exitPrice={trade.exitPrice}
                entryDate={trade.entryDate} exitDate={trade.exitDate}
                direction={trade.direction as 'Long' | 'Short'}
                stopLoss={trade.stopLoss} takeProfit={trade.takeProfit}
              />
            </div>
          </div>
        </details>

        {trade.imageUrl && (
          <details className="group bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden" open={false}>
            <summary className="p-4 flex items-center justify-between cursor-pointer select-none bg-zinc-50/50 dark:bg-white/[0.02] hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-colors">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500">
                  <Newspaper className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Chart Snapshot</h3>
              </div>
              <ChevronDown className="w-5 h-5 text-zinc-400 group-open:-rotate-180 transition-transform duration-200" />
            </summary>
            <div className="p-0 border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-black/20">
              <img src={trade.imageUrl} alt="Trade Snapshot" className="max-h-[700px] w-full object-contain" />
            </div>
          </details>
        )}
      </div>

    </div>
  );
}