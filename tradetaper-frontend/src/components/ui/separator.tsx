import React from 'react';

export const Separator: React.FC<{ className?: string } & React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...rest }) => (
  <div className={`w-full h-px bg-gray-200 dark:bg-gray-700 ${className}`} {...rest} />
);

export default Separator;


