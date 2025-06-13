'use client';

import { useAuthStorage } from '@/hooks/useLocalStorage';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, LogOut, User, Check, X } from 'lucide-react';

export default function AuthTestPage() {
  const { isAuthenticated, token, user, logout } = useAuthStorage();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const authData = {
    isAuthenticated,
    token: token ? `${token.substring(0, 20)}...` : null,
    user,
    pathname,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent mb-2">
            Authentication Test
          </h1>
          <p className="text-gray-400">Test the authentication flow and state management</p>
        </motion.div>

        <div className="grid gap-6">
          {/* Authentication Status */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              {isAuthenticated ? (
                <Check className="w-6 h-6 text-green-400" />
              ) : (
                <X className="w-6 h-6 text-red-400" />
              )}
              <h2 className="text-xl font-semibold text-white">
                Authentication Status
              </h2>
            </div>
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              isAuthenticated 
                ? 'bg-green-900/50 text-green-300 border border-green-700/50'
                : 'bg-red-900/50 text-red-300 border border-red-700/50'
            }`}>
              {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </div>
          </motion.div>

          {/* Authentication Data */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Authentication Data</h2>
            <div className="bg-gray-800/50 rounded-lg p-4 font-mono text-sm text-gray-300">
              <pre>{JSON.stringify(authData, null, 2)}</pre>
            </div>
          </motion.div>

          {/* User Information */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <User className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-semibold text-white">User Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                  <div className="text-white">{user.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                  <div className="text-white">{user.role || 'Admin'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">First Name</label>
                  <div className="text-white">{user.firstName || 'N/A'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Last Name</label>
                  <div className="text-white">{user.lastName || 'N/A'}</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Test Actions</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Go to Login
              </button>
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}