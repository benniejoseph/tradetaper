import React, { PropsWithChildren, useState } from 'react';

interface TabsProps extends PropsWithChildren<{ defaultValue: string; className?: string }>{}
export const Tabs: React.FC<TabsProps> = ({ defaultValue, className = '', children }) => {
  return <div className={className}>{children}</div>;
};

export const TabsList: React.FC<PropsWithChildren<{ className?: string }>> = ({ className = '', children }) => (
  <div className={`inline-flex items-center gap-2 rounded-md border p-1 ${className}`}>{children}</div>
);

interface TabsTriggerProps extends PropsWithChildren<{ value: string; className?: string }>{}
export const TabsTrigger: React.FC<TabsTriggerProps> = ({ className = '', children }) => (
  <button type="button" className={`px-3 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${className}`}>{children}</button>
);

interface TabsContentProps extends PropsWithChildren<{ value: string; className?: string }>{}
export const TabsContent: React.FC<TabsContentProps> = ({ className = '', children }) => (
  <div className={className}>{children}</div>
);

export default Tabs;


