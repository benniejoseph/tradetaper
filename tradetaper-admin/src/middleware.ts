import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api'];
const RESTRICTED_PROD_PATHS = ['/debug', '/test-api', '/test-direct', '/api-test'];

export function middleware(request: NextRequest) {
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
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.webp|.*\\.svg).*)'],
};
