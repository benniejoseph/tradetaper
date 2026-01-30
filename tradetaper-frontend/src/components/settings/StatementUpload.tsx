'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { statementService, StatementUploadResponse } from '@/services/statementService';
import toast from 'react-hot-toast';

interface StatementUploadProps {
  accountId?: string;
  onSuccess?: (result: StatementUploadResponse) => void;
}

export function StatementUpload({ accountId, onSuccess }: StatementUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<StatementUploadResponse | null>(null);

  const handleFile = useCallback(async (file: File) => {
    // Validate file type
    const validTypes = ['.csv', '.html', '.htm'];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(extension)) {
      toast.error('Please upload a CSV or HTML file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setResult(null);

    try {
      const uploadResult = await statementService.uploadStatement(file, accountId);
      setResult(uploadResult);
      
      if (uploadResult.status === 'COMPLETED') {
        toast.success(`Imported ${uploadResult.tradesImported} trades!`);
        onSuccess?.(uploadResult);
      } else if (uploadResult.status === 'FAILED') {
        toast.error(uploadResult.errorMessage || 'Upload failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload statement');
    } finally {
      setIsUploading(false);
    }
  }, [accountId, onSuccess]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragging 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-gray-600 hover:border-gray-500'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          accept=".csv,.html,.htm"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        <div className="flex flex-col items-center gap-3">
          {isUploading ? (
            <>
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-gray-300">Processing statement...</p>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 text-gray-400" />
              <div>
                <p className="text-gray-300 font-medium">
                  Drop your statement file here
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  or click to browse
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                  MT4 HTML
                </span>
                <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                  MT5 CSV
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`
          p-4 rounded-lg border
          ${result.status === 'COMPLETED' 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-red-500/10 border-red-500/30'
          }
        `}>
          <div className="flex items-start gap-3">
            {result.status === 'COMPLETED' ? (
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">{result.fileName}</span>
                <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-400">
                  {result.fileType}
                </span>
              </div>
              
              {result.status === 'COMPLETED' ? (
                <div className="mt-2 text-sm">
                  <span className="text-green-400">
                    {result.tradesImported} trades imported
                  </span>
                  {result.tradesSkipped > 0 && (
                    <span className="text-gray-500 ml-2">
                      ({result.tradesSkipped} duplicates skipped)
                    </span>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-red-400">
                  {result.errorMessage || 'Upload failed'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-gray-500">
        <p className="font-medium text-gray-400 mb-2">How to export your statement:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>MT4:</strong> Account History tab → Right-click → Save as Detailed Report
          </li>
          <li>
            <strong>MT5:</strong> History tab → Right-click → Export → As CSV or HTML
          </li>
        </ul>
      </div>
    </div>
  );
}
