"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Common currencies for trading
export const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺' },
  GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  JPY: { symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
};

export type CurrencyCode = keyof typeof CURRENCIES;

interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyContextType {
  selectedCurrency: CurrencyCode;
  setSelectedCurrency: (currency: CurrencyCode) => void;
  exchangeRates: ExchangeRates;
  convertAmount: (amount: number, fromCurrency?: string) => number;
  formatCurrency: (amount: number, fromCurrency?: string) => string;
  isLoading: boolean;
  lastUpdated: Date | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

// Mock exchange rates service - in production, you'd use a real API like ExchangeRate-API, Fixer.io, etc.
const fetchExchangeRates = async (baseCurrency: CurrencyCode): Promise<ExchangeRates> => {
  // Mock rates - in production, fetch from real API
  const mockRates: Record<CurrencyCode, ExchangeRates> = {
    USD: {
      EUR: 0.85,
      GBP: 0.73,
      JPY: 110.0,
      CHF: 0.92,
      CAD: 1.25,
      AUD: 1.35,
      NZD: 1.45,
      USD: 1.0,
    },
    EUR: {
      USD: 1.18,
      GBP: 0.86,
      JPY: 129.5,
      CHF: 1.08,
      CAD: 1.47,
      AUD: 1.59,
      NZD: 1.71,
      EUR: 1.0,
    },
    GBP: {
      USD: 1.37,
      EUR: 1.16,
      JPY: 150.7,
      CHF: 1.26,
      CAD: 1.71,
      AUD: 1.85,
      NZD: 1.99,
      GBP: 1.0,
    },
    JPY: {
      USD: 0.0091,
      EUR: 0.0077,
      GBP: 0.0066,
      CHF: 0.0084,
      CAD: 0.0114,
      AUD: 0.0123,
      NZD: 0.0132,
      JPY: 1.0,
    },
    CHF: {
      USD: 1.09,
      EUR: 0.93,
      GBP: 0.79,
      JPY: 119.6,
      CAD: 1.36,
      AUD: 1.47,
      NZD: 1.58,
      CHF: 1.0,
    },
    CAD: {
      USD: 0.80,
      EUR: 0.68,
      GBP: 0.58,
      JPY: 88.0,
      CHF: 0.74,
      AUD: 1.08,
      NZD: 1.16,
      CAD: 1.0,
    },
    AUD: {
      USD: 0.74,
      EUR: 0.63,
      GBP: 0.54,
      JPY: 81.5,
      CHF: 0.68,
      CAD: 0.93,
      NZD: 1.07,
      AUD: 1.0,
    },
    NZD: {
      USD: 0.69,
      EUR: 0.58,
      GBP: 0.50,
      JPY: 75.9,
      CHF: 0.63,
      CAD: 0.86,
      AUD: 0.93,
      NZD: 1.0,
    },
  };

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return mockRates[baseCurrency] || mockRates.USD;
};

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load saved currency preference
  useEffect(() => {
    const savedCurrency = localStorage.getItem('tradeTaper.selectedCurrency');
    if (savedCurrency && savedCurrency in CURRENCIES) {
      setSelectedCurrency(savedCurrency as CurrencyCode);
    }
  }, []);

  // Fetch exchange rates when currency changes
  useEffect(() => {
    const loadExchangeRates = async () => {
      setIsLoading(true);
      try {
        const rates = await fetchExchangeRates(selectedCurrency);
        setExchangeRates(rates);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        // Set default rates in case of error
        setExchangeRates({ [selectedCurrency]: 1.0 });
      } finally {
        setIsLoading(false);
      }
    };

    loadExchangeRates();
  }, [selectedCurrency]);

  // Save currency preference and update rates
  const handleSetSelectedCurrency = (currency: CurrencyCode) => {
    setSelectedCurrency(currency);
    localStorage.setItem('tradeTaper.selectedCurrency', currency);
  };

  // Convert amount from one currency to selected currency
  const convertAmount = (amount: number, fromCurrency: string = 'USD'): number => {
    if (fromCurrency === selectedCurrency) return amount;
    
    const rate = exchangeRates[fromCurrency as CurrencyCode];
    if (!rate) return amount; // Return original if no rate available
    
    return amount * rate;
  };

  // Format currency with proper symbol and decimal places
  const formatCurrency = (amount: number, fromCurrency: string = 'USD'): string => {
    const convertedAmount = convertAmount(amount, fromCurrency);
    const currency = CURRENCIES[selectedCurrency];
    
    // Special formatting for JPY (no decimal places)
    const decimals = selectedCurrency === 'JPY' ? 0 : 2;
    
    return `${currency.symbol}${convertedAmount.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };

  const contextValue: CurrencyContextType = {
    selectedCurrency,
    setSelectedCurrency: handleSetSelectedCurrency,
    exchangeRates,
    convertAmount,
    formatCurrency,
    isLoading,
    lastUpdated,
  };

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};