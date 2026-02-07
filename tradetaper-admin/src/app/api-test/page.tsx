'use client';

import { useState, useEffect } from 'react';

export default function ApiTestPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testApis = async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.tradetaper.com/api/v1';
      
      const endpoints = [
        '/admin/dashboard/stats',
        '/admin/user-analytics/30d',
        '/admin/revenue-analytics/30d',
        '/admin/system-health',
        '/admin/activity-feed?limit=5'
      ];

      const testResults: any = {};

      for (const endpoint of endpoints) {
        try {
          console.log(`Testing: ${baseUrl}${endpoint}`);
          const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            testResults[endpoint] = { success: true, data };
          } else {
            testResults[endpoint] = { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
          }
        } catch (error) {
          testResults[endpoint] = { success: false, error: error.message };
        }
      }

      setResults(testResults);
      setLoading(false);
    };

    testApis();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Testing API Endpoints...</h1>
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Results</h1>
      <div className="space-y-4">
        {Object.entries(results).map(([endpoint, result]: [string, any]) => (
          <div key={endpoint} className="bg-gray-800 p-4 rounded-lg">
            <h3 className="font-semibold text-lg">{endpoint}</h3>
            <div className={`mt-2 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
              Status: {result.success ? 'SUCCESS' : 'FAILED'}
            </div>
            {result.success ? (
              <pre className="mt-2 text-sm bg-gray-900 p-2 rounded overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            ) : (
              <div className="mt-2 text-red-400">
                Error: {result.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 