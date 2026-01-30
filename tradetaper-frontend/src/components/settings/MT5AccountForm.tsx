"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FaSave, FaTimes, FaSearch } from 'react-icons/fa';

// MT5Server type for server dropdown
export interface MT5Server {
  name: string;
  address?: string;
}

interface MT5AccountFormProps {
  account?: any;
  servers?: MT5Server[];
  loadingServers?: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// Server list loaded lazily via import('@/data/mt5Servers')

export default function MT5AccountForm({ 
  account, 
  servers = [], 
  loadingServers = false,
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: MT5AccountFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    server: '',
    login: '',
    password: '',
    isActive: true,
    initialBalance: '',
    leverage: '100', // Default leverage
    currency: 'USD',
  });
  
  const [serverSearch, setServerSearch] = useState('');
  const [showServerDropdown, setShowServerDropdown] = useState(false);
  const [filteredServers, setFilteredServers] = useState<MT5Server[]>([]);
  const serverInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [loadedServers, setLoadedServers] = useState<MT5Server[]>([]);

  // Load servers lazily
  useEffect(() => {
    import('@/data/mt5Servers').then((mod) => {
      setLoadedServers(mod.MT5_SERVERS);
    });
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (account) {
      setFormData({
        name: account.accountName || '',
        server: account.server || '',
        login: account.login || '',
        password: '',
        isActive: account.isActive ?? true,
        initialBalance: account.initialBalance?.toString() || '',
        leverage: account.leverage?.toString() || '100',
        currency: account.currency || 'USD',
      });
      setServerSearch(account.server || '');
    }
  }, [account]);

  // Filter servers based on search
  useEffect(() => {
    const allServersList = servers.length > 0 ? servers : (loadedServers.length > 0 ? loadedServers : []);
    
    if (serverSearch.trim() === '') {
      setFilteredServers(allServersList.slice(0, 15));
    } else {
      const searchLower = serverSearch.toLowerCase();
      const filtered = allServersList.filter(s => 
        s.name.toLowerCase().includes(searchLower)
      ).slice(0, 50); // Show more results
      setFilteredServers(filtered);
    }
  }, [serverSearch, servers, loadedServers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          serverInputRef.current && !serverInputRef.current.contains(e.target as Node)) {
        setShowServerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleServerSelect = (server: MT5Server) => {
    setFormData({ ...formData, server: server.name });
    setServerSearch(server.name);
    setShowServerDropdown(false);
  };

  const handleServerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setServerSearch(value);
    setFormData({ ...formData, server: value });
    setShowServerDropdown(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.server || !formData.login) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (!account && !formData.password) {
      alert('Password is required for new accounts');
      return;
    }

    const submissionData = {
      accountName: formData.name,
      server: formData.server,
      login: formData.login,
      password: formData.password,
      isActive: formData.isActive,
      initialBalance: formData.initialBalance ? parseFloat(formData.initialBalance) : undefined,
      leverage: formData.leverage ? parseInt(formData.leverage) : 100,
      currency: formData.currency
    };

    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Account Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Account Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder="e.g., My Trading Account"
          required
        />
      </div>

      {/* Server - Searchable Input */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Server * <span className="text-gray-500 font-normal">(Type to search)</span>
        </label>
        {loadingServers ? (
          <div className="flex items-center text-gray-500 py-3">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading servers...
          </div>
        ) : (
          <>
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={serverInputRef}
                type="text"
                value={serverSearch}
                onChange={handleServerInputChange}
                onFocus={() => setShowServerDropdown(true)}
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Search for your broker server (e.g., Exness, ICMarkets, FTMO)"
                required
              />
            </div>
            
            {/* Server Dropdown */}
            {showServerDropdown && (
              <div 
                ref={dropdownRef}
                className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg"
              >
                {filteredServers.length > 0 ? (
                  filteredServers.map((server) => (
                    <button
                      key={server.name}
                      type="button"
                      onClick={() => handleServerSelect(server)}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                    >
                      {server.name}
                      {server.address && (
                        <span className="text-xs text-gray-500 ml-2">{server.address}</span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    No servers found. Type your server name to use a custom server.
                  </div>
                )}
                
            {/* Custom server option - Always show if text is entered to confirm manual entry intent */}
            {serverSearch && (
              <div className="border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => handleServerSelect({ name: serverSearch })}
                  className="w-full text-left px-4 py-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center justify-between"
                >
                  <span>Use custom server: <strong>"{serverSearch}"</strong></span>
                  <span className="text-xs bg-emerald-200 dark:bg-emerald-800 px-2 py-1 rounded">Manual Entry</span>
                </button>
              </div>
            )}
              </div>
            )}
          </>
        )}
        <p className="mt-2 text-xs text-gray-500 flex items-start gap-1">
          <span className="text-emerald-500 font-bold">Tip:</span> <span>If your server isn't listed, simply type the exact name from your MT5 login screen and click "Use custom server".</span>
        </p>
      </div>

      {/* Login */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Login ID *
        </label>
        <input
          type="text"
          value={formData.login}
          onChange={(e) => setFormData({ ...formData, login: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder="e.g., 12345678"
          required
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Password {account ? '(leave blank to keep current)' : '*'}
        </label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          placeholder={account ? '••••••••' : 'Enter password'}
          required={!account}
        />
      </div>

      {/* Account Size & Leverage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Account Size (Starting Balance)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={formData.initialBalance}
              onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
              className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., 10000"
              min="0"
              step="0.01"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Initial balance for P&L tracking.
          </p>
        </div>

        {/* Leverage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Leverage (1:X)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">1 :</span>
            <input
              type="number"
              value={formData.leverage}
              onChange={(e) => setFormData({ ...formData, leverage: e.target.value })}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., 100"
              min="1"
              step="1"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Used for margin calculations.
          </p>
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3 py-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
        />
        <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
          Account is active (enable auto-sync)
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <FaTimes className="w-4 h-4" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <FaSave className="w-4 h-4" />
          {isSubmitting ? 'Saving...' : (account ? 'Update Account' : 'Add Account')}
        </button>
      </div>
    </form>
  );
}
