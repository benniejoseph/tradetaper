// src/components/analytics/StatCard.tsx (or a shared location)
"use client";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  positiveIsGood?: boolean; // For coloring P/L values (true if higher is better)
  isCurrency?: boolean;
  isPercentage?: boolean;
  className?: string; // Allow passing additional classes
}

const StatCard = ({
  title,
  value,
  description,
  positiveIsGood,
  isCurrency = false,
  isPercentage = false,
  className = ""
}: StatCardProps) => {
  let valueColor = 'text-white';
  const numericValue = typeof value === 'string' ? parseFloat(value) : value; // Ensure we compare numbers

  if (typeof numericValue === 'number' && positiveIsGood !== undefined) {
    if (numericValue > 0 && positiveIsGood) valueColor = 'text-green-400';
    else if (numericValue < 0 && positiveIsGood) valueColor = 'text-red-400';
    else if (numericValue < 0 && !positiveIsGood) valueColor = 'text-green-400'; // e.g., for Avg Loss, less negative is better
    else if (numericValue > 0 && !positiveIsGood) valueColor = 'text-red-400';
    // For zero or when positiveIsGood is undefined, it remains text-white
  }

  const displayValue = typeof numericValue === 'number'
    ? (
        isCurrency ? numericValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) :
        (isPercentage ? numericValue.toFixed(2) + '%' : numericValue.toFixed(2))
      )
    : value; // Display original string value if not a number or parsing failed

  return (
    <div className={`bg-gray-700 p-4 rounded-md shadow ${className}`}> {/* Updated background, allow className */}
      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</h3>
      <p className={`text-2xl font-semibold mt-1 ${valueColor}`}>{displayValue}</p>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  );
};

export default StatCard;