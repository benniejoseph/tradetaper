'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

interface SimpleAuthWrapperProps {
  children: React.ReactNode;
}

export default function SimpleAuthWrapper({ children }: SimpleAuthWrapperProps) {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const router = useRouter();
  const pathname = usePathname();

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/debug-auth'];
  const isPublicPath = publicPaths.includes(pathname);

  // Check authentication immediately on mount and path changes
  useEffect(() => {
    console.log('SimpleAuthWrapper: Checking auth for path:', pathname);
    
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('admin_token');
        const authFlag = localStorage.getItem('admin_authenticated');
        const isAuth = !!(token && authFlag === 'true');
        
        console.log('SimpleAuthWrapper: Auth check - token:', !!token, 'flag:', authFlag, 'result:', isAuth);
        
        setAuthState(isAuth ? 'authenticated' : 'unauthenticated');
      } catch (error) {
        console.error('SimpleAuthWrapper: Auth check failed:', error);
        setAuthState('unauthenticated');
      }
    };

    // Small delay to ensure localStorage is available
    const timer = setTimeout(checkAuth, 10);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Handle redirects after auth state is determined
  useEffect(() => {
    if (authState === 'loading') return;

    console.log('SimpleAuthWrapper: Handling redirect - authState:', authState, 'isPublicPath:', isPublicPath, 'pathname:', pathname);

    if (authState === 'unauthenticated' && !isPublicPath) {
      console.log('SimpleAuthWrapper: Redirecting to login');
      router.replace('/login');
    } else if (authState === 'authenticated' && pathname === '/login') {
      console.log('SimpleAuthWrapper: Redirecting to dashboard');
      router.replace('/');
    }
  }, [authState, isPublicPath, pathname, router]);

  // Listen for auth changes
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('SimpleAuthWrapper: Storage changed, rechecking auth');
      
      const token = localStorage.getItem('admin_token');
      const authFlag = localStorage.getItem('admin_authenticated');
      const isAuth = !!(token && authFlag === 'true');
      
      setAuthState(isAuth ? 'authenticated' : 'unauthenticated');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  console.log('SimpleAuthWrapper: Render - path:', pathname, 'authState:', authState, 'isPublic:', isPublicPath);

  // Show loading during auth check
  if (authState === 'loading') {
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

  // Show children for authenticated users or public paths
  return <>{children}</>;
}