"use client";

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { themeClasses } from '@/styles/theme-classes';

interface ThemeToggleProps {
  variant?: 'icon' | 'button' | 'switch';
  showLabel?: boolean;
  className?: string;
}

/**
 * ThemeToggle Component
 * 
 * A reusable component for toggling between light and dark themes.
 * Uses the centralized theme system.
 * 
 * @param variant - Display variant: 'icon' (icon only), 'button' (with label), 'switch' (toggle switch)
 * @param showLabel - Whether to show the theme name label
 * @param className - Additional CSS classes
 */
export function ThemeToggle({ 
  variant = 'icon', 
  showLabel = false,
  className = ''
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'switch') {
    return (
      <button
        onClick={toggleTheme}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors duration-200 focus:outline-none focus:ring-2 
          focus:ring-emerald-500 focus:ring-offset-2
          ${isDark ? 'bg-emerald-600' : 'bg-gray-300'}
          ${className}
        `}
        role="switch"
        aria-checked={isDark}
        aria-label="Toggle theme"
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white 
            transition-transform duration-200
            ${isDark ? 'translate-x-6' : 'translate-x-1'}
          `}
        >
          {isDark ? (
            <Moon className="h-3 w-3 text-emerald-600 ml-0.5 mt-0.5" />
          ) : (
            <Sun className="h-3 w-3 text-gray-500 ml-0.5 mt-0.5" />
          )}
        </span>
        {showLabel && (
          <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
            {isDark ? 'Dark' : 'Light'}
          </span>
        )}
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={`
          ${themeClasses.button.secondary}
          flex items-center gap-2
          ${className}
        `}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <>
            <Moon className="h-4 w-4" />
            {showLabel && <span>Dark Mode</span>}
          </>
        ) : (
          <>
            <Sun className="h-4 w-4" />
            {showLabel && <span>Light Mode</span>}
          </>
        )}
      </button>
    );
  }

  // Default: icon variant
  return (
    <button
      onClick={toggleTheme}
      className={`
        ${themeClasses.button.icon}
        relative
        ${className}
      `}
      aria-label="Toggle theme"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative h-5 w-5">
        {/* Sun icon */}
        <Sun 
          className={`
            absolute inset-0 h-5 w-5 transition-all duration-300
            ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}
          `}
        />
        {/* Moon icon */}
        <Moon 
          className={`
            absolute inset-0 h-5 w-5 transition-all duration-300
            ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}
          `}
        />
      </div>
    </button>
  );
}

export default ThemeToggle;

