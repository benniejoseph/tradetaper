'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Public paths that don't require authentication
  const publicPaths = ['/login'];
  const isPublicPath = publicPaths.includes(pathname);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check authentication status
    const checkAuth = () => {
      try {
        const isAuth = localStorage.getItem('admin_authenticated') === 'true';
        const adminUser = localStorage.getItem('admin_user');
        
        if (isAuth && adminUser) {
          const user = JSON.parse(adminUser);
          // Check if login is not too old (24 hours)
          const loginTime = new Date(user.loginTime);
          const now = new Date();
          const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff < 24) {
            setIsAuthenticated(true);
          } else {
            // Session expired
            localStorage.removeItem('admin_authenticated');
            localStorage.removeItem('admin_user');
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to prevent hydration issues
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Prevent multiple redirects
    if (isLoading || hasRedirected || isAuthenticated === null) return;

    // Redirect logic with safeguards
    if (!isAuthenticated && !isPublicPath) {
      setHasRedirected(true);
      router.replace('/login');
    } else if (isAuthenticated && pathname === '/login') {
      setHasRedirected(true);
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, isPublicPath, pathname, router, hasRedirected]);

  // Show loading spinner while checking authentication
  if (isLoading) {
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
          <p className="text-gray-400 text-sm mt-2">Loading admin panel...</p>
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