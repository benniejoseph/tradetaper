"use client";
import React from 'react';
import { FaSync, FaBell, FaCog, FaShareAlt, FaBars, FaWallet } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import {
  selectAvailableAccounts,
  selectSelectedAccount,
  setSelectedAccount
} from '@/store/features/accountSlice';

interface ContentHeaderProps {
  toggleSidebar?: () => void;
}

export default function ContentHeader({ toggleSidebar }: ContentHeaderProps) {
  const dispatch = useDispatch<AppDispatch>();
  const availableAccounts = useSelector(selectAvailableAccounts);
  const selectedAccount = useSelector(selectSelectedAccount);

  // Placeholder data from original code, will be replaced or removed if account balance comes from selectedAccount
  const placeholderAccountBalance = "6,578.98 USDT"; 
  const lastUpdated = "12:35 AM";

  const handleAccountChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setSelectedAccount(event.target.value));
  };

  const topBarBg = "bg-[var(--color-light-primary)] dark:bg-dark-secondary";
  const textColor = "text-[var(--color-text-dark-primary)] dark:text-text-light-primary";
  const secondaryTextColor = "text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary";
  const iconButtonClasses = `p-2 rounded-full hover:bg-[var(--color-light-hover)] dark:hover:bg-dark-primary transition-colors`;
  const selectStyles = `bg-transparent border border-[var(--color-light-border)] dark:border-gray-700 rounded-md text-sm font-medium focus:ring-accent-green focus:border-accent-green ${secondaryTextColor} hover:text-accent-green`;

  return (
    <header className={`w-full ${topBarBg} ${textColor} p-4 shadow-md sticky top-0 z-20 border-b border-[var(--color-light-border)] dark:border-dark-primary`}>
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {toggleSidebar && (
            <button 
              onClick={toggleSidebar}
              className={`md:hidden ${iconButtonClasses} ${secondaryTextColor}`}
              aria-label="Toggle sidebar"
            >
              <FaBars />
            </button>
          )}
          
          {/* Account Selection Dropdown */}
          <div className="flex items-center space-x-2">
            <FaWallet className="text-accent-green" />
            {availableAccounts.length > 0 ? (
              <select 
                value={selectedAccount?.id || ''} 
                onChange={handleAccountChange}
                className={`${selectStyles} px-2 py-1.5`}
              >
                {availableAccounts.map(account => (
                  <option key={account.id} value={account.id} className="bg-white dark:bg-dark-tertiary text-black dark:text-white">
                    {account.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className={`text-sm font-medium ${secondaryTextColor}`}>{placeholderAccountBalance}</span>
            )}
          </div>
        </div>

        {/* Right Section: Last Updated & Icons */}
        <div className="flex items-center space-x-3">
          <span className={`text-xs ${secondaryTextColor} hidden lg:block`}>
            Last updated: {lastUpdated}
          </span>
          
          <button className={`${iconButtonClasses} ${secondaryTextColor}`} aria-label="Refresh data">
            <FaSync />
          </button>
          <button className={`${iconButtonClasses} ${secondaryTextColor}`} aria-label="Notifications">
            <FaBell />
          </button>
          <button className={`${iconButtonClasses} ${secondaryTextColor}`} aria-label="Settings">
            <FaCog />
          </button>
          <button className={`${iconButtonClasses} ${secondaryTextColor}`} aria-label="Share or export">
            <FaShareAlt />
          </button>
        </div>
      </div>
    </header>
  );
} 