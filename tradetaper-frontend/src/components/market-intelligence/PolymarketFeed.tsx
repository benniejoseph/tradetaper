import React, { useEffect, useMemo, useState } from 'react';
import { FaChartLine, FaExternalLinkAlt, FaRedoAlt } from 'react-icons/fa';
import { authApiClient as api } from '@/services/api';

type AssetClass = 'all' | 'forex' | 'metals' | 'commodities' | 'indices';

interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  probability: number;
  endDate: string | null;
  volume: number;
  liquidity: number;
  tags: string[];
  url: string;
  assetClasses: AssetClass[];
}

interface PolymarketResponse {
  markets: PolymarketMarket[];
  assetClass: AssetClass;
  generatedAt: string;
  count: number;
}

const assetClassOptions: Array<{ id: AssetClass; label: string }> = [
  { id: 'all', label: 'All Trading' },
  { id: 'forex', label: 'Forex' },
  { id: 'metals', label: 'Metals' },
  { id: 'commodities', label: 'Commodities' },
  { id: 'indices', label: 'Indices' },
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const formatDate = (value: string | null): string => {
  if (!value) return 'No expiry';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'No expiry';
  return dateFormatter.format(parsed);
};

const PolymarketFeed: React.FC = () => {
  const [assetClass, setAssetClass] = useState<AssetClass>('all');
  const [search, setSearch] = useState('');
  const [markets, setMarkets] = useState<PolymarketMarket[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = async (selectedAssetClass: AssetClass) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<PolymarketResponse>('/market-intelligence/polymarket', {
        params: {
          assetClass: selectedAssetClass,
          limit: 48,
        },
      });

      setMarkets(Array.isArray(response.data?.markets) ? response.data.markets : []);
      setGeneratedAt(response.data?.generatedAt || new Date().toISOString());
    } catch (fetchError) {
      console.error('Failed to fetch Polymarket markets', fetchError);
      setError('Could not load Polymarket data. Try again in a moment.');
      setMarkets([]);
      setGeneratedAt(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMarkets(assetClass);
  }, [assetClass]);

  const filteredMarkets = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return markets;

    return markets.filter((market) => {
      const haystack = `${market.question} ${market.tags.join(' ')}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [markets, search]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-emerald-900/40 bg-white dark:bg-black/70 p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FaChartLine className="text-emerald-600 dark:text-emerald-400" />
              Polymarket Signal Hub
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Event probabilities for macro context. Use as risk/sentiment input, not entry trigger.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchMarkets(assetClass)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-emerald-800/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-emerald-950/40"
            >
              <FaRedoAlt className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
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
            placeholder="Search event question..."
            className="w-full lg:w-80 rounded-lg border border-gray-200 dark:border-emerald-900/50 bg-white dark:bg-black px-3 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-500"
          />
        </div>

        {generatedAt && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Updated {new Date(generatedAt).toLocaleString()}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredMarkets.map((market) => (
          <article
            key={market.id}
            className="rounded-xl border border-gray-200 dark:border-emerald-900/40 bg-white dark:bg-black/70 p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-snug">
                {market.question}
              </h3>
              <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                {market.probability.toFixed(2)}%
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Liquidity</p>
                <p className="font-semibold text-gray-900 dark:text-white">{currencyFormatter.format(market.liquidity)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Volume</p>
                <p className="font-semibold text-gray-900 dark:text-white">{currencyFormatter.format(market.volume)}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Expiry</p>
                <p className="font-semibold text-gray-900 dark:text-white">{formatDate(market.endDate)}</p>
              </div>
            </div>

            {market.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {market.tags.slice(0, 5).map((tag) => (
                  <span
                    key={`${market.id}-${tag}`}
                    className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-emerald-950/20 dark:text-emerald-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <a
                href={market.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                Open market
                <FaExternalLinkAlt className="text-xs" />
              </a>
            </div>
          </article>
        ))}
      </div>

      {!loading && filteredMarkets.length === 0 && !error && (
        <div className="rounded-xl border border-gray-200 dark:border-emerald-900/40 bg-white dark:bg-black/70 px-4 py-10 text-center text-sm text-gray-600 dark:text-gray-400">
          No trading-relevant Polymarket events matched this filter.
        </div>
      )}
    </div>
  );
};

export default PolymarketFeed;
