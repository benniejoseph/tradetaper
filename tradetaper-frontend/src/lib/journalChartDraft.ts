import { Timeframe } from '@/types/enums';
import { AssetType, Trade, TradeDirection, TradeStatus } from '@/types/trade';

export const JOURNAL_CHART_DRAFT_STORAGE_KEY = 'tt.journal.chartDraft.v1';

export interface StoredJournalChartDraft {
  createdAt: string;
  draft: Partial<Trade>;
  analysisSummary?: string;
}

type UnknownRecord = Record<string, unknown>;

const FOREX_CURRENCIES = new Set([
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'AUD',
  'NZD',
  'CAD',
  'CHF',
]);

const asRecord = (value: unknown): UnknownRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as UnknownRecord;
};

const firstString = (record: UnknownRecord, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
};

const firstNumber = (record: UnknownRecord, keys: string[]): number | undefined => {
  for (const key of keys) {
    const value = record[key];
    const parsed = toFiniteNumber(value);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
};

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const normalized = value.replace(/,/g, '').replace(/[^0-9.\-]/g, '');
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeSymbol = (value: string): string => {
  return value
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[._:-]/g, '')
    .replace('/', '');
};

const parseDirection = (value: unknown): TradeDirection | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized.includes('short') || normalized.includes('sell') || normalized.includes('bear')) {
    return TradeDirection.SHORT;
  }
  if (normalized.includes('long') || normalized.includes('buy') || normalized.includes('bull')) {
    return TradeDirection.LONG;
  }
  return undefined;
};

const parseTimeframe = (value: unknown): Timeframe | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toUpperCase().replace(/\s+/g, '');
  if (!normalized) return undefined;

  const aliases: Record<string, Timeframe> = {
    M1: Timeframe.M1,
    '1M': Timeframe.M1,
    '1MIN': Timeframe.M1,
    M5: Timeframe.M5,
    '5M': Timeframe.M5,
    '5MIN': Timeframe.M5,
    M15: Timeframe.M15,
    '15M': Timeframe.M15,
    '15MIN': Timeframe.M15,
    M30: Timeframe.M30,
    '30M': Timeframe.M30,
    '30MIN': Timeframe.M30,
    H1: Timeframe.H1,
    '1H': Timeframe.H1,
    '1HR': Timeframe.H1,
    H4: Timeframe.H4,
    '4H': Timeframe.H4,
    '4HR': Timeframe.H4,
    D1: Timeframe.D1,
    '1D': Timeframe.D1,
    DAILY: Timeframe.D1,
    W1: Timeframe.W1,
    '1W': Timeframe.W1,
    WEEKLY: Timeframe.W1,
    MN: Timeframe.MN,
    '1MO': Timeframe.MN,
    '1MONTH': Timeframe.MN,
    MONTHLY: Timeframe.MN,
  };

  return aliases[normalized];
};

const parseDate = (datePart?: string, timePart?: string): string | undefined => {
  const dateValue = datePart?.trim();
  const timeValue = timePart?.trim();
  if (!dateValue && !timeValue) return undefined;
  const candidate = dateValue && timeValue ? `${dateValue} ${timeValue}` : dateValue || timeValue || '';
  if (!candidate) return undefined;

  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

const deriveAssetType = (symbol: string): AssetType => {
  if (/BTC|ETH|SOL|XRP|ADA|DOGE|LTC/.test(symbol)) return AssetType.CRYPTO;
  if (/XAU|XAG|GOLD|SILVER|WTI|BRENT|OIL/.test(symbol)) return AssetType.COMMODITIES;
  if (symbol.length === 6) {
    const base = symbol.slice(0, 3);
    const quote = symbol.slice(3, 6);
    if (FOREX_CURRENCIES.has(base) && FOREX_CURRENCIES.has(quote)) {
      return AssetType.FOREX;
    }
  }
  return AssetType.STOCK;
};

const readStringArray = (record: UnknownRecord, keys: string[]): string[] => {
  for (const key of keys) {
    const value = record[key];
    if (!Array.isArray(value)) continue;
    const values = value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
    if (values.length > 0) return values;
  }
  return [];
};

const summarizeIndicators = (value: unknown): string | undefined => {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const lines = value
    .map((entry) => {
      if (typeof entry === 'string') return entry.trim();
      const indicator = asRecord(entry);
      if (!indicator) return '';
      const name = typeof indicator.name === 'string' ? indicator.name.trim() : '';
      const indicatorValue =
        typeof indicator.value === 'string' || typeof indicator.value === 'number'
          ? String(indicator.value).trim()
          : '';
      if (!name && !indicatorValue) return '';
      return indicatorValue ? `${name}: ${indicatorValue}` : name;
    })
    .filter((line) => line.length > 0);

  return lines.length > 0 ? lines.join(', ') : undefined;
};

const getCandidateRecord = (payload: unknown): UnknownRecord | null => {
  const root = asRecord(payload);
  if (!root) return null;

  const nestedKeys = ['data', 'result', 'analysis', 'tradeDraft', 'trade', 'draft'];
  const nestedRecords = nestedKeys
    .map((key) => asRecord(root[key]))
    .filter((entry): entry is UnknownRecord => entry !== null);

  const candidates = [root, ...nestedRecords];
  return candidates.find((candidate) =>
    ['symbol', 'instrument', 'entryPrice', 'openPrice', 'direction', 'side', 'observations'].some(
      (field) => field in candidate,
    ),
  ) || root;
};

export const buildJournalChartDraft = (payload: unknown): StoredJournalChartDraft | null => {
  const source = getCandidateRecord(payload);
  if (!source) return null;

  const rawSymbol = firstString(source, ['symbol', 'instrument', 'pair', 'ticker']);
  const symbol = rawSymbol ? normalizeSymbol(rawSymbol) : undefined;
  const direction = parseDirection(source.direction ?? source.side);
  const entryPrice = firstNumber(source, ['entryPrice', 'openPrice', 'entry']);
  const exitPrice = firstNumber(source, ['exitPrice', 'closePrice', 'exit']);
  const stopLoss = firstNumber(source, ['stopLoss', 'sl']);
  const takeProfit = firstNumber(source, ['takeProfit', 'tp']);

  const timeframe = parseTimeframe(firstString(source, ['timeframe', 'tf', 'chartTimeframe']));
  const sentiment = firstString(source, ['sentiment', 'marketSentiment']);
  const observations = firstString(source, ['observations', 'analysis', 'notes', 'summary']);
  const chartPatterns = readStringArray(source, ['chartPatterns', 'patterns']);
  const indicatorsSummary = summarizeIndicators(source.indicators);
  const tags = readStringArray(source, ['tags', 'relatedTopics', 'keywords']);
  const entryDate = parseDate(
    firstString(source, ['entryDate', 'tradeDate', 'openTime', 'date']),
    firstString(source, ['tradeTime', 'time']),
  );

  const setupLines = [
    chartPatterns.length > 0 ? `Patterns: ${chartPatterns.join(', ')}` : '',
    indicatorsSummary ? `Indicators: ${indicatorsSummary}` : '',
    sentiment ? `Sentiment: ${sentiment}` : '',
    observations ? `Observations: ${observations}` : '',
  ].filter((line) => line.length > 0);

  if (!symbol && entryPrice === undefined && setupLines.length === 0) {
    return null;
  }

  const draft: Partial<Trade> = {
    symbol: symbol || '',
    status: TradeStatus.OPEN,
  };

  if (symbol) {
    draft.assetType = deriveAssetType(symbol);
  }
  if (direction) {
    draft.direction = direction;
  }
  if (entryPrice !== undefined) {
    draft.entryPrice = entryPrice;
  }
  if (exitPrice !== undefined) {
    draft.exitPrice = exitPrice;
  }
  if (stopLoss !== undefined) {
    draft.stopLoss = stopLoss;
  }
  if (takeProfit !== undefined) {
    draft.takeProfit = takeProfit;
  }
  if (timeframe) {
    draft.timeframe = timeframe;
  }
  if (entryDate) {
    draft.entryDate = entryDate;
  }
  if (setupLines.length > 0) {
    draft.setupDetails = setupLines.join('\n');
  }
  if (observations) {
    draft.notes = observations;
  }
  if (tags.length > 0) {
    draft.tags = tags.slice(0, 8).map((name) => ({ name }));
  }

  return {
    createdAt: new Date().toISOString(),
    draft,
    analysisSummary: setupLines[setupLines.length - 1] || observations || undefined,
  };
};

export const writeStoredJournalChartDraft = (draft: StoredJournalChartDraft): void => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(JOURNAL_CHART_DRAFT_STORAGE_KEY, JSON.stringify(draft));
};

export const readStoredJournalChartDraft = (): StoredJournalChartDraft | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(JOURNAL_CHART_DRAFT_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredJournalChartDraft;
    if (!parsed || typeof parsed !== 'object' || !parsed.draft) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const clearStoredJournalChartDraft = (): void => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(JOURNAL_CHART_DRAFT_STORAGE_KEY);
};
