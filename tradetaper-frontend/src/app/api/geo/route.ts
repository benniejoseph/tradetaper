import { NextRequest, NextResponse } from 'next/server';
import {
  normalizeCountryCode,
  countryFromAcceptLanguage,
  resolveCurrencyCode,
  DEFAULT_COUNTRY_CODE,
} from '@/lib/currency';

// Edge runtime so Vercel injects real IP geo headers
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // Vercel injects x-vercel-ip-country on all plans (including Hobby)
  const country =
    normalizeCountryCode(request.headers.get('x-vercel-ip-country')) ??
    normalizeCountryCode(request.headers.get('cf-ipcountry')) ??
    countryFromAcceptLanguage(request.headers.get('accept-language')) ??
    DEFAULT_COUNTRY_CODE;
  const currency = resolveCurrencyCode(country, null);

  return NextResponse.json(
    { country, currency },
    {
      headers: {
        // Cache per-browser for 1 hour; country doesn't change mid-session
        'Cache-Control': 'private, max-age=3600',
      },
    },
  );
}
