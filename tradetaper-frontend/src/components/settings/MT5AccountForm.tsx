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

// Comprehensive list of common MT5 broker servers
const ALL_SERVERS: MT5Server[] = [
  // MetaQuotes Demo
  { name: 'MetaQuotes-Demo' },
  // IC Markets
  { name: 'ICMarketsSC-Demo' },
  { name: 'ICMarketsSC-Live01' },
  { name: 'ICMarketsSC-Live02' },
  { name: 'ICMarketsSC-Live03' },
  { name: 'ICMarkets-Demo' },
  { name: 'ICMarkets-Live' },
  // Exness
  { name: 'Exness-MT5Real' },
  { name: 'Exness-MT5Real2' },
  { name: 'Exness-MT5Real3' },
  { name: 'Exness-MT5Real4' },
  { name: 'Exness-MT5Real5' },
  { name: 'Exness-MT5Real6' },
  { name: 'Exness-MT5Real7' },
  { name: 'Exness-MT5Real8' },
  { name: 'Exness-MT5Trial' },
  { name: 'Exness-MT5Trial2' },
  { name: 'Exness-MT5Trial3' },
  // FTMO
  { name: 'FTMO-Demo' },
  { name: 'FTMO-Demo2' },
  { name: 'FTMO-Server' },
  { name: 'FTMO-Server2' },
  { name: 'FTMO-Live' },
  // XM
  { name: 'XMGlobal-MT5' },
  { name: 'XMGlobal-MT5 2' },
  { name: 'XMGlobal-MT5 3' },
  { name: 'XMGlobal-Real 1' },
  // Pepperstone
  { name: 'Pepperstone-Demo' },
  { name: 'Pepperstone-Edge01' },
  { name: 'Pepperstone-Edge02' },
  { name: 'Pepperstone-Edge03' },
  // OANDA
  { name: 'OANDA-OandaPractice-1' },
  { name: 'OANDA-OandaLive-1' },
  // Admiral Markets
  { name: 'AdmiralMarkets-Demo' },
  { name: 'AdmiralMarkets-Live' },
  { name: 'Admirals-MT5' },
  // FBS
  { name: 'FBS-Demo' },
  { name: 'FBS-Real' },
  { name: 'FBS-Real-2' },
  // RoboForex
  { name: 'RoboForex-ECN' },
  { name: 'RoboForex-Demo' },
  { name: 'RoboForex-Pro' },
  // Tickmill
  { name: 'Tickmill-Demo' },
  { name: 'Tickmill-Live' },
  // FxPro
  { name: 'FxPro-MT5' },
  { name: 'FxPro-Demo01' },
  // Alpari
  { name: 'Alpari-MT5-Demo' },
  { name: 'Alpari-MT5' },
  // HotForex / HFM
  { name: 'HFMarketsEU-Demo MT5' },
  { name: 'HFMarketsEU-Live Server MT5' },
  // FXCM
  { name: 'FXCM-MT5' },
  { name: 'FXCM-Demo01' },
  // AvaTrade
  { name: 'Ava-Demo' },
  { name: 'Ava-Real' },
  // Vantage
  { name: 'VantageInternational-Demo' },
  { name: 'VantageInternational-Live' },
  // ThinkMarkets
  { name: 'ThinkMarkets-Demo' },
  { name: 'ThinkMarkets-Live' },
  // FXTM
  { name: 'ForexTimeFXTM-Demo01' },
  { name: 'ForexTimeFXTM-ECN-Demo' },
  // My Forex Funds
  { name: 'MyForexFunds-Demo' },
  { name: 'MyForexFunds-Live' },
  // The 5ers
  { name: 'The5ers-Demo' },
  { name: 'The5ers-Live' },
  // Funded Next
  { name: 'FundedNext-Demo' },
  { name: 'FundedNext-Server' },
  // True Forex Funds
  { name: 'TrueForexFunds-Demo' },
  { name: 'TrueForexFunds-Live' },
  // E8 Funding
  { name: 'E8Funding-Demo' },
  { name: 'E8Funding-Live' },
  // FundingPips
  { name: 'FundingPips-Demo' },
  { name: 'FundingPips-Server' },
  { name: 'FundingPips-Live' },
  { name: 'FundingPips-Real' },
  { name: 'FundingPips2-SIM' },
  // Funding Traders
  { name: 'FundingTraders-Demo' },
  { name: 'FundingTraders-Live' },
  // Alpha Capital Group
  { name: 'AlphaCapital-Demo' },
  { name: 'AlphaCapital-Live' },
  // Topstep
  { name: 'Topstep-Demo' },
  { name: 'Topstep-Live' },
  // Apex Trader Funding
  { name: 'ApexTrader-Demo' },
  { name: 'ApexTrader-Live' },
  // Lux Trading Firm
  { name: 'LuxTradingFirm-Demo' },
  { name: 'LuxTradingFirm-Live' },
  // City Traders Imperium
  { name: 'CTI-Demo' },
  { name: 'CTI-Live' },
  // Surge Trading
  { name: 'SurgeTrading-Demo' },
  { name: 'SurgeTrading-Live' },
  // Blue Guardian
  { name: 'BlueGuardian-Demo' },
  { name: 'BlueGuardian-Live' },
];

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
    const allServersList = servers.length > 0 ? servers : ALL_SERVERS;
    
    if (serverSearch.trim() === '') {
      setFilteredServers(allServersList.slice(0, 15));
    } else {
      const searchLower = serverSearch.toLowerCase();
      const filtered = allServersList.filter(s => 
        s.name.toLowerCase().includes(searchLower)
      ).slice(0, 15);
      setFilteredServers(filtered);
    }
  }, [serverSearch, servers]);

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

    onSubmit({
      ...formData,
      initialBalance: formData.initialBalance ? parseFloat(formData.initialBalance) : undefined,
      leverage: formData.leverage ? parseInt(formData.leverage) : 100,
    });
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
                
                {/* Custom server option */}
                {serverSearch && !filteredServers.some(s => s.name.toLowerCase() === serverSearch.toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => handleServerSelect({ name: serverSearch })}
                    className="w-full text-left px-4 py-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium"
                  >
                    Use custom server: "{serverSearch}"
                  </button>
                )}
              </div>
            )}
          </>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Type your broker name to find servers or enter custom server name
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
