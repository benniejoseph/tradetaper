/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/trades/TradeForm.tsx - Compact Tabbed Redesign
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
import { FormTabs, Tab } from '../ui/FormTabs';
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
  Zap
} from 'lucide-react';

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

export default function TradeForm({ initialData, isEditMode = false, onFormSubmitSuccess, onCancel }: TradeFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isLoading: tradeSubmitLoading, error: tradeSubmitError } = useSelector((state: RootState) => state.trades);
  const selectedAccountIdFromStore = useSelector(selectSelectedAccountId);
  const availableAccounts = useSelector(selectAvailableAccounts);
  const mt5Accounts = useSelector(selectMT5Accounts) as MT5Account[];
  const { theme } = useTheme();

  // Tab state
  const [activeTab, setActiveTab] = useState('trade');
  
  // Form state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [selectedTags, setSelectedTags] = useState<MultiValue<TagOption>>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);

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
    ictConcept: initialData?.ictConcept || '',
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

  // Tab configuration
  const tabs: Tab[] = [
    { id: 'trade', label: 'Trade', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'execution', label: 'Execution', icon: <Target className="w-4 h-4" /> },
    { id: 'analysis', label: 'Analysis', icon: <Brain className="w-4 h-4" /> },
  ];

  // Compact input classes
  const inputClass = "w-full px-3 py-2 text-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all";
  const labelClass = "text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block";
  const cardClass = "bg-white/50 dark:bg-white/[0.02] rounded-2xl border border-gray-200/50 dark:border-white/5 p-4";

  // React Select styles
  const selectStyles: StylesConfig<TagOption, true> = {
    control: (p, s) => ({ ...p, backgroundColor: 'transparent', borderColor: s.isFocused ? 'rgb(16 185 129)' : 'rgb(229 231 235)', borderRadius: '0.75rem', minHeight: '38px' }),
    menu: (p) => ({ ...p, backgroundColor: 'var(--bg-primary)', borderRadius: '0.75rem', zIndex: 50 }),
    option: (p, s) => ({ ...p, backgroundColor: s.isSelected ? 'rgb(16 185 129)' : s.isFocused ? 'rgba(16,185,129,0.1)' : 'transparent', color: s.isSelected ? 'white' : 'inherit' }),
    multiValue: (p) => ({ ...p, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '0.5rem' }),
    multiValueLabel: (p) => ({ ...p, color: 'rgb(16 185 129)', fontWeight: 500 }),
  };

  return (
    <div className="w-full">
      {/* Error Display */}
      {(formError || tradeSubmitError) && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
          {formError || tradeSubmitError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Tabbed Content */}
        <FormTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
          
          {/* === TAB 1: TRADE === */}
          {activeTab === 'trade' && (
            <div className="space-y-4">
              {/* Account Selection */}
              <div className={cardClass}>
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

              {/* Core Trade Grid */}
              <div className={cardClass}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className={labelClass}>Asset Type</label>
                    <select name="assetType" value={formData.assetType} onChange={handleChange} className={inputClass}>
                      {Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Symbol</label>
                    <input type="text" name="symbol" value={formData.symbol} onChange={handleChange} placeholder="EURUSD" className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Direction</label>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setFormData((p: any) => ({ ...p, direction: TradeDirection.LONG }))}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all
                          ${formData.direction === TradeDirection.LONG ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400'}`}>
                        <TrendingUp className="w-3 h-3" /> Long
                      </button>
                      <button type="button" onClick={() => setFormData((p: any) => ({ ...p, direction: TradeDirection.SHORT }))}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all
                          ${formData.direction === TradeDirection.SHORT ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400'}`}>
                        <TrendingDown className="w-3 h-3" /> Short
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Quantity</label>
                    <input type="number" name="quantity" value={formData.quantity || ''} onChange={handleChange} placeholder="0.01" step="any" className={inputClass} required />
                  </div>
                </div>
              </div>

              {/* Entry & Exit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={cardClass}>
                  <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Entry
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Price</label>
                      <input type="number" name="entryPrice" value={formData.entryPrice || ''} onChange={handleChange} step="any" className={inputClass} required />
                    </div>
                    <div>
                      <label className={labelClass}>Date & Time</label>
                      <input type="datetime-local" name="entryDate" value={formData.entryDate} onChange={handleChange} className={inputClass} required />
                    </div>
                  </div>
                </div>
                <div className={cardClass}>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> Exit (Optional)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Price</label>
                      <input type="number" name="exitPrice" value={formData.exitPrice || ''} onChange={handleChange} step="any" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Date & Time</label>
                      <input type="datetime-local" name="exitDate" value={formData.exitDate || ''} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Management */}
              <div className={cardClass}>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className={labelClass}>Stop Loss</label>
                    <input type="number" name="stopLoss" value={formData.stopLoss || ''} onChange={handleChange} step="any" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Take Profit</label>
                    <input type="number" name="takeProfit" value={formData.takeProfit || ''} onChange={handleChange} step="any" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Commission</label>
                    <input type="number" name="commission" value={formData.commission || ''} onChange={handleChange} step="any" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                      {Object.values(TradeStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>R:R</label>
                    <div className={`${inputClass} flex items-center justify-center font-bold ${formData.rMultiple >= 2 ? 'text-emerald-600' : formData.rMultiple >= 1 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {formData.rMultiple ? `${formData.rMultiple}R` : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === TAB 2: EXECUTION === */}
          {activeTab === 'execution' && (
            <div className="space-y-4">
              {/* Strategy & ICT */}
              <div className={cardClass}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Strategy</label>
                    <select name="strategyId" value={formData.strategyId || ''} onChange={handleChange} className={inputClass}>
                      <option value="">Select...</option>
                      {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>ICT Concept</label>
                    <input type="text" name="ictConcept" value={formData.ictConcept || ''} onChange={handleChange} placeholder="FVG, OB, BMS..." className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Session</label>
                    <select name="session" value={formData.session} onChange={handleChange} className={inputClass}>
                      {Object.values(TradingSession).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className={cardClass}>
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

              {/* Market Context */}
              <div className={cardClass}>
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" /> Market Context
                </h4>
                <div className="flex flex-wrap items-start gap-4">
                  <ChipSelector
                    label="Condition"
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
                    label="News"
                    value={formData.newsImpact}
                    onChange={(v) => setFormData((p: any) => ({ ...p, newsImpact: v }))}
                  />
                  <div>
                    <label className={labelClass}>Planned R:R</label>
                    <input type="number" value={formData.plannedRR || ''} onChange={(e) => setFormData((p: any) => ({ ...p, plannedRR: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      placeholder="2.0" step="0.5" className="w-16 px-2 py-1.5 text-sm text-center rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10" />
                  </div>
                </div>
              </div>

              {/* Chart Upload */}
              <div className={cardClass}>
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-1">
                  <Upload className="w-3 h-3" /> Chart Snapshot
                </h4>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{selectedFile ? selectedFile.name : 'Upload chart'}</span>
                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                  </label>
                  {imagePreviewUrl && (
                    <div className="relative w-20 h-20">
                      <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                      <button type="button" onClick={() => { setSelectedFile(null); setImagePreviewUrl(null); }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* === TAB 3: ANALYSIS === */}
          {activeTab === 'analysis' && (
            <div className="space-y-4">
              {/* Psychology */}
              <div className={cardClass}>
                <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-1">
                  <Brain className="w-3 h-3" /> Psychology & Mindset
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <EmotionChipPicker label="Before" value={formData.emotionBefore} onChange={(v) => setFormData((p: any) => ({ ...p, emotionBefore: v }))} />
                  <EmotionChipPicker label="During" value={formData.emotionDuring} onChange={(v) => setFormData((p: any) => ({ ...p, emotionDuring: v }))} />
                  <EmotionChipPicker label="After" value={formData.emotionAfter} onChange={(v) => setFormData((p: any) => ({ ...p, emotionAfter: v }))} />
                </div>
                <div className="flex flex-wrap items-center gap-6">
                  <StarRating label="Confidence" value={formData.confidenceLevel} onChange={(v) => setFormData((p: any) => ({ ...p, confidenceLevel: v }))} max={5} />
                  <ToggleChip label="Followed Plan" value={formData.followedPlan} onChange={(v) => setFormData((p: any) => ({ ...p, followedPlan: v }))} />
                  <ChipSelector
                    label="Grade"
                    value={formData.executionGrade}
                    onChange={(v) => setFormData((p: any) => ({ ...p, executionGrade: v }))}
                    options={Object.values(ExecutionGrade).map(g => ({ value: g, label: g }))}
                    color="purple"
                  />
                </div>
              </div>

              {/* Environment */}
              <div className={cardClass}>
                <h4 className="text-xs font-bold text-green-600 dark:text-green-400 mb-3 flex items-center gap-1">
                  <Home className="w-3 h-3" /> Trading Environment
                </h4>
                <div className="flex flex-wrap items-center gap-6">
                  <StarRating label="Sleep" value={formData.sleepQuality} onChange={(v) => setFormData((p: any) => ({ ...p, sleepQuality: v }))} max={5} />
                  <StarRating label="Energy" value={formData.energyLevel} onChange={(v) => setFormData((p: any) => ({ ...p, energyLevel: v }))} max={5} />
                  <StarRating label="Focus" value={formData.distractionLevel ? 6 - formData.distractionLevel : undefined} 
                    onChange={(v) => setFormData((p: any) => ({ ...p, distractionLevel: v ? 6 - v : undefined }))} max={5} />
                  <div>
                    <label className={labelClass}>Location</label>
                    <input type="text" value={formData.tradingEnvironment || ''} onChange={(e) => setFormData((p: any) => ({ ...p, tradingEnvironment: e.target.value }))}
                      placeholder="Home, Office..." className="w-28 px-2 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10" />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className={cardClass}>
                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Notes & Reflections
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Entry Reason</label>
                    <textarea name="entryReason" value={formData.entryReason || ''} onChange={handleChange} rows={2}
                      placeholder="Why did you enter?" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Setup Details</label>
                    <textarea name="setupDetails" value={formData.setupDetails || ''} onChange={handleChange} rows={2}
                      placeholder="Describe your setup..." className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Mistakes</label>
                    <textarea name="mistakesMade" value={formData.mistakesMade || ''} onChange={handleChange} rows={2}
                      placeholder="What could be improved?" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Lessons Learned</label>
                    <textarea name="lessonsLearned" value={formData.lessonsLearned || ''} onChange={handleChange} rows={2}
                      placeholder="Key takeaways..." className={inputClass} />
                  </div>
                </div>
                <div className="mt-3">
                  <label className={labelClass}>General Notes</label>
                  <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows={3}
                    placeholder="Any other observations..." className={inputClass} />
                </div>
              </div>
            </div>
          )}
        </FormTabs>

        {/* Submit Buttons - Fixed at Bottom */}
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
          {onCancel && (
            <button type="button" onClick={onCancel}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-all">
              Cancel
            </button>
          )}
          <button type="submit" disabled={tradeSubmitLoading || isUploading}
            className="px-6 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {tradeSubmitLoading || isUploading ? 'Saving...' : (
              <>
                {isEditMode ? <Save className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {isEditMode ? 'Update Trade' : 'Log Trade'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}