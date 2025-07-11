/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/trades/TradeForm.tsx
"use client";
import { useState, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
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
import { authApiClient } from '@/services/api'; // To make direct API call for file upload
import { useTheme } from '@/context/ThemeContext'; // Import useTheme
import { validateTradeData, getFieldError, ValidationError } from '@/utils/tradeValidation'; // Import validation utilities

import CreatableSelect from 'react-select/creatable';
import { ActionMeta, MultiValue, OnChangeValue, StylesConfig } from 'react-select';
import { FaUpload, FaTimesCircle, FaCalculator, FaSave, FaPaperPlane } from 'react-icons/fa'; // Added icons

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
  const { theme } = useTheme(); // Get current theme for dynamic styles

  // Add validation state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // --- THEME HELPER CLASSES ---
  const labelClasses = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";
  
  const formElementBaseStructuralClasses = "block w-full rounded-xl shadow-sm p-3 transition-all duration-200 border backdrop-blur-sm";
  const formElementThemeClasses = 
    `bg-white/60 dark:bg-gray-800/40 border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-white`;
  const formElementBorderColor = theme === 'dark' ? '#374151' : '#e5e7eb';
  const formElementBgColor = theme === 'dark' ? 'rgba(31, 41, 55, 0.4)' : 'rgba(255, 255, 255, 0.6)';
  const formElementTextColor = theme === 'dark' ? '#ffffff' : '#111827';
  const formElementPlaceholderColor = theme === 'dark' ? 'rgba(209, 213, 219, 0.6)' : 'rgba(107, 114, 128, 0.7)';

  const inputFocusClasses = "focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none hover:bg-white/80 dark:hover:bg-gray-800/60";
  const placeholderClasses = "placeholder:text-gray-500 dark:placeholder:text-gray-400";
  
  const themedInputClasses = `${formElementBaseStructuralClasses} ${formElementThemeClasses} ${inputFocusClasses} ${placeholderClasses}`;
  const themedSelectClasses = `${formElementBaseStructuralClasses} ${formElementThemeClasses} ${inputFocusClasses} appearance-none`;
  const themedTextareaClasses = `${formElementBaseStructuralClasses} ${formElementThemeClasses} ${inputFocusClasses} ${placeholderClasses} min-h-[120px] resize-y`;

  const sectionContainerClasses = "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-8 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-200";
  const sectionTitleClasses = "text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200/30 dark:border-gray-700/30 flex items-center space-x-3";
  // --- END THEME HELPER CLASSES ---

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
        session: getEnumValue(TradingSession, initialData.session, TradingSession.NEW_YORK),
        setupDetails: initialData.setupDetails || '',
        mistakesMade: initialData.mistakesMade || '',
        lessonsLearned: initialData.lessonsLearned || '',
        imageUrl: initialData.imageUrl || '',
        rMultiple: initialData.rMultiple ?? undefined,
        isStarred: initialData.isStarred || false,
        strategyId: initialData.strategyId || undefined,
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
    setUploadError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setUploadError("File is too large (max 5MB).");
        return;
      }
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError("Invalid file type. Please select an image (PNG, JPG, GIF, WEBP).");
        return;
      }

      setSelectedFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, imageUrl: '' }));
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
    setUploadError(null);
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

    
    const finalTagNames = selectedTags.map(tagOption => tagOption.value);
    const payload: CreateTradePayload | UpdateTradePayload = {
        ...formData,
        session: formData.session,
        tagNames: finalTagNames,
        imageUrl: finalImageUrl,
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

    try {
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
    }
  };

  // --- CUSTOM STYLES FOR REACT-SELECT ---
  const selectStyles: StylesConfig<TagOption, true> = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: formElementBgColor,
      borderColor: state.isFocused ? 'var(--color-accent-green)' : formElementBorderColor,
      boxShadow: state.isFocused ? '0 0 0 2px var(--color-accent-green-transparent)' : 'none', // Ring effect
      borderRadius: '0.5rem', // Matches rounded-lg
      minHeight: '42px', // Matches p-2.5 with typical line height
      transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
      '&:hover': {
        borderColor: state.isFocused ? 'var(--color-accent-green)' : formElementBorderColor,
      },
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '2px 8px',
    }),
    input: (provided) => ({
      ...provided,
      color: formElementTextColor,
      margin: '0px',
      padding: '0px',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: formElementPlaceholderColor,
    }),
    singleValue: (provided) => ({
      ...provided,
      color: formElementTextColor,
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: theme === 'dark' ? 'var(--color-dark-tertiary)' : 'var(--color-light-tertiary)', // multivalue bg
      borderRadius: '0.25rem', // Slightly less rounded for tags
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: formElementTextColor,
      fontSize: '0.875rem',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: theme === 'dark' ? 'var(--text-text-light-secondary)' : 'var(--color-text-dark-secondary)',
      '&:hover': {
        backgroundColor: theme === 'dark' ? 'var(--color-accent-red-darker)' : 'var(--color-accent-red)',
        color: 'white',
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: formElementBgColor,
      borderColor: formElementBorderColor,
      borderWidth: '1px',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)', // Standard shadow
      zIndex: 9999, // Ensure dropdown appears above other elements
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999, // For portal mode if needed
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? 'var(--color-accent-blue)' : state.isFocused ? (theme === 'dark' ? 'var(--color-dark-hover)' : 'var(--color-light-hover)') : 'transparent',
      color: state.isSelected ? 'white' : formElementTextColor,
      fontSize: '0.875rem',
      '&:active': {
        backgroundColor: 'var(--color-accent-blue-darker)',
      },
    }),
    // Add other parts if needed: dropdownIndicator, clearIndicator, etc.
    indicatorSeparator: () => ({ display: 'none' }), // Often hidden for cleaner look
    dropdownIndicator: (provided) => ({
        ...provided,
        color: theme === 'dark' ? 'var(--text-text-light-secondary)' : 'var(--color-text-dark-secondary)',
        '&:hover': {
            color: theme === 'dark' ? 'white' : 'black',
        }
    }),
    clearIndicator: (provided) => ({
        ...provided,
        color: theme === 'dark' ? 'var(--text-text-light-secondary)' : 'var(--color-text-dark-secondary)',
        '&:hover': {
            color: theme === 'dark' ? 'white' : 'black',
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
  const primaryButtonClasses = `bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white focus:ring-blue-500 hover:scale-105 hover:shadow-xl`;
  const secondaryButtonClasses = 
    `bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-500 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-400 hover:text-white focus:ring-gray-500 hover:scale-105 backdrop-blur-sm`;
  
  // Option theme classes for standard select
  const optionThemeClass = "bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white";

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
      {uploadError && (
        <div className="p-4 bg-red-50/90 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 text-red-700 dark:text-red-400 rounded-xl text-sm backdrop-blur-sm">
          Upload Error: {uploadError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Core Details */}
        <div className={sectionContainerClasses}>
          <h2 className={sectionTitleClasses}>
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-xl">
              <FaCalculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Core Trade Information</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="md:col-span-2">
              <label htmlFor="accountId" className={labelClasses}>Account <span className="text-accent-red">*</span></label>
              {availableAccounts.length > 0 ? (
                <select 
                  id="accountId" 
                  name="accountId" 
                  value={formData.accountId || ''} 
                  onChange={handleChange} 
                  required 
                  className={themedSelectClasses}
                >
                  <option value="" disabled className={optionThemeClass}>Select an account</option>
                  {availableAccounts.map(account => (
                    <option key={account.id} value={account.id} className={optionThemeClass}>
                      {account.name} (Balance: {account.currency} {Number(account.balance).toFixed(2)})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
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
              <label htmlFor="assetType" className={labelClasses}>Asset Type <span className="text-accent-red">*</span></label>
              <select id="assetType" name="assetType" value={formData.assetType} onChange={handleChange} required className={themedSelectClasses}>
                {Object.values(AssetType).map(type => <option key={type} value={type} className={optionThemeClass}>{type}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="symbol" className={labelClasses}>Symbol / Pair <span className="text-accent-red">*</span></label>
              <input type="text" id="symbol" name="symbol" value={formData.symbol} onChange={handleChange} required placeholder="e.g., AAPL, EURUSD, BTCUSDT" className={themedInputClasses} />
              {renderFieldError('symbol')}
            </div>
            <div>
              <label htmlFor="direction" className={labelClasses}>Direction <span className="text-accent-red">*</span></label>
              <select id="direction" name="direction" value={formData.direction} onChange={handleChange} required className={themedSelectClasses}>
                {Object.values(TradeDirection).map(dir => <option key={dir} value={dir} className={optionThemeClass}>{dir}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="status" className={labelClasses}>Status <span className="text-accent-red">*</span></label>
              <select id="status" name="status" value={formData.status} onChange={handleChange} required className={themedSelectClasses}>
                {Object.values(TradeStatus).map(stat => <option key={stat} value={stat} className={optionThemeClass}>{stat}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 flex items-center space-x-2 mt-2">
              <input
                type="checkbox"
                id="isStarred"
                name="isStarred"
                checked={!!formData.isStarred}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-accent-yellow focus:ring-accent-yellow dark:bg-dark-tertiary dark:border-gray-600"
              />
              <label htmlFor="isStarred" className={labelClasses + " mb-0"}>
                Mark as Starred
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Entry & Exit */}
        <div className={sectionContainerClasses}>
          <h2 className={sectionTitleClasses}>
            <div className="p-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl">
              <FaPaperPlane className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span>Entry & Exit Details</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label htmlFor="entryDate" className={labelClasses}>Entry Date & Time <span className="text-accent-red">*</span></label>
              <input type="datetime-local" id="entryDate" name="entryDate" value={formData.entryDate} onChange={handleChange} required className={themedInputClasses} />
              {renderFieldError('entryDate')}
            </div>
            <div>
              <label htmlFor="entryPrice" className={labelClasses}>Entry Price <span className="text-accent-red">*</span></label>
              <input type="number" id="entryPrice" name="entryPrice" value={formData.entryPrice || ''} onChange={handleChange} required placeholder="0.00" step="any" className={themedInputClasses} />
              {renderFieldError('entryPrice')}
            </div>
            <div>
              <label htmlFor="exitDate" className={labelClasses}>Exit Date & Time</label>
              <input type="datetime-local" id="exitDate" name="exitDate" value={formData.exitDate || ''} onChange={handleChange} className={themedInputClasses} />
              {renderFieldError('exitDate')}
            </div>
            <div>
              <label htmlFor="exitPrice" className={labelClasses}>Exit Price</label>
              <input type="number" id="exitPrice" name="exitPrice" value={formData.exitPrice || ''} onChange={handleChange} placeholder="0.00" step="any" className={themedInputClasses} />
              {renderFieldError('exitPrice')}
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
                    <label htmlFor="stopLoss" className={labelClasses}>Stop Loss</label>
                    <input type="number" id="stopLoss" name="stopLoss" value={formData.stopLoss || ''} onChange={handleChange} placeholder="0.00" step="any" className={themedInputClasses} />
                    {renderFieldError('stopLoss')}
                </div>
                <div>
                    <label htmlFor="takeProfit" className={labelClasses}>Take Profit</label>
                    <input type="number" id="takeProfit" name="takeProfit" value={formData.takeProfit || ''} onChange={handleChange} placeholder="0.00" step="any" className={themedInputClasses} />
                    {renderFieldError('takeProfit')}
                </div>
                <div>
                    <label htmlFor="quantity" className={labelClasses}>Quantity / Size <span className="text-accent-red">*</span></label>
                    <input type="number" id="quantity" name="quantity" value={formData.quantity || ''} onChange={handleChange} required placeholder="e.g., 100, 0.01" step="any" className={themedInputClasses} />
                    {renderFieldError('quantity')}
                </div>
                <div>
                    <label htmlFor="commission" className={labelClasses}>Commission</label>
                    <input type="number" id="commission" name="commission" value={formData.commission || ''} onChange={handleChange} placeholder="0.00" step="any" className={themedInputClasses} />
                    {renderFieldError('commission')}
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
                    <label htmlFor="strategyId" className={labelClasses}>Trading Strategy</label>
                    <select id="strategyId" name="strategyId" value={formData.strategyId || ''} onChange={handleChange} className={themedSelectClasses}>
                        <option value="" className={optionThemeClass}>No strategy selected</option>
                        {strategies.filter(s => s.isActive).map(strategy => (
                            <option key={strategy.id} value={strategy.id} className={optionThemeClass}>
                                {strategy.name}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Link this trade to a specific trading strategy for performance tracking
                    </p>
                </div>
                <div>
                    <label htmlFor="session" className={labelClasses}>Trading Session</label>
                    <select id="session" name="session" value={formData.session} onChange={handleChange} className={themedSelectClasses}>
                        {Object.values(TradingSession).map(sess => <option key={sess} value={sess} className={optionThemeClass}>{sess}</option>)}
                    </select>
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
                        classNamePrefix="react-select" // Useful for more specific global CSS if needed
                        styles={selectStyles} // Apply custom styles
                        theme={(currentTheme) => ({
                            ...currentTheme,
                            borderRadius: 5,
                            colors: {
                                ...currentTheme.colors,
                                primary: 'var(--color-accent-blue)', // Border on focus, selected item bg
                                primary75: 'var(--color-accent-blue-lighter)', 
                                primary50: 'var(--color-accent-blue-lightest)', 
                                primary25: 'var(--color-light-hover)', // Hover/focus bg for options
                                
                                danger: 'var(--color-accent-red)',
                                dangerLight: 'var(--color-accent-red-lighter)',

                                neutral0: formElementBgColor,  // control background
                                neutral5: theme === 'dark' ? 'var(--color-dark-tertiary)' : 'var(--color-light-tertiary)', // multivalue bg
                                neutral10: theme === 'dark' ? 'var(--color-dark-border)' : 'var(--color-light-border)', // multivalue hover bg, indicators
                                neutral20: formElementBorderColor, // border and separators
                                neutral30: formElementBorderColor, // hover border
                                neutral40: theme === 'dark' ? 'var(--text-text-light-secondary)' : 'var(--color-text-dark-secondary)', // placeholder, disabled indicator
                                neutral50: formElementPlaceholderColor, // placeholder text
                                neutral60: theme === 'dark' ? 'var(--text-text-light-primary)' : 'var(--color-text-dark-primary)', // indicator hover
                                neutral80: formElementTextColor, // input text, selected value text
                                neutral90: formElementTextColor, // selected value text for single
                            },
                        })}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Add custom tags to categorize and filter your trades
                    </p>
                </div>
            </div>
        </div>

        {/* Section 5: Reflection & Notes */}
        <div className={sectionContainerClasses}>
            <h2 className={sectionTitleClasses}>
              <div className="p-2 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-xl">
                <FaSave className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <span>Reflection & Journaling</span>
            </h2>
            <div className="space-y-5">
                <div>
                    <label htmlFor="setupDetails" className={labelClasses}>Setup Details</label>
                    <textarea id="setupDetails" name="setupDetails" value={formData.setupDetails || ''} onChange={handleChange} placeholder="Describe your trade setup, confluence factors, etc." className={themedTextareaClasses} />
                </div>
                <div>
                    <label htmlFor="mistakesMade" className={labelClasses}>Mistakes Made</label>
                    <textarea id="mistakesMade" name="mistakesMade" value={formData.mistakesMade || ''} onChange={handleChange} placeholder="Any deviations from your plan or execution errors?" className={themedTextareaClasses} />
                </div>
                <div>
                    <label htmlFor="lessonsLearned" className={labelClasses}>Lessons Learned</label>
                    <textarea id="lessonsLearned" name="lessonsLearned" value={formData.lessonsLearned || ''} onChange={handleChange} placeholder="What can you take away from this trade?" className={themedTextareaClasses} />
                </div>
                <div>
                    <label htmlFor="notes" className={labelClasses}>General Notes</label>
                    <textarea id="notes" name="notes" value={formData.notes || ''} onChange={handleChange} placeholder="Any other observations or comments..." className={themedTextareaClasses} />
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
                                ${selectedFile || imagePreviewUrl ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-800/40'} 
                                text-gray-700 dark:text-gray-300 
                                hover:bg-gray-100/80 dark:hover:bg-gray-700/40 
                                hover:border-blue-400 dark:hover:border-blue-500`}>
                    <FaUpload className={`text-4xl mb-3 ${selectedFile || imagePreviewUrl ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span className="text-sm font-medium leading-normal">{selectedFile ? selectedFile.name : (imagePreviewUrl ? "Change Chart" : "Upload Chart")}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</span>
                    <input id="file-upload" name="imageUrl" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"/>
                </label>
                {imagePreviewUrl && (
                    <div className="relative group max-w-md w-full">
                        <img src={imagePreviewUrl} alt="Selected chart preview" className="w-full h-auto rounded-2xl shadow-lg object-contain max-h-96 border border-gray-200/50 dark:border-gray-700/50" />
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
          <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6 border-t border-gray-200/30 dark:border-gray-700/30">
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