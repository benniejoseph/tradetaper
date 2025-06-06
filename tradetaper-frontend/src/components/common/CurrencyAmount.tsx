"use client";
import React from 'react';
import { useCurrency } from '@/context/CurrencyContext';

interface CurrencyAmountProps {
  amount: number;
  fromCurrency?: string;
  className?: string;
  showOriginal?: boolean;
  precision?: number;
}

/**
 * A component that displays monetary amounts with automatic currency conversion
 */
export const CurrencyAmount: React.FC<CurrencyAmountProps> = ({
  amount,
  fromCurrency = 'USD',
  className = '',
  showOriginal = false,
  precision,
}) => {
  const { formatCurrency, selectedCurrency, convertAmount } = useCurrency();

  // Handle zero or invalid amounts
  if (amount === 0) {
    return <span className={className}>0</span>;
  }

  if (isNaN(amount)) {
    return <span className={className}>-</span>;
  }

  const formattedAmount = formatCurrency(amount, fromCurrency);
  const convertedAmount = convertAmount(amount, fromCurrency);
  
  // Show original currency if different from selected and showOriginal is true
  const shouldShowOriginal = showOriginal && fromCurrency !== selectedCurrency;

  return (
    <span className={className} title={shouldShowOriginal ? `Original: ${amount.toFixed(precision || 2)} ${fromCurrency}` : undefined}>
      {formattedAmount}
      {shouldShowOriginal && (
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
          ({amount.toFixed(precision || 2)} {fromCurrency})
        </span>
      )}
    </span>
  );
};

/**
 * Hook to format amounts without rendering a component
 */
export const useCurrencyFormat = () => {
  const { formatCurrency, convertAmount } = useCurrency();
  
  return {
    formatAmount: (amount: number, fromCurrency?: string) => formatCurrency(amount, fromCurrency),
    convertAmount: (amount: number, fromCurrency?: string) => convertAmount(amount, fromCurrency),
  };
};