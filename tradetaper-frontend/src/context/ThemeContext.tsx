"use client";

import React, { ReactNode } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

// Compatibility hook to match the old interface
export const useTheme = () => {
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return {
    theme: resolvedTheme, // Return resolvedTheme (light/dark) to match old behavior
    setTheme,
    toggleTheme,
    // Expose original values just in case
    systemTheme: theme === 'system',
    originalTheme: theme,
  };
};

// Deprecated Provider (no-op as next-themes provider is in providers.tsx)
// Keep it to avoid breaking imports in layout.tsx until it is removed there
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};
 