"use client";
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'accent';
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const colorClasses = {
  primary: 'border-accent-blue',
  secondary: 'border-gray-400',
  accent: 'border-accent-green'
};

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary', 
  text, 
  className = '' 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[color]} 
          border-2 border-t-transparent rounded-full animate-spin
        `}
      />
      {text && (
        <p className="mt-2 text-sm text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary">
          {text}
        </p>
      )}
    </div>
  );
}

// Specific loading components for common use cases
export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

export function TableLoader({ text = "Loading data..." }: { text?: string }) {
  return (
    <div className="py-10 text-center">
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}

export function ButtonLoader() {
  return <LoadingSpinner size="sm" className="inline-flex" />;
} 