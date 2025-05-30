/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/trades/TradeForm.tsx
"use client";
import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Trade, CreateTradePayload, UpdateTradePayload, AssetType, TradeDirection, TradeStatus,
  Tag as TradeTagType
 } from '@/types/trade';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { createTrade, updateTrade } from '@/store/features/tradesSlice';
import { authApiClient } from '@/services/api'; // To make direct API call for file upload

import CreatableSelect from 'react-select/creatable';
import { ActionMeta, MultiValue, OnChangeValue } from 'react-select';

interface TagOption {
  readonly label: string;
  readonly value: string; // Typically same as label for tags
  readonly color?: string; // Optional for display
  readonly isNew?: boolean; // For creatable
}

interface TradeFormProps {
  initialData?: Trade;
  isEditMode?: boolean;
}

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

export default function TradeForm({ initialData, isEditMode = false }: TradeFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isLoading: tradeSubmitLoading, error: tradeSubmitError } = useSelector((state: RootState) => state.trades);

  const [selectedTags, setSelectedTags] = useState<MultiValue<TagOption>>([]);

  const [formData, setFormData] = useState<Omit<CreateTradePayload | UpdateTradePayload, 'tagNames'>>({
    // Initialize without tagNames, as it's handled by selectedTags
    assetType: initialData?.assetType || AssetType.STOCK,
    symbol: initialData?.symbol || '',
    direction: initialData?.direction || TradeDirection.LONG,
    status: initialData?.status || TradeStatus.OPEN,
    entryDate: formatDateForInput(initialData?.entryDate),
    entryPrice: initialData?.entryPrice || 0,
    exitDate: formatDateForInput(initialData?.exitDate),
    exitPrice: initialData?.exitPrice ?? undefined,
    quantity: initialData?.quantity || 0,
    commission: initialData?.commission || 0,
    notes: initialData?.notes || '',
    strategyTag: initialData?.strategyTag || '', // Keep if still used for simple input/display
    setupDetails: initialData?.setupDetails || '',
    mistakesMade: initialData?.mistakesMade || '',
    lessonsLearned: initialData?.lessonsLearned || '',
    imageUrl: initialData?.imageUrl || '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);


  useEffect(() => {
    if (initialData) {
      setFormData({
        assetType: initialData.assetType,
        symbol: initialData.symbol,
        direction: initialData.direction,
        status: initialData.status,
        entryDate: formatDateForInput(initialData.entryDate),
        entryPrice: initialData.entryPrice,
        exitDate: formatDateForInput(initialData.exitDate),
        exitPrice: initialData.exitPrice ?? undefined,
        quantity: initialData.quantity,
        commission: initialData.commission,
        notes: initialData.notes || '',
        strategyTag: initialData.strategyTag || '',
        setupDetails: initialData.setupDetails || '',
        mistakesMade: initialData.mistakesMade || '',
        lessonsLearned: initialData.lessonsLearned || '',
        imageUrl: initialData.imageUrl || '',
      });
      setImagePreviewUrl(initialData.imageUrl || null); // Set initial preview if editing
      setSelectedFile(null); // Reset selected file when initialData changes
      // Initialize selectedTags from initialData.tags
      
      if (initialData.tags && initialData.tags.length > 0) {
        setSelectedTags(initialData.tags.map(tag => ({ label: tag.name, value: tag.name, color: tag.color })));
      } else {
        setSelectedTags([]);
      }
    }
  }, [initialData]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let val: string | number | undefined = value;
    if (type === 'number') val = value === '' ? undefined : parseFloat(value);
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Basic client-side validation (size, type) - backend will also validate
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
      setImagePreviewUrl(URL.createObjectURL(file)); // Create a temporary URL for preview
      setFormData(prev => ({ ...prev, imageUrl: '' })); // Clear any old imageUrl if new file selected
    } else {
      setSelectedFile(null);
      // If initialData had an imageUrl, keep it unless user clears it or uploads new
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
    let finalImageUrl = (formData as UpdateTradePayload).imageUrl || '';// Use existing URL if no new file

    if (selectedFile) { /* ... file upload logic as before ... */
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
        imageUrl: finalImageUrl, // Use the uploaded URL or existing one
        entryPrice: Number(formData.entryPrice),
        quantity: Number(formData.quantity),
        commission: Number(formData.commission || 0),
        exitPrice: formData.exitPrice !== undefined && formData.exitPrice !== null && formData.exitPrice.toString().trim() !== '' ? Number(formData.exitPrice) : undefined,
        stopLoss: formData.stopLoss !== undefined && formData.stopLoss !== null && formData.stopLoss.toString().trim() !== '' ? Number(formData.stopLoss) : undefined,
        takeProfit: formData.takeProfit !== undefined && formData.takeProfit !== null && formData.takeProfit.toString().trim() !== '' ? Number(formData.takeProfit) : undefined,
    };

    try {
      if (isEditMode && initialData?.id) {
        await dispatch(updateTrade({ id: initialData.id, payload: payload as UpdateTradePayload })).unwrap();
        alert('Trade updated successfully!');
      } else {
        await dispatch(createTrade(payload as CreateTradePayload)).unwrap();
        alert('Trade created successfully!');
      }
      router.push('/trades');
    } catch (err: any) {
        setFormError(err.message || (isEditMode ? "Failed to update trade." : "Failed to create trade."));
    }
  };
  // Custom styles for react-select to match dark theme
  const selectStyles = {
    control: (styles: any) => ({ ...styles, backgroundColor: '#374151', borderColor: '#4B5563', color: 'white' }),
    multiValue: (styles: any) => ({ ...styles, backgroundColor: '#4B5563' }),
    multiValueLabel: (styles: any) => ({ ...styles, color: 'white' }),
    multiValueRemove: (styles: any) => ({ ...styles, color: '#9CA3AF', ':hover': { backgroundColor: '#EF4444', color: 'white' } }),
    input: (styles: any) => ({ ...styles, color: 'white' }),
    menu: (styles: any) => ({ ...styles, backgroundColor: '#374151' }),
    option: (styles: any, { isDisabled, isFocused, isSelected }: any) => ({
      ...styles,
      backgroundColor: isDisabled ? undefined : isSelected ? '#2563EB' : isFocused ? '#4B5563' : undefined,
      color: isDisabled ? '#ccc' : isSelected ? 'white' : 'white',
      cursor: isDisabled ? 'not-allowed' : 'default',
    }),
    placeholder: (styles: any) => ({ ...styles, color: '#9CA3AF' }),
    singleValue: (styles: any) => ({ ...styles, color: 'white' }),
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 md:p-6 bg-gray-800 rounded-lg shadow-xl max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-center text-white mb-6">
        {isEditMode ? 'Edit Trade' : 'Add New Trade'}
      </h2>

      {/* Display trade submission error (from Redux) */}
      {tradeSubmitError && <p className="text-red-400 bg-red-900 p-3 rounded text-center">{tradeSubmitError}</p>}
      {/* Display form-specific error (e.g., if upload failed before trade submission) */}
      {formError && <p className="text-red-400 bg-red-900 p-3 rounded text-center">{formError}</p>}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ... Symbol, Asset Type, Direction, Status, Entry Date, Entry Price, Exit Date, Exit Price, Quantity, Commission, SL, TP ... */}
        {/* All these fields remain the same as before */}
        <div>
            <label htmlFor="symbol" className="block text-sm font-medium text-gray-300">Symbol</label>
            <input type="text" name="symbol" id="symbol" value={formData.symbol} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        <div>
            <label htmlFor="assetType" className="block text-sm font-medium text-gray-300">Asset Type</label>
            <select name="assetType" id="assetType" value={formData.assetType} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
            {Object.values(AssetType).map(type => <option key={type} value={type}>{type}</option>)}
            </select>
        </div>
        <div>
            <label htmlFor="direction" className="block text-sm font-medium text-gray-300">Direction</label>
            <select name="direction" id="direction" value={formData.direction} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
            {Object.values(TradeDirection).map(dir => <option key={dir} value={dir}>{dir}</option>)}
            </select>
        </div>
        <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-300">Status</label>
            <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500">
            {Object.values(TradeStatus).map(stat => <option key={stat} value={stat}>{stat}</option>)}
            </select>
        </div>
        <div>
            <label htmlFor="entryDate" className="block text-sm font-medium text-gray-300">Entry Date & Time</label>
            <input type="datetime-local" name="entryDate" id="entryDate" value={formData.entryDate} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        <div>
            <label htmlFor="entryPrice" className="block text-sm font-medium text-gray-300">Entry Price</label>
            <input type="number" name="entryPrice" id="entryPrice" value={formData.entryPrice} onChange={handleChange} required step="any" className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        <div>
            <label htmlFor="exitDate" className="block text-sm font-medium text-gray-300">Exit Date & Time (Optional)</label>
            <input type="datetime-local" name="exitDate" id="exitDate" value={formData.exitDate || ''} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        <div>
            <label htmlFor="exitPrice" className="block text-sm font-medium text-gray-300">Exit Price (Optional)</label>
            <input type="number" name="exitPrice" id="exitPrice" value={formData.exitPrice ?? ''} onChange={handleChange} step="any" className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-300">Quantity / Size</label>
            <input type="number" name="quantity" id="quantity" value={formData.quantity} onChange={handleChange} required step="any" className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        <div>
            <label htmlFor="commission" className="block text-sm font-medium text-gray-300">Commission (Optional)</label>
            <input type="number" name="commission" id="commission" value={formData.commission} onChange={handleChange} step="any" className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        <div>
            <label htmlFor="stopLoss" className="block text-sm font-medium text-gray-300">Stop Loss (Optional)</label>
            <input type="number" name="stopLoss" id="stopLoss" value={formData.stopLoss ?? ''} onChange={handleChange} step="any" className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        <div>
            <label htmlFor="takeProfit" className="block text-sm font-medium text-gray-300">Take Profit (Optional)</label>
            <input type="number" name="takeProfit" id="takeProfit" value={formData.takeProfit ?? ''} onChange={handleChange} step="any" className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
        </div>
      </div>

      {/* Journaling Fields */}
      {/* <div>
        <label htmlFor="strategyTag" className="block text-sm font-medium text-gray-300">Strategy / Tags (comma-separated)</label>
        <input type="text" name="strategyTag" id="strategyTag" value={formData.strategyTag || ''} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
      </div> */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-300">Tags (Select or Create New)</label>
        <CreatableSelect
          isMulti
          id="tags"
          name="tags"
          value={selectedTags}
          onChange={handleTagChange}
          options={[]} // Initially no predefined options, users create them. Or fetch user's existing tags here.
          placeholder="Type to create or select tags..."
          className="mt-1 react-select-container"
          classNamePrefix="react-select"
          styles={selectStyles} // Apply custom dark theme styles
          // formatCreateLabel={(inputValue) => `Create "${inputValue}"`} // Customize "create" label
        />
      </div>
      {/* ... Textareas for setupDetails, mistakesMade, lessonsLearned ... */}
      <div>
        <label htmlFor="setupDetails" className="block text-sm font-medium text-gray-300">Setup / Rationale</label>
        <textarea name="setupDetails" id="setupDetails" value={formData.setupDetails || ''} onChange={handleChange} rows={3} className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
      </div>
      <div>
        <label htmlFor="mistakesMade" className="block text-sm font-medium text-gray-300">Mistakes Made</label>
        <textarea name="mistakesMade" id="mistakesMade" value={formData.mistakesMade || ''} onChange={handleChange} rows={3} className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
      </div>
      <div>
        <label htmlFor="lessonsLearned" className="block text-sm font-medium text-gray-300">Lessons Learned</label>
        <textarea name="lessonsLearned" id="lessonsLearned" value={formData.lessonsLearned || ''} onChange={handleChange} rows={3} className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"/>
      </div>


      {/* Image Upload Section */}
      <div>
        <label htmlFor="tradeImage" className="block text-sm font-medium text-gray-300">Trade Image</label>
        <input
          type="file"
          name="tradeImage"
          id="tradeImage"
          accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"
          onChange={handleFileChange}
          className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
        />
        {uploadError && <p className="text-xs text-red-400 mt-1">{uploadError}</p>}
        {imagePreviewUrl && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-1">Image Preview:</p>
            <img src={imagePreviewUrl} alt="Trade preview" className="max-w-xs h-auto rounded border border-gray-600" />
          </div>
        )}
      </div>
      {isUploading && <p className="text-blue-400 text-sm">Uploading image...</p>}


      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={() => router.back()}
                className="px-4 py-2 border border-gray-500 text-gray-300 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-500">
          Cancel
        </button>
        <button type="submit" disabled={tradeSubmitLoading || isUploading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:opacity-50">
          {tradeSubmitLoading || isUploading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Trade')}
        </button>
      </div>
    </form>
  );
}