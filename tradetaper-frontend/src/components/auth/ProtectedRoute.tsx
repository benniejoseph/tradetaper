// src/components/auth/ProtectedRoute.tsx
"use client";
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react'; // Added useState

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading: authIsLoading, token } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [isClient, setIsClient] = useState(false); // New state to track client-side mount

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
    if (!authIsLoading && !token) {
      router.push('/login');
    }
  }, [isClient, authIsLoading, token, router]);


  // On the server, and on the initial client render BEFORE isClient is true,
  // render a consistent loading state if auth is still loading or no token yet.
  // This helps match the server output if the server also determined a loading state.
  if (!isClient || authIsLoading) {
    // If isClient is false, OR if auth is still loading on the client
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  // After client has mounted and auth is not loading:
  // If there's still no token (e.g. loadUserFromStorage finished and found no token),
  // the useEffect above will handle redirection.
  // We can still show "Loading..." or null here to prevent flashing content before redirect.
  if (!token) {
    // This state should be brief as useEffect will redirect.
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
    // Or return null; to render nothing until redirect.
  }

  // If client has mounted, auth is not loading, and token exists, render children.
  return <>{children}</>;
};

export default ProtectedRoute;