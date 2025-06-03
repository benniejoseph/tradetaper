import { useState, useEffect } from 'react';
import { contentService } from '@/services/contentService';

type ContentType = 'product-description' | 'terms' | 'privacy' | 'cancellation-refund' | 'support' | 'index';

interface UseContentReturn {
  content: string;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useContent(contentType: ContentType): UseContentReturn {
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

  useEffect(() => {
    fetchContent();
  }, [contentType]);

  const refetch = () => {
    fetchContent();
  };

  return {
    content,
    loading,
    error,
    refetch
  };
}

// Hook for multiple content types
export function useMultipleContent(contentTypes: ContentType[]) {
  const [contents, setContents] = useState<Record<ContentType, string>>({} as Record<ContentType, string>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMultipleContents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const contentPromises = contentTypes.map(async (type) => {
        const contentTypeMap = {
          'product-description': () => contentService.getProductDescription(),
          'terms': () => contentService.getTermsOfService(),
          'privacy': () => contentService.getPrivacyPolicy(),
          'cancellation-refund': () => contentService.getCancellationRefundPolicy(),
          'support': () => contentService.getSupportGuide(),
          'index': () => contentService.getContentIndex()
        };
        
        const fetcher = contentTypeMap[type];
        if (!fetcher) {
          throw new Error(`Unknown content type: ${type}`);
        }
        
        const content = await fetcher();
        return { type, content };
      });

      const results = await Promise.all(contentPromises);
      const contentMap = results.reduce((acc, { type, content }) => {
        acc[type] = content;
        return acc;
      }, {} as Record<ContentType, string>);

      setContents(contentMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contentTypes.length > 0) {
      fetchMultipleContents();
    }
  }, [JSON.stringify(contentTypes)]);

  return {
    contents,
    loading,
    error,
    refetch: fetchMultipleContents
  };
} 