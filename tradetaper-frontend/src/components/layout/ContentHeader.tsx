"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { FaBars } from 'react-icons/fa';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { Search, ChevronDown } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
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
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
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

  const getAccountOptionLabel = (account: {
    id: string;
    name: string;
    type: string;
    balance?: number | null;
  }) => {
    if (!isMobile) {
      return `${account.name} (${account.type}) - $${Number(account.balance || 0).toFixed(2)}`;
    }

    const compactName =
      account.name.length > 16 ? `${account.name.slice(0, 16)}...` : account.name;
    return compactName;
  };

  const renderAccountSelector = (mobileVariant: boolean) => (
    <div className={`relative ${mobileVariant ? 'min-w-0 flex-1' : 'flex-shrink-0'}`}>
      <select
        value={selectedAccount?.id || ''}
        onChange={(e) => handleAccountChange(e.target.value || null)}
        className={`content-header-input appearance-none rounded-lg border border-gray-200/50 bg-white/80 px-2 py-1.5 pr-6 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700/50 dark:bg-[#0A0A0A]/80 dark:focus:ring-emerald-400 ${
          mobileVariant ? 'h-9 w-full text-xs' : isSidebarExpanded ? 'w-44 text-sm' : 'w-36 text-sm'
        }`}
      >
        <option value="">{mobileVariant ? 'All Accounts' : 'All Accounts'}</option>
        {allAccounts.map((account) => (
          <option key={account.id} value={account.id}>
            {getAccountOptionLabel(account)}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
    </div>
  );

  const renderCurrencySelector = (mobileVariant: boolean) => (
    <div className={`relative ${mobileVariant ? 'w-[82px] flex-shrink-0' : 'flex-shrink-0'}`}>
      <select
        value={selectedCurrency}
        onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
        disabled={isLoading}
        className={`content-header-input appearance-none rounded-lg border border-gray-200/50 bg-white/80 px-2 py-1.5 pr-6 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 dark:border-gray-700/50 dark:bg-[#0A0A0A]/80 dark:focus:ring-emerald-400 ${
          mobileVariant ? 'h-9 w-full text-xs' : 'w-24 text-xs'
        }`}
        title="Select display currency"
      >
        {Object.entries(CURRENCIES).map(([code]) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
      <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
        {isLoading ? (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-500" />
        ) : (
          <ChevronDown className="pointer-events-none h-3 w-3 text-gray-400" />
        )}
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="px-4 sm:px-5 py-3">
        <div className={`max-w-full ${isMobile ? 'space-y-2' : ''}`}>
          <div className="flex max-w-full items-center justify-between gap-2">
            {/* Left side - Menu button and title */}
            <div className={`flex min-w-0 flex-1 items-center ${isMobile ? 'space-x-2' : !isSidebarExpanded ? 'space-x-4' : 'space-x-6'}`}>
              {isMobile && (
                <button
                  onClick={toggleSidebar}
                  className="rounded-lg p-2 text-gray-500 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#0A0A0A] dark:hover:text-white"
                  aria-label="Toggle sidebar"
                >
                  <FaBars className="h-5 w-5" />
                </button>
              )}
              <h1 className={`truncate font-semibold text-gray-900 dark:text-white ${isMobile ? 'max-w-[38vw] text-base' : isSidebarExpanded ? 'text-xl' : 'text-lg'}`}>
                {getPageTitle()}
              </h1>

              {isAuthenticated && !isMobile && (
                <div className="flex items-center gap-2">
                  {renderAccountSelector(false)}
                  {renderCurrencySelector(false)}
                </div>
              )}
            </div>

            {/* Right side - Search, notifications, and theme toggle */}
            <div className={`flex flex-shrink-0 items-center ${isMobile ? 'space-x-1' : 'space-x-3'}`}>
              {!isMobile && (
                <div className="relative hidden sm:block">
                  <input
                    type="text"
                    placeholder="Search..."
                    className={`content-header-input rounded-lg border border-gray-200 bg-gray-100 px-3.5 py-1.5 pl-9 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-700 dark:bg-[#0A0A0A] dark:focus:ring-emerald-400 ${isSidebarExpanded ? 'w-60' : 'w-52'}`}
                  />
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              )}

              {isAuthenticated && (
                <div className="flex-shrink-0">
                  <NotificationBell />
                </div>
              )}

              <div className="flex-shrink-0">
                <ThemeToggle className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-[#0A0A0A]" />
              </div>

              {!isMobile && user && (
                <Link href="/profile" className="group hidden flex-shrink-0 items-center space-x-3 rounded-lg p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-[#0A0A0A] sm:flex">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-semibold text-white transition-shadow group-hover:shadow-md">
                    {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </div>
                  <div className="min-w-0 text-left hidden lg:block">
                    <p className="truncate text-sm font-medium text-gray-900 transition-colors group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400">
                      {user.firstName || user.email?.split('@')[0]}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {isAuthenticated && isMobile && (
            <div className="flex min-w-0 items-center gap-2">
              {renderAccountSelector(true)}
              {renderCurrencySelector(true)}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Named export
export { ContentHeader };

// Default export
export default ContentHeader; 
