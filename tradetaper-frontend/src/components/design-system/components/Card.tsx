import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  footer?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      title,
      footer,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'bg-white shadow-sm rounded-lg overflow-hidden';
    
    const classes = [
      baseClasses,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classes} {...props}>
        {title && (
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {title}
            </h3>
          </div>
        )}
        <div className="px-4 py-5 sm:p-6">{children}</div>
        {footer && (
          <div className="px-4 py-4 sm:px-6 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card'; 