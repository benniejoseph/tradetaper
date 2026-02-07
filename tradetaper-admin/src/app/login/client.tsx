'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent mb-4">
          TradeTaper Admin
        </h1>
        <p className="text-gray-400 mb-8">Authentication has been disabled for this admin panel.</p>
        
        <Link 
          href="/"
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
        >
          <span>Access Admin Dashboard</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
        
        <p className="text-gray-500 text-sm mt-4">
          Click the button above to access the admin dashboard directly.
        </p>
      </motion.div>
    </div>
  );
} 
