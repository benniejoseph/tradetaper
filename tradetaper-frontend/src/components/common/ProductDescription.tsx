'use client';

import React, { useState, useEffect } from 'react';
import { contentService } from '@/services/contentService';

interface ProductDescriptionProps {
  showTitle?: boolean;
  className?: string;
  variant?: 'full' | 'compact' | 'landing';
}

const ProductDescription: React.FC<ProductDescriptionProps> = ({ 
  showTitle = true,
  className = '',
  variant = 'full'
}) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedContent = await contentService.getProductDescription();
        setContent(fetchedContent);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product description');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Content</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const getProseClasses = () => {
    switch (variant) {
      case 'compact':
        return 'prose prose-sm max-w-none';
      case 'landing':
        return 'prose prose-xl max-w-none text-center';
      default:
        return 'prose prose-lg max-w-none';
    }
  };

  return (
    <div className={`${getProseClasses()} ${className}`}>
      {showTitle && variant !== 'landing' && (
        <h1 className="text-3xl font-bold text-gray-900 mb-8">About TradeTaper</h1>
      )}
      <div 
        className="product-description-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

export default ProductDescription; 