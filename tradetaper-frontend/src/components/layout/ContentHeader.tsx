"use client";
import React, { useState, useCallback } from 'react';
import { FaSync, FaBell, FaCog, FaShareAlt, FaBars, FaWallet, FaCircle } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import {
  selectAvailableAccounts,
  selectSelectedAccount,
  setSelectedAccount
} from '@/store/features/accountSlice';
import { fetchTrades } from '@/store/features/tradesSlice';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface ContentHeaderProps {
  toggleSidebar?: () => void;
}

export default function ContentHeader({ toggleSidebar }: ContentHeaderProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const availableAccounts = useSelector(selectAvailableAccounts);
  const selectedAccount = useSelector(selectSelectedAccount);
  const { isLoading } = useSelector((state: RootState) => state.trades);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Placeholder data from original code, will be replaced or removed if account balance comes from selectedAccount
  const placeholderAccountBalance = "6,578.98 USDT"; 
  const lastUpdated = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  const handleAccountChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === '') {
      // Handle "All Accounts" selection by setting to null
      dispatch(setSelectedAccount(null));
    } else {
      dispatch(setSelectedAccount(value));
    }
  };

  const handleRefreshData = useCallback(async () => {
    if (isRefreshing || isLoading) return;
    
    setIsRefreshing(true);
    try {
      // Refresh trades data
      await dispatch(fetchTrades(selectedAccount?.id)).unwrap();
      toast.success('Data refreshed successfully!');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Failed to refresh data. Please try again.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000); // Minimum animation time
    }
  }, [dispatch, selectedAccount?.id, isRefreshing, isLoading]);

  const handleNotifications = useCallback(() => {
    setShowNotifications(!showNotifications);
    // TODO: Implement notifications panel
    toast('Notifications feature coming soon!', {
      icon: '🔔',
    });
  }, [showNotifications]);

  const handleSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  const handleShare = useCallback(() => {
    // TODO: Implement share/export functionality
    if (navigator.share) {
      navigator.share({
        title: 'TradeTaper - Trading Journal',
        text: 'Check out my trading performance on TradeTaper',
        url: window.location.origin + '/dashboard'
      }).catch(err => {
        console.error('Error sharing:', err);
        toast.error('Sharing not supported on this device');
      });
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.origin + '/dashboard')
        .then(() => toast.success('Dashboard link copied to clipboard!'))
        .catch(() => toast.error('Failed to copy link'));
    }
  }, []);

  return (
    <header className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-20 shadow-lg">
      <div className="max-w-full px-4 md:px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            {toggleSidebar && (
              <button 
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-all duration-200 hover:scale-105"
                aria-label="Toggle sidebar">
                <FaBars className="w-4 h-4" />
              </button>
            )}
            
            {/* Account Selection */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl">
                <FaWallet className="w-3 h-3 text-white" />
              </div>
              
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Trading Account
                </label>
                {availableAccounts.length > 0 ? (
                  <div className="relative">
                    <select 
                      value={selectedAccount?.id || ''} 
                      onChange={handleAccountChange}
                      className="appearance-none bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 pr-7 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70">
                      <option value="" className="bg-white dark:bg-gray-800">
                        All Accounts
                      </option>
                      {availableAccounts.map(account => (
                        <option key={account.id} value={account.id} className="bg-white dark:bg-gray-800">
                          {account.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {placeholderAccountBalance}
                    </span>
                    <div className="flex items-center space-x-1">
                      <FaCircle className="w-2 h-2 text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Live</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Last Updated */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Updated {lastUpdated}
              </span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleRefreshData}
                disabled={isRefreshing || isLoading}
                className="group p-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-blue-500 dark:hover:bg-blue-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105 hover:shadow-lg backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Refresh data">
                <FaSync className={`w-4 h-4 transition-transform duration-300 ${
                  isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'
                }`} />
              </button>
              
              <button 
                onClick={handleNotifications}
                className="group relative p-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-green-500 dark:hover:bg-green-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105 hover:shadow-lg backdrop-blur-sm"
                aria-label="Notifications">
                <FaBell className="w-4 h-4" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </button>
              
              <button 
                onClick={handleSettings}
                className="group p-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-purple-500 dark:hover:bg-purple-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105 hover:shadow-lg backdrop-blur-sm"
                aria-label="Settings">
                <FaCog className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              </button>
              
              <button 
                onClick={handleShare}
                className="group p-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gradient-to-r hover:from-blue-500 hover:to-green-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105 hover:shadow-lg backdrop-blur-sm"
                aria-label="Share or export">
                <FaShareAlt className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 