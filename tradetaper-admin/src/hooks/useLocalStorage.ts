'use client';

import { useState, useEffect, useCallback } from 'react';

// Custom hook for localStorage with real-time updates
export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Function to set value in localStorage and state
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        if (valueToStore === null || valueToStore === undefined) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        
        // Trigger custom event for cross-tab communication
        window.dispatchEvent(new CustomEvent('localStorage-change', {
          detail: { key, value: valueToStore }
        }));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Listen for changes in localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if ('key' in e && e.key === key) {
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : initialValue;
          setStoredValue(newValue);
        } catch (error) {
          console.error(`Error parsing localStorage change for key "${key}":`, error);
        }
      } else if ('detail' in e && e.detail.key === key) {
        setStoredValue(e.detail.value);
      }
    };

    // Listen for both storage events and custom events
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorage-change', handleStorageChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorage-change', handleStorageChange as EventListener);
    };
  }, [key, initialValue]);

  return [storedValue, setValue] as const;
}

// Specialized hook for authentication
export function useAuthStorage() {
  const [token, setToken] = useLocalStorage<string | null>('admin_token', null);
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('admin_authenticated', false);
  const [user, setUser] = useLocalStorage<any>('admin_user', null);

  const login = useCallback((tokenValue: string, userData: any) => {
    setToken(tokenValue);
    setIsAuthenticated(true);
    setUser(userData);
  }, [setToken, setIsAuthenticated, setUser]);

  const logout = useCallback(() => {
    setToken(null);
    setIsAuthenticated(false);
    setUser(null);
  }, [setToken, setIsAuthenticated, setUser]);

  const isLoggedIn = token && isAuthenticated;

  return {
    token,
    isAuthenticated: isLoggedIn,
    user,
    login,
    logout,
    setToken,
    setIsAuthenticated,
    setUser,
  };
}