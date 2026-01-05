/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/trades/TradeForm.tsx
"use client";
import React, { useState, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import { Trade, CreateTradePayload, UpdateTradePayload, AssetType, TradeDirection, TradeStatus,
  Tag as TradeTagType
 } from '@/types/trade';
import { Strategy } from '@/types/strategy';
import { strategiesService } from '@/services/strategiesService';
import { TradingSession } from '@/types/enums';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { createTrade, updateTrade } from '@/store/features/tradesSlice';
import { selectSelectedAccountId, selectAvailableAccounts } from '@/store/features/accountSlice';
import { selectMT5Accounts, fetchMT5Accounts, MT5Account } from '@/store/features/mt5AccountsSlice';
import { authApiClient } from '@/services/api'; // To make direct API call for file upload
import { useTheme } from '@/context/ThemeContext'; // Import useTheme

// Define ValidationError type inline
type ValidationError = { field: string; message: string };

// Helper function to get field error
const getFieldError = (errors: ValidationError[], fieldName: string): string | null => {
  const error = errors.find(err => err.field === fieldName);
  return error ? error.message : null;
};

// Simple validation function
const validateTradeData = (data: any): { isValid: boolean; errors: ValidationError[] } => {
  const errors: ValidationError[] = [];
  
  if (!data.symbol || data.symbol.trim() === '') {
    errors.push({ field: 'symbol', message: 'Symbol is required' });
  }
  if (!data.entryPrice || data.entryPrice <= 0) {
    errors.push({ field: 'entryPrice', message: 'Entry price must be greater than 0' });
  }
  if (!data.quantity || data.quantity <= 0) {
    errors.push({ field: 'quantity', message: 'Quantity must be greater than 0' });
  }
  if (!data.entryDate) {
    errors.push({ field: 'entryDate', message: 'Entry date is required' });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

import CreatableSelect from 'react-select/creatable';
import { ActionMeta, MultiValue, OnChangeValue, StylesConfig } from 'react-select';
import { FaUpload, FaTimesCircle, FaCalculator, FaSave, FaPaperPlane } from 'react-icons/fa';
import { FormInput } from '../ui/FormInput';
import { FormSelect } from '../ui/FormSelect';
import { FormTextarea } from '../ui/FormTextarea';

interface TagOption {
  readonly label: string;
  readonly value: string; // Typically same as label for tags
  readonly color?: string; // Optional for display
  readonly isNew?: boolean; // For creatable
}

interface TradeFormProps {
  initialData?: Trade;
  isEditMode?: boolean;
  onFormSubmitSuccess?: (tradeId?: string) => void;
  onCancel?: () => void;
}

// Helper function to safely get enum key for initialData
const getEnumValue = <T extends object>(enumObj: T, value: any, defaultValue: T[keyof T]): T[keyof T] => {
  if (value && Object.values(enumObj).includes(value as T[keyof T])) {
    return value as T[keyof T];
  }
  return defaultValue;
};

const formatDateForInput = (dateString?: string): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const tzoffset = date.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
        return localISOTime;
    } catch (error) {
        return '';
    }
};

export default function TradeForm({ initialData, isEditMode = false, onFormSubmitSuccess, onCancel }: TradeFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isLoading: tradeSubmitLoading, error: tradeSubmitError } = useSelector((state: RootState) => state.trades);
  const selectedAccountIdFromStore = useSelector(selectSelectedAccountId);
  const availableAccounts = useSelector(selectAvailableAccounts);
  const mt5Accounts = useSelector(selectMT5Accounts) as MT5Account[];
  const { theme } = useTheme(); // Get current theme for dynamic styles

  // Merge accounts for dropdown
  const allAccounts = useMemo(() => {
    const manualAccountsFormatted = availableAccounts.map(acc => ({
      id: acc.id,
      name: acc.name,
      balance: acc.balance,
      currency: acc.currency,
      type: 'Manually Added'
    }));
    
    const mt5AccountsFormatted = mt5Accounts.map(acc => ({
      id: acc.id,
      name: acc.accountName, // Map accountName to name
      balance: acc.balance || 0,
      currency: acc.currency || 'USD',
      type: 'MT5 Linked'
    }));

    return [...manualAccountsFormatted, ...mt5AccountsFormatted];
  }, [availableAccounts, mt5Accounts]);

  // Fetch MT5 accounts if needed
  useEffect(() => {
    if (mt5Accounts.length === 0) {
      dispatch(fetchMT5Accounts());
    }
  }, [dispatch, mt5Accounts.length]);

  // Add validation state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const sectionContainerClasses = "bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl p-8 rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 shadow-lg hover:shadow-xl transition-all duration-200";
  const sectionTitleClasses = "text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-emerald-200/30 dark:border-emerald-700/30 flex items-center space-x-3";
  const labelClasses = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";

  const [selectedTags, setSelectedTags] = useState<MultiValue<TagOption>>([]);

  const [formData, setFormData] = useState<Omit<CreateTradePayload | UpdateTradePayload, 'tagNames' | 'strategyTag'> & 
    { stopLoss?: number; takeProfit?: number; rMultiple?: number; session?: TradingSession; accountId?: string; isStarred?: boolean; strategyId?: string; }>
  ({
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
  });

  // State for calculated R:R - to be implemented properly later
  const [calculatedRR, setCalculatedRR] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);

  // Remove handleFileChange as it's now handled by ChartUploadButton
  // const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => { ... };

  // Remove selectedFile, imagePreviewUrl, isUploading states as they are now handled by ChartUploadButton
  // const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(initialData?.imageUrl || null);
  // const [isUploading, setIsUploading] = useState(false);

  // Calculate R:R and update formData.rMultiple
  useEffect(() => {
    const entry = parseFloat(formData.entryPrice as any);
    const sl = parseFloat(formData.stopLoss as any);
    const tp = parseFloat(formData.takeProfit as any);

    if (formData.direction && !isNaN(entry) && !isNaN(sl) && !isNaN(tp) && sl !== entry && tp !== entry) {
      let riskPerUnit: number;
      let rewardPerUnit: number;

      if (formData.direction === TradeDirection.LONG) {
        riskPerUnit = entry - sl;
        rewardPerUnit = tp - entry;
      } else if (formData.direction === TradeDirection.SHORT) {
        riskPerUnit = sl - entry;
        rewardPerUnit = entry - tp;
      } else {
        setFormData(prev => ({ ...prev, rMultiple: undefined }));
        return;
      }

      if (riskPerUnit > 0 && rewardPerUnit > 0) {
        const rr = rewardPerUnit / riskPerUnit;
        setFormData(prev => ({ ...prev, rMultiple: parseFloat(rr.toFixed(2)) }));
      } else {
        setFormData(prev => ({ ...prev, rMultiple: undefined }));
      }
    } else {
      setFormData(prev => ({ ...prev, rMultiple: undefined }));
    }
  }, [formData.entryPrice, formData.stopLoss, formData.takeProfit, formData.direction]);

  // Load strategies
  useEffect(() => {
    const loadStrategies = async () => {
      try {
        const data = await strategiesService.getStrategies();
        setStrategies(data);
      } catch (error) {
        console.error('Error loading strategies:', error);
      }
    };
    loadStrategies();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData(prevFormData => ({
        ...prevFormData,
        accountId: initialData.accountId || selectedAccountIdFromStore || undefined,
        assetType: initialData.assetType,
        symbol: initialData.symbol,
        direction: initialData.direction,
        status: initialData.status,
        entryDate: formatDateForInput(initialData.entryDate),
        entryPrice: initialData.entryPrice,
        stopLoss: initialData.stopLoss ?? undefined,
        takeProfit: initialData.takeProfit ?? undefined,
        exitDate: formatDateForInput(initialData.exitDate),
        exitPrice: initialData.exitPrice ?? undefined,
        quantity: initialData.quantity,
        commission: initialData.commission,
        notes: initialData.notes || '',
        session: getEnumValue(TradingSession, initialData?.session, TradingSession.NEW_YORK),
        setupDetails: initialData?.setupDetails || '',
        mistakesMade: initialData?.mistakesMade || '',
        lessonsLearned: initialData?.lessonsLearned || '',
        imageUrl: initialData?.imageUrl || '',
        rMultiple: initialData?.rMultiple ?? undefined,
        isStarred: initialData?.isStarred || false,
        strategyId: initialData?.strategyId || undefined,
      }));
      setImagePreviewUrl(initialData.imageUrl || null);
      setSelectedFile(null);
      if (initialData.tags && initialData.tags.length > 0) {
        setSelectedTags(initialData.tags.map(tag => ({ label: tag.name, value: tag.name, color: tag.color })));
      } else {
        setSelectedTags([]);
      }
    }
  }, [initialData]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'isStarred' && type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, isStarred: checked }));
    } else {
      let val: string | number | boolean | undefined = value; // Allow boolean for isStarred
      if (type === 'number') val = value === '' ? undefined : parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: val }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    // File validation - show errors via formError instead
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setFormError("File is too large (max 5MB).");
        return;
      }
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setFormError("Invalid file type. Please select an image (PNG, JPG, GIF, WEBP).");
        return;
      }

      setSelectedFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, imageUrl: '' }));
      setFormError(null); // Clear any previous errors
    } else {
      setSelectedFile(null);
      setImagePreviewUrl(initialData?.imageUrl || null);
    }
  };

  const handleTagChange = (newValue: MultiValue<TagOption>) => {
    setSelectedTags(newValue);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setValidationErrors([]); // Clear previous validation errors

    // Client-side validation
    const validationResult = validateTradeData({
      ...formData,
      assetType: formData.assetType as AssetType,
      symbol: formData.symbol as string,
      direction: formData.direction as TradeDirection,
      entryDate: formData.entryDate as string,
      entryPrice: formData.entryPrice as number,
      quantity: formData.quantity as number,
      tagNames: selectedTags.map(tagOption => tagOption.value),
      isStarred: formData.isStarred,
    });

    if (!validationResult.isValid) {
      setValidationErrors(validationResult.errors);
      setFormError('Please fix the validation errors below.');
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload image to GCS if a new file is selected
      let uploadedImageUrl = formData.imageUrl || '';
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        
        try {
          const uploadResponse = await authApiClient.post('/files/upload/trade-image', uploadFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          uploadedImageUrl = uploadResponse.data.url;
        } catch (uploadError: any) {
          setFormError(`Image upload failed: ${uploadError.response?.data?.message || uploadError.message}`);
          setIsUploading(false);
          return;
        }
      }
      
      const finalTagNames = selectedTags.map(tagOption => tagOption.value);
      const payload: CreateTradePayload | UpdateTradePayload = {
          ...formData,
          session: formData.session,
          tagNames: finalTagNames,
          imageUrl: uploadedImageUrl,
          assetType: formData.assetType as AssetType,
          symbol: formData.symbol as string,
          direction: formData.direction as TradeDirection,
          entryDate: formData.entryDate as string,
          entryPrice: formData.entryPrice as number,
          quantity: formData.quantity as number,
          isStarred: formData.isStarred,
      };

      // Remove rMultiple from payload as it should be calculated on backend
      delete (payload as any).rMultiple;

      let resultAction;
      if (isEditMode && initialData?.id) {
        resultAction = await dispatch(updateTrade({ id: initialData.id, payload: payload as UpdateTradePayload }));
        if (updateTrade.fulfilled.match(resultAction)) {
          if (onFormSubmitSuccess) {
            onFormSubmitSuccess(resultAction.payload.id);
          } else {
            router.push('/journal');
          }
        }
      } else {
        resultAction = await dispatch(createTrade(payload as CreateTradePayload));
        if (createTrade.fulfilled.match(resultAction)) {
          if (onFormSubmitSuccess) {
            onFormSubmitSuccess(resultAction.payload.id);
          } else {
            router.push('/journal');
          }
        }
      }
      if (resultAction.meta.requestStatus === 'rejected') {
        setFormError(resultAction.payload as string || 'Submission failed');
      }

    } catch (error: any) { 
      setFormError(error.message || 'An unexpected error occurred.');
    } finally {
      setIsUploading(false);
    }
  };

  // --- CUSTOM STYLES FOR REACT-SELECT (Robust Theming) ---
  const selectStyles: StylesConfig<TagOption, true> = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'var(--bg-secondary)', // Use CSS variables
      borderColor: state.isFocused ? 'var(--accent)' : 'var(--border)',
      boxShadow: state.isFocused ? '0 0 0 2px var(--shadow-md)' : 'none', 
      borderRadius: '0.75rem', 
      minHeight: '46px', 
      transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
      '&:hover': {
        borderColor: state.isFocused ? 'var(--accent)' : 'var(--border-hover)',
      },
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '2px 8px',
    }),
    input: (provided) => ({
      ...provided,
      color: 'var(--text-primary)',
      margin: '0px',
      padding: '0px',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'var(--text-tertiary)',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'var(--text-primary)',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: 'var(--bg-tertiary)',
      borderRadius: '0.375rem',
      border: '1px solid var(--border)',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'var(--text-secondary)',
      fontSize: '0.875rem',
      fontWeight: 500,
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'var(--text-tertiary)',
      '&:hover': {
        backgroundColor: 'var(--error-light)',
        color: 'var(--error)',
      },
      borderTopRightRadius: '0.375rem',
      borderBottomRightRadius: '0.375rem',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'var(--bg-primary)',
      borderColor: 'var(--border)',
      borderWidth: '1px',
      borderRadius: '0.75rem',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 9999, 
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? 'var(--accent)' : state.isFocused ? 'var(--bg-secondary)' : 'transparent',
      color: state.isSelected ? 'white' : 'var(--text-primary)',
      fontSize: '0.875rem',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: 'var(--accent-hover)',
      },
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (provided) => ({
        ...provided,
        color: 'var(--text-tertiary)',
        '&:hover': {
            color: 'var(--text-secondary)',
        }
    }),
    clearIndicator: (provided) => ({
        ...provided,
        color: 'var(--text-tertiary)',
        '&:hover': {
            color: 'var(--text-secondary)',
        }
    }),
  };
  // --- END CUSTOM STYLES FOR REACT-SELECT ---

  const calculatedRRColor = () => {
    if (formData.rMultiple === undefined || formData.rMultiple === null) return 'text-gray-600 dark:text-gray-400';
    if (formData.rMultiple >= 2) return 'text-green-600 dark:text-green-400'; 
    if (formData.rMultiple >= 1) return 'text-yellow-600 dark:text-yellow-400'; 
    if (formData.rMultiple > 0) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Helper function to render field validation errors
  const renderFieldError = (fieldName: string) => {
    const error = getFieldError(validationErrors, fieldName);
    if (!error) return null;
    
    return (
      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
        {error}
      </p>
    );
  };

  const buttonBaseClasses = "flex items-center justify-center space-x-2 px-6 py-3 font-semibold rounded-xl transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-opacity-70";
  const primaryButtonClasses = `bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white focus:ring-emerald-500 hover:scale-105 hover:shadow-xl`;
  const secondaryButtonClasses = 
    `bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 hover:bg-emerald-500 dark:hover:bg-emerald-500 text-gray-600 dark:text-gray-400 hover:text-white focus:ring-emerald-500 hover:scale-105 backdrop-blur-sm`;
  
  // Option theme classes for standard select
  const optionThemeClass = "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium";

  return (
    <div className="w-full space-y-8">
      {/* Global Form Error Messages */}
      {formError && (
        <div className="p-4 bg-red-50/90 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 text-red-700 dark:text-red-400 rounded-xl text-sm backdrop-blur-sm">
          {formError}
        </div>
      )}
      {tradeSubmitError && (
        <div className="p-4 bg-red-50/90 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 text-red-700 dark:text-red-400 rounded-xl text-sm backdrop-blur-sm">
          Submission Error: {tradeSubmitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Core Details */}
        {/* Section 1: Core Details */}
        <div className={sectionContainerClasses}>
          <h2 className={sectionTitleClasses}>
            <div className="p-2 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-xl">
              <FaCalculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span>Core Trade Information</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="md:col-span-2">
              <FormSelect
                label="Account"
                id="accountId" 
                name="accountId" 
                value={formData.accountId || ''} 
                onChange={handleChange} 
                required
                error={getFieldError(validationErrors, 'accountId')}
              >
                  <option value="" disabled>Select an account</option>
                  {allAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.type}) - {account.currency} {Number(account.balance).toFixed(2)}
                    </option>
                  ))}
              </FormSelect>
              {allAccounts.length === 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 mt-2">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                    <strong>No accounts available.</strong> You need to create a trading account first.
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Go to <strong>Settings → Manage Accounts</strong> to add your first trading account.
                  </p>
                </div>
              )}
            </div>
            <div>
              <FormSelect
                label="Asset Type"
                id="assetType" 
                name="assetType" 
                value={formData.assetType} 
                onChange={handleChange} 
                required
              >
                {Object.values(AssetType).map(type => <option key={type} value={type}>{type}</option>)}
              </FormSelect>
            </div>
            <div>
              <FormInput
                label="Symbol / Pair"
                type="text" 
                id="symbol" 
                name="symbol" 
                value={formData.symbol} 
                onChange={handleChange} 
                required 
                placeholder="e.g., AAPL, EURUSD, BTCUSDT"
                error={getFieldError(validationErrors, 'symbol')}
              />
            </div>
            <div>
              <FormSelect
                label="Direction"
                id="direction" 
                name="direction" 
                value={formData.direction} 
                onChange={handleChange} 
                required
              >
                {Object.values(TradeDirection).map(dir => <option key={dir} value={dir}>{dir}</option>)}
              </FormSelect>
            </div>
            <div>
              <FormSelect
                label="Status"
                id="status" 
                name="status" 
                value={formData.status} 
                onChange={handleChange} 
                required
              >
                {Object.values(TradeStatus).map(stat => <option key={stat} value={stat}>{stat}</option>)}
              </FormSelect>
            </div>
            <div className="md:col-span-2 flex items-center space-x-2 mt-2">
              <input
                type="checkbox"
                id="isStarred"
                name="isStarred"
                checked={!!formData.isStarred}
                onChange={handleChange}
                className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 dark:bg-emerald-950/20 dark:border-emerald-600/30"
              />
              <label htmlFor="isStarred" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-0">
                Mark as Starred
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Entry & Exit */}
        <div className={sectionContainerClasses}>
          <h2 className={sectionTitleClasses}>
            <div className="p-2 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-xl">
              <FaPaperPlane className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span>Entry & Exit Details</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <FormInput
                label="Entry Date & Time"
                type="datetime-local" 
                id="entryDate" 
                name="entryDate" 
                value={formData.entryDate} 
                onChange={handleChange} 
                required 
                error={getFieldError(validationErrors, 'entryDate')}
              />
            </div>
            <div>
              <FormInput
                label="Entry Price"
                type="number" 
                id="entryPrice" 
                name="entryPrice" 
                value={formData.entryPrice || ''} 
                onChange={handleChange} 
                required 
                placeholder="0.00" 
                step="any"
                error={getFieldError(validationErrors, 'entryPrice')}
              />
            </div>
            <div>
               <FormInput
                label="Exit Date & Time"
                type="datetime-local" 
                id="exitDate" 
                name="exitDate" 
                value={formData.exitDate || ''} 
                onChange={handleChange} 
                error={getFieldError(validationErrors, 'exitDate')}
              />
            </div>
            <div>
              <FormInput
                label="Exit Price"
                type="number" 
                id="exitPrice" 
                name="exitPrice" 
                value={formData.exitPrice || ''} 
                onChange={handleChange} 
                placeholder="0.00" 
                step="any"
                error={getFieldError(validationErrors, 'exitPrice')}
              />
            </div>
          </div>
        </div>
        
        {/* Section 3: Risk & Quantity */}
        <div className={sectionContainerClasses}>
            <h2 className={sectionTitleClasses}>
              <div className="p-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl">
                <FaCalculator className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <span>Risk, Reward & Quantity</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                    <FormInput
                        label="Stop Loss"
                        type="number" 
                        id="stopLoss" 
                        name="stopLoss" 
                        value={formData.stopLoss || ''} 
                        onChange={handleChange} 
                        placeholder="0.00" 
                        step="any"
                        error={getFieldError(validationErrors, 'stopLoss')}
                    />
                </div>
                <div>
                     <FormInput
                        label="Take Profit"
                        type="number" 
                        id="takeProfit" 
                        name="takeProfit" 
                        value={formData.takeProfit || ''} 
                        onChange={handleChange} 
                        placeholder="0.00" 
                        step="any"
                        error={getFieldError(validationErrors, 'takeProfit')}
                    />
                </div>
                <div>
                    <FormInput
                        label="Lots"
                        type="number" 
                        id="quantity" 
                        name="quantity" 
                        value={formData.quantity || ''} 
                        onChange={handleChange} 
                        required 
                        placeholder="e.g., 100, 0.01" 
                        step="any"
                        error={getFieldError(validationErrors, 'quantity')}
                    />
                </div>
                <div>
                    <FormInput
                        label="Commission"
                        type="number" 
                        id="commission" 
                        name="commission" 
                        value={formData.commission || ''} 
                        onChange={handleChange} 
                        placeholder="0.00" 
                        step="any"
                        error={getFieldError(validationErrors, 'commission')}
                    />
                </div>
                {formData.rMultiple !== undefined && (
                    <div className="md:col-span-2">
                        <p className={`text-sm font-medium ${calculatedRRColor()}`}>
                            Calculated R:R: {formData.rMultiple.toFixed(2)}R
                        </p>
                    </div>
                )}
            </div>
        </div>
        
        {/* Section 4: Strategy & Tags */}
        <div className={sectionContainerClasses}>
            <h2 className={sectionTitleClasses}>
              <div className="p-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl">
                <FaCalculator className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span>Strategy & Analysis</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                     <FormSelect
                        label="Trading Strategy"
                        id="strategyId" 
                        name="strategyId" 
                        value={formData.strategyId || ''} 
                        onChange={handleChange}
                    >
                        <option value="">No strategy selected</option>
                        {strategies.filter(s => s.isActive).map(strategy => (
                            <option key={strategy.id} value={strategy.id}>
                                {strategy.name}
                            </option>
                        ))}
                    </FormSelect>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Link this trade to a specific trading strategy for performance tracking
                    </p>
                </div>
                <div>
                    <FormSelect
                        label="Trading Session"
                        id="session" 
                        name="session" 
                        value={formData.session} 
                        onChange={handleChange}
                    >
                        {Object.values(TradingSession).map(sess => <option key={sess} value={sess}>{sess}</option>)}
                    </FormSelect>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Market session when this trade was executed
                    </p>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="tags" className={labelClasses}>Tags</label>
                    <CreatableSelect
                        isMulti
                        name="tags"
                        options={[]} // You might want to load existing tags as suggestions here
                        value={selectedTags}
                        onChange={handleTagChange}
                        placeholder="Type to add tags (e.g., Scalp, Breakout, Reversal)"
                        classNamePrefix="react-select"
                        styles={selectStyles} 
                    />
                </div>
            </div>
            
            <div className="space-y-5 mt-6 pt-6 border-t border-emerald-100/50 dark:border-emerald-800/30">
                <div>
                     <FormTextarea
                        label="Setup Details"
                        id="setupDetails" 
                        name="setupDetails" 
                        value={formData.setupDetails || ''} 
                        onChange={handleChange} 
                        placeholder="Describe your trade setup, confluence factors, etc."
                    />
                </div>
                <div>
                     <FormTextarea
                        label="Mistakes Made"
                        id="mistakesMade" 
                        name="mistakesMade" 
                        value={formData.mistakesMade || ''} 
                        onChange={handleChange} 
                        placeholder="Any deviations from your plan or execution errors?"
                    />
                </div>
                <div>
                     <FormTextarea
                        label="Lessons Learned"
                        id="lessonsLearned" 
                        name="lessonsLearned" 
                        value={formData.lessonsLearned || ''} 
                        onChange={handleChange} 
                        placeholder="What can you take away from this trade?"
                    />
                </div>
                <div>
                     <FormTextarea
                        label="General Notes"
                        id="notes" 
                        name="notes" 
                        value={formData.notes || ''} 
                        onChange={handleChange} 
                        placeholder="Any other observations or comments..."
                    />
                </div>
            </div>
        </div>
        
        {/* Section 6: Chart Upload */}
        <div className={sectionContainerClasses}>
            <h2 className={sectionTitleClasses}>
              <div className="p-2 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 rounded-xl">
                <FaUpload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span>Chart Snapshot</span>
            </h2>
            <div className="flex flex-col items-center space-y-6">
                <label htmlFor="file-upload" 
                    className={`w-full max-w-md flex flex-col items-center px-6 py-8 rounded-xl shadow-lg tracking-wide uppercase border-2 border-dashed cursor-pointer transition-all duration-200 backdrop-blur-sm
                                ${selectedFile || imagePreviewUrl ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/20' : 'border-emerald-300 dark:border-emerald-600/30 bg-emerald-50/80 dark:bg-emerald-950/10'} 
                                text-gray-700 dark:text-gray-300 
                                hover:bg-emerald-100/80 dark:hover:bg-emerald-900/30 
                                hover:border-emerald-400 dark:hover:border-emerald-500`}>
                    <FaUpload className={`text-4xl mb-3 ${selectedFile || imagePreviewUrl ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span className="text-sm font-medium leading-normal">{selectedFile ? selectedFile.name : (imagePreviewUrl ? "Change Chart" : "Upload Chart")}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</span>
                    <input id="file-upload" name="imageUrl" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"/>
                </label>
                {imagePreviewUrl && (
                    <div className="relative group max-w-md w-full">
                        <img src={imagePreviewUrl} alt="Selected chart preview" className="w-full h-auto rounded-2xl shadow-lg object-contain max-h-96 border border-emerald-200/50 dark:border-emerald-700/30" />
                        <button 
                            type="button" 
                            onClick={() => { setSelectedFile(null); setImagePreviewUrl(initialData?.imageUrl || null); setFormData(prev => ({...prev, imageUrl: initialData?.imageUrl || ''}))}}
                            className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-red-500 hover:bg-opacity-90 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg"
                            aria-label="Remove image">
                            <FaTimesCircle className="h-5 w-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Submission and Error Handling Section */}
        <div className={sectionContainerClasses}>
          <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6 border-t border-emerald-200/30 dark:border-emerald-700/30">
              {onCancel && (
                  <button 
                      type="button"
                      onClick={onCancel}
                      className={`${buttonBaseClasses} ${secondaryButtonClasses}`}
                  >
                      Cancel
                  </button>
              )}
              <button 
                  type="submit" 
                  disabled={tradeSubmitLoading || isUploading}
                  className={`${buttonBaseClasses} ${primaryButtonClasses} disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
              >
                  {tradeSubmitLoading || isUploading ? 'Saving...' : (isEditMode ? <><FaSave className="mr-2" /> Update Trade</> : <><FaPaperPlane className="mr-2" /> Log Trade</>)}
              </button>
          </div>
        </div>
      </form>
    </div>
  );
}