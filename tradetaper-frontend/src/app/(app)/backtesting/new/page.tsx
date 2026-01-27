'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Strategy } from '@/types/strategy';
import { 
  CreateBacktestTradeDto, 
  TIMEFRAMES, 
  SESSIONS, 
  KILL_ZONES, 
  DAYS_OF_WEEK,
  MARKET_STRUCTURES,
  HTF_BIASES,
  OUTCOMES,
  COMMON_SYMBOLS,
  ICT_CONCEPTS,
  SETUP_TYPES,
  Timeframe,
  TradingSession,
  KillZone,
  DayOfWeek,
  MarketStructure,
  HTFBias,
  TradeOutcome,
  TradeDirection,
} from '@/types/backtesting';
import { strategiesService } from '@/services/strategiesService';
import { backtestingService } from '@/services/backtestingService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { FiArrowLeft, FiSave, FiStar } from 'react-icons/fi';

function ContentHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
      )}
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`p-1 ${star <= value ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}
        >
          <FiStar className={`w-5 h-5 ${star <= value ? 'fill-current' : ''}`} />
        </button>
      ))}
    </div>
  );
}

function NewBacktestTradeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const strategyIdFromUrl = searchParams.get('strategyId');

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateBacktestTradeDto>({
    strategyId: strategyIdFromUrl || '',
    symbol: 'XAUUSD',
    direction: 'LONG',
    entryPrice: 0,
    exitPrice: undefined,
    stopLoss: undefined,
    takeProfit: undefined,
    lotSize: 1,
    timeframe: 'M15',
    session: 'newyork',
    killZone: 'ny_open',
    dayOfWeek: 'tuesday',
    hourOfDay: 14,
    tradeDate: new Date().toISOString().split('T')[0],
    setupType: 'Order Block Entry',
    ictConcept: 'Power of Three',
    marketStructure: 'bullish',
    htfBias: 'bullish',
    outcome: 'win',
    pnlPips: undefined,
    pnlDollars: undefined,
    rMultiple: undefined,
    holdingTimeMinutes: undefined,
    entryQuality: 3,
    executionQuality: 3,
    followedRules: true,
    checklistScore: undefined,
    notes: '',
    screenshotUrl: '',
    lessonLearned: '',
  });

  useEffect(() => {
    loadStrategies();
  }, []);

  useEffect(() => {
    if (strategyIdFromUrl) {
      setFormData(prev => ({ ...prev, strategyId: strategyIdFromUrl }));
    }
  }, [strategyIdFromUrl]);

  const loadStrategies = async () => {
    try {
      setLoading(true);
      const data = await strategiesService.getStrategies();
      setStrategies(data);
      if (data.length > 0 && !strategyIdFromUrl) {
        setFormData(prev => ({ ...prev, strategyId: data[0].id }));
      }
    } catch (err) {
      setError('Failed to load strategies');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await backtestingService.createTrade(formData);
      router.push(`/backtesting?strategyId=${formData.strategyId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save backtest trade');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = <K extends keyof CreateBacktestTradeDto>(
    field: K, 
    value: CreateBacktestTradeDto[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate R-Multiple when prices change
  useEffect(() => {
    if (formData.entryPrice && formData.exitPrice && formData.stopLoss) {
      const risk = Math.abs(formData.entryPrice - formData.stopLoss);
      const reward = Math.abs(formData.exitPrice - formData.entryPrice);
      if (risk > 0) {
        const rMultiple = formData.outcome === 'loss' ? -(reward / risk) : reward / risk;
        setFormData(prev => ({ ...prev, rMultiple: parseFloat(rMultiple.toFixed(2)) }));
      }
    }
  }, [formData.entryPrice, formData.exitPrice, formData.stopLoss, formData.outcome]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const selectedStrategy = strategies.find(s => s.id === formData.strategyId);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/backtesting"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
        </Link>
        <ContentHeader
          title="Record Backtest Trade"
          description="Add a new manual backtest trade to analyze strategy performance"
        />
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Strategy Selection */}
        <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-xl p-6 border border-emerald-200/50 dark:border-emerald-700/30">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Strategy</h2>
          <select
            value={formData.strategyId}
            onChange={(e) => updateField('strategyId', e.target.value)}
            required
            className="w-full px-4 py-2 border border-emerald-300 dark:border-emerald-600/30 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-black text-gray-900 dark:text-white"
          >
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Trade Details */}
        <div className="bg-gradient-to-br from-white to-blue-50 dark:from-black dark:to-blue-950/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/30">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trade Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symbol</label>
              <select
                value={formData.symbol}
                onChange={(e) => updateField('symbol', e.target.value)}
                className="w-full px-4 py-2 border border-blue-300 dark:border-blue-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              >
                {COMMON_SYMBOLS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Direction</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.direction === 'LONG'}
                    onChange={() => updateField('direction', 'LONG')}
                    className="text-emerald-600"
                  />
                  <span className="text-green-600 font-medium">LONG</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.direction === 'SHORT'}
                    onChange={() => updateField('direction', 'SHORT')}
                    className="text-emerald-600"
                  />
                  <span className="text-red-600 font-medium">SHORT</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entry Price *</label>
              <input
                type="number"
                step="any"
                required
                value={formData.entryPrice || ''}
                onChange={(e) => updateField('entryPrice', parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-blue-300 dark:border-blue-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exit Price</label>
              <input
                type="number"
                step="any"
                value={formData.exitPrice || ''}
                onChange={(e) => updateField('exitPrice', parseFloat(e.target.value) || undefined)}
                className="w-full px-4 py-2 border border-blue-300 dark:border-blue-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stop Loss</label>
              <input
                type="number"
                step="any"
                value={formData.stopLoss || ''}
                onChange={(e) => updateField('stopLoss', parseFloat(e.target.value) || undefined)}
                className="w-full px-4 py-2 border border-blue-300 dark:border-blue-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Take Profit</label>
              <input
                type="number"
                step="any"
                value={formData.takeProfit || ''}
                onChange={(e) => updateField('takeProfit', parseFloat(e.target.value) || undefined)}
                className="w-full px-4 py-2 border border-blue-300 dark:border-blue-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lot Size</label>
              <input
                type="number"
                step="0.01"
                value={formData.lotSize || ''}
                onChange={(e) => updateField('lotSize', parseFloat(e.target.value) || undefined)}
                className="w-full px-4 py-2 border border-blue-300 dark:border-blue-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Timing */}
        <div className="bg-gradient-to-br from-white to-purple-50 dark:from-black dark:to-purple-950/20 rounded-xl p-6 border border-purple-200/50 dark:border-purple-700/30">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timing</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trade Date *</label>
              <input
                type="date"
                required
                value={formData.tradeDate}
                onChange={(e) => updateField('tradeDate', e.target.value)}
                className="w-full px-4 py-2 border border-purple-300 dark:border-purple-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hour (UTC)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={formData.hourOfDay ?? ''}
                onChange={(e) => updateField('hourOfDay', parseInt(e.target.value) || undefined)}
                className="w-full px-4 py-2 border border-purple-300 dark:border-purple-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timeframe *</label>
              <select
                value={formData.timeframe}
                onChange={(e) => updateField('timeframe', e.target.value as Timeframe)}
                className="w-full px-4 py-2 border border-purple-300 dark:border-purple-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              >
                {TIMEFRAMES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session</label>
              <select
                value={formData.session || ''}
                onChange={(e) => updateField('session', e.target.value as TradingSession || undefined)}
                className="w-full px-4 py-2 border border-purple-300 dark:border-purple-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              >
                <option value="">Select Session</option>
                {SESSIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kill Zone</label>
              <select
                value={formData.killZone || ''}
                onChange={(e) => updateField('killZone', e.target.value as KillZone || undefined)}
                className="w-full px-4 py-2 border border-purple-300 dark:border-purple-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              >
                <option value="">Select Kill Zone</option>
                {KILL_ZONES.map(k => (
                  <option key={k.value} value={k.value}>{k.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Day of Week</label>
              <select
                value={formData.dayOfWeek || ''}
                onChange={(e) => updateField('dayOfWeek', e.target.value as DayOfWeek || undefined)}
                className="w-full px-4 py-2 border border-purple-300 dark:border-purple-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              >
                <option value="">Select Day</option>
                {DAYS_OF_WEEK.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Setup Details */}
        <div className="bg-gradient-to-br from-white to-amber-50 dark:from-black dark:to-amber-950/20 rounded-xl p-6 border border-amber-200/50 dark:border-amber-700/30">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Setup Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Setup Type</label>
              <select
                value={formData.setupType || ''}
                onChange={(e) => updateField('setupType', e.target.value || undefined)}
                className="w-full px-4 py-2 border border-amber-300 dark:border-amber-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              >
                <option value="">Select Setup</option>
                {SETUP_TYPES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ICT Concept</label>
              <select
                value={formData.ictConcept || ''}
                onChange={(e) => updateField('ictConcept', e.target.value || undefined)}
                className="w-full px-4 py-2 border border-amber-300 dark:border-amber-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              >
                <option value="">Select Concept</option>
                {ICT_CONCEPTS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Market Structure</label>
              <select
                value={formData.marketStructure || ''}
                onChange={(e) => updateField('marketStructure', e.target.value as MarketStructure || undefined)}
                className="w-full px-4 py-2 border border-amber-300 dark:border-amber-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              >
                <option value="">Select Structure</option>
                {MARKET_STRUCTURES.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HTF Bias</label>
              <select
                value={formData.htfBias || ''}
                onChange={(e) => updateField('htfBias', e.target.value as HTFBias || undefined)}
                className="w-full px-4 py-2 border border-amber-300 dark:border-amber-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              >
                <option value="">Select Bias</option>
                {HTF_BIASES.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-gradient-to-br from-white to-green-50 dark:from-black dark:to-green-950/20 rounded-xl p-6 border border-green-200/50 dark:border-green-700/30">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Outcome *</label>
              <div className="flex gap-4">
                {OUTCOMES.map(o => (
                  <label key={o.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.outcome === o.value}
                      onChange={() => updateField('outcome', o.value)}
                      className="text-emerald-600"
                    />
                    <span className={`font-medium ${
                      o.value === 'win' ? 'text-green-600' :
                      o.value === 'loss' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>{o.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">P&L (Pips)</label>
              <input
                type="number"
                step="any"
                value={formData.pnlPips ?? ''}
                onChange={(e) => updateField('pnlPips', parseFloat(e.target.value) || undefined)}
                className="w-full px-4 py-2 border border-green-300 dark:border-green-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">P&L ($)</label>
              <input
                type="number"
                step="any"
                value={formData.pnlDollars ?? ''}
                onChange={(e) => updateField('pnlDollars', parseFloat(e.target.value) || undefined)}
                className="w-full px-4 py-2 border border-green-300 dark:border-green-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">R-Multiple</label>
              <input
                type="number"
                step="0.01"
                value={formData.rMultiple ?? ''}
                onChange={(e) => updateField('rMultiple', parseFloat(e.target.value) || undefined)}
                className="w-full px-4 py-2 border border-green-300 dark:border-green-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Holding Time (min)</label>
              <input
                type="number"
                value={formData.holdingTimeMinutes ?? ''}
                onChange={(e) => updateField('holdingTimeMinutes', parseInt(e.target.value) || undefined)}
                className="w-full px-4 py-2 border border-green-300 dark:border-green-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Quality */}
        <div className="bg-gradient-to-br from-white to-pink-50 dark:from-black dark:to-pink-950/20 rounded-xl p-6 border border-pink-200/50 dark:border-pink-700/30">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quality Assessment</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Entry Quality</label>
              <StarRating
                value={formData.entryQuality || 0}
                onChange={(v) => updateField('entryQuality', v)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Execution Quality</label>
              <StarRating
                value={formData.executionQuality || 0}
                onChange={(v) => updateField('executionQuality', v)}
              />
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.followedRules}
                  onChange={(e) => updateField('followedRules', e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded"
                />
                <span className="text-gray-700 dark:text-gray-300">Followed all trading rules</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Checklist Score (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.checklistScore ?? ''}
                onChange={(e) => updateField('checklistScore', parseFloat(e.target.value) || undefined)}
                className="w-full px-4 py-2 border border-pink-300 dark:border-pink-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black dark:to-gray-950/20 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/30">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notes</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trade Notes</label>
              <textarea
                rows={3}
                value={formData.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Describe the trade setup, reasoning, and execution..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lesson Learned</label>
              <textarea
                rows={2}
                value={formData.lessonLearned || ''}
                onChange={(e) => updateField('lessonLearned', e.target.value)}
                placeholder="Key takeaway from this trade..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Screenshot URL</label>
              <input
                type="url"
                value={formData.screenshotUrl || ''}
                onChange={(e) => updateField('screenshotUrl', e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href="/backtesting"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <LoadingSpinner />
                Saving...
              </>
            ) : (
              <>
                <FiSave />
                Save Backtest Trade
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewBacktestTradePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
      <NewBacktestTradeContent />
    </Suspense>
  );
}
