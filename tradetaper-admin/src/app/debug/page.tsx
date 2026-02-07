'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';

export default function DebugPage() {
  const [apiUrl, setApiUrl] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setApiUrl(process.env.NEXT_PUBLIC_API_URL || 'Not set');
  }, []);

  const runTests = async () => {
    setLoading(true);
    const results = [];

    // Test 1: Environment variable
    results.push({
      test: 'Environment Variable',
      result: process.env.NEXT_PUBLIC_API_URL || 'Not set',
      status: process.env.NEXT_PUBLIC_API_URL ? 'pass' : 'fail'
    });

    // Test 2: Direct fetch to backend
    try {
      const response = await fetch('https://api.tradetaper.com/api/v1/admin/system-health', {
        headers: {
          'Authorization': 'Bearer mock-admin-token',
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      results.push({
        test: 'Direct Backend Fetch',
        result: data,
        status: response.ok ? 'pass' : 'fail'
      });
    } catch (error: any) {
      results.push({
        test: 'Direct Backend Fetch',
        result: error.message,
        status: 'fail'
      });
    }

    // Test 3: Admin API client
    try {
      const data = await adminApi.getSystemHealth();
      results.push({
        test: 'Admin API Client',
        result: data,
        status: 'pass'
      });
    } catch (error: any) {
      results.push({
        test: 'Admin API Client',
        result: error.message,
        status: 'fail'
      });
    }

    // Test 4: Dashboard stats
    try {
      const data = await adminApi.getDashboardStats();
      results.push({
        test: 'Dashboard Stats',
        result: data,
        status: 'pass'
      });
    } catch (error: any) {
      results.push({
        test: 'Dashboard Stats',
        result: error.message,
        status: 'fail'
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Debug Page</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Environment Info</h2>
        <p><strong>API URL:</strong> {apiUrl}</p>
        <p><strong>Environment:</strong> {process.env.NODE_ENV || 'development'}</p>
        <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
      </div>

      <button
        onClick={runTests}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold disabled:opacity-50 mb-6"
      >
        {loading ? 'Running Tests...' : 'Run API Tests'}
      </button>

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Results</h2>
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.status === 'pass' 
                  ? 'bg-green-900/20 border-green-700' 
                  : 'bg-red-900/20 border-red-700'
              }`}
            >
              <h3 className="font-semibold mb-2">
                {result.test} - 
                <span className={result.status === 'pass' ? 'text-green-400' : 'text-red-400'}>
                  {result.status.toUpperCase()}
                </span>
              </h3>
              <pre className="text-sm overflow-auto bg-gray-800 p-2 rounded">
                {typeof result.result === 'object' 
                  ? JSON.stringify(result.result, null, 2)
                  : result.result
                }
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 