import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm';
    
    const errorClasses = error ? 'border-red-500' : '';

    const classes = [
      baseClasses,
      errorClasses,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div>
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <div className="relative mt-1 rounded-md shadow-sm">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">{leftIcon}</span>
            </div>
          )}
          <input ref={ref} className={classes} {...props} />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-500 sm:text-sm">{rightIcon}</span>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600" id={`${props.id}-error`}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input'; 