import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PRODUCTION_API_BASE_URL = 'https://api.tradetaper.com/api/v1';
const DEVELOPMENT_API_BASE_URL = 'http://localhost:3000/api/v1';
const PUBLIC_PATHS = ['/login', '/api'];
const RESTRICTED_PROD_PATHS = [
  '/debug',
  '/test-api',
  '/test-direct',
  '/api-test',
  '/testing',
  '/ui-lab',
  '/geographic',
];

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

function resolveMiddlewareApiBaseUrl(): string {
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

  if (isProduction && isRunAppHost(normalized)) {
    return PRODUCTION_API_BASE_URL;
  }

  return normalized;
}

const MIDDLEWARE_API_BASE_URL = resolveMiddlewareApiBaseUrl();

function toLoginRedirect(request: NextRequest): NextResponse {
  const loginUrl = new URL('/login', request.url);
  const from = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set('from', from);
  return NextResponse.redirect(loginUrl);
}

async function hasValidAdminSession(request: NextRequest): Promise<boolean> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return false;
  }

  try {
    const response = await fetch(`${MIDDLEWARE_API_BASE_URL}/admin/auth/me`, {
      method: 'GET',
      headers: {
        cookie: cookieHeader,
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
      redirect: 'manual',
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Keep diagnostics/test pages unavailable in production.
  if (
    process.env.NODE_ENV === 'production' &&
    RESTRICTED_PROD_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Require admin session cookie for all private routes.
  const adminToken = request.cookies.get('admin_token')?.value;

  if (!adminToken) {
    return toLoginRedirect(request);
  }

  const sessionValid = await hasValidAdminSession(request);
  if (!sessionValid) {
    return toLoginRedirect(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.webp|.*\\.svg).*)'],
};
