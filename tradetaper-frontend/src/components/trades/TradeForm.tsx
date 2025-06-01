/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/trades/TradeForm.tsx
"use client";
import { useState, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import { Trade, CreateTradePayload, UpdateTradePayload, AssetType, TradeDirection, TradeStatus,
  Tag as TradeTagType
 } from '@/types/trade';
import { ICTConcept, TradingSession } from '@/types/enums';
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
  const labelClasses = "block text-sm font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary mb-1";
  
  const formElementBaseStructuralClasses = "block w-full rounded-lg shadow-sm p-2.5 transition-colors duration-150 ease-in-out border"; // Added explicit border
  const formElementThemeClasses = 
    `bg-[var(--color-light-secondary)] border-[var(--color-light-border)] text-[var(--color-text-dark-primary)] 
     dark:bg-dark-primary dark:border-gray-700 dark:text-text-light-primary`;
  // For react-select, we need to be more specific with border color, as it has its own defaults
  const formElementBorderColor = theme === 'dark' ? '#4B5563' : 'var(--color-light-border)'; // gray-700 for dark, var for light
  const formElementBgColor = theme === 'dark' ? 'var(--color-dark-primary)' : 'var(--color-light-secondary)';
  const formElementTextColor = theme === 'dark' ? 'var(--text-text-light-primary)' : 'var(--color-text-dark-primary)';
  const formElementPlaceholderColor = theme === 'dark' ? 'rgba(209, 213, 219, 0.6)' : 'rgba(107, 114, 128, 0.7)'; // approx. dark:opacity-60, light:opacity-70

  const inputFocusClasses = "focus:ring-2 focus:ring-accent-green focus:border-accent-green focus:outline-none";
  const placeholderClasses = "placeholder:text-[var(--color-text-dark-secondary)] placeholder:opacity-70 dark:placeholder:text-text-light-secondary dark:placeholder:opacity-60";
  
  const themedInputClasses = `${formElementBaseStructuralClasses} ${formElementThemeClasses} ${inputFocusClasses} ${placeholderClasses}`;
  const themedSelectClasses = `${formElementBaseStructuralClasses} ${formElementThemeClasses} ${inputFocusClasses} appearance-none`;
  const themedTextareaClasses = `${formElementBaseStructuralClasses} ${formElementThemeClasses} ${inputFocusClasses} ${placeholderClasses} min-h-[100px]`;

  const sectionContainerClasses = "bg-[var(--color-light-primary)] dark:bg-dark-secondary p-6 rounded-xl shadow-lg dark:shadow-card-modern";
  const sectionTitleClasses = "text-xl font-semibold text-[var(--color-text-dark-primary)] dark:text-text-light-primary mb-6 border-b border-[var(--color-light-border)] dark:border-dark-primary pb-3";
  // --- END THEME HELPER CLASSES ---

  const [selectedTags, setSelectedTags] = useState<MultiValue<TagOption>>([]);

  const [formData, setFormData] = useState<Omit<CreateTradePayload | UpdateTradePayload, 'tagNames' | 'strategyTag'> & 
    { stopLoss?: number; takeProfit?: number; rMultiple?: number; ictConcept?: ICTConcept; session?: TradingSession; accountId?: string; isStarred?: boolean; }>
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
    ictConcept: getEnumValue(ICTConcept, initialData?.ictConcept, ICTConcept.FVG),
    session: getEnumValue(TradingSession, initialData?.session, TradingSession.NEW_YORK),
    setupDetails: initialData?.setupDetails || '',
    mistakesMade: initialData?.mistakesMade || '',
    lessonsLearned: initialData?.lessonsLearned || '',
    imageUrl: initialData?.imageUrl || '',
    rMultiple: initialData?.rMultiple ?? undefined,
    isStarred: initialData?.isStarred || false,
  });

  // State for calculated R:R - to be implemented properly later
  const [calculatedRR, setCalculatedRR] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
        ictConcept: getEnumValue(ICTConcept, initialData.ictConcept, ICTConcept.FVG),
        session: getEnumValue(TradingSession, initialData.session, TradingSession.NEW_YORK),
        setupDetails: initialData.setupDetails || '',
        mistakesMade: initialData.mistakesMade || '',
        lessonsLearned: initialData.lessonsLearned || '',
        imageUrl: initialData.imageUrl || '',
        rMultiple: initialData.rMultiple ?? undefined,
        isStarred: initialData.isStarred || false,
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

    let finalImageUrl = (formData as UpdateTradePayload).imageUrl || '';

    if (selectedFile) {
      setIsUploading(true);
      const fileData = new FormData();
      fileData.append('file', selectedFile);
      try {
        const response = await authApiClient.post<{ url: string; message: string }>(
          '/files/upload/trade-image', fileData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        finalImageUrl = response.data.url;
      } catch (err: any) {
        setIsUploading(false);
        setUploadError(err.response?.data?.message || err.message || "File upload failed.");
        return;
      }
      setIsUploading(false);
    }
    const finalTagNames = selectedTags.map(tagOption => tagOption.value);
    const payload: CreateTradePayload | UpdateTradePayload = {
        ...formData,
        ictConcept: formData.ictConcept,
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
      backgroundColor: theme === 'dark' ? 'var(--color-dark-tertiary)' : 'var(--color-light-tertiary)',
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
    if (formData.rMultiple === undefined || formData.rMultiple === null) return 'text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary';
    // These specific colors for R:R bands are likely fine as they convey meaning
    if (formData.rMultiple >= 2) return 'text-accent-green'; 
    if (formData.rMultiple >= 1) return 'text-yellow-400'; 
    if (formData.rMultiple > 0) return 'text-orange-400';
    return 'text-accent-red';
  };

  // Helper function to render field validation errors
  const renderFieldError = (fieldName: string) => {
    const error = getFieldError(validationErrors, fieldName);
    if (!error) return null;
    
    return (
      <p className="mt-1 text-sm text-accent-red">
        {error}
      </p>
    );
  };

  const buttonBaseClasses = "w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 font-semibold rounded-lg transition-all duration-150 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-opacity-70";
  const primaryButtonClasses = `bg-accent-green hover:bg-accent-green-darker text-dark-primary focus:ring-accent-green focus:ring-offset-2 focus:ring-offset-[var(--color-light-secondary)] dark:focus:ring-offset-dark-primary`;
  const secondaryButtonClasses = 
    `text-[var(--color-text-dark-secondary)] bg-[var(--color-light-hover)] hover:bg-gray-300 dark:text-text-light-secondary dark:bg-dark-secondary dark:hover:bg-gray-700 
     focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-[var(--color-light-secondary)] dark:focus:ring-offset-dark-primary`;
  
  // Option theme classes for standard select
  const optionThemeClass = "bg-[var(--color-light-secondary)] text-[var(--color-text-dark-primary)] dark:bg-dark-primary dark:text-text-light-primary";

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-[var(--color-text-dark-primary)] dark:text-text-light-primary mb-8 text-center">
        {isEditMode ? 'Edit Trade Details' : 'Log New Trade'}
      </h1>

      {/* Global Form Error Messages */}
      {formError && <div className="mb-4 p-3 bg-accent-red bg-opacity-15 text-accent-red rounded-lg text-sm">{formError}</div>}
      {tradeSubmitError && <div className="mb-4 p-3 bg-accent-red bg-opacity-15 text-accent-red rounded-lg text-sm">Submission Error: {tradeSubmitError}</div>}
      {uploadError && <div className="mb-4 p-3 bg-accent-red bg-opacity-15 text-accent-red rounded-lg text-sm">Upload Error: {uploadError}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Core Details */}
        <div className={sectionContainerClasses}>
          <h2 className={sectionTitleClasses}>Core Trade Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {isEditMode && availableAccounts.length > 0 && (
              <div className="md:col-span-2">
                <label htmlFor="accountId" className={labelClasses}>Account <span className="text-accent-red">*</span></label>
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
                      {account.name} (Balance: ${account.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            )}
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
          <h2 className={sectionTitleClasses}>Entry & Exit Details</h2>
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
            <div>
              <label htmlFor="quantity" className={labelClasses}>Quantity / Size <span className="text-accent-red">*</span></label>
              <input type="number" id="quantity" name="quantity" value={formData.quantity || ''} onChange={handleChange} required placeholder="e.g., 100, 0.01" step="any" className={themedInputClasses} />
              {renderFieldError('quantity')}
            </div>
            <div>
              <label htmlFor="commission" className={labelClasses}>Commission</label>
              <input type="number" id="commission" name="commission" value={formData.commission || ''} onChange={handleChange} placeholder="0.00" step="any" className={themedInputClasses} />
            </div>
          </div>
        </div>
        
        {/* Section 3: Risk & Quantity */}
        <div className={sectionContainerClasses}>
            <h2 className={sectionTitleClasses}>Risk, Reward & Quantity</h2>
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
                </div>
                <div>
                    <label htmlFor="commission" className={labelClasses}>Commission</label>
                    <input type="number" id="commission" name="commission" value={formData.commission || ''} onChange={handleChange} placeholder="0.00" step="any" className={themedInputClasses} />
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
        
        {/* Section 4: ICT Concepts & Tags */}
        <div className={sectionContainerClasses}>
            <h2 className={sectionTitleClasses}>Strategy & Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                    <label htmlFor="ictConcept" className={labelClasses}>ICT Concept</label>
                    <select id="ictConcept" name="ictConcept" value={formData.ictConcept} onChange={handleChange} className={themedSelectClasses}>
                        {Object.values(ICTConcept).map(concept => <option key={concept} value={concept} className={optionThemeClass}>{concept}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="session" className={labelClasses}>Trading Session</label>
                    <select id="session" name="session" value={formData.session} onChange={handleChange} className={themedSelectClasses}>
                        {Object.values(TradingSession).map(sess => <option key={sess} value={sess} className={optionThemeClass}>{sess}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="tags" className={labelClasses}>Tags</label>
                    <CreatableSelect
                        isMulti
                        name="tags"
                        options={[]} // You might want to load existing tags as suggestions here
                        value={selectedTags}
                        onChange={handleTagChange}
                        placeholder="Type to add tags (e.g., Scalp, Breakout)"
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
                </div>
            </div>
        </div>

        {/* Section 5: Reflection & Notes */}
        <div className={sectionContainerClasses}>
            <h2 className={sectionTitleClasses}>Reflection & Journaling</h2>
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
            <h2 className={sectionTitleClasses}>Chart Snapshot</h2>
            <div className="flex flex-col items-center space-y-4">
                <label htmlFor="file-upload" 
                    className={`w-full max-w-md flex flex-col items-center px-4 py-6 rounded-lg shadow-md tracking-wide uppercase border border-dashed cursor-pointer 
                                ${selectedFile || imagePreviewUrl ? 'border-accent-green' : 'border-[var(--color-light-border)] dark:border-gray-600'} 
                                text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary 
                                bg-[var(--color-light-secondary)] hover:bg-[var(--color-light-hover)] 
                                dark:bg-dark-primary dark:hover:bg-dark-secondary 
                                transition-colors duration-150`}>
                    <FaUpload className={`text-3xl ${selectedFile || imagePreviewUrl ? 'text-accent-green' : 'text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary'} mb-2`} />
                    <span className="text-sm leading-normal">{selectedFile ? selectedFile.name : (imagePreviewUrl ? "Change Chart" : "Upload Chart")}</span>
                    <input id="file-upload" name="imageUrl" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"/>
                </label>
                {imagePreviewUrl && (
                    <div className="relative group max-w-md w-full">
                        <img src={imagePreviewUrl} alt="Selected chart preview" className="w-full h-auto rounded-lg shadow-md object-contain max-h-96" />
                        <button 
                            type="button" 
                            onClick={() => { setSelectedFile(null); setImagePreviewUrl(initialData?.imageUrl || null); setFormData(prev => ({...prev, imageUrl: initialData?.imageUrl || ''}))}}
                            className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75 hover:text-accent-red transition-all duration-150 opacity-0 group-hover:opacity-100"
                            aria-label="Remove image">
                            <FaTimesCircle className="h-5 w-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Submission and Error Handling Section */}
        <div className={sectionContainerClasses}>
          {tradeSubmitError && (
              <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                  <p><strong>Error:</strong> {tradeSubmitError}</p>
              </div>
          )}
          {formError && (
               <div className="my-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                  <p><strong>Error:</strong> {formError}</p>
              </div>
          )}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6 border-t border-[var(--color-light-border)] dark:border-dark-primary">
              {onCancel && (
                  <button 
                      type="button"
                      onClick={onCancel}
                      className={`py-2.5 px-6 rounded-lg font-semibold transition-colors text-sm shadow-sm
                                  bg-[var(--color-light-hover)] hover:bg-gray-300 text-[var(--color-text-dark-primary)] border border-[var(--color-light-border)]
                                  dark:bg-dark-tertiary dark:hover:bg-gray-700 dark:text-text-light-secondary dark:border-gray-700`}
                  >
                      Cancel
                  </button>
              )}
              <button 
                  type="submit" 
                  disabled={tradeSubmitLoading || isUploading}
                  className={`py-2.5 px-6 rounded-lg font-semibold transition-colors text-sm shadow-md hover:shadow-lg flex items-center justify-center space-x-2
                              bg-accent-green hover:bg-accent-green-darker text-dark-primary 
                              disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                  {tradeSubmitLoading || isUploading ? 'Saving...' : (isEditMode ? <><FaSave className="mr-2" /> Update Trade</> : <><FaPaperPlane className="mr-2" /> Log Trade</>)}
              </button>
          </div>
        </div>
      </form>
    </div>
  );
}