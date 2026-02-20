"use client";
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaCheckCircle, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import Link from 'next/link';

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const session_id = searchParams.get('session_id');
    
    if (!session_id) {
      setStatus('error');
      return;
    }
    
    // Here you would typically verify the session with your backend
    // For now, we'll just simulate success after a delay
    setTimeout(() => {
      setStatus('success');
    }, 2000);

  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-12 text-center shadow-lg max-w-md">
          <FaSpinner className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Processing Payment
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we confirm your subscription...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-12 text-center shadow-lg max-w-md">
          <FaExclamationTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Payment Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            There was an issue processing your payment. Please try again or contact support.
          </p>
          <div className="space-y-4">
            <Link
              href="/pricing"
              className="block w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
            >
              Try Again
            </Link>
            <Link
              href="/dashboard"
              className="block w-full py-3 px-6 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700/80 text-gray-900 dark:text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-12 text-center shadow-lg max-w-md">
        <FaCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Payment Successful!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Thank you for subscribing to TradeTaper. Your account has been upgraded and you now have access to all premium features.
        </p>
        
        <div className="bg-green-50/80 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/50 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
            What&apos;s Next?
          </h2>
          <ul className="text-sm text-green-700 dark:text-green-400 space-y-2">
            <li>• Start logging unlimited trades</li>
            <li>• Access advanced analytics</li>
            <li>• Use premium features</li>
            <li>• Get priority support</li>
          </ul>
        </div>

        <div className="space-y-4">
          <Link
            href="/journal/new"
            className="block w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
          >
            Log Your First Trade
          </Link>
          <Link
            href="/dashboard"
            className="block w-full py-3 px-6 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700/80 text-gray-900 dark:text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/billing"
            className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors"
          >
            Manage Billing Settings
          </Link>
        </div>
      </div>
    </div>
  );
} 