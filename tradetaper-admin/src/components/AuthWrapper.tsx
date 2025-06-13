'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useAuthStorage } from '@/hooks/useLocalStorage';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated, token } = useAuthStorage();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);
  const lastAuthState = useRef<boolean | null>(null);

  // Public paths that don't require authentication
  const publicPaths = ['/login'];
  const isPublicPath = publicPaths.includes(pathname);

  console.log('AuthWrapper: Render - pathname:', pathname, 'isAuthenticated:', isAuthenticated, 'token:', !!token, 'lastAuthState:', lastAuthState.current);

  // Handle redirects based on authentication status
  useEffect(() => {
    // Prevent multiple redirects for the same auth state and path
    if (hasRedirected.current && lastAuthState.current === isAuthenticated) {
      console.log('AuthWrapper: Already redirected for this auth state, skipping');
      return;
    }

    console.log('AuthWrapper: Redirect logic - isAuthenticated:', isAuthenticated, 'isPublicPath:', isPublicPath, 'pathname:', pathname);

    // Handle unauthenticated users trying to access protected routes
    if (!isAuthenticated && !isPublicPath) {
      console.log('AuthWrapper: Redirecting to login - user not authenticated');
      hasRedirected.current = true;
      lastAuthState.current = isAuthenticated;
      router.replace('/login');
      return;
    }

    // Handle authenticated users on login page
    if (isAuthenticated && pathname === '/login') {
      console.log('AuthWrapper: Redirecting to dashboard - user already authenticated');
      hasRedirected.current = true;
      lastAuthState.current = isAuthenticated;
      router.replace('/');
      return;
    }

    // Update last auth state and reset redirect flag for valid navigation
    lastAuthState.current = isAuthenticated;
    hasRedirected.current = false;
    console.log('AuthWrapper: Valid navigation, resetting redirect flag');
  }, [isAuthenticated, isPublicPath, pathname, router]);

  // Reset redirect flag when pathname changes
  useEffect(() => {
    hasRedirected.current = false;
  }, [pathname]);

  // If not authenticated and not on public path, show loading while redirecting
  if (!isAuthenticated && !isPublicPath) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Redirecting...</h2>
          <p className="text-gray-400 text-sm">Please wait while we redirect you to login.</p>
        </motion.div>
      </div>
    );
  }

  // Show children for authenticated users or public paths
  return <>{children}</>;
} 