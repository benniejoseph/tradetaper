export type CurrencyCode = "INR" | "USD";

export const DEFAULT_COUNTRY_CODE = "US";
export const INDIA_COUNTRY_CODE = "IN";
export const DEFAULT_CURRENCY_CODE: CurrencyCode = "USD";

export function normalizeCountryCode(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

export function countryFromAcceptLanguage(
  header: string | null | undefined,
): string | null {
  if (!header) {
    return null;
  }

  const segments = header.split(",");
  for (const segment of segments) {
    const languageTag = segment.split(";")[0]?.trim();
    if (!languageTag) {
      continue;
    }

    const parts = languageTag.split("-");
    if (parts.length < 2) {
      continue;
    }

    const region = normalizeCountryCode(parts[parts.length - 1] ?? null);
    if (region) {
      return region;
    }
  }

  return null;
}

export function resolveCurrencyCode(
  country?: string | null,
  currency?: string | null,
): CurrencyCode {
  const normalizedCurrency = (currency ?? "").toUpperCase();
  if (normalizedCurrency === "INR") {
    return "INR";
  }
  if (normalizedCurrency === "USD") {
    return "USD";
  }

  const normalizedCountry = normalizeCountryCode(country);
  return normalizedCountry === INDIA_COUNTRY_CODE ? "INR" : "USD";
}

export function resolveCurrencyCodeFromHeaders(
  headersLike: Pick<Headers, "get">,
): CurrencyCode {
  const country =
    normalizeCountryCode(headersLike.get("x-vercel-ip-country")) ??
    normalizeCountryCode(headersLike.get("cf-ipcountry")) ??
    countryFromAcceptLanguage(headersLike.get("accept-language")) ??
    DEFAULT_COUNTRY_CODE;

  return resolveCurrencyCode(country, null);
}
