export type BillingAttributionPayload = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  ref?: string;
  landingPath?: string;
  referrerHost?: string;
  capturedAt?: string;
};

const STORAGE_KEY = 'tt.billing_attribution.v1';

const QUERY_FIELD_MAP: Record<string, keyof BillingAttributionPayload> = {
  utm_source: 'utmSource',
  utm_medium: 'utmMedium',
  utm_campaign: 'utmCampaign',
  utm_term: 'utmTerm',
  utm_content: 'utmContent',
  gclid: 'gclid',
  fbclid: 'fbclid',
  msclkid: 'msclkid',
  ref: 'ref',
};

const FIELD_MAX_LENGTH: Partial<Record<keyof BillingAttributionPayload, number>> =
  {
    utmSource: 128,
    utmMedium: 128,
    utmCampaign: 128,
    utmTerm: 128,
    utmContent: 128,
    gclid: 128,
    fbclid: 128,
    msclkid: 128,
    ref: 64,
    landingPath: 255,
    referrerHost: 255,
    capturedAt: 64,
  };

const sanitize = (
  value: unknown,
  field: keyof BillingAttributionPayload,
): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const max = FIELD_MAX_LENGTH[field] ?? 128;
  return trimmed.slice(0, max);
};

const hasAttributionSignals = (payload?: BillingAttributionPayload): boolean => {
  if (!payload) {
    return false;
  }
  return Boolean(
    payload.utmSource ||
      payload.utmMedium ||
      payload.utmCampaign ||
      payload.utmTerm ||
      payload.utmContent ||
      payload.gclid ||
      payload.fbclid ||
      payload.msclkid ||
      payload.ref,
  );
};

const normalizePayload = (
  payload?: Partial<BillingAttributionPayload>,
): BillingAttributionPayload | undefined => {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const normalized: BillingAttributionPayload = {
    utmSource: sanitize(payload.utmSource, 'utmSource'),
    utmMedium: sanitize(payload.utmMedium, 'utmMedium'),
    utmCampaign: sanitize(payload.utmCampaign, 'utmCampaign'),
    utmTerm: sanitize(payload.utmTerm, 'utmTerm'),
    utmContent: sanitize(payload.utmContent, 'utmContent'),
    gclid: sanitize(payload.gclid, 'gclid'),
    fbclid: sanitize(payload.fbclid, 'fbclid'),
    msclkid: sanitize(payload.msclkid, 'msclkid'),
    ref: sanitize(payload.ref, 'ref'),
    landingPath: sanitize(payload.landingPath, 'landingPath'),
    referrerHost: sanitize(payload.referrerHost, 'referrerHost'),
    capturedAt: sanitize(payload.capturedAt, 'capturedAt'),
  };

  const hasAnyValue = Object.values(normalized).some((value) => Boolean(value));
  return hasAnyValue ? normalized : undefined;
};

const readStoredAttribution = (): BillingAttributionPayload | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<BillingAttributionPayload>;
    return normalizePayload(parsed);
  } catch {
    return undefined;
  }
};

const persistAttribution = (payload: BillingAttributionPayload): void => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const extractFromUrl = (url: URL): Partial<BillingAttributionPayload> => {
  const extracted: Partial<BillingAttributionPayload> = {};
  for (const [queryKey, field] of Object.entries(QUERY_FIELD_MAP)) {
    const value = url.searchParams.get(queryKey);
    if (!value) {
      continue;
    }
    extracted[field] = value;
  }
  return extracted;
};

export const captureBillingAttributionFromLocation = ():
  | BillingAttributionPayload
  | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const currentUrl = new URL(window.location.href);
  const incoming = normalizePayload(extractFromUrl(currentUrl));
  const existing = readStoredAttribution();

  const next: BillingAttributionPayload = {
    ...(existing || {}),
    ...(incoming || {}),
  };

  if (!next.landingPath) {
    next.landingPath = sanitize(
      `${currentUrl.pathname}${currentUrl.search}`,
      'landingPath',
    );
  }

  if (!next.referrerHost && document.referrer) {
    try {
      const referrerHost = new URL(document.referrer).hostname;
      next.referrerHost = sanitize(referrerHost, 'referrerHost');
    } catch {
      // Ignore invalid referrer values.
    }
  }

  if (hasAttributionSignals(next) && !next.capturedAt) {
    next.capturedAt = new Date().toISOString();
  }

  const normalizedNext = normalizePayload(next);
  if (!normalizedNext) {
    return undefined;
  }

  persistAttribution(normalizedNext);
  return normalizedNext;
};

export const getBillingAttributionForCheckout = ():
  | BillingAttributionPayload
  | undefined => {
  const stored = readStoredAttribution();
  if (!stored) {
    return undefined;
  }

  if (!hasAttributionSignals(stored)) {
    return undefined;
  }

  return stored;
};
