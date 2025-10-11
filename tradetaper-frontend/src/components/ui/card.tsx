import React, { PropsWithChildren } from 'react';

type WithClassName = { className?: string };

export const Card: React.FC<PropsWithChildren<WithClassName>> = ({ className = '', children }) => (
  <div className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${className}`}>
    {children}
  </div>
);

export const CardHeader: React.FC<PropsWithChildren<WithClassName>> = ({ className = '', children }) => (
  <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>{children}</div>
);

export const CardContent: React.FC<PropsWithChildren<WithClassName>> = ({ className = '', children }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

export const CardTitle: React.FC<PropsWithChildren<WithClassName>> = ({ className = '', children }) => (
  <h3 className={`text-sm font-medium ${className}`}>{children}</h3>
);

export default Card;


