'use client';

import { useState, useEffect, useCallback } from 'react';

// Custom hook for localStorage with real-time updates
export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value with immediate localStorage read
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      console.log(`useLocalStorage init: ${key} = ${item}`);
      
      if (item === null) return initialValue;
      
      // Handle legacy string boolean values
      if (item === 'true') return true as T;
      if (item === 'false') return false as T;
      
      // Try to parse as JSON, fallback to string value
      try {
        return JSON.parse(item);
      } catch {
        return item as T;
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Force a re-read on mount to ensure we have the latest value
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const item = window.localStorage.getItem(key);
      console.log(`useLocalStorage mount check: ${key} = ${item}`);
      
      if (item === null) return;
      
      let parsedValue;
      // Handle legacy string boolean values
      if (item === 'true') parsedValue = true as T;
      else if (item === 'false') parsedValue = false as T;
      else {
        try {
          parsedValue = JSON.parse(item);
        } catch {
          parsedValue = item as T;
        }
      }
      
      setStoredValue(currentValue => {
        if (JSON.stringify(currentValue) !== JSON.stringify(parsedValue)) {
          console.log(`useLocalStorage: Updating ${key} from ${currentValue} to ${parsedValue}`);
          return parsedValue;
        }
        return currentValue;
      });
    } catch (error) {
      console.error(`Error re-reading localStorage key "${key}":`, error);
    }
  }, [key]);

  // Function to set value in localStorage and state
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue(currentValue => {
        const valueToStore = value instanceof Function ? value(currentValue) : value;
        
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
        
        return valueToStore;
      });
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  // Listen for changes in localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if ('key' in e && e.key === key) {
        try {
          if (!e.newValue) {
            setStoredValue(initialValue);
            return;
          }
          
          // Handle legacy string boolean values
          if (e.newValue === 'true') {
            setStoredValue(true as T);
            return;
          }
          if (e.newValue === 'false') {
            setStoredValue(false as T);
            return;
          }
          
          // Try to parse as JSON, fallback to string value
          try {
            const newValue = JSON.parse(e.newValue);
            setStoredValue(newValue);
          } catch {
            setStoredValue(e.newValue as T);
          }
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

// Specialized hook for authentication - uses string storage for backward compatibility
export function useAuthStorage() {
  const [token, setToken] = useLocalStorage<string | null>('admin_token', null);
  const [authFlag, setAuthFlag] = useLocalStorage<string>('admin_authenticated', 'false');
  const [user, setUser] = useLocalStorage<any>('admin_user', null);

  const login = useCallback((tokenValue: string, userData: any) => {
    console.log('useAuthStorage: login called with token:', !!tokenValue);
    setToken(tokenValue);
    setAuthFlag('true');
    setUser({
      ...userData,
      loginTime: new Date().toISOString(),
    });
  }, [setToken, setAuthFlag, setUser]);

  const logout = useCallback(() => {
    console.log('useAuthStorage: logout called');
    setToken(null);
    setAuthFlag('false');
    setUser(null);
  }, [setToken, setAuthFlag, setUser]);

  // User is authenticated if both token exists and auth flag is 'true'
  const isAuthenticated = !!(token && authFlag === 'true');

  console.log('useAuthStorage: state check', { token: !!token, authFlag, isAuthenticated });

  return {
    token,
    isAuthenticated,
    user,
    login,
    logout,
    setToken,
    setAuthFlag,
    setUser,
  };
}