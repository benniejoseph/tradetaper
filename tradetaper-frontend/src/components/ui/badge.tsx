import React, { PropsWithChildren } from 'react';

type BadgeVariant = 'default' | 'secondary' | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<PropsWithChildren<BadgeProps>> = ({ variant = 'default', className = '', children }) => {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold';
  const styles: Record<BadgeVariant, string> = {
    default: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    outline: 'border border-gray-300 text-gray-800 dark:border-gray-600 dark:text-gray-200',
  };
  return <span className={`${base} ${styles[variant]} ${className}`}>{children}</span>;
};

export default Badge;


