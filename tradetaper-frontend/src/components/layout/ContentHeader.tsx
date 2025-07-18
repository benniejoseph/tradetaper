"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { FaBars } from 'react-icons/fa';
import { ThemeToggleButton } from '@/components/common/ThemeToggleButton';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { Bell, Search, ChevronDown, DollarSign } from 'lucide-react';
import { selectMT5Accounts, selectSelectedMT5AccountId, setSelectedMT5Account } from '@/store/features/mt5AccountsSlice';
import { selectAvailableAccounts, selectSelectedAccountId, setSelectedAccount } from '@/store/features/accountSlice';
import { useCurrency, CURRENCIES, CurrencyCode } from '@/context/CurrencyContext';

interface ContentHeaderProps {
  toggleSidebar: () => void;
  isMobile: boolean;
  isSidebarExpanded?: boolean;
}

function ContentHeader({ toggleSidebar, isMobile, isSidebarExpanded }: ContentHeaderProps) {
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);
  const { selectedCurrency, setSelectedCurrency, isLoading } = useCurrency();
  
  // Account selectors
  const mt5Accounts = useSelector(selectMT5Accounts);
  const selectedMT5AccountId = useSelector(selectSelectedMT5AccountId);
  const regularAccounts = useSelector(selectAvailableAccounts);
  const selectedRegularAccountId = useSelector(selectSelectedAccountId);
  
  // Combine all accounts for display
  const allAccounts = [
    ...mt5Accounts.map(acc => ({ id: acc.id, name: acc.accountName, type: 'MT5', balance: acc.balance })),
    ...regularAccounts.map(acc => ({ id: acc.id, name: acc.name, type: 'Regular', balance: acc.balance }))
  ];
  
  // Get currently selected account
  const selectedAccount = allAccounts.find(acc => 
    acc.id === selectedMT5AccountId || acc.id === selectedRegularAccountId
  );

  // Get the current page title based on the pathname
  const getPageTitle = () => {
    const path = pathname.split('/')[1];
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const handleAccountChange = (accountId: string | null) => {
    // Find which type of account this is
    const isMT5 = mt5Accounts.find(acc => acc.id === accountId);
    
    if (accountId === null) {
      // "All Accounts" selected
      dispatch(setSelectedMT5Account(null));
      dispatch(setSelectedAccount(null));
    } else if (isMT5) {
      // MT5 account selected
      dispatch(setSelectedMT5Account(accountId));
      dispatch(setSelectedAccount(null));
    } else {
      // Regular account selected
      dispatch(setSelectedAccount(accountId));
      dispatch(setSelectedMT5Account(null));
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-2 max-w-full overflow-hidden">
          {/* Left side - Menu button, title, and account selector */}
          <div className={`flex items-center flex-shrink-0 ${isMobile ? 'space-x-2' : !isSidebarExpanded ? 'space-x-4' : 'space-x-6'} min-w-0`}>
            {/* Mobile hamburger menu - only show on mobile/tablet */}
            {isMobile && (
              <button 
                onClick={toggleSidebar}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                aria-label="Toggle sidebar">
                <FaBars className="w-5 h-5" />
              </button>
            )}
            <h1 className={`font-semibold text-gray-900 dark:text-white truncate ${isMobile ? 'text-base' : isSidebarExpanded ? 'text-2xl' : 'text-xl'}`}>
              {getPageTitle()}
            </h1>
            
            {/* Account Selector - Show on all pages */}
            <div className="relative flex-shrink-0">
              <select
                value={selectedAccount?.id || ''}
                onChange={(e) => handleAccountChange(e.target.value || null)}
                className={`appearance-none bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 rounded-lg px-2 py-2 pr-6 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200 ${isMobile ? 'w-20 text-xs' : isSidebarExpanded ? 'w-44 text-sm' : 'w-36 text-sm'}`}
              >
                <option value="">{isMobile ? 'All' : 'All Accounts'}</option>
                {allAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {isMobile ? account.name.substring(0, 8) + (account.name.length > 8 ? '...' : '') : `${account.name} (${account.type}) - $${Number(account.balance || 0).toFixed(2)}`}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>

            {/* Currency Selector */}
            <div className="relative flex-shrink-0">
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
                disabled={isLoading}
                className={`appearance-none bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 rounded-lg px-2 py-2 pr-6 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200 disabled:opacity-50 ${isMobile ? 'w-16' : 'w-24'}`}
                title="Select display currency"
              >
                {Object.entries(CURRENCIES).map(([code, currency]) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center">
                {isLoading ? (
                  <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                ) : (
                  <ChevronDown className="w-3 h-3 text-gray-400 pointer-events-none" />
                )}
              </div>
            </div>
              </div>
              
          {/* Right side - Search, notifications, and theme toggle */}
          <div className={`flex items-center flex-shrink-0 ${isMobile ? 'space-x-1' : 'space-x-3'}`}>
            {/* Search - Only show on desktop */}
            {!isMobile && (
              <div className="relative hidden sm:block">
                <input
                  type="text"
                  placeholder="Search..."
                  className={`px-4 py-2 pl-10 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200 ${isSidebarExpanded ? 'w-64' : 'w-56'}`}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            )}

            {/* Notifications */}
            <button 
              className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 relative flex-shrink-0`}
              aria-label="Notifications">
              <Bell className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
              
            {/* Theme Toggle - Hide on mobile */}
            {!isMobile && (
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                <ThemeToggleButton />
              </div>
            )}

            {/* User Avatar - Only show on desktop */}
            {!isMobile && user && (
              <div className="hidden sm:flex items-center space-x-3 flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white font-semibold text-sm">
                  {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </div>
                <div className="hidden lg:block min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.firstName || user.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// Named export
export { ContentHeader };

// Default export
export default ContentHeader; 