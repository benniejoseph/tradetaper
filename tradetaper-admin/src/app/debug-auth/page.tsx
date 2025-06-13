'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStorage } from '@/hooks/useLocalStorage';

export default function DebugAuthPage() {
  const [localStorageData, setLocalStorageData] = useState<any>({});
  const { isAuthenticated, token, user, login } = useAuthStorage();
  const router = useRouter();

  const checkLocalStorage = () => {
    if (typeof window !== 'undefined') {
      const data = {
        admin_token: localStorage.getItem('admin_token'),
        admin_authenticated: localStorage.getItem('admin_authenticated'),
        admin_user: localStorage.getItem('admin_user'),
        timestamp: new Date().toISOString(),
      };
      setLocalStorageData(data);
      console.log('Debug: localStorage data:', data);
    }
  };

  useEffect(() => {
    checkLocalStorage();
    // Check every second to see localStorage changes
    const interval = setInterval(checkLocalStorage, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTestLogin = () => {
    console.log('Debug: Testing login...');
    const mockToken = 'test-token-' + Date.now();
    const mockUser = {
      id: 'test-user',
      email: 'test@test.com',
      role: 'admin',
    };
    
    login(mockToken, mockUser);
    console.log('Debug: Login called, checking state...');
    
    setTimeout(() => {
      checkLocalStorage();
      console.log('Debug: After login - isAuthenticated:', isAuthenticated);
    }, 100);
  };

  const handleClearAuth = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_user');
    checkLocalStorage();
  };

  const handleNavigateHome = () => {
    router.replace('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="grid gap-6">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-3">Hook State</h2>
          <div className="font-mono text-sm space-y-1">
            <div>isAuthenticated: {String(isAuthenticated)}</div>
            <div>token: {token || 'null'}</div>
            <div>user: {user ? JSON.stringify(user) : 'null'}</div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-3">localStorage Raw Data</h2>
          <div className="font-mono text-sm">
            <pre>{JSON.stringify(localStorageData, null, 2)}</pre>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-3">Actions</h2>
          <div className="space-x-4">
            <button 
              onClick={handleTestLogin}
              className="bg-blue-600 px-4 py-2 rounded"
            >
              Test Login
            </button>
            <button 
              onClick={handleClearAuth}
              className="bg-red-600 px-4 py-2 rounded"
            >
              Clear Auth
            </button>
            <button 
              onClick={checkLocalStorage}
              className="bg-green-600 px-4 py-2 rounded"
            >
              Refresh Data
            </button>
            <button 
              onClick={handleNavigateHome}
              className="bg-purple-600 px-4 py-2 rounded"
            >
              Navigate Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}