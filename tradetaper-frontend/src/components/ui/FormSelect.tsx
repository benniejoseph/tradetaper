import React, { SelectHTMLAttributes, forwardRef, ReactNode } from 'react';

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string | null;
  className?: string;
  required?: boolean;
  children: ReactNode;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, className = '', required, children, ...props }, ref) => {
    return (
      <div className={className}>
        <label htmlFor={props.id || props.name} className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            <select
            ref={ref}
            className={`
                block w-full rounded-xl shadow-sm p-3 transition-all duration-200 border backdrop-blur-sm appearance-none
                bg-gradient-to-r from-emerald-50/50 to-white/50 dark:from-emerald-950/30 dark:to-emerald-900/10
                border-emerald-200/50 dark:border-emerald-700/30
                text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 font-medium
                focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none
                hover:from-emerald-100/60 hover:to-emerald-50/60 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20
                ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            `}
            {...props}
            >
            {children}
            </select>
             {/* Custom Dropdown Arrow */}
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';
