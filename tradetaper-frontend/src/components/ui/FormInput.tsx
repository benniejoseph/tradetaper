import React, { InputHTMLAttributes, forwardRef } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  className?: string;
  required?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className = '', required, ...props }, ref) => {
    return (
      <div className={className}>
        <label htmlFor={props.id || props.name} className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          ref={ref}
          className={`
            block w-full rounded-xl shadow-sm p-3 transition-all duration-200 border backdrop-blur-sm
            bg-white dark:bg-gray-950
            border-emerald-200/50 dark:border-emerald-700/50
            text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-medium
            focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none
            hover:border-emerald-300 dark:hover:border-emerald-600
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
