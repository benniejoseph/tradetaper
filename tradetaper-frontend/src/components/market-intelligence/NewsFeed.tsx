import React, { useEffect, useMemo, useState } from 'react';
import {
  FaExclamationTriangle,
  FaNewspaper,
  FaRedoAlt,
  FaVideo,
} from 'react-icons/fa';
import { authApiClient as api } from '@/services/api';

interface NewsArticle {
  id?: string;
  title: string;
  summary?: string;
  description?: string;
  source: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  category: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  sentimentScore?: number;
  impact?: 'low' | 'medium' | 'high';
  hasVideo?: boolean;
  videoUrl?: string;
  symbols?: string[];
}

interface CategoryOption {
  label: string;
  value: string;
}

interface SourceStatus {
  source: string;
  configured: boolean;
  fetched: boolean;
  articleCount: number;
  error?: string;
  fetchedAt: string;
}

interface NewsPayload {
  news: NewsArticle[];
  totalArticles: number;
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  lastUpdated: string;
  topSources: string[];
  appliedCategory: string;
  availableCategories: CategoryOption[];
  sourceStatus: SourceStatus[];
}

const FALLBACK_CATEGORIES: CategoryOption[] = [
  { label: 'All', value: 'all' },
  { label: 'Forex', value: 'forex' },
  { label: 'Crypto', value: 'crypto' },
  { label: 'Stocks', value: 'stocks' },
  { label: 'Economy', value: 'economy' },
  { label: 'Fed', value: 'fed' },
];

const categoryLabel = (value: string): string => {
  switch (value) {
    case 'all':
      return 'All';
    case 'forex':
      return 'Forex';
    case 'crypto':
      return 'Crypto';
    case 'stocks':
      return 'Stocks';
    case 'economy':
      return 'Economy';
    case 'fed':
      return 'Fed';
    default:
      return value.charAt(0).toUpperCase() + value.slice(1);
  }
};

const sentimentClass = (sentiment?: string): string => {
  if (sentiment === 'bullish') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
  }
  if (sentiment === 'bearish') {
    return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
  }
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
};

const impactClass = (impact?: string): string => {
  if (impact === 'high') {
    return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
  }
  if (impact === 'medium') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
  }
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
};

const sourceDotClass = (status: SourceStatus): string => {
  if (!status.configured) {
    return 'bg-gray-400';
  }
  if (!status.fetched) {
    return 'bg-rose-500';
  }
  return 'bg-emerald-500';
};

const formatTimestamp = (value?: string): string => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const normalizeCategoryOptions = (input: unknown): CategoryOption[] => {
  if (!Array.isArray(input) || input.length === 0) {
    return FALLBACK_CATEGORIES;
  }

  const normalized = input
    .map((item: unknown) => {
      if (!item || typeof item !== 'object') return null;
      const option = item as Partial<CategoryOption>;
      const value = String(option.value || '').trim().toLowerCase();
      if (!value) return null;
      return {
        value,
        label: String(option.label || categoryLabel(value)),
      };
    })
    .filter((item: CategoryOption | null): item is CategoryOption => item !== null);

  return normalized.length > 0 ? normalized : FALLBACK_CATEGORIES;
};

const NewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [meta, setMeta] = useState<NewsPayload | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const activeCategoryExists = useMemo(
    () => categories.some((cat) => cat.value === activeCategory),
    [categories, activeCategory],
  );

  useEffect(() => {
    if (!activeCategoryExists && categories.length > 0) {
      setActiveCategory(categories[0].value);
    }
  }, [activeCategoryExists, categories]);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const response = await api.get('/market-intelligence/news/categories');
        if (!isMounted) return;

        const fromBackend = normalizeCategoryOptions(response.data?.categories);
        setCategories(fromBackend);
      } catch {
        if (!isMounted) return;
        setCategories(FALLBACK_CATEGORIES);
      }
    };

    void fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchNews = async (category: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/market-intelligence/news', {
        params: {
          category,
          limit: 30,
        },
      });

      const payload = response.data;
      const items = Array.isArray(payload?.news)
        ? payload.news
        : Array.isArray(payload)
          ? payload
          : [];

      const normalizedPayload: NewsPayload = {
        news: items,
        totalArticles: Number(payload?.totalArticles ?? items.length ?? 0),
        overallSentiment: payload?.overallSentiment || 'neutral',
        sentimentScore: Number(payload?.sentimentScore ?? 0),
        lastUpdated: payload?.lastUpdated || new Date().toISOString(),
        topSources: Array.isArray(payload?.topSources) ? payload.topSources : [],
        appliedCategory: String(payload?.appliedCategory || category),
        availableCategories: normalizeCategoryOptions(payload?.availableCategories),
        sourceStatus: Array.isArray(payload?.sourceStatus)
          ? payload.sourceStatus
          : [],
      };

      setNews(items);
      setMeta(normalizedPayload);

      if (normalizedPayload.availableCategories.length > 0) {
        setCategories(normalizedPayload.availableCategories);
      }
    } catch (fetchError) {
      console.error('Failed to fetch news', fetchError);
      setError('Could not load market news. Please retry.');
      setNews([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchNews(activeCategory);
  }, [activeCategory]);

  const renderedCategories = categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-wrap items-center gap-2 pb-1">
        {renderedCategories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat.value
                ? 'bg-emerald-600 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.4)]'
                : 'bg-white dark:bg-black/70 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-emerald-950/40'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-emerald-900/40 bg-white dark:bg-black/70 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>
            Articles: <span className="font-semibold text-gray-800 dark:text-gray-100">{meta?.totalArticles ?? 0}</span>
          </span>
          <span>
            Sentiment:{' '}
            <span className={`px-2 py-0.5 rounded-full font-semibold ${sentimentClass(meta?.overallSentiment)}`}>
              {meta?.overallSentiment || 'neutral'}
            </span>
          </span>
          <span>
            Last update: <span className="font-semibold text-gray-800 dark:text-gray-100">{formatTimestamp(meta?.lastUpdated)}</span>
          </span>
          {meta?.topSources && meta.topSources.length > 0 && (
            <span className="truncate">
              Top sources: <span className="font-semibold text-gray-800 dark:text-gray-100">{meta.topSources.join(', ')}</span>
            </span>
          )}
        </div>

        {meta?.sourceStatus && meta.sourceStatus.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {meta.sourceStatus.map((status) => (
              <div
                key={status.source}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-emerald-900/40 px-2.5 py-1 text-xs"
                title={status.error || `${status.articleCount} articles`}
              >
                <span className={`h-2 w-2 rounded-full ${sourceDotClass(status)}`} />
                <span className="text-gray-700 dark:text-gray-200">{status.source}</span>
                <span className="text-gray-500 dark:text-gray-400">{status.articleCount}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-900/10 p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="mt-0.5 text-rose-600 dark:text-rose-300" />
            <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          </div>
          <button
            onClick={() => void fetchNews(activeCategory)}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700"
          >
            <FaRedoAlt size={11} /> Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-200 dark:bg-emerald-950/40 rounded-lg h-64"
            />
          ))
        ) : news.length > 0 ? (
          news.map((item, idx) => (
            <article
              key={item.id || `${item.url}-${idx}`}
              className="bg-white dark:bg-black/70 rounded-lg shadow-sm overflow-hidden flex flex-col border border-gray-100 dark:border-emerald-900/30 hover:shadow-md transition-shadow"
            >
              <div className="relative h-48 bg-gray-200 dark:bg-emerald-950/40">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <FaNewspaper size={48} />
                  </div>
                )}

                {item.hasVideo && (
                  <div className="absolute top-2 right-2 inline-flex items-center gap-1 bg-black/70 text-white text-[11px] px-2 py-1 rounded-full">
                    <FaVideo size={10} /> Video
                  </div>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    {item.category}
                  </span>
                  <span className="text-xs text-gray-500">{formatTimestamp(item.publishedAt)}</span>
                </div>

                <h3 className="text-md font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {item.title}
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3 flex-1">
                  {item.summary || item.description || 'No summary available.'}
                </p>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${sentimentClass(item.sentiment)}`}>
                    {item.sentiment || 'neutral'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${impactClass(item.impact)}`}>
                    {(item.impact || 'low').toUpperCase()} impact
                  </span>
                </div>

                <div className="mt-auto flex justify-between items-center gap-2">
                  <span className="text-xs text-gray-500 truncate">{item.source}</span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-medium whitespace-nowrap"
                  >
                    Read More →
                  </a>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="md:col-span-2 lg:col-span-3 rounded-lg border border-gray-200 dark:border-emerald-900/40 bg-white dark:bg-black/70 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No news found for this category.
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsFeed;
