'use client';

import React, { useEffect, useState } from 'react';
import { FeatureGate } from '@/components/common/FeatureGate';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { useAiError } from '@/hooks/useAiError';
import { toast } from 'react-hot-toast';

/* ────────────────────────────────────────────────────── */
/* Types                                                  */
/* ────────────────────────────────────────────────────── */
type Phase    = 'challenge' | 'verification' | 'funded' | 'express';
type Status   = 'active' | 'passed' | 'failed' | 'expired';
type Badge    = 'passing' | 'at_risk' | 'failed' | 'passed';

interface PropFirmChallenge {
  id: string;
  firmName: string;
  phase: Phase;
  accountSize: number;
  profitTargetPct: number;
  dailyDrawdownLimitPct: number;
  maxDrawdownLimitPct: number;
  startBalance: number;
  currentBalance: number;
  currentEquity: number;
  startDate: string;
  endDate: string | null;
  status: Status;
  platform: string | null;
  notes: string | null;
  // computed
  currentProfitPct: number;
  currentDailyDrawdownPct: number;
  currentMaxDrawdownPct: number;
  daysRemaining: number | null;
  statusBadge: Badge;
}

interface ChallengeFormData {
  firmName: string;
  phase: Phase;
  accountSize: string;
  profitTargetPct: string;
  dailyDrawdownLimitPct: string;
  maxDrawdownLimitPct: string;
  startBalance: string;
  currentBalance: string;
  currentEquity: string;
  startDate: string;
  endDate: string;
  platform: string;
  notes: string;
}

const EMPTY_FORM: ChallengeFormData = {
  firmName: '',
  phase: 'challenge',
  accountSize: '',
  profitTargetPct: '10',
  dailyDrawdownLimitPct: '5',
  maxDrawdownLimitPct: '10',
  startBalance: '',
  currentBalance: '',
  currentEquity: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  platform: 'MT5',
  notes: '',
};

/* ────────────────────────────────────────────────────── */
/* Helpers                                               */
/* ────────────────────────────────────────────────────── */
const BADGE_CONFIG: Record<Badge, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  passing: { label: 'Passing',  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
  at_risk: { label: 'At Risk',  color: 'text-amber-600 dark:text-amber-400',    bg: 'bg-amber-500/10 border-amber-500/20',    icon: AlertTriangle },
  failed:  { label: 'Failed',   color: 'text-red-600 dark:text-red-400',         bg: 'bg-red-500/10 border-red-500/20',         icon: XCircle },
  passed:  { label: '✅ Passed', color: 'text-violet-600 dark:text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20',  icon: Trophy },
};

const PHASE_LABELS: Record<Phase, string> = {
  challenge: 'Phase 1 – Challenge',
  verification: 'Phase 2 – Verification',
  funded: 'Funded',
  express: 'Express',
};

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  const isOver = value >= max * 0.8;
  return (
    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────── */
/* Page                                                  */
/* ────────────────────────────────────────────────────── */
export default function PropFirmPage() {
  return (
    <FeatureGate feature="mentor" className="min-h-screen">
      <PropFirmDashboard />
    </FeatureGate>
  );
}

function PropFirmDashboard() {
  const [challenges, setChallenges]   = useState<PropFirmChallenge[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editing, setEditing]         = useState<PropFirmChallenge | null>(null);
  const [deleting, setDeleting]       = useState<string | null>(null);
  const handleAiError = useAiError();

  const apiBase = process.env.NEXT_PUBLIC_API_URL + '/api/v1';

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/prop-firm-challenges`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setChallenges(await res.json());
    } catch (e) { handleAiError(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`${apiBase}/prop-firm-challenges/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setChallenges((prev) => prev.filter((c) => c.id !== id));
      toast.success('Challenge deleted');
    } catch (e) { toast.error('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const active   = challenges.filter((c) => c.status === 'active');
  const archived = challenges.filter((c) => c.status !== 'active');

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(139,92,246,0.08),transparent_50%),radial-gradient(circle_at_80%_100%,rgba(16,185,129,0.07),transparent_50%)]" />

      <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 dark:border-emerald-800/40 bg-white/80 dark:bg-zinc-900/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300 w-fit">
              <Trophy className="h-3.5 w-3.5" />
              Prop Firm Tracker
            </div>
            <h1 className="mt-2 text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Challenge Tracker
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Track FTMO, MyForexFunds, E8, and more — drawdown, targets, deadlines.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="rounded-xl border border-gray-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 p-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => { setEditing(null); setShowModal(true); }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
            >
              <Plus className="h-4 w-4" />
              Add Challenge
            </button>
          </div>
        </div>

        {/* Summary strip */}
        {!loading && active.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Active', value: active.length, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Passing', value: active.filter(c => c.statusBadge === 'passing').length, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'At Risk', value: active.filter(c => c.statusBadge === 'at_risk').length, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Failed',  value: active.filter(c => c.statusBadge === 'failed').length, color: 'text-red-500', bg: 'bg-red-500/10' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl border border-gray-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 p-4 text-center ${s.bg}`}>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-52 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />)}
          </div>
        ) : challenges.length === 0 ? (
          <EmptyState onAdd={() => { setEditing(null); setShowModal(true); }} />
        ) : (
          <div className="space-y-4">
            {active.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                onEdit={() => { setEditing(c); setShowModal(true); }}
                onDelete={() => handleDelete(c.id)}
                deleteLoading={deleting === c.id}
              />
            ))}
            {archived.length > 0 && (
              <details className="group">
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  Archived ({archived.length})
                </summary>
                <div className="mt-3 space-y-4 opacity-70">
                  {archived.map((c) => (
                    <ChallengeCard
                      key={c.id}
                      challenge={c}
                      onEdit={() => { setEditing(c); setShowModal(true); }}
                      onDelete={() => handleDelete(c.id)}
                      deleteLoading={deleting === c.id}
                    />
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <ChallengeModal
          challenge={editing}
          apiBase={apiBase}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={(updated) => {
            if (editing) {
              setChallenges(prev => prev.map(c => c.id === updated.id ? updated : c));
            } else {
              setChallenges(prev => [updated, ...prev]);
            }
            setShowModal(false);
            setEditing(null);
            toast.success(editing ? 'Challenge updated' : 'Challenge added');
          }}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────── */
/* Challenge Card                                        */
/* ────────────────────────────────────────────────────── */
function ChallengeCard({
  challenge: c,
  onEdit,
  onDelete,
  deleteLoading,
}: {
  challenge: PropFirmChallenge;
  onEdit: () => void;
  onDelete: () => void;
  deleteLoading: boolean;
}) {
  const badge  = BADGE_CONFIG[c.statusBadge];
  const BadgeIcon = badge.icon;
  const profit = c.currentBalance - c.startBalance;

  return (
    <div className={`rounded-2xl border bg-white/80 dark:bg-zinc-900/60 p-5 space-y-5 transition-shadow hover:shadow-md dark:border-zinc-800 ${c.status !== 'active' ? 'opacity-60' : ''}`}>
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{c.firmName}</h3>
            <span className="rounded-full border border-gray-200/70 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {PHASE_LABELS[c.phase]}
            </span>
            {c.platform && (
              <span className="rounded-full border border-blue-200/70 dark:border-blue-800/40 bg-blue-50/80 dark:bg-blue-900/20 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                {c.platform}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Account size: {fmtCurrency(c.accountSize)}
            {c.daysRemaining !== null && ` · ${c.daysRemaining}d remaining`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${badge.bg} ${badge.color}`}>
            <BadgeIcon className="h-3.5 w-3.5" />
            {badge.label}
          </span>
          <button onClick={onEdit} className="rounded-lg border border-gray-200/70 dark:border-zinc-700 p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            disabled={deleteLoading}
            className="rounded-lg border border-red-200/70 dark:border-red-800/40 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Profit target */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Profit Target</span>
            <span className={`text-xs font-bold ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {profit >= 0 ? '+' : ''}{fmtCurrency(profit)} ({c.currentProfitPct >= 0 ? '+' : ''}{c.currentProfitPct.toFixed(2)}%)
            </span>
          </div>
          <ProgressBar value={Math.max(0, c.currentProfitPct)} max={c.profitTargetPct} color="bg-emerald-500" />
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            {c.currentProfitPct.toFixed(2)}% / {c.profitTargetPct}% target
          </p>
        </div>

        {/* Daily drawdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Daily Drawdown</span>
            <span className={`text-xs font-bold ${c.currentDailyDrawdownPct >= c.dailyDrawdownLimitPct * 0.8 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
              {c.currentDailyDrawdownPct.toFixed(2)}%
            </span>
          </div>
          <ProgressBar value={c.currentDailyDrawdownPct} max={c.dailyDrawdownLimitPct} color="bg-blue-500" />
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            {c.currentDailyDrawdownPct.toFixed(2)}% / {c.dailyDrawdownLimitPct}% limit
          </p>
        </div>

        {/* Max drawdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Max Drawdown</span>
            <span className={`text-xs font-bold ${c.currentMaxDrawdownPct >= c.maxDrawdownLimitPct * 0.8 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
              {c.currentMaxDrawdownPct.toFixed(2)}%
            </span>
          </div>
          <ProgressBar value={c.currentMaxDrawdownPct} max={c.maxDrawdownLimitPct} color="bg-purple-500" />
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            {c.currentMaxDrawdownPct.toFixed(2)}% / {c.maxDrawdownLimitPct}% limit
          </p>
        </div>
      </div>

      {/* Balance row */}
      <div className="flex flex-wrap gap-4 border-t border-gray-100 dark:border-zinc-800 pt-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">Start</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{fmtCurrency(c.startBalance)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">Current</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{fmtCurrency(c.currentBalance)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">Equity</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{fmtCurrency(c.currentEquity)}</p>
        </div>
        {c.daysRemaining !== null && (
          <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3.5 w-3.5" />
            {c.daysRemaining > 0 ? `${c.daysRemaining} days left` : 'Deadline passed'}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────── */
/* Add/Edit Modal                                        */
/* ────────────────────────────────────────────────────── */
function ChallengeModal({
  challenge,
  apiBase,
  onClose,
  onSave,
}: {
  challenge: PropFirmChallenge | null;
  apiBase: string;
  onClose: () => void;
  onSave: (c: PropFirmChallenge) => void;
}) {
  const [form, setForm] = useState<ChallengeFormData>(() => {
    if (!challenge) return EMPTY_FORM;
    return {
      firmName: challenge.firmName,
      phase: challenge.phase,
      accountSize: String(challenge.accountSize),
      profitTargetPct: String(challenge.profitTargetPct),
      dailyDrawdownLimitPct: String(challenge.dailyDrawdownLimitPct),
      maxDrawdownLimitPct: String(challenge.maxDrawdownLimitPct),
      startBalance: String(challenge.startBalance),
      currentBalance: String(challenge.currentBalance),
      currentEquity: String(challenge.currentEquity),
      startDate: challenge.startDate?.split('T')[0] ?? '',
      endDate: challenge.endDate?.split('T')[0] ?? '',
      platform: challenge.platform ?? 'MT5',
      notes: challenge.notes ?? '',
    };
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof ChallengeFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        firmName: form.firmName,
        phase: form.phase,
        accountSize: parseFloat(form.accountSize),
        profitTargetPct: parseFloat(form.profitTargetPct),
        dailyDrawdownLimitPct: parseFloat(form.dailyDrawdownLimitPct),
        maxDrawdownLimitPct: parseFloat(form.maxDrawdownLimitPct),
        startBalance: parseFloat(form.startBalance),
        currentBalance: parseFloat(form.currentBalance),
        currentEquity: parseFloat(form.currentEquity || form.currentBalance),
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        platform: form.platform || undefined,
        notes: form.notes || undefined,
      };

      const url = challenge
        ? `${apiBase}/prop-firm-challenges/${challenge.id}`
        : `${apiBase}/prop-firm-challenges`;

      const res = await fetch(url, {
        method: challenge ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(await res.text());
      onSave(await res.json());
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">
            {challenge ? 'Edit Challenge' : 'Add Prop Firm Challenge'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><FormInput label="Firm Name" value={form.firmName} onChange={set('firmName')} placeholder="e.g. FTMO" required /></div>
              <FormSelect label="Phase" value={form.phase} onChange={set('phase')} options={[
                { value: 'challenge', label: 'Phase 1 – Challenge' },
                { value: 'verification', label: 'Phase 2 – Verification' },
                { value: 'funded', label: 'Funded' },
                { value: 'express', label: 'Express' },
              ]} />
              <FormInput label="Platform" value={form.platform} onChange={set('platform')} placeholder="MT5" />
              <FormInput label="Account Size ($)" value={form.accountSize} onChange={set('accountSize')} type="number" required />
              <FormInput label="Start Balance ($)" value={form.startBalance} onChange={set('startBalance')} type="number" required />
              <FormInput label="Current Balance ($)" value={form.currentBalance} onChange={set('currentBalance')} type="number" required />
              <FormInput label="Current Equity ($)" value={form.currentEquity} onChange={set('currentEquity')} type="number" placeholder="Same as balance" />
              <FormInput label="Profit Target (%)" value={form.profitTargetPct} onChange={set('profitTargetPct')} type="number" step="0.5" required />
              <FormInput label="Daily DD Limit (%)" value={form.dailyDrawdownLimitPct} onChange={set('dailyDrawdownLimitPct')} type="number" step="0.5" required />
              <FormInput label="Max DD Limit (%)" value={form.maxDrawdownLimitPct} onChange={set('maxDrawdownLimitPct')} type="number" step="0.5" required />
              <FormInput label="Start Date" value={form.startDate} onChange={set('startDate')} type="date" required />
              <FormInput label="End Date (optional)" value={form.endDate} onChange={set('endDate')} type="date" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">Notes</label>
              <textarea
                value={form.notes}
                onChange={set('notes')}
                rows={2}
                className="w-full rounded-xl border border-gray-200/70 dark:border-zinc-700 bg-gray-50/80 dark:bg-zinc-800/80 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                placeholder="Any additional notes..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200/70 dark:border-zinc-700 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                {saving ? 'Saving...' : challenge ? 'Update' : 'Add Challenge'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, type = 'text', required = false, placeholder, step }: any) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        step={step}
        className="w-full rounded-xl border border-gray-200/70 dark:border-zinc-700 bg-gray-50/80 dark:bg-zinc-800/80 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
      />
    </div>
  );
}

function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: any; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-gray-200/70 dark:border-zinc-700 bg-gray-50/80 dark:bg-zinc-800/80 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-3xl border border-emerald-200/40 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/20 dark:via-zinc-950 dark:to-teal-900/10 p-12 text-center">
      <Trophy className="h-16 w-16 text-emerald-300 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Challenges Yet</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-sm mb-6">
        Add your FTMO, MyForexFunds, E8, or any other prop firm challenge to track drawdown limits, profit targets, and deadlines in real-time.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
      >
        <Plus className="h-4 w-4" />
        Add Your First Challenge
      </button>
    </div>
  );
}
