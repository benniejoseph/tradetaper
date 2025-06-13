'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  // Automatically redirect to dashboard since auth is disabled
  useEffect(() => {
    console.log('LoginPage: Authentication disabled, redirecting to dashboard');
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-green-600 rounded-3xl mb-6 shadow-2xl"
        >
          <Shield className="w-10 h-10 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent mb-2">
          TradeTaper Admin
        </h1>
        <p className="text-gray-400 mb-4">Authentication disabled - redirecting to dashboard...</p>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </motion.div>
    </div>
  );
} 