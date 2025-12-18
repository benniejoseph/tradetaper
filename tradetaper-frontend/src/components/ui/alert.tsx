import React, { PropsWithChildren } from 'react';

type AlertVariant = 'default' | 'destructive';

interface AlertProps {
  variant?: AlertVariant;
  className?: string;
}

export const Alert: React.FC<PropsWithChildren<AlertProps>> = ({ variant = 'default', className = '', children }) => {
  const base = 'rounded-md border p-3 flex items-start gap-2';
  const styles: Record<AlertVariant, string> = {
    default: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300',
    destructive: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300',
  };
  return <div className={`${base} ${styles[variant]} ${className}`}>{children}</div>;
};

export const AlertDescription: React.FC<PropsWithChildren<{ className?: string }>> = ({ className = '', children }) => (
  <div className={`text-sm ${className}`}>{children}</div>
);

export default Alert;


