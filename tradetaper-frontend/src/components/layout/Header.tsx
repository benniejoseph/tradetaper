"use client";
import React from 'react';
import { FaBars, FaTimes } from 'react-icons/fa'; // Icons for menu toggle
import { ThemeToggleButton } from '@/components/common/ThemeToggleButton'; // Added

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export default function Header({ isSidebarOpen, toggleSidebar }: HeaderProps) {
  return (
    <header className="bg-[var(--color-light-primary)] text-[var(--color-text-dark-primary)] 
                     dark:bg-dark-secondary dark:text-text-light-primary 
                     p-4 shadow-md md:hidden sticky top-0 z-30 
                     border-b border-[var(--color-light-border)] dark:border-transparent">
      <div className="container mx-auto flex justify-between items-center">
        {/* Placeholder for Logo or Page Title on mobile if needed */}
        <div className="text-xl font-semibold text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
          {/* Could be dynamic based on page, or App Logo */}
          Tradetaper
        </div>
        <div className="flex items-center space-x-2"> {/* Wrapper for buttons */}
          <ThemeToggleButton />
          <button 
            onClick={toggleSidebar}
            className="text-2xl p-1 text-[var(--color-text-dark-secondary)] hover:text-accent-green dark:text-text-light-secondary dark:hover:text-accent-green rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent-green"
            aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>
    </header>
  );
} 