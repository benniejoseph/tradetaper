'use client';

import React, { useState, useEffect } from 'react';
import { contentService } from '@/services/contentService';

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
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contentTypeMap = {
    'product-description': () => contentService.getProductDescription(),
    'terms': () => contentService.getTermsOfService(),
    'privacy': () => contentService.getPrivacyPolicy(),
    'cancellation-refund': () => contentService.getCancellationRefundPolicy(),
    'support': () => contentService.getSupportGuide(),
    'index': () => contentService.getContentIndex()
  };

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const contentFetcher = contentTypeMap[contentType];
        if (!contentFetcher) {
          throw new Error(`Unknown content type: ${contentType}`);
        }
        
        const fetchedContent = await contentFetcher();
        setContent(fetchedContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [contentType]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading content...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Content</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      {title && (
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{title}</h1>
      )}
      <div 
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

export default MarkdownContent; 