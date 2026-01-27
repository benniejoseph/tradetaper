'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleAuthService } from '@/services/googleAuthService';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Prevent running if already processed or if no params yet
    if (status !== 'processing') return;
    
    const handleCallback = async () => {
      try {
        // Check if we have any auth-related params before processing
        const token = searchParams.get('token');
        const user = searchParams.get('user');
        const error = searchParams.get('error');
        
        // If no relevant params, wait - they might still be loading
        if (!token && !user && !error) {
          console.log('No auth params yet, waiting...');
          // Give it a moment for params to populate
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Re-check after waiting
          const tokenRetry = searchParams.get('token');
          const userRetry = searchParams.get('user');
          const errorRetry = searchParams.get('error');
          
          if (!tokenRetry && !userRetry && !errorRetry) {
            // Still no params - check localStorage as fallback (might already be authenticated)
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
              console.log('Found existing token in localStorage, redirecting to dashboard');
              router.push('/dashboard');
              return;
            }
            // Truly no params - redirect to login
            console.log('No auth params found after waiting');
            setErrorMessage('No authentication data received');
            setStatus('error');
            setTimeout(() => router.push('/login'), 2000);
            return;
          }
        }
        
        const success = await GoogleAuthService.handleGoogleCallback(searchParams);
        
        if (success) {
          setStatus('success');
          // Redirect to dashboard after successful authentication
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        } else {
          // Check if there's an error parameter
          const errorParam = searchParams.get('error');
          
          let errorMsg = 'Authentication failed';
          if (errorParam) {
            errorMsg = `Authentication error: ${errorParam}`;
          }
          
          setErrorMessage(errorMsg);
          setStatus('error');
          
          // Redirect to login page after error
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } catch (err) {
        console.error('Error in Google callback:', err);
        setErrorMessage(`Callback processing error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setStatus('error');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router, status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Completing sign in...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we process your Google authentication.
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Sign in successful!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Redirecting you to your dashboard...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Sign in failed
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {errorMessage || 'There was an error signing you in.'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Redirecting to login page...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Loading...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we process your authentication.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <GoogleCallbackContent />
    </Suspense>
  );
} 