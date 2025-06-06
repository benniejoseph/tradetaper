/**
 * Format a date string or Date object for display
 * @param dateString Date string or Date object to format
 * @returns Formatted date string
 */
export function formatDate(dateString?: string | Date | null): string {
  if (!dateString) return 'Never';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Format a date as a relative time (e.g., "2 hours ago")
 * @param dateString Date string or Date object to format
 * @returns Formatted relative time string
 */
export function formatRelativeTime(dateString?: string | Date | null): string {
  if (!dateString) return 'Never';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  // Convert to seconds
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) {
    return diffSec <= 1 ? 'just now' : `${diffSec} seconds ago`;
  }
  
  // Convert to minutes
  const diffMin = Math.floor(diffSec / 60);
  
  if (diffMin < 60) {
    return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  }
  
  // Convert to hours
  const diffHour = Math.floor(diffMin / 60);
  
  if (diffHour < 24) {
    return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
  }
  
  // Convert to days
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay < 30) {
    return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
  }
  
  // For older dates, return the formatted date
  return formatDate(date);
}

/**
 * Format a date as a short date string (e.g., "Jan 1, 2023")
 * @param dateString Date string or Date object to format
 * @returns Formatted short date string
 */
export function formatShortDate(dateString?: string | Date | null): string {
  if (!dateString) return 'Never';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
} 