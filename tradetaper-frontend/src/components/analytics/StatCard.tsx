// src/components/analytics/StatCard.tsx (or a shared location)
"use client";

import { CurrencyAmount } from '@/components/common/CurrencyAmount';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  positiveIsGood?: boolean; // For coloring P/L values (true if higher is better)
  isCurrency?: boolean;
  isPercentage?: boolean;
  className?: string; // Allow passing additional classes
  fromCurrency?: string; // For currency conversion
}

const StatCard = ({
  title,
  value,
  description,
  positiveIsGood,
  isCurrency = false,
  isPercentage = false,
  className = "",
  fromCurrency = "USD"
}: StatCardProps) => {
  let valueColor = 'text-[var(--color-text-dark-primary)] dark:text-text-light-primary'; // Default to primary text for current theme
  const numericValue = typeof value === 'string' ? parseFloat(value) : value; // Ensure we compare numbers

  if (typeof numericValue === 'number' && positiveIsGood !== undefined) {
    if (numericValue > 0 && positiveIsGood) valueColor = 'text-accent-green';
    else if (numericValue < 0 && positiveIsGood) valueColor = 'text-accent-red';
    else if (numericValue < 0 && !positiveIsGood) valueColor = 'text-accent-green';
    else if (numericValue > 0 && !positiveIsGood) valueColor = 'text-accent-red';
  }

  // Format display value based on type
  let displayValue: React.ReactNode;
  
  if (typeof numericValue === 'number') {
    if (isCurrency) {
      displayValue = (
        <CurrencyAmount 
          amount={numericValue} 
          fromCurrency={fromCurrency}
          className={valueColor}
          showOriginal={false}
        />
      );
    } else if (isPercentage) {
      displayValue = numericValue.toFixed(2) + '%';
    } else {
      displayValue = numericValue.toFixed(2);
    }
  } else {
    displayValue = value; // Display original string value if not a number
  }

  // Icon mapping for StatCards
  let icon = '';
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('p&l') || lowerTitle.includes('pnl')) icon = '💲';
  else if (lowerTitle.includes('win rate')) icon = '🎯';
  else if (lowerTitle.includes('profit factor')) icon = '⚖️';
  else if (lowerTitle.includes('avg win') || lowerTitle.includes('average win')) icon = '📈';
  else if (lowerTitle.includes('avg loss') || lowerTitle.includes('average loss')) icon = '📉';
  else if (lowerTitle.includes('trades')) icon = '📊';
  else if (lowerTitle.includes('expectancy')) icon = '🔮';
  else if (lowerTitle.includes('max drawdown')) icon = '🩸';
  else if (lowerTitle.includes('commission')) icon = '💸';

  return (
    <div className={`bg-[var(--color-light-primary)] dark:bg-dark-secondary 
                     p-5 rounded-xl shadow-lg dark:shadow-card-modern 
                     hover:shadow-glow-green-sm transition-all duration-300 ease-in-out 
                     transform hover:-translate-y-1 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary uppercase tracking-wider">{title}</h3>
        {icon && <span className="text-2xl text-accent-green opacity-80">{icon}</span>} 
      </div>
      <div className={`text-3xl font-semibold mt-2 ${isCurrency ? '' : valueColor}`}>
        {displayValue}
      </div>
      {description && <p className="text-xs text-[var(--color-text-dark-secondary)] opacity-90 dark:text-text-light-secondary dark:opacity-90 mt-2">{description}</p>}
    </div>
  );
};

export default StatCard;