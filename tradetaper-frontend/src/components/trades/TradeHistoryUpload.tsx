import React, { useState, useRef } from 'react';
import { Upload, FileText, FileSpreadsheet, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';
import { AnimatedButton } from '../ui/AnimatedButton';
import { AnimatedCard } from '../ui/AnimatedCard';

interface ParsedTrade {
  positionId: string;
  symbol: string;
  type: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  closePrice: number;
  openTime: string;
  closeTime: string;
  profit: number;
  commission: number;
  swap: number;
  comment?: string;
}

interface UploadResponse {
  success: boolean;
  message: string;
  tradesImported: number;
  errors?: string[];
  trades?: ParsedTrade[];
}

interface TradeHistoryUploadProps {
  accountId: string;
  onUploadComplete?: (response: UploadResponse) => void;
}

export const TradeHistoryUpload: React.FC<TradeHistoryUploadProps> = ({
  accountId,
  onUploadComplete
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedFileTypes = ['.html', '.htm', '.xlsx', '.xls'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): string | null => {
    const fileName = file.name.toLowerCase();
    const hasValidExtension = acceptedFileTypes.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return `Invalid file type. Please upload HTML or Excel files only. Accepted types: ${acceptedFileTypes.join(', ')}`;
    }
    
    if (file.size > maxFileSize) {
      return `File size too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB.`;
    }
    
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadResult({
        success: false,
        message: error,
        tradesImported: 0,
        errors: [error]
      });
      return;
    }
    
    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`/api/v1/mt5-accounts/${accountId}/upload-trade-history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result: UploadResponse = await response.json();
      setUploadResult(result);
      
      if (result.success && onUploadComplete) {
        onUploadComplete(result);
      }

    } catch (error) {
      setUploadResult({
        success: false,
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tradesImported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileName: string) => {
    const name = fileName.toLowerCase();
    if (name.endsWith('.html') || name.endsWith('.htm')) {
      return <FileText className="h-8 w-8 text-orange-500" />;
    }
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    }
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AnimatedCard className="w-full max-w-2xl mx-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
            <Upload className="h-5 w-5" />
            Upload Trade History
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Upload your MT5 trade history files (HTML or Excel format) to import historical trades
          </p>
        </div>
        
        <div className="space-y-6">
          {/* File Upload Area */}
          {!selectedFile && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Drop your trade history file here</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                or click to browse and select a file
              </p>
              
              <AnimatedButton
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </AnimatedButton>
              
              <div className="text-sm text-gray-500 space-y-1 mt-4">
                <p>Supported formats: HTML (.html, .htm), Excel (.xlsx, .xls)</p>
                <p>Maximum file size: 10MB</p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFileTypes.join(',')}
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

          {/* Selected File Display */}
          {selectedFile && !isUploading && !uploadResult && (
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getFileIcon(selectedFile.name)}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <AnimatedButton onClick={uploadFile} size="sm">
                    Upload
                  </AnimatedButton>
                  <AnimatedButton onClick={resetUpload} variant="secondary" size="sm">
                    <X className="h-4 w-4" />
                  </AnimatedButton>
                </div>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span className="text-gray-900 dark:text-white">Uploading and parsing trade history...</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{uploadProgress}% complete</p>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${
                uploadResult.success 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {uploadResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <p className={`text-sm ${
                    uploadResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}>
                    {uploadResult.message}
                  </p>
                </div>
              </div>

              {uploadResult.success && uploadResult.trades && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">Import Summary</h4>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm rounded">
                      {uploadResult.tradesImported} trades imported
                    </span>
                  </div>
                  
                  {/* Trade Preview */}
                  <div className="border rounded-lg max-h-60 overflow-y-auto bg-white dark:bg-gray-800">
                    <div className="grid grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-700 text-sm font-medium border-b">
                      <div className="text-gray-900 dark:text-white">Symbol</div>
                      <div className="text-gray-900 dark:text-white">Type</div>
                      <div className="text-gray-900 dark:text-white">Volume</div>
                      <div className="text-gray-900 dark:text-white">Open Price</div>
                      <div className="text-gray-900 dark:text-white">Close Price</div>
                      <div className="text-gray-900 dark:text-white">Profit</div>
                    </div>
                    {uploadResult.trades.slice(0, 10).map((trade, index) => (
                      <div key={index} className="grid grid-cols-6 gap-2 p-3 text-sm border-b last:border-b-0">
                        <div className="font-medium text-gray-900 dark:text-white">{trade.symbol}</div>
                        <div>
                          <span className={`px-2 py-1 text-xs rounded ${
                            trade.type === 'buy' 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                              : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                          }`}>
                            {trade.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-gray-900 dark:text-white">{trade.volume}</div>
                        <div className="text-gray-900 dark:text-white">{trade.openPrice.toFixed(5)}</div>
                        <div className="text-gray-900 dark:text-white">{trade.closePrice.toFixed(5)}</div>
                        <div className={trade.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${trade.profit.toFixed(2)}
                        </div>
                      </div>
                    ))}
                    {uploadResult.trades.length > 10 && (
                      <div className="p-3 text-center text-sm text-gray-500">
                        ... and {uploadResult.trades.length - 10} more trades
                      </div>
                    )}
                  </div>
                </div>
              )}

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">Errors:</h4>
                  <ul className="text-sm text-red-600 space-y-1">
                    {uploadResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <AnimatedButton onClick={resetUpload} variant="secondary">
                  Upload Another File
                </AnimatedButton>
                {uploadResult.success && (
                  <AnimatedButton onClick={() => window.location.reload()}>
                    Refresh Trades
                  </AnimatedButton>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AnimatedCard>
  );
}; 