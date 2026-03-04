const PRODUCTION_API_BASE_URL = 'https://api.tradetaper.com/api/v1';
const DEVELOPMENT_API_BASE_URL = 'http://localhost:3000/api/v1';

function normalizeApiBaseUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname || parsed.pathname === '/') {
      parsed.pathname = '/api/v1';
    }
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function isRunAppHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith('.run.app');
  } catch {
    return false;
  }
}

export function resolveApiBaseUrl(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const fallback = isProduction
    ? PRODUCTION_API_BASE_URL
    : DEVELOPMENT_API_BASE_URL;
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!configured) {
    return fallback;
  }

  const normalized = normalizeApiBaseUrl(configured);
  if (!normalized) {
    return fallback;
  }

  // Keep production on the canonical API domain even if build-time env drifts to Cloud Run.
  if (isProduction && isRunAppHost(normalized)) {
    if (typeof window !== 'undefined') {
      console.warn(
        `Ignoring NEXT_PUBLIC_API_URL (${normalized}) and using canonical API (${PRODUCTION_API_BASE_URL})`,
      );
    }
    return PRODUCTION_API_BASE_URL;
  }

  return normalized;
}

export const API_BASE_URL = resolveApiBaseUrl();
