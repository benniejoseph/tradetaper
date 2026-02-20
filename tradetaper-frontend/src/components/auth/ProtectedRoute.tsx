// src/components/auth/ProtectedRoute.tsx
"use client";
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react'; // Added useState
import { usePathname } from 'next/navigation';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);
  const [isClient, setIsClient] = useState(false); // New state to track client-side mount
  const isPublicRoute =
    pathname === '/community' || pathname.startsWith('/community/');

  // This effect runs only on the client after the component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) { // Don't run redirection logic until client has mounted
        return;
    }

    // Wait for auth loading to finish (e.g. from loadUserFromStorage)
    // and then check token presence for redirection.
    if (!isLoading && !user && !isPublicRoute) {
      router.push('/login');
    }
  }, [isClient, isLoading, user, router, isPublicRoute]);


  // On the server, and on the initial client render BEFORE isClient is true,
  // render a consistent loading state if auth is still loading or no token yet.
  // This helps match the server output if the server also determined a loading state.
  if (!isClient || isLoading) {
    // If isClient is false, OR if auth is still loading on the client
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  // After client has mounted and auth is not loading:
  // If there's still no token (e.g. loadUserFromStorage finished and found no token),
  // the useEffect above will handle redirection.
  // We can still show "Loading..." or null here to prevent flashing content before redirect.
  if (!user && !isPublicRoute) {
    // This state should be brief as useEffect will redirect.
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
    // Or return null; to render nothing until redirect.
  }

  // If client has mounted, auth is not loading, and token exists, render children.
  return <>{children}</>;
}
