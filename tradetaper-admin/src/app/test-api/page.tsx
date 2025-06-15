'use client';

import { useState } from 'react';
import { adminApi } from '@/lib/api';

export default function TestApiPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Testing dashboard stats API...');
      console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL);
      const data = await adminApi.getDashboardStats();
      console.log('API Response:', data);
      setResult(data);
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testSystemHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Testing system health API...');
      const data = await adminApi.getSystemHealth();
      console.log('System Health Response:', data);
      setResult(data);
    } catch (err: any) {
      console.error('System Health Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">API Test Page</h1>
      
      <div className="mb-4">
        <p><strong>API Base URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
      </div>

      <div className="space-y-4 mb-6">
        <button
          onClick={testDashboardStats}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test Dashboard Stats'}
        </button>

        <button
          onClick={testSystemHealth}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded disabled:opacity-50 ml-4"
        >
          {loading ? 'Loading...' : 'Test System Health'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 rounded p-4 mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="bg-gray-800 rounded p-4">
          <h3 className="text-lg font-semibold mb-2">API Response:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 