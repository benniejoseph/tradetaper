"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { format as formatDateFns, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import {
  ArrowLeft,
  Edit3,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Calendar,
  Layers,
  Target,
  Brain,
  CheckCircle2,
  XCircle,
  Zap,
  Tag,
  MessageSquare,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Activity,
  Crosshair,
  Image as ImageIcon,
} from 'lucide-react';

import { AppDispatch, RootState } from '@/store/store';
import { fetchTradeById } from '@/store/features/tradesSlice';
import TradeCandleChart from '@/components/charts/TradeCandleChart';
import ReplayThisTradeButton from '@/components/backtesting/ReplayThisTradeButton';
import { NotesService } from '@/services/notesService';
import { Note } from '@/types/note';

type NullableNumber = number | null | undefined;

const panelClass =
  'rounded-3xl border border-zinc-200/70 bg-white/90 shadow-[0_8px_40px_rgba(16,24,40,0.08)] backdrop-blur-md dark:border-emerald-500/20 dark:bg-[#06090A]/95 dark:shadow-[0_20px_80px_rgba(0,0,0,0.45)]';

const cardClass =
  'rounded-2xl border border-zinc-200/70 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/[0.02]';

const sectionCardClass =
  'rounded-2xl border border-zinc-200/70 bg-white/75 p-4 dark:border-white/10 dark:bg-white/[0.02]';

const formatNumber = (value?: number, decimals = 2) =>
  value?.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) || '—';

const formatCurrency = (value: NullableNumber, decimals = 2) => {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  const amount = Number(value);
  const sign = amount > 0 ? '+' : '';
  return `${sign}$${Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

const formatDate = (dateValue: unknown): string | null => {
  if (!dateValue || dateValue === 'undefined' || dateValue === 'null') return null;
  try {
    const date = new Date(String(dateValue));
    if (Number.isNaN(date.getTime())) return null;
    return formatDateFns(date, 'MMM dd, yyyy • HH:mm');
  } catch {
    return null;
  }
};

const ProgressBar: React.FC<{
  label: string;
  value?: number;
  max: number;
  accent?: 'emerald' | 'cyan' | 'lime' | 'amber';
}> = ({ label, value, max, accent = 'emerald' }) => {
  const safeValue = value && value > 0 ? value : 0;
  const ratio = Math.min(100, Math.max(0, (safeValue / max) * 100));

  const gradientByAccent: Record<string, string> = {
    emerald: 'from-emerald-400 to-emerald-500',
    cyan: 'from-cyan-400 to-teal-500',
    lime: 'from-lime-400 to-emerald-500',
    amber: 'from-amber-400 to-emerald-500',
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
        <span>{label}</span>
        <span>{safeValue > 0 ? `${safeValue}/${max}` : '—'}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-200/80 dark:bg-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradientByAccent[accent]} shadow-[0_0_12px_rgba(16,185,129,0.45)] transition-all`}
          style={{ width: `${ratio}%` }}
        />
      </div>
    </div>
  );
};

const InlineMetric: React.FC<{
  label: string;
  value: React.ReactNode;
  emphasis?: 'neutral' | 'emerald' | 'red';
}> = ({ label, value, emphasis = 'neutral' }) => {
  const valueColor =
    emphasis === 'emerald'
      ? 'text-emerald-500 dark:text-emerald-400'
      : emphasis === 'red'
        ? 'text-red-500 dark:text-red-400'
        : 'text-zinc-900 dark:text-white';

  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-xs uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className={`text-sm font-semibold ${valueColor}`}>{value}</span>
    </div>
  );
};

const MoodPanel: React.FC<{
  title: string;
  mood?: string;
  quote?: string;
  scoreLabel: string;
  score?: number;
  scoreMax: number;
}> = ({ title, mood, quote, scoreLabel, score, scoreMax }) => (
  <div className={cardClass}>
    <div className="mb-3 flex items-center justify-between">
      <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">{title}</p>
      <span className="rounded-md border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-300">
        {mood || '—'}
      </span>
    </div>
    <p className="min-h-[50px] text-sm italic leading-relaxed text-zinc-700 dark:text-zinc-300">
      {quote || 'No contextual note captured for this phase.'}
    </p>
    <div className="mt-3">
      <ProgressBar label={scoreLabel} value={score} max={scoreMax} accent="emerald" />
    </div>
  </div>
);

export default function ViewTradePage() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams();
  const tradeId = params.tradeId as string;

  const { currentTrade: trade, isLoading, error } = useSelector((state: RootState) => state.trades);
  const [linkedNotes, setLinkedNotes] = useState<Note[]>([]);
  const [isLinkedNotesLoading, setIsLinkedNotesLoading] = useState(false);

  useEffect(() => {
    if (tradeId) {
      dispatch(fetchTradeById(tradeId));
    }
  }, [dispatch, tradeId]);

  useEffect(() => {
    if (!tradeId) return;
    let active = true;

    const fetchLinkedNotes = async () => {
      setIsLinkedNotesLoading(true);
      try {
        const response = await NotesService.getNotesByTrade(tradeId);
        if (active) {
          setLinkedNotes(response.notes || []);
        }
      } catch (notesError) {
        if (active) {
          console.error('Failed to fetch linked notes for trade:', notesError);
          setLinkedNotes([]);
        }
      } finally {
        if (active) {
          setIsLinkedNotesLoading(false);
        }
      }
    };

    fetchLinkedNotes();
    return () => {
      active = false;
    };
  }, [tradeId]);

  const pnlPercentage = useMemo(() => {
    if (
      trade?.entryPrice === undefined ||
      trade?.entryPrice === null ||
      trade?.quantity === undefined ||
      trade?.quantity === null ||
      trade?.profitOrLoss === undefined ||
      trade?.profitOrLoss === null
    ) {
      return null;
    }
    const base = trade.entryPrice * trade.quantity;
    if (!base) return null;
    return (trade.profitOrLoss / base) * 100;
  }, [trade]);

  const holdTime = useMemo(() => {
    if (!trade?.entryDate || !trade?.exitDate) return null;
    try {
      const entry = new Date(trade.entryDate);
      const exit = new Date(trade.exitDate);
      if (Number.isNaN(entry.getTime()) || Number.isNaN(exit.getTime())) return null;
      const mins = differenceInMinutes(exit, entry);
      if (mins < 60) return `${mins}m`;
      const hrs = differenceInHours(exit, entry);
      if (hrs < 24) return `${hrs}h ${mins % 60}m`;
      const days = differenceInDays(exit, entry);
      return `${days}d ${hrs % 24}h`;
    } catch {
      return null;
    }
  }, [trade]);

  const isLong = useMemo(
    () => String(trade?.direction || '').toLowerCase() === 'long',
    [trade?.direction],
  );
  const isWin = (trade?.profitOrLoss ?? 0) >= 0;
  const strategyName = (trade as any)?.strategy?.name || trade?.strategy?.name;
  const focusScore = trade?.distractionLevel ? Math.max(1, 6 - trade.distractionLevel) : undefined;

  const tags = useMemo(
    () =>
      (trade?.tags || [])
        .map((t: any) => (typeof t === 'string' ? t : t?.name))
        .filter((t): t is string => Boolean(t && t.trim())),
    [trade?.tags],
  );

  if (isLoading && !trade) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-emerald-500" />
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading trade details...</p>
        </div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">Trade Not Found</h2>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            {error || 'The requested trade could not be loaded.'}
          </p>
          <Link
            href="/journal"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600"
          >
            Back to Journal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1800px] px-4 py-5 md:px-8">
      <div className={`${panelClass} relative overflow-hidden p-4 md:p-6`}>
        <div className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-100">
          <div className="absolute -left-24 top-0 h-[260px] w-[260px] rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/20" />
          <div className="absolute right-0 top-0 h-[320px] w-[340px] bg-gradient-to-l from-emerald-500/10 via-transparent to-transparent blur-2xl dark:from-emerald-500/25" />
        </div>

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/journal"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300/70 bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-white/15 dark:bg-white/[0.02] dark:text-zinc-300 dark:hover:border-emerald-500/50 dark:hover:text-emerald-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Link>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300/70 bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-white/15 dark:bg-white/[0.02] dark:text-zinc-300 dark:hover:border-emerald-500/50 dark:hover:text-emerald-300"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>

              <ReplayThisTradeButton
                symbol={trade.symbol}
                timeframe={trade.timeframe}
                openTime={trade.entryDate}
                closeTime={trade.exitDate}
              />

              <Link
                href={`/journal/edit/${trade.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/25 dark:text-emerald-300"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit Trade
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${isLong ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'border-red-500/35 bg-red-500/15 text-red-600 dark:text-red-300'}`}>
                  {trade.direction || '—'}
                </span>
                <span className="rounded-md border border-zinc-300/80 bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-700 dark:border-white/15 dark:bg-white/[0.03] dark:text-zinc-300">
                  {trade.status || '—'}
                </span>
                {trade.isStarred && (
                  <span className="rounded-md border border-amber-500/45 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-500">
                    Starred
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white md:text-5xl">
                {trade.symbol}
                <span className="ml-2 text-zinc-400 dark:text-zinc-500">/ {trade.assetType}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(trade.entryDate) || 'Date unavailable'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {trade.session || 'Session —'}
                </span>
                {holdTime && <span className="font-semibold text-zinc-700 dark:text-zinc-300">Hold {holdTime}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className={cardClass}>
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Total P&L</p>
                <p className={`mt-2 text-3xl font-black ${isWin ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {formatCurrency(trade.profitOrLoss)}
                </p>
              </div>
              <div className={cardClass}>
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Return</p>
                <p className={`mt-3 text-2xl font-black ${pnlPercentage !== null && pnlPercentage >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                  {pnlPercentage !== null ? `${pnlPercentage > 0 ? '+' : ''}${pnlPercentage.toFixed(2)}%` : '—'}
                </p>
              </div>
              <div className={cardClass}>
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">R-Multiple</p>
                <p className="mt-3 text-2xl font-black text-emerald-500 dark:text-emerald-400">
                  {trade.rMultiple !== undefined && trade.rMultiple !== null ? `${trade.rMultiple.toFixed(2)}R` : '—'}
                </p>
              </div>
              <div className={cardClass}>
                <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Planned R:R</p>
                <p className="mt-3 text-2xl font-black text-zinc-900 dark:text-white">
                  {trade.plannedRR !== undefined && trade.plannedRR !== null ? `${trade.plannedRR.toFixed(2)}R` : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className={cardClass}>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Entry Price</p>
                  <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-white">{formatNumber(trade.entryPrice, 2)}</p>
                  <div className="mt-2 h-[2px] w-full rounded-full bg-gradient-to-r from-emerald-500/80 to-emerald-300/60" />
                </div>
                <div className={cardClass}>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Exit Price</p>
                  <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-white">
                    {trade.exitPrice !== undefined && trade.exitPrice !== null ? formatNumber(trade.exitPrice, 2) : 'Open'}
                  </p>
                  <div className="mt-2 h-[2px] w-full rounded-full bg-gradient-to-r from-emerald-500/80 to-emerald-300/60" />
                </div>
                <div className={cardClass}>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Stop Loss</p>
                  <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-white">{formatNumber(trade.stopLoss, 2)}</p>
                  <div className="mt-2 h-[2px] w-full rounded-full bg-gradient-to-r from-red-500/80 to-red-300/70" />
                </div>
                <div className={cardClass}>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">Take Profit</p>
                  <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-white">{formatNumber(trade.takeProfit, 2)}</p>
                  <div className="mt-2 h-[2px] w-full rounded-full bg-gradient-to-r from-emerald-500/80 to-emerald-300/60" />
                </div>
              </div>

              <div className={sectionCardClass}>
                <div className="mb-4 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-emerald-500" />
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Mindset & Psychology</h2>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <MoodPanel
                    title="Before"
                    mood={trade.emotionBefore}
                    quote={trade.entryReason}
                    scoreLabel="Confidence"
                    score={trade.confidenceLevel}
                    scoreMax={10}
                  />
                  <MoodPanel
                    title="During"
                    mood={trade.emotionDuring}
                    quote={trade.notes}
                    scoreLabel="Energy"
                    score={trade.energyLevel}
                    scoreMax={5}
                  />
                  <MoodPanel
                    title="After"
                    mood={trade.emotionAfter}
                    quote={trade.lessonsLearned}
                    scoreLabel="Focus"
                    score={focusScore}
                    scoreMax={5}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <div className={sectionCardClass}>
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-zinc-700 dark:text-zinc-200">Analysis Notes</h3>
                  </div>
                  <div className="space-y-3">
                    <div className={cardClass}>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-300">Market Setup</p>
                      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{trade.setupDetails || 'Not recorded.'}</p>
                    </div>
                    <div className={cardClass}>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-300">Entry Reasoning</p>
                      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{trade.entryReason || 'Not recorded.'}</p>
                    </div>
                    <div className={cardClass}>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-300">General Notes</p>
                      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{trade.notes || 'Not recorded.'}</p>
                    </div>
                    <div className={cardClass}>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-300">Confirmations</p>
                      {trade.confirmations && trade.confirmations.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {trade.confirmations.map((c: string, i: number) => (
                            <span key={`${c}-${i}`} className="rounded-md border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                              {c}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">Not recorded.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className={sectionCardClass}>
                  <div className="mb-3 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-zinc-700 dark:text-zinc-200">Post-Trade Review</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-red-400/35 bg-red-500/[0.08] p-3">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-red-500">Mistakes Made</p>
                      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{trade.mistakesMade || 'No mistakes logged.'}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/[0.08] p-3">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-300">Lessons Learned</p>
                      <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{trade.lessonsLearned || 'No lessons logged.'}</p>
                    </div>
                    <div className={cardClass}>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Execution Checklist</p>
                      <div className="space-y-2">
                        {[
                          { label: 'Followed Plan', value: trade.followedPlan },
                          { label: 'Hesitated', value: trade.hesitated },
                          { label: 'Prepared to Lose', value: trade.preparedToLose },
                        ]
                          .filter((item) => item.value !== undefined)
                          .map((item) => (
                            <div key={item.label} className="flex items-center justify-between">
                              <span className="text-xs uppercase tracking-[0.11em] text-zinc-500 dark:text-zinc-400">{item.label}</span>
                              <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                                item.value
                                  ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                                  : 'border-red-500/35 bg-red-500/10 text-red-500 dark:text-red-300'
                              }`}>
                                {item.value ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                {item.value ? 'YES' : 'NO'}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className={cardClass}>
                      <ProgressBar label="Sleep Quality" value={trade.sleepQuality} max={5} accent="cyan" />
                    </div>
                    {trade.ruleViolations && trade.ruleViolations.length > 0 && (
                      <div className={cardClass}>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-red-500">Rule Violations</p>
                        <div className="flex flex-wrap gap-1.5">
                          {trade.ruleViolations.map((v: string, i: number) => (
                            <span key={`${v}-${i}`} className="rounded-md border border-red-500/35 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-600 dark:text-red-300">
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={sectionCardClass}>
                <div className="mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-zinc-700 dark:text-zinc-200">Price Action / Trade Flow</h3>
                </div>
                <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-100/40 dark:bg-black/30">
                  <div className="h-[460px] md:h-[520px]">
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
              </div>
            </div>

            <div className="space-y-5">
              <div className={sectionCardClass}>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-zinc-700 dark:text-zinc-200">Trade Details</h3>
                <InlineMetric label="Position Size" value={`${formatNumber(trade.quantity, 2)} units`} />
                <InlineMetric label="Direction" value={trade.direction || '—'} emphasis={isLong ? 'emerald' : 'red'} />
                <InlineMetric label="Commission" value={formatCurrency(trade.commission)} emphasis={(trade.commission || 0) <= 0 ? 'red' : 'neutral'} />
                <InlineMetric label="Swap" value={formatCurrency((trade as any).swap)} emphasis={((trade as any).swap || 0) < 0 ? 'red' : 'neutral'} />
                <InlineMetric label="Net Profit" value={formatCurrency(trade.profitOrLoss)} emphasis={isWin ? 'emerald' : 'red'} />
                <InlineMetric label="Account" value={trade.account?.name || trade.accountId?.slice(0, 8) || '—'} />
                <InlineMetric label="Asset Type" value={trade.assetType || '—'} />
                <InlineMetric label="Entry Time" value={formatDate(trade.entryDate) || '—'} />
                <InlineMetric label="Exit Time" value={formatDate(trade.exitDate) || 'Open'} />
              </div>

              <div className={sectionCardClass}>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-zinc-700 dark:text-zinc-200">Environment</h3>
                <InlineMetric label="Session" value={trade.session || '—'} />
                <InlineMetric label="Timeframe" value={trade.timeframe || '—'} />
                <InlineMetric label="Market Trend" value={trade.marketCondition || '—'} emphasis={isLong ? 'emerald' : 'neutral'} />
                <InlineMetric label="HTF Bias" value={trade.htfBias || '—'} />
                <InlineMetric label="News Impact" value={trade.newsImpact === undefined ? '—' : trade.newsImpact ? 'Yes' : 'No'} emphasis={trade.newsImpact ? 'emerald' : 'neutral'} />
                <InlineMetric label="Execution Grade" value={trade.executionGrade || '—'} />
                <InlineMetric label="Trading Environment" value={trade.tradingEnvironment || '—'} />
              </div>

              <div className={sectionCardClass}>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-zinc-700 dark:text-zinc-200">Strategy & Tags</h3>
                <div className="rounded-xl border border-emerald-500/35 bg-gradient-to-br from-emerald-500/[0.14] to-transparent p-3">
                  <p className="mb-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-300">
                    <Crosshair className="h-3 w-3" />
                    Strategy Match
                  </p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{strategyName || 'Not assigned'}</p>
                </div>
                <div className="mt-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Tags</p>
                  {tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className="inline-flex items-center gap-1 rounded-md border border-zinc-300/80 bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700 dark:border-white/15 dark:bg-white/[0.03] dark:text-zinc-300"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">No tags.</p>
                  )}
                </div>
              </div>

              <div className={sectionCardClass}>
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-zinc-700 dark:text-zinc-200">Linked Journal Notes</h3>
                </div>
                {isLinkedNotesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading linked notes...
                  </div>
                ) : linkedNotes.length === 0 ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">No linked notes yet.</p>
                ) : (
                  <div className="space-y-2">
                    {linkedNotes.map((note) => (
                      <Link
                        key={note.id}
                        href={`/notes/${note.id}`}
                        className="block rounded-xl border border-zinc-200/80 bg-white/80 p-3 transition hover:border-emerald-400/70 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-emerald-500/40"
                      >
                        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{note.title || 'Untitled note'}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
                          {note.preview || 'Open note to view full transcription.'}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {trade.imageUrl && (
                <div className={sectionCardClass}>
                  <div className="mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-zinc-700 dark:text-zinc-200">Entry Screenshot</h3>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={trade.imageUrl} alt="Trade screenshot" className="h-auto max-h-[380px] w-full object-cover" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

