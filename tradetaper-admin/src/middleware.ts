import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /login, /dashboard)
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const publicPaths = ['/login'];
  
  // Check if the current path is public
  const isPublicPath = publicPaths.includes(pathname);

  // Get the authentication token from cookies or headers
  // For now, we'll check localStorage on the client side
  // In a real app, you'd use HTTP-only cookies or JWT tokens
  
  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next();
  }

  // For protected paths, redirect to login
  // Note: This is a simple implementation. In production, you'd want to:
  // 1. Check for valid JWT tokens
  // 2. Verify token expiration
  // 3. Check user roles/permissions
  
  // Since we can't access localStorage in middleware, we'll handle auth on the client side
  // This middleware just ensures the login page exists
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 