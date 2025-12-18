import React, { PropsWithChildren } from 'react';

type BadgeVariant = 'default' | 'secondary' | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<PropsWithChildren<BadgeProps>> = ({ variant = 'default', className = '', children }) => {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold';
  const styles: Record<BadgeVariant, string> = {
    default: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-[#141414] dark:text-gray-300',
    outline: 'border border-gray-300 dark:border-[#2A2A2A] text-gray-800 dark:text-gray-300',
  };
  return <span className={`${base} ${styles[variant]} ${className}`}>{children}</span>;
};

export default Badge;


