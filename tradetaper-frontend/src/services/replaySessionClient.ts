interface ReplaySessionCreateInput {
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  startingBalance: number;
}

interface ReplaySessionCreateResponse {
  id: string;
}

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const TIMEFRAME_ALIASES: Record<string, string> = {
  M1: '1m',
  M5: '5m',
  M15: '15m',
  M30: '30m',
  H1: '1h',
  H4: '4h',
  D1: '1d',
  W1: '1d',
  '1': '1m',
  '5': '5m',
  '15': '15m',
  '30': '30m',
  '60': '1h',
  '240': '4h',
  '1440': '1d',
  '1M': '1m',
  '5M': '5m',
  '15M': '15m',
  '30M': '30m',
  '1H': '1h',
  '4H': '4h',
  '1D': '1d',
};

const parseApiMessage = async (
  response: Response,
  fallback: string,
): Promise<string> => {
  const payload = (await response.json().catch(() => null)) as
    | { message?: unknown }
    | null;
  const message = payload?.message;
  return typeof message === 'string' && message.trim().length > 0
    ? message
    : fallback;
};

const toIsoDate = (raw: string, fieldName: string): string => {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${fieldName}`);
  }
  return date.toISOString();
};

export const normalizeReplayTimeframe = (
  timeframe: string | null | undefined,
  fallback = '15m',
): string => {
  if (!timeframe) return fallback;
  const key = timeframe.trim().toUpperCase().replace(/\s/g, '');
  return TIMEFRAME_ALIASES[key] || fallback;
};

export const buildReplaySessionUrl = (
  sessionId: string,
  params: Record<string, string | number>,
): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query
    ? `/replay/session/${sessionId}?${query}`
    : `/replay/session/${sessionId}`;
};

export const fetchCsrfToken = async (apiUrl = DEFAULT_API_URL): Promise<string> => {
  const csrfResponse = await fetch(`${apiUrl}/csrf-token`, {
    credentials: 'include',
  });
  if (!csrfResponse.ok) {
    throw new Error(await parseApiMessage(csrfResponse, 'Failed to fetch CSRF token'));
  }

  const payload = (await csrfResponse.json()) as { csrfToken?: unknown };
  if (typeof payload.csrfToken !== 'string' || payload.csrfToken.length === 0) {
    throw new Error('CSRF token missing from response');
  }

  return payload.csrfToken;
};

export const createReplaySession = async (
  input: ReplaySessionCreateInput,
  apiUrl = DEFAULT_API_URL,
): Promise<ReplaySessionCreateResponse> => {
  const csrfToken = await fetchCsrfToken(apiUrl);

  const response = await fetch(`${apiUrl}/replay/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify({
      symbol: input.symbol.toUpperCase(),
      timeframe: normalizeReplayTimeframe(input.timeframe),
      startDate: toIsoDate(input.startDate, 'start date'),
      endDate: toIsoDate(input.endDate, 'end date'),
      startingBalance: input.startingBalance,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseApiMessage(response, 'Failed to create replay session'));
  }

  const payload = (await response.json()) as { id?: unknown };
  if (typeof payload.id !== 'string' || payload.id.length === 0) {
    throw new Error('Replay session ID missing from response');
  }

  return { id: payload.id };
};
