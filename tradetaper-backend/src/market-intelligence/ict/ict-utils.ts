/**
 * ICT Utility Functions
 * Helper functions for ICT analysis services
 */

/**
 * Safely format a number to fixed decimal places
 * Returns 'N/A' if the value is null, undefined, or NaN
 */
export function safeToFixed(value: any, decimals: number = 2): string {
  try {
    if (value === null || value === undefined || value === '' || (typeof value === 'number' && isNaN(value))) {
      return 'N/A';
    }
    
    // If it's already a string, try to parse it
    const num = typeof value === 'string' ? parseFloat(value) : value;
    
    if (typeof num !== 'number' || isNaN(num)) {
      return 'N/A';
    }
    
    return num.toFixed(decimals);
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Safely format a price range
 * Returns 'N/A - N/A' if either value is invalid
 */
export function formatPriceRange(low: number | null | undefined, high: number | null | undefined, decimals: number = 2): string {
  return `${safeToFixed(low, decimals)} - ${safeToFixed(high, decimals)}`;
}

/**
 * Check if a value is a valid number
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Get a safe number value with a default fallback
 */
export function safeNumber(value: number | null | undefined, defaultValue: number = 0): number {
  return isValidNumber(value) ? value : defaultValue;
}

/**
 * Safely calculate percentage
 */
export function safePercentage(value: number | null | undefined, decimals: number = 1): string {
  if (!isValidNumber(value)) {
    return 'N/A';
  }
  return `${value.toFixed(decimals)}%`;
}

