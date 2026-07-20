import React, { useEffect, useMemo, useState } from 'react';
import {
  FaComments,
  FaExternalLinkAlt,
  FaGlobe,
  FaNewspaper,
  FaRedoAlt,
  FaSignal,
} from 'react-icons/fa';
import { authApiClient as api } from '@/services/api';

type AssetClass = 'all' | 'forex' | 'indices' | 'commodities' | 'crypto';
type IndicatorTone = 'positive' | 'negative' | 'neutral';

interface EconomicIndicator {
  name: string;
  value: number;
  date: string;
  change: number;
  interpretation: IndicatorTone;
}

interface EconomicOverview {
  gdp: EconomicIndicator;
  unemployment: EconomicIndicator;
  inflation: EconomicIndicator;
  interestRate: EconomicIndicator;
  consumerConfidence?: EconomicIndicator;
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  marketImpact: string[];
  timestamp: string;
}

interface FreeSourceStatus {
  source: string;
  category: 'news' | 'social' | 'fundamentals';
  fetched: boolean;
  itemCount: number;
  fetchedAt: string;
  error?: string;
}

interface FreeMarketNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  assetClasses: AssetClass[];
  tags: string[];
  relevanceScore: number;
}

interface FreeSocialSignalItem {
  id: string;
  platform: 'reddit' | 'wikipedia';
  source: string;
  title: string;
  summary: string;
  author: string;
  url: string;
  publishedAt: string;
  upvotes: number;
  comments: number;
  engagementScore: number;
  assetClasses: AssetClass[];
  tags: string[];
}

interface MarketMoversResponse {
  generatedAt: string;
  assetClass: AssetClass;
  limit: number;
  news: {
    items: FreeMarketNewsItem[];
    totalAvailable: number;
  };
  socialSignals: {
    items: FreeSocialSignalItem[];
    totalAvailable: number;
  };
  fundamentals: {
    overview: EconomicOverview | null;
  };
  sourceStatus: FreeSourceStatus[];
  disclaimers: string[];
}

const assetClassOptions: Array<{ id: AssetClass; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'forex', label: 'Forex' },
  { id: 'indices', label: 'Indices' },
  { id: 'commodities', label: 'Commodities' },
  { id: 'crypto', label: 'Crypto' },
];

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
});

const formatIndicatorValue = (indicator: EconomicIndicator): string => {
  if (indicator.name.toLowerCase().includes('rate')) {
    return `${indicator.value.toFixed(2)}%`;
  }
  if (Math.abs(indicator.value) >= 1000) {
    return compactNumber.format(indicator.value);
  }
  return indicator.value.toFixed(2);
};

const sentimentBadge = (value: 'bullish' | 'bearish' | 'neutral'): string => {
  switch (value) {
    case 'bullish':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300';
    case 'bearish':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
  }
};

const MarketMoversFeed: React.FC = () => {
  const [assetClass, setAssetClass] = useState<AssetClass>('all');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<MarketMoversResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = async (selectedAssetClass: AssetClass) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<MarketMoversResponse>(
        '/market-intelligence/market-movers/free',
        {
          params: {
            assetClass: selectedAssetClass,
            limit: 28,
          },
        },
      );
      setData(response.data);
    } catch (fetchError) {
      console.error('Failed to fetch free market movers', fetchError);
      setError('Could not load free market movers feed. Please try again.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchFeed(assetClass);
  }, [assetClass]);

  const filteredNews = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    if (!term) return data.news.items;
    return data.news.items.filter((item) => {
      const haystack = `${item.title} ${item.summary} ${item.tags.join(' ')}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [data, search]);

  const filteredSocial = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    if (!term) return data.socialSignals.items;
    return data.socialSignals.items.filter((item) => {
      const haystack = `${item.title} ${item.summary} ${item.tags.join(' ')} ${item.source}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [data, search]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-emerald-900/40 bg-white dark:bg-black/70 p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaSignal className="text-emerald-600 dark:text-emerald-400" />
              Market Movers (Free Sources)
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Real-time macro headlines, Reddit + Wikipedia crowd signals, and FRED fundamentals.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchFeed(assetClass)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-emerald-800/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-emerald-950/40"
            disabled={loading}
          >
            <FaRedoAlt className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="mt-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {assetClassOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setAssetClass(option.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  assetClass === option.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-black text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-emerald-950/40'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search news and posts..."
            className="w-full lg:w-80 rounded-lg border border-gray-200 dark:border-emerald-900/50 bg-white dark:bg-black px-3 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-500"
          />
        </div>

        {data && (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Updated {new Date(data.generatedAt).toLocaleString()}
            </p>
            <div className="flex flex-wrap gap-2">
              {data.sourceStatus.map((status) => (
                <span
                  key={`${status.source}-${status.category}`}
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                    status.fetched
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                  }`}
                  title={status.error || `${status.itemCount} items`}
                >
                  {status.source}: {status.fetched ? status.itemCount : 'failed'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      {data?.fundamentals.overview && (
        <section className="rounded-xl border border-gray-200 dark:border-emerald-900/40 bg-white dark:bg-black/70 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FaGlobe className="text-emerald-600 dark:text-emerald-400" />
              Macro Fundamentals (FRED)
            </h3>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${sentimentBadge(
                data.fundamentals.overview.overallSentiment,
              )}`}
            >
              {data.fundamentals.overview.overallSentiment}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              data.fundamentals.overview.gdp,
              data.fundamentals.overview.unemployment,
              data.fundamentals.overview.inflation,
              data.fundamentals.overview.interestRate,
            ].map((indicator) => (
              <article
                key={indicator.name}
                className="rounded-lg border border-gray-100 dark:border-emerald-900/30 bg-gray-50 dark:bg-black px-3 py-3"
              >
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {indicator.name}
                </p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {formatIndicatorValue(indicator)}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Change {indicator.change >= 0 ? '+' : ''}
                  {indicator.change.toFixed(2)}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-emerald-900/40 bg-white dark:bg-black/70 p-4 sm:p-5">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FaNewspaper className="text-emerald-600 dark:text-emerald-400" />
            Market-Moving News
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {data?.news.totalAvailable ?? 0} items available
          </p>

          <div className="mt-4 space-y-3">
            {filteredNews.slice(0, 14).map((item) => (
              <article
                key={item.id}
                className="rounded-lg border border-gray-100 dark:border-emerald-900/30 bg-gray-50 dark:bg-black p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400"
                  >
                    {item.title}
                  </a>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-400 hover:text-emerald-500"
                  >
                    <FaExternalLinkAlt className="text-xs" />
                  </a>
                </div>
                {item.summary && (
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 line-clamp-3">
                    {item.summary}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                  <span>{item.source}</span>
                  <span>•</span>
                  <span>{new Date(item.publishedAt).toLocaleString()}</span>
                  <span>•</span>
                  <span>Relevance {item.relevanceScore}</span>
                </div>
              </article>
            ))}

            {!loading && filteredNews.length === 0 && (
              <div className="rounded-lg border border-gray-100 dark:border-emerald-900/30 bg-gray-50 dark:bg-black px-3 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                No news items matched this filter.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-emerald-900/40 bg-white dark:bg-black/70 p-4 sm:p-5">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FaComments className="text-emerald-600 dark:text-emerald-400" />
            Social Signals
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {data?.socialSignals.totalAvailable ?? 0} signals available
          </p>

          <div className="mt-4 space-y-3">
            {filteredSocial.slice(0, 14).map((item) => (
              <article
                key={item.id}
                className="rounded-lg border border-gray-100 dark:border-emerald-900/30 bg-gray-50 dark:bg-black p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400"
                  >
                    {item.title}
                  </a>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {item.source}
                  </span>
                </div>
                {item.summary && (
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 line-clamp-3">
                    {item.summary}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                  <span>
                    {item.platform === 'reddit'
                      ? `u/${item.author}`
                      : 'Wikimedia Analytics'}
                  </span>
                  <span>•</span>
                  <span>{new Date(item.publishedAt).toLocaleString()}</span>
                  <span>•</span>
                  <span>
                    {item.platform === 'reddit' ? 'Upvotes' : 'Views'}{' '}
                    {compactNumber.format(item.upvotes)}
                  </span>
                  <span>•</span>
                  <span>
                    {item.platform === 'reddit' ? 'Comments' : '7d Avg'}{' '}
                    {compactNumber.format(item.comments)}
                  </span>
                </div>
              </article>
            ))}

            {!loading && filteredSocial.length === 0 && (
              <div className="rounded-lg border border-gray-100 dark:border-emerald-900/30 bg-gray-50 dark:bg-black px-3 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                No social posts matched this filter.
              </div>
            )}
          </div>
        </div>
      </section>

      {data?.disclaimers?.length ? (
        <section className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-950/20 p-4">
          <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Signal Safety Notes
          </h4>
          <ul className="mt-2 space-y-1 text-xs text-amber-800 dark:text-amber-300 list-disc pl-4">
            {data.disclaimers.map((disclaimer, index) => (
              <li key={index}>{disclaimer}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
};

export default MarketMoversFeed;
