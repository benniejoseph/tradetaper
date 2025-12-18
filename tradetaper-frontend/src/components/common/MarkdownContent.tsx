'use client';

import React from 'react';

interface MarkdownContentProps {
  contentType: 'product-description' | 'terms' | 'privacy' | 'cancellation-refund' | 'support' | 'index';
  title?: string;
  className?: string;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({ 
  contentType, 
  title,
  className = '' 
}) => {
  const getContent = () => {
    switch (contentType) {
      case 'product-description':
        return '<p>TradeTaper is your advanced trading journal and analysis platform.</p>';
      case 'terms':
        return '<p>Terms of Service content will be displayed here.</p>';
      case 'privacy':
        return '<p>Privacy Policy content will be displayed here.</p>';
      case 'cancellation-refund':
        return '<p>Cancellation and Refund Policy content will be displayed here.</p>';
      case 'support':
        return '<p>Support Guide content will be displayed here.</p>';
      case 'index':
        return '<p>Content Index will be displayed here.</p>';
      default:
        return '<p>Content not available.</p>';
    }
  };

  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      {title && (
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{title}</h1>
      )}
      <div 
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: getContent() }}
      />
    </div>
  );
};

export default MarkdownContent; 