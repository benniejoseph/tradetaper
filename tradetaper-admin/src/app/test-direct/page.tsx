'use client';

import { useState, useEffect } from 'react';

export default function TestDirectPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testDirectApiCall = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Making direct API call...');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      console.log('API URL:', apiUrl);
      
      const response = await fetch(`${apiUrl}/admin/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-admin-token'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      setResult(data);
    } catch (err: any) {
      console.error('API Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Automatically test on page load
    testDirectApiCall();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Direct API Test Page</h1>
      
      <div className="mb-4">
        <p><strong>API Base URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
      </div>

      <div className="space-y-4 mb-6">
        <button
          onClick={testDirectApiCall}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Test Direct API Call'}
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