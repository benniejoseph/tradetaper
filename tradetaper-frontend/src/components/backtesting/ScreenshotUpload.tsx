'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadScreenshot } from '@/services/backtestingService';

interface ScreenshotUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export default function ScreenshotUpload({ value, onChange, disabled }: ScreenshotUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPG, PNG, and WebP images are allowed.');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const result = await uploadScreenshot(file);
      onChange(result.url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload screenshot');
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      {!value && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center
            transition-all duration-200
            ${dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-emerald-950/20' : 'border-gray-300 dark:border-gray-700'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400 dark:hover:border-gray-600'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleChange}
            disabled={disabled}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-indigo-600 dark:text-emerald-400 animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Uploading screenshot...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                <Upload className="w-8 h-8 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  JPG, PNG, or WebP (max 5MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Area */}
      {value && (
        <div className="relative group">
          <div className="relative border-2 border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
            <img
              src={value}
              alt="Trade screenshot"
              className="w-full h-auto max-h-96 object-contain bg-gray-50 dark:bg-gray-900"
            />

            {/* Remove button */}
            {!disabled && (
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* View full size button */}
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 right-2 p-2 bg-gray-900/80 text-white rounded-lg hover:bg-gray-900 transition-all duration-200 opacity-0 group-hover:opacity-100 flex items-center gap-2 text-sm"
            >
              <ImageIcon className="w-4 h-4" />
              View Full Size
            </a>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
