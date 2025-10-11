import React, { PropsWithChildren } from 'react';

type AlertVariant = 'default' | 'destructive';

interface AlertProps {
  variant?: AlertVariant;
  className?: string;
}

export const Alert: React.FC<PropsWithChildren<AlertProps>> = ({ variant = 'default', className = '', children }) => {
  const base = 'rounded-md border p-3 flex items-start gap-2';
  const styles: Record<AlertVariant, string> = {
    default: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
    destructive: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200',
  };
  return <div className={`${base} ${styles[variant]} ${className}`}>{children}</div>;
};

export const AlertDescription: React.FC<PropsWithChildren<{ className?: string }>> = ({ className = '', children }) => (
  <div className={`text-sm ${className}`}>{children}</div>
);

export default Alert;


