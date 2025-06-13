'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isInitialCheckDone, setIsInitialCheckDone] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);
  const checkInProgress = useRef(false);

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/debug-auth'];
  const isPublicPath = publicPaths.includes(pathname);

  // Direct localStorage check for authentication
  const checkAuthStatus = () => {
    if (typeof window === 'undefined') return;
    if (checkInProgress.current) {
      console.log('AuthWrapper: Auth check already in progress, skipping');
      return;
    }
    
    checkInProgress.current = true;
    console.log('AuthWrapper: Starting auth check...');
    
    try {
      const token = localStorage.getItem('admin_token');
      const authFlag = localStorage.getItem('admin_authenticated');
      const isAuth = !!(token && authFlag === 'true');
      
      console.log('AuthWrapper: Direct auth check - token:', !!token, 'authFlag:', authFlag, 'isAuth:', isAuth, 'pathname:', pathname);
      
      setIsAuthenticated(prevState => {
        console.log('AuthWrapper: Setting auth state from', prevState, 'to', isAuth);
        return isAuth;
      });
      
      if (!isInitialCheckDone) {
        console.log('AuthWrapper: Marking initial check as done');
        setIsInitialCheckDone(true);
      }
    } catch (error) {
      console.error('AuthWrapper: Auth check error:', error);
      setIsAuthenticated(false);
      if (!isInitialCheckDone) {
        setIsInitialCheckDone(true);
      }
    } finally {
      checkInProgress.current = false;
    }
  };

  // Check auth on mount and pathname changes
  useEffect(() => {
    console.log('AuthWrapper: Checking auth for pathname:', pathname);
    setIsInitialCheckDone(false); // Reset for new path
    checkAuthStatus();
  }, [pathname]);

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin_token' || e.key === 'admin_authenticated') {
        console.log('AuthWrapper: Storage changed, rechecking auth');
        hasRedirected.current = false; // Reset redirect flag on auth change
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  console.log('AuthWrapper: Render - pathname:', pathname, 'isAuthenticated:', isAuthenticated, 'isPublicPath:', isPublicPath, 'isInitialCheckDone:', isInitialCheckDone);

  // Handle redirects based on authentication status
  useEffect(() => {
    // Wait for initial auth check to complete
    if (!isInitialCheckDone) {
      console.log('AuthWrapper: Initial check not done, skipping redirect');
      return;
    }

    if (isAuthenticated === null) {
      console.log('AuthWrapper: Auth state unknown, skipping redirect');
      return;
    }

    // Prevent multiple redirects
    if (hasRedirected.current) {
      console.log('AuthWrapper: Already redirected, skipping');
      return;
    }

    console.log('AuthWrapper: Redirect logic - isAuthenticated:', isAuthenticated, 'isPublicPath:', isPublicPath, 'pathname:', pathname);

    // Handle unauthenticated users trying to access protected routes
    if (!isAuthenticated && !isPublicPath) {
      console.log('AuthWrapper: Redirecting to login - user not authenticated');
      hasRedirected.current = true;
      router.replace('/login');
      return;
    }

    // Handle authenticated users on login page
    if (isAuthenticated && pathname === '/login') {
      console.log('AuthWrapper: Redirecting to dashboard - user already authenticated');
      hasRedirected.current = true;
      router.replace('/');
      return;
    }

    console.log('AuthWrapper: Valid navigation, no redirect needed');
  }, [isAuthenticated, isPublicPath, pathname, router, isInitialCheckDone]);

  // Reset redirect flag when pathname changes
  useEffect(() => {
    hasRedirected.current = false;
  }, [pathname]);

  // Show loading while initial check is in progress
  if (!isInitialCheckDone) {
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
          <h2 className="text-xl font-semibold text-white mb-2">TradeTaper Admin</h2>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-gray-400 text-sm mt-2">Checking authentication...</p>
        </motion.div>
      </div>
    );
  }

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