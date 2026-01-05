import React, { TextareaHTMLAttributes, forwardRef } from 'react';

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string | null;
  className?: string;
  required?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, className = '', required, ...props }, ref) => {
    return (
      <div className={className}>
        <label htmlFor={props.id || props.name} className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
          ref={ref}
          className={`
            block w-full rounded-xl shadow-sm p-3 transition-all duration-200 border backdrop-blur-sm min-h-[120px] resize-y
            bg-gradient-to-r from-emerald-50/50 to-white/50 dark:from-emerald-950/30 dark:to-emerald-900/10
            border-emerald-200/50 dark:border-emerald-700/30
            text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 font-medium
            focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none
            hover:from-emerald-100/60 hover:to-emerald-50/60 dark:hover:from-emerald-900/20 dark:hover:to-emerald-800/20
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

FormTextarea.displayName = 'FormTextarea';
