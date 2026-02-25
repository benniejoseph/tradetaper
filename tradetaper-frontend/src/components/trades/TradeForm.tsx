/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/trades/TradeForm.tsx - Single Page Scrolling Redesign
"use client";
import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import { Trade, CreateTradePayload, UpdateTradePayload, AssetType, TradeDirection, TradeStatus, Tag as TradeTagType } from '@/types/trade';
import { Strategy } from '@/types/strategy';
import { strategiesService } from '@/services/strategiesService';
import { TradingSession, EmotionalState, ExecutionGrade, MarketCondition, HTFBias, Timeframe } from '@/types/enums';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { createTrade, updateTrade } from '@/store/features/tradesSlice';
import { selectSelectedAccountId, selectAvailableAccounts } from '@/store/features/accountSlice';
import { selectMT5Accounts, fetchMT5Accounts, MT5Account } from '@/store/features/mt5AccountsSlice';
import { authApiClient } from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import CreatableSelect from 'react-select/creatable';
import { MultiValue, StylesConfig } from 'react-select';
import { FormInput } from '../ui/FormInput';
import { FormSelect } from '../ui/FormSelect';
import { FormTextarea } from '../ui/FormTextarea';
import { EmotionChipPicker } from '../ui/EmotionChipPicker';
import { StarRating } from '../ui/StarRating';
import { ToggleChip } from '../ui/ToggleChip';
import { ChipSelector } from '../ui/ChipSelector';
import Modal from '../ui/Modal';
import VoiceJournalButton from './VoiceJournalButton';
import { 
  BarChart3, 
  Target, 
  Brain, 
  TrendingUp, 
  TrendingDown,
  Upload,
  Save,
  Send,
  X,
  Clock,
  DollarSign,
  Tag,
  FileText,
  Home,
  Zap,
  Layers,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

// Types
type ValidationError = { field: string; message: string };
interface TagOption { readonly label: string; readonly value: string; readonly color?: string; readonly isNew?: boolean; }
interface TradeFormProps { 
  initialData?: Trade; 
  isEditMode?: boolean; 
  onFormSubmitSuccess?: (tradeId?: string) => void; 
  onCancel?: () => void; 
}

// Helper functions
const getFieldError = (errors: ValidationError[], fieldName: string): string | null => {
  const error = errors.find(err => err.field === fieldName);
  return error ? error.message : null;
};

const validateTradeData = (data: any): { isValid: boolean; errors: ValidationError[] } => {
  const errors: ValidationError[] = [];
  if (!data.symbol?.trim()) errors.push({ field: 'symbol', message: 'Symbol required' });
  if (!data.entryPrice || data.entryPrice <= 0) errors.push({ field: 'entryPrice', message: 'Entry price required' });
  if (!data.quantity || data.quantity <= 0) errors.push({ field: 'quantity', message: 'Quantity required' });
  if (!data.entryDate) errors.push({ field: 'entryDate', message: 'Entry date required' });
  return { isValid: errors.length === 0, errors };
};

const formatDateForInput = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const tzoffset = date.getTimezoneOffset() * 60000;
    return (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
  } catch { return ''; }
};

const getEnumValue = <T extends object>(enumObj: T, value: any, defaultValue: T[keyof T]): T[keyof T] => {
  if (value && Object.values(enumObj).includes(value)) return value;
  return defaultValue;
};

// Section Header Component
const FormSectionHeader: React.FC<{ title: string; icon: React.ReactNode; color?: string }> = ({ title, icon, color = "emerald" }) => (
  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-100 dark:border-white/5">
    <div className={`p-2 rounded-xl bg-${color}-50 dark:bg-${color}-500/10 text-${color}-600 dark:text-${color}-400 shadow-sm`}>
      {icon}
    </div>
    <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">{title}</h3>
  </div>
);

export default function TradeForm({ initialData, isEditMode = false, onFormSubmitSuccess, onCancel }: TradeFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isLoading: tradeSubmitLoading, error: tradeSubmitError } = useSelector((state: RootState) => state.trades);
  const selectedAccountIdFromStore = useSelector(selectSelectedAccountId);
  const availableAccounts = useSelector(selectAvailableAccounts);
  const mt5Accounts = useSelector(selectMT5Accounts) as MT5Account[];
  const { theme } = useTheme();

  // Form state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [selectedTags, setSelectedTags] = useState<MultiValue<TagOption>>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  
  // Sync Modal State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncMode, setSyncMode] = useState<'OVERRIDE' | 'PARTIAL'>('PARTIAL');
  const [isSyncing, setIsSyncing] = useState(false);

  const displayError = useMemo(() => {
    const raw = formError || tradeSubmitError;
    if (!raw) return null;
    if (Array.isArray(raw)) {
      return raw.map((item: any) => {
        if (typeof item === 'string') return item;
        if (item?.field && Array.isArray(item?.errors)) return `${item.field}: ${item.errors.join(', ')}`;
        return JSON.stringify(item);
      }).join(' | ');
    }
    if (typeof raw === 'object') {
      try {
        if ((raw as any).field && Array.isArray((raw as any).errors)) {
          return `${(raw as any).field}: ${(raw as any).errors.join(', ')}`;
        }
        return JSON.stringify(raw);
      } catch {
        return 'Submission failed';
      }
    }
    return String(raw);
  }, [formError, tradeSubmitError]);

  // Merge accounts
  const allAccounts = useMemo(() => {
    const manual = (availableAccounts as any[]).map(acc => ({ id: acc.id, name: acc.name, balance: acc.balance, currency: acc.currency, type: 'Manual' }));
    const mt5 = mt5Accounts.map(acc => ({ id: acc.id, name: acc.accountName, balance: acc.balance || 0, currency: acc.currency || 'USD', type: 'MT5' }));
    return [...manual, ...mt5];
  }, [availableAccounts, mt5Accounts]);

  // Form data
  const [formData, setFormData] = useState<any>({
    accountId: initialData?.accountId || selectedAccountIdFromStore || undefined,
    assetType: initialData?.assetType || AssetType.STOCK,
    symbol: initialData?.symbol || '',
    direction: initialData?.direction || TradeDirection.LONG,
    status: initialData?.status || TradeStatus.OPEN,
    entryDate: formatDateForInput(initialData?.entryDate),
    entryPrice: initialData?.entryPrice || 0,
    stopLoss: initialData?.stopLoss ?? undefined,
    takeProfit: initialData?.takeProfit ?? undefined,
    exitDate: formatDateForInput(initialData?.exitDate),
    exitPrice: initialData?.exitPrice ?? undefined,
    quantity: initialData?.quantity || 0,
    commission: initialData?.commission || 0,
    notes: initialData?.notes || '',
    session: getEnumValue(TradingSession, initialData?.session, TradingSession.NEW_YORK),
    setupDetails: initialData?.setupDetails || '',
    mistakesMade: initialData?.mistakesMade || '',
    lessonsLearned: initialData?.lessonsLearned || '',
    imageUrl: initialData?.imageUrl || '',
    rMultiple: initialData?.rMultiple ?? undefined,
    isStarred: initialData?.isStarred || false,
    strategyId: initialData?.strategyId || undefined,
    emotionBefore: initialData?.emotionBefore || undefined,
    emotionDuring: initialData?.emotionDuring || undefined,
    emotionAfter: initialData?.emotionAfter || undefined,
    confidenceLevel: initialData?.confidenceLevel || undefined,
    followedPlan: initialData?.followedPlan ?? undefined,
    ruleViolations: initialData?.ruleViolations || [],
    plannedRR: initialData?.plannedRR || undefined,
    executionGrade: initialData?.executionGrade || undefined,
    marketCondition: initialData?.marketCondition || undefined,
    timeframe: initialData?.timeframe || undefined,
    htfBias: initialData?.htfBias || undefined,
    newsImpact: initialData?.newsImpact ?? undefined,
    entryReason: initialData?.entryReason || '',
    confirmations: initialData?.confirmations || [],
    hesitated: initialData?.hesitated ?? undefined,
    preparedToLose: initialData?.preparedToLose ?? undefined,
    sleepQuality: initialData?.sleepQuality || undefined,
    energyLevel: initialData?.energyLevel || undefined,
    distractionLevel: initialData?.distractionLevel || undefined,
    tradingEnvironment: initialData?.tradingEnvironment || '',
  });

  // Effects
  useEffect(() => { if (mt5Accounts.length === 0) dispatch(fetchMT5Accounts()); }, [dispatch, mt5Accounts.length]);
  
  useEffect(() => {
    const loadStrategies = async () => {
      try { setStrategies(await strategiesService.getStrategies()); } 
      catch (e) { console.error('Error loading strategies:', e); }
    };
    loadStrategies();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData((prev: any) => ({
        ...prev,
        ...initialData,
        entryDate: formatDateForInput(initialData.entryDate),
        exitDate: formatDateForInput(initialData.exitDate),
        session: getEnumValue(TradingSession, initialData.session, TradingSession.NEW_YORK),
      }));
      setImagePreviewUrl(initialData.imageUrl || null);
      if (initialData.tags?.length) {
        setSelectedTags(initialData.tags.map((tag: any) => ({ label: tag.name, value: tag.name, color: tag.color })));
      }
    }
  }, [initialData]);

  // Calculate R:R
  useEffect(() => {
    const { entryPrice, stopLoss, takeProfit, direction } = formData;
    if (direction && entryPrice > 0 && stopLoss > 0 && takeProfit > 0 && stopLoss !== entryPrice) {
      const risk = direction === TradeDirection.LONG ? entryPrice - stopLoss : stopLoss - entryPrice;
      const reward = direction === TradeDirection.LONG ? takeProfit - entryPrice : entryPrice - takeProfit;
      if (risk > 0 && reward > 0) {
        setFormData((prev: any) => ({ ...prev, rMultiple: parseFloat((reward / risk).toFixed(2)) }));
      }
    }
  }, [formData.entryPrice, formData.stopLoss, formData.takeProfit, formData.direction]);

  // Handlers
  const handleVoiceDataParsed = (parsedData: any) => {
    if (parsedData?.updates) {
      setFormData((prev: any) => ({
        ...prev,
        ...parsedData.updates,
      }));
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === 'isStarred' && type === 'checkbox') {
      setFormData((prev: any) => ({ ...prev, isStarred: (e.target as HTMLInputElement).checked }));
    } else {
      let val: any = value;
      if (type === 'number') val = value === '' ? undefined : parseFloat(value);
      setFormData((prev: any) => ({ ...prev, [name]: val }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { setFormError("File too large (max 5MB)"); return; }
      const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowed.includes(file.type)) { setFormError("Invalid file type"); return; }
      setSelectedFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setFormData((prev: any) => ({ ...prev, imageUrl: '' }));
      setFormError(null);
    }
  };

  const handleSyncJournalToGroup = async () => {
    if (!initialData?.id || !initialData.groupId) return;
    setIsSyncing(true);
    try {
      await authApiClient.post(`/trades/${initialData.id}/copy-journal`, { mode: syncMode });
      setIsSyncModalOpen(false);
      toast.success('Journal successfully synced to group trades!');
    } catch (error: any) {
      console.error('Failed to sync journal to group:', error);
      toast.error(error?.response?.data?.message || 'Failed to sync journal to group trades.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setValidationErrors([]);

    const validation = validateTradeData(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setFormError('Fix validation errors');
      return;
    }

    try {
      setIsUploading(true);
      let uploadedImageUrl = formData.imageUrl || '';
      
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        try {
          const res = await authApiClient.post('/files/upload/trade-image', uploadFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          uploadedImageUrl = res.data.url;
        } catch (err: any) {
          setFormError(`Upload failed: ${err.message}`);
          setIsUploading(false);
          return;
        }
      }

      const payload = {
        ...formData,
        tagNames: selectedTags.map(t => t.value),
        imageUrl: uploadedImageUrl,
        entryDate: new Date(formData.entryDate).toISOString(),
        exitDate: formData.exitDate ? new Date(formData.exitDate).toISOString() : undefined,
      };
      delete payload.rMultiple;

      let result;
      if (isEditMode && initialData?.id) {
        result = await dispatch(updateTrade({ id: initialData.id, payload }));
        if (updateTrade.fulfilled.match(result)) {
          onFormSubmitSuccess?.(result.payload.id) || router.push('/journal');
        }
      } else {
        result = await dispatch(createTrade(payload));
        if (createTrade.fulfilled.match(result)) {
          onFormSubmitSuccess?.(result.payload.id) || router.push('/journal');
        }
      }
      if (result.meta.requestStatus === 'rejected') {
        setFormError((result as any).payload || 'Submission failed');
      }
    } catch (err: any) {
      setFormError(err.message || 'Unexpected error');
    } finally {
      setIsUploading(false);
    }
  };

  // Compact input classes
  const inputClass = "w-full px-4 py-2.5 text-sm bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-zinc-400";
  const labelClass = "text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 block";
  const cardClass = "bg-zinc-50/50 dark:bg-white/[0.02] rounded-xl border border-zinc-200/50 dark:border-white/5 p-5";

  // React Select styles
  const selectStyles: StylesConfig<TagOption, true> = {
    control: (p, s) => ({ ...p, backgroundColor: 'transparent', borderColor: s.isFocused ? 'rgb(16 185 129)' : 'rgba(255,255,255,0.1)', borderRadius: '0.75rem', minHeight: '42px' }),
    menu: (p) => ({ ...p, backgroundColor: 'var(--bg-primary)', borderRadius: '0.75rem', zIndex: 50 }),
    option: (p, s) => ({ ...p, backgroundColor: s.isSelected ? 'rgb(16 185 129)' : s.isFocused ? 'rgba(16,185,129,0.1)' : 'transparent', color: s.isSelected ? 'white' : 'inherit' }),
    multiValue: (p) => ({ ...p, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '0.5rem' }),
    multiValueLabel: (p) => ({ ...p, color: 'rgb(16 185 129)', fontWeight: 500 }),
  };

  return (
    <div className="w-full">
      {/* Error Display */}
      {displayError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
          <span className="font-bold">Error:</span> {displayError}
        </div>
      )}

      {/* Voice Journal AI Banner */}
      <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-emerald-500/10 to-transparent p-5 rounded-2xl border border-emerald-500/20 shadow-sm">
         <div className="flex gap-4 items-center">
           <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex flex-shrink-0 items-center justify-center">
             <Brain className="w-6 h-6 text-emerald-500" />
           </div>
           <div>
             <h3 className="font-bold text-emerald-700 dark:text-emerald-400 text-lg">TradeTaper AI Voice Journal</h3>
             <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Tap the mic to dictate your trade analysis. AI will automatically extract and fill out the form sections below.</p>
             <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-emerald-700/80 dark:text-emerald-400/80">
                <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5"/> Mention entry criteria & market conditions</span>
                <span className="flex items-center gap-1.5"><Brain className="w-3.5 h-3.5"/> Discuss emotions before, during, and after</span>
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5"/> State rule violations and lessons learned</span>
             </div>
           </div>
        </div>
        <VoiceJournalButton onParsedData={handleVoiceDataParsed} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* === SECTION 1: TRADE DETAILS === */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 md:p-8 shadow-sm">
           <FormSectionHeader title="Trade Details" icon={<Layers className="w-5 h-5" />} color="zinc" />
           
           <div className="space-y-6">
              {/* Account & Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                 <div className="lg:col-span-2">
                    <label className={labelClass}>Trading Account</label>
                    <select
                      name="accountId"
                      value={formData.accountId || ''}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    >
                      <option value="">Select account...</option>
                      {allAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type}) – {acc.currency} {Number(acc.balance).toFixed(0)}
                        </option>
                      ))}
                    </select>
                 </div>
                 <div>
                    <label className={labelClass}>Asset Type</label>
                    <select name="assetType" value={formData.assetType} onChange={handleChange} className={inputClass}>
                      {Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className={labelClass}>Direction</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setFormData((p: any) => ({ ...p, direction: TradeDirection.LONG }))}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm border
                          ${formData.direction === TradeDirection.LONG ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20' : 'bg-white dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10'}`}>
                        <TrendingUp className="w-3.5 h-3.5" /> Long
                      </button>
                      <button type="button" onClick={() => setFormData((p: any) => ({ ...p, direction: TradeDirection.SHORT }))}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm border
                          ${formData.direction === TradeDirection.SHORT ? 'bg-red-500 text-white border-red-600 shadow-red-500/20' : 'bg-white dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10'}`}>
                        <TrendingDown className="w-3.5 h-3.5" /> Short
                      </button>
                    </div>
                 </div>
              </div>

              {/* Symbol & Quantity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                    <label className={labelClass}>Symbol</label>
                    <input type="text" name="symbol" value={formData.symbol} onChange={handleChange} placeholder="EURUSD" className={inputClass} required />
                 </div>
                 <div>
                    <label className={labelClass}>Quantity (Lots/Units)</label>
                    <input type="number" name="quantity" value={formData.quantity || ''} onChange={handleChange} placeholder="0.00" step="any" className={inputClass} required />
                 </div>
              </div>

              {/* Entry & Exit & Risk */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                 <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-2 mb-3">
                       <div className="p-1 bg-blue-100 dark:bg-emerald-500/10 rounded text-blue-600 dark:text-emerald-400"><TrendingUp className="w-3 h-3" /></div>
                       <span className="text-xs font-bold text-zinc-500 uppercase">Entry</span>
                    </div>
                    <div className="space-y-3">
                       <div>
                          <input type="number" name="entryPrice" value={formData.entryPrice || ''} onChange={handleChange} step="any" placeholder="Price" className={inputClass} required />
                       </div>
                       <div>
                          <input type="datetime-local" name="entryDate" value={formData.entryDate} onChange={handleChange} className={inputClass} required />
                       </div>
                    </div>
                 </div>

                 <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-2 mb-3">
                       <div className="p-1 bg-purple-100 dark:bg-emerald-500/10 rounded text-purple-600 dark:text-emerald-400"><TrendingDown className="w-3 h-3" /></div>
                       <span className="text-xs font-bold text-zinc-500 uppercase">Exit</span>
                    </div>
                    <div className="space-y-3">
                       <div>
                          <input type="number" name="exitPrice" value={formData.exitPrice || ''} onChange={handleChange} step="any" placeholder="Price" className={inputClass} />
                       </div>
                       <div>
                          <input type="datetime-local" name="exitDate" value={formData.exitDate || ''} onChange={handleChange} className={inputClass} />
                       </div>
                    </div>
                 </div>

                 <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-2 mb-3">
                       <div className="p-1 bg-red-100 dark:bg-red-500/10 rounded text-red-600 dark:text-red-400"><Target className="w-3 h-3" /></div>
                       <span className="text-xs font-bold text-zinc-500 uppercase">Targets</span>
                    </div>
                    <div className="space-y-3">
                       <div>
                          <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">Stop Loss</label>
                          <input type="number" name="stopLoss" value={formData.stopLoss || ''} onChange={handleChange} step="any" className={inputClass} />
                       </div>
                       <div>
                          <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">Take Profit</label>
                          <input type="number" name="takeProfit" value={formData.takeProfit || ''} onChange={handleChange} step="any" className={inputClass} />
                       </div>
                    </div>
                 </div>

                 <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-2 mb-3">
                       <div className="p-1 bg-amber-100 dark:bg-amber-500/10 rounded text-amber-600 dark:text-amber-400"><DollarSign className="w-3 h-3" /></div>
                       <span className="text-xs font-bold text-zinc-500 uppercase">Outcome</span>
                    </div>
                    <div className="space-y-3">
                       <div>
                          <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">Commission</label>
                          <input type="number" name="commission" value={formData.commission || ''} onChange={handleChange} step="any" className={inputClass} />
                       </div>
                       <div>
                          <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">Status</label>
                          <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                            {Object.values(TradeStatus).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* === SECTION 2: EXECUTION & CONTEXT === */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 md:p-8 shadow-sm">
           <FormSectionHeader title="Execution & Context" icon={<Target className="w-5 h-5" />} color="blue" />
           
           <div className="space-y-6">
              {/* Strategy Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                    <label className={labelClass}>Strategy</label>
                    <select name="strategyId" value={formData.strategyId || ''} onChange={handleChange} className={inputClass}>
                      <option value="">Select...</option>
                      {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className={labelClass}>Trading Session</label>
                    <select name="session" value={formData.session} onChange={handleChange} className={inputClass}>
                      {Object.values(TradingSession).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
              </div>

               {/* Tags */}
              <div>
                <label className={labelClass}>Tags</label>
                <CreatableSelect
                  isMulti
                  value={selectedTags}
                  onChange={(val) => setSelectedTags(val)}
                  placeholder="Add tags..."
                  styles={selectStyles}
                  classNamePrefix="select"
                />
              </div>

              {/* Context Chips & R:R */}
              <div className="p-5 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                 <div className="flex flex-wrap items-end gap-6">
                    <ChipSelector
                      label="Market Condition"
                      value={formData.marketCondition}
                      onChange={(v) => setFormData((p: any) => ({ ...p, marketCondition: v }))}
                      options={Object.values(MarketCondition).map(c => ({ value: c, label: c }))}
                      color="blue"
                    />
                    <ChipSelector
                      label="Timeframe"
                      value={formData.timeframe}
                      onChange={(v) => setFormData((p: any) => ({ ...p, timeframe: v }))}
                      options={Object.values(Timeframe).map(t => ({ value: t, label: t }))}
                      color="blue"
                    />
                    <ChipSelector
                      label="HTF Bias"
                      value={formData.htfBias}
                      onChange={(v) => setFormData((p: any) => ({ ...p, htfBias: v }))}
                      options={Object.values(HTFBias).map(b => ({ value: b, label: b }))}
                      color="blue"
                    />
                    <ToggleChip
                      label="News Impact"
                      value={formData.newsImpact}
                      onChange={(v) => setFormData((p: any) => ({ ...p, newsImpact: v }))}
                    />
                    <div>
                      <label className={labelClass}>Planned R:R</label>
                      <input type="number" value={formData.plannedRR || ''} onChange={(e) => setFormData((p: any) => ({ ...p, plannedRR: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        placeholder="2.0" step="0.5" className="w-20 px-3 py-2 text-sm text-center rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10" />
                    </div>
                 </div>
              </div>

              {/* Chart Upload */}
              <div>
                 <label className={labelClass}>Chart Snapshot</label>
                 <div className="flex items-center gap-4">
                    <label className="flex-1 flex items-center justify-center gap-2 px-6 py-8 border-2 border-dashed border-zinc-300 dark:border-white/10 rounded-2xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-all group">
                      <div className="text-center group-hover:scale-105 transition-transform">
                         <Upload className="w-6 h-6 text-zinc-400 group-hover:text-emerald-500 mx-auto mb-2" />
                         <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-600">
                           {selectedFile ? selectedFile.name : 'Click to Upload Chart Image'}
                         </span>
                      </div>
                      <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                    </label>
                    {imagePreviewUrl && (
                      <div className="relative w-32 h-32 shrink-0">
                        <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover rounded-xl border border-zinc-200 dark:border-white/10 shadow-sm" />
                        <button type="button" onClick={() => { setSelectedFile(null); setImagePreviewUrl(null); }}
                          className="absolute -top-2 -right-2 p-1.5 bg-red-500 rounded-full text-white shadow-md hover:bg-red-600 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                 </div>
              </div>

           </div>
        </div>

        {/* === SECTION 3: ANALYSIS & PSYCHOLOGY === */}
        <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 md:p-8 shadow-sm">
           <FormSectionHeader title="Analysis & Psychology" icon={<Brain className="w-5 h-5" />} color="purple" />
           
           <div className="space-y-6">
              {/* Psychology Headers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <EmotionChipPicker label="Emotion Before" value={formData.emotionBefore} onChange={(v) => setFormData((p: any) => ({ ...p, emotionBefore: v }))} />
                 <EmotionChipPicker label="Emotion During" value={formData.emotionDuring} onChange={(v) => setFormData((p: any) => ({ ...p, emotionDuring: v }))} />
                 <EmotionChipPicker label="Emotion After" value={formData.emotionAfter} onChange={(v) => setFormData((p: any) => ({ ...p, emotionAfter: v }))} />
              </div>

              {/* Performance Ratings */}
              <div className="p-5 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                 <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                    <StarRating label="Confidence" value={formData.confidenceLevel} onChange={(v) => setFormData((p: any) => ({ ...p, confidenceLevel: v }))} max={5} />
                    <StarRating label="Sleep Quality" value={formData.sleepQuality} onChange={(v) => setFormData((p: any) => ({ ...p, sleepQuality: v }))} max={5} />
                    <StarRating label="Energy Level" value={formData.energyLevel} onChange={(v) => setFormData((p: any) => ({ ...p, energyLevel: v }))} max={5} />
                    <StarRating label="Focus" value={formData.distractionLevel ? 6 - formData.distractionLevel : undefined} 
                        onChange={(v) => setFormData((p: any) => ({ ...p, distractionLevel: v ? 6 - v : undefined }))} max={5} />
                    
                    <div className="h-8 w-px bg-zinc-200 dark:bg-white/10 hidden md:block"></div>
                    
                    <ToggleChip label="Followed Plan" value={formData.followedPlan} onChange={(v) => setFormData((p: any) => ({ ...p, followedPlan: v }))} />
                    <ToggleChip label="Hesitated" value={formData.hesitated} onChange={(v) => setFormData((p: any) => ({ ...p, hesitated: v }))} />
                    <ToggleChip label="Prepared to Lose" value={formData.preparedToLose} onChange={(v) => setFormData((p: any) => ({ ...p, preparedToLose: v }))} />
                 </div>
              </div>

              {/* Notes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                    <label className={labelClass}>Entry Reason</label>
                    <textarea name="entryReason" value={formData.entryReason || ''} onChange={handleChange} rows={3}
                      placeholder="Why did you enter this trade?" className={inputClass} />
                 </div>
                 <div>
                    <label className={labelClass}>Setup Details</label>
                    <textarea name="setupDetails" value={formData.setupDetails || ''} onChange={handleChange} rows={3}
                      placeholder="Describe the setup..." className={inputClass} />
                 </div>
                 <div>
                    <label className={labelClass}>Mistakes Made</label>
                    <textarea name="mistakesMade" value={formData.mistakesMade || ''} onChange={handleChange} rows={3}
                      placeholder="What went wrong?" className={inputClass} />
                 </div>
                 <div>
                    <label className={labelClass}>Lessons Learned</label>
                    <textarea name="lessonsLearned" value={formData.lessonsLearned || ''} onChange={handleChange} rows={3}
                      placeholder="What did you learn?" className={inputClass} />
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                     <label className={labelClass}>Trading Environment / Location</label>
                     <input type="text" value={formData.tradingEnvironment || ''} onChange={(e) => setFormData((p: any) => ({ ...p, tradingEnvironment: e.target.value }))}
                        placeholder="Home, Office, Cafe..." className={inputClass} />
                 </div>
                 <div>
                     <label className={labelClass}>General Notes</label>
                     <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={1}
                        placeholder="Any additional observations..." className={inputClass} style={{ minHeight: '42px', resize: 'none' }} />
                 </div>
              </div>
           </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-zinc-200 dark:border-white/10 sticky bottom-0 bg-zinc-50/95 dark:bg-black/95 backdrop-blur-sm p-4 -mx-4 -mb-6 md:mx-0 md:mb-0 md:bg-transparent md:backdrop-filter-none">
          {isEditMode && initialData?.groupId && (
            <button
              type="button"
              onClick={() => setIsSyncModalOpen(true)}
              className="px-6 py-3 text-sm font-bold rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all shadow-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Sync Journal to Group
            </button>
          )}
          {onCancel && (
            <button type="button" onClick={onCancel}
              className="px-6 py-3 text-sm font-bold rounded-xl bg-white dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/10 transition-all shadow-sm">
              Cancel
            </button>
          )}
          <button type="submit" disabled={tradeSubmitLoading || isUploading}
            className="px-8 py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {tradeSubmitLoading || isUploading ? 'Saving Trade...' : (
              <>
                {isEditMode ? <Save className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {isEditMode ? 'Update Trade' : 'Log Trade'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Sync Journal Modal */}
      <Modal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        title="Sync Journal to Group"
        description="This trade is part of a larger position group. Do you want to copy your analysis, notes, and tags downward to the other trades?"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button 
              onClick={() => setIsSyncModalOpen(false)}
              disabled={isSyncing}
              className="px-4 py-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleSyncJournalToGroup}
              disabled={isSyncing}
              className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : 'Confirm Sync'}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <label 
            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${syncMode === 'PARTIAL' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10' : 'border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
            onClick={() => setSyncMode('PARTIAL')}
          >
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${syncMode === 'PARTIAL' ? 'border-blue-500' : 'border-zinc-300 dark:border-zinc-600'}`}>
              {syncMode === 'PARTIAL' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">Fill Empty Only (Recommended)</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Only copies notes/analysis fields to other trades if they are currently blank. Preserves existing notes.</div>
            </div>
          </label>

          <label 
            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${syncMode === 'OVERRIDE' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10' : 'border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
            onClick={() => setSyncMode('OVERRIDE')}
          >
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${syncMode === 'OVERRIDE' ? 'border-blue-500' : 'border-zinc-300 dark:border-zinc-600'}`}>
              {syncMode === 'OVERRIDE' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">Override All</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Replaces all analysis on the other grouped trades with the exact analysis written here. Data will be lost.</div>
            </div>
          </label>
        </div>
      </Modal>
    </div>
  );
}
