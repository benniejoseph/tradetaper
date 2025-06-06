"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MT5Account } from '@/types/mt5Account';
import { MT5Server } from '@/services/mt5AccountsService';
import { authApiClient } from '@/services/api';
import { FaEye, FaEyeSlash, FaInfoCircle, FaChevronDown, FaChevronUp, FaPlug, FaUpload, FaFileAlt, FaTable, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

// Default MT5 servers to use if API fails
const DEFAULT_MT5_SERVERS: MT5Server[] = [
  { name: 'MetaQuotes-Demo', description: 'MetaQuotes Demo Server' },
  { name: 'ICMarketsSC-Demo', description: 'IC Markets SC Demo' },
  { name: 'ICMarketsSC-Live', description: 'IC Markets SC Live' },
  { name: 'Deriv-Demo', description: 'Deriv Demo' },
  { name: 'Deriv-Live', description: 'Deriv Live' },
  { name: 'XM-Demo', description: 'XM Demo' },
  { name: 'XM-Real', description: 'XM Real' },
  { name: 'Exness-Demo', description: 'Exness Demo' },
  { name: 'Exness-Live', description: 'Exness Live' },
];

interface FormData {
  name: string;
  server: string;
  login: string;
  password: string;
  isActive: boolean;
}

interface UploadResult {
  success: boolean;
  message: string;
  tradesImported: number;
  trades?: any[];
}

interface MT5AccountFormProps {
  account?: MT5Account;
  servers: MT5Server[];
  loadingServers: boolean;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

type IntegrationMode = 'connect' | 'upload';

const MT5AccountForm: React.FC<MT5AccountFormProps> = ({ 
  account, 
  servers = [], 
  loadingServers, 
  onSubmit, 
  onCancel, 
  isSubmitting 
}) => {
  // Integration mode state
  const [integrationMode, setIntegrationMode] = useState<IntegrationMode>('connect');
  
  // Connection form state
  const [formData, setFormData] = useState<FormData>({
    name: account?.accountName || '',
    server: account?.server || '',
    login: account?.login || '',
    password: '',
    isActive: account?.isActive ?? true,
  });

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [accountId, setAccountId] = useState<string | null>(null);

  // Other existing state
  const [showPassword, setShowPassword] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredServers, setFilteredServers] = useState<MT5Server[]>([]);
  const [serverFilter, setServerFilter] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use provided servers or default ones
  const availableServers = servers.length > 0 ? servers : DEFAULT_MT5_SERVERS;

  useEffect(() => {
    const filtered = availableServers.filter(server => 
      server.name.toLowerCase().includes(serverFilter.toLowerCase()) ||
      server.description.toLowerCase().includes(serverFilter.toLowerCase())
    );
    setFilteredServers(filtered);
  }, [serverFilter, availableServers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Handle server selection
  const handleServerSelect = (serverName: string) => {
    setFormData(prev => ({
      ...prev,
      server: serverName
    }));
    setIsDropdownOpen(false);
    setServerFilter('');
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Validate connection form
  const validateConnectionForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.server.trim()) {
      newErrors.server = 'Server is required';
    }
    
    if (!formData.login.trim()) {
      newErrors.login = 'Login is required';
    }
    
    // Only require password for new accounts
    if (!account && !formData.password.trim()) {
      newErrors.password = 'Password is required for new accounts';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle connection form submission
  const handleConnectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateConnectionForm()) {
      // For editing, only include password if it was changed
      if (account && !formData.password) {
        const submitData = {
          name: formData.name,
          server: formData.server,
          login: formData.login,
          isActive: formData.isActive
        };
        onSubmit(submitData as FormData);
      } else {
        onSubmit(formData);
      }
    }
  };

  // Handle manual account creation for file upload
  const createManualAccount = async (): Promise<string> => {
    try {
      const response = await authApiClient.post('/mt5-accounts/manual', {
        accountName: formData.name || 'Manual Upload Account',
        server: 'Manual-Upload',
        login: formData.login || 'manual',
        isRealAccount: false
      });

      return response.data.id;
    } catch (error) {
      throw new Error(`Failed to create account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // Create manual account if needed
      let currentAccountId = accountId;
      if (!currentAccountId) {
        currentAccountId = await createManualAccount();
        setAccountId(currentAccountId);
      }

      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await authApiClient.post(`/mt5-accounts/${currentAccountId}/upload-trade-history`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result: UploadResult = response.data;
      setUploadResult(result);

    } catch (error) {
      setUploadResult({
        success: false,
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        tradesImported: 0
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['.html', '.htm', '.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    
    if (!allowedTypes.some(type => fileName.endsWith(type))) {
      setUploadResult({
        success: false,
        message: 'Invalid file type. Please upload HTML or Excel files only.',
        tradesImported: 0
      });
      return;
    }
    
    if (file.size > maxSize) {
      setUploadResult({
        success: false,
        message: 'File size too large. Maximum size is 10MB.',
        tradesImported: 0
      });
      return;
    }
    
    setSelectedFile(file);
    setUploadResult(null);
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full space-y-6">
      {/* Tab Selection */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setIntegrationMode('connect')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-all ${
            integrationMode === 'connect'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <FaPlug className="w-4 h-4" />
          Connect Account
        </button>
        <button
          type="button"
          onClick={() => setIntegrationMode('upload')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-all ${
            integrationMode === 'upload'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <FaUpload className="w-4 h-4" />
          Upload Files
        </button>
      </div>

      {/* Mode Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className={`p-4 rounded-lg border-2 transition-all ${
          integrationMode === 'connect' 
            ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-700'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <FaPlug className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900 dark:text-white">Live Connection</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time trade synchronization with automatic updates
          </p>
        </div>
        
        <div className={`p-4 rounded-lg border-2 transition-all ${
          integrationMode === 'upload' 
            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
            : 'border-gray-200 dark:border-gray-700'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <FaUpload className="w-4 h-4 text-green-600" />
            <span className="font-medium text-gray-900 dark:text-white">Manual Upload</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Upload trade history files for manual synchronization
          </p>
        </div>
      </div>

      {/* Connection Form */}
      {integrationMode === 'connect' && (
        <form onSubmit={handleConnectionSubmit} className="space-y-6">
          {/* Account Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Account Name *
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.name 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-opacity-50 transition-colors`}
              placeholder="My Trading Account"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Server Selection */}
          <div>
            <label htmlFor="server" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              MT5 Server *
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full px-4 py-3 text-left rounded-lg border ${
                  errors.server 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-opacity-50 transition-colors flex items-center justify-between`}
              >
                <span className={formData.server ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                  {formData.server || 'Select MT5 Server'}
                </span>
                {isDropdownOpen ? <FaChevronUp className="h-4 w-4" /> : <FaChevronDown className="h-4 w-4" />}
              </button>
              
              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
                  <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                    <input
                      type="text"
                      placeholder="Search servers..."
                      value={serverFilter}
                      onChange={(e) => setServerFilter(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="overflow-y-auto max-h-48">
                    {loadingServers ? (
                      <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                        Loading servers...
                      </div>
                    ) : filteredServers.length > 0 ? (
                      filteredServers.map((server) => (
                        <button
                          key={server.name}
                          type="button"
                          onClick={() => handleServerSelect(server.name)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors"
                        >
                          <div className="font-medium">{server.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{server.description}</div>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                        No servers found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.server && <p className="mt-1 text-sm text-red-600">{errors.server}</p>}
          </div>

          {/* Login */}
          <div>
            <label htmlFor="login" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Login (Account Number) *
            </label>
            <input
              id="login"
              type="text"
              value={formData.login}
              onChange={(e) => handleInputChange('login', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.login 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
              } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-opacity-50 transition-colors`}
              placeholder="123456789"
            />
            {errors.login && <p className="mt-1 text-sm text-red-600">{errors.login}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Password {!account && '*'}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full px-4 py-3 pr-12 rounded-lg border ${
                  errors.password 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-opacity-50 transition-colors`}
                placeholder={account ? "Leave blank to keep current password" : "Your MT5 password"}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              id="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-900 dark:text-white">
              Active account
            </label>
          </div>

          {/* Submit Buttons for Connection */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-8 py-3 rounded-lg text-base font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-8 py-3 rounded-lg text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg transition-all ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {account ? 'Updating Account...' : 'Connecting Account...'}
                </div>
              ) : (
                <>
                  <FaPlug className="mr-2 inline" />
                  {account ? 'Update Connection' : 'Connect Account'}
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* File Upload Form */}
      {integrationMode === 'upload' && (
        <div className="space-y-6">
          {/* Account Name for Upload */}
          <div>
            <label htmlFor="upload-name" className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Account Name
            </label>
            <input
              id="upload-name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-opacity-50 transition-colors"
              placeholder="My Manual Account"
            />
          </div>

          {/* File Upload Area */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FaUpload className="w-4 h-4 text-green-600" />
              <span className="font-medium text-gray-900 dark:text-white">Upload Trade History</span>
            </div>
            
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-4">
                <div className="flex justify-center space-x-4">
                  <FaFileAlt className="w-8 h-8 text-orange-500" />
                  <FaTable className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    Drop your trade history file here
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    or click to browse and select a file
                  </p>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Supported formats: HTML (.html, .htm), Excel (.xlsx, .xls)</p>
                  <p>Maximum file size: 10MB</p>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm,.xlsx,.xls"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />

            {/* Selected File Display */}
            {selectedFile && (
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedFile.name.toLowerCase().includes('.html') ? (
                      <FaFileAlt className="w-6 h-6 text-orange-500" />
                    ) : (
                      <FaTable className="w-6 h-6 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <FaExclamationTriangle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
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
              <div className={`p-4 rounded-lg border ${
                uploadResult.success 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {uploadResult.success ? (
                    <FaCheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <FaExclamationTriangle className="w-4 h-4 text-red-600" />
                  )}
                  <p className={`font-medium ${
                    uploadResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}>
                    {uploadResult.message}
                  </p>
                </div>
                
                {uploadResult.success && uploadResult.trades && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-green-800 dark:text-green-200">Import Summary</span>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-sm rounded">
                        {uploadResult.tradesImported} trades imported
                      </span>
                    </div>
                    
                    {uploadResult.trades.length > 0 && (
                      <div className="text-sm text-green-700 dark:text-green-300">
                        <p>• Symbols: {[...new Set(uploadResult.trades.map(t => t.symbol))].join(', ')}</p>
                        <p>• Total P&L: ${uploadResult.trades.reduce((sum, t) => sum + t.profit, 0).toFixed(2)}</p>
                        <p>• Date range: {uploadResult.trades[0]?.openTime} to {uploadResult.trades[uploadResult.trades.length-1]?.closeTime}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Upload Actions */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-8 py-3 rounded-lg text-base font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
              >
                Cancel
              </button>
              
              {uploadResult?.success ? (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full sm:w-auto px-8 py-3 rounded-lg text-base font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg transition-all transform hover:scale-105"
                >
                  <FaCheckCircle className="mr-2 inline" />
                  View Imported Trades
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFileUpload}
                  disabled={!selectedFile || isUploading}
                  className={`w-full sm:w-auto px-8 py-3 rounded-lg text-base font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg transition-all ${
                    (!selectedFile || isUploading) ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </div>
                  ) : (
                    <>
                      <FaUpload className="mr-2 inline" />
                      Upload & Import Trades
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MT5AccountForm; 