"use client";
import React from 'react';

export interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface FormTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export const FormTabs: React.FC<FormTabsProps> = ({ tabs, activeTab, onTabChange, children }) => {
  return (
    <div className="w-full">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 dark:border-white/10 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all duration-200 border-b-2 -mb-px
              ${activeTab === tab.id 
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/5' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
          >
            <span className="w-4 h-4">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="min-h-[300px]">
        {children}
      </div>
    </div>
  );
};

export default FormTabs;
