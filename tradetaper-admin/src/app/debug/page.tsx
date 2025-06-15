 'use client';

import { useState, useEffect } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';

// Create a query client for this test
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function DebugContent() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Test React Query
  const { data: dashboardData, isLoading, error, isError } = useQuery({
    queryKey: ['debug-dashboard-stats'],
    queryFn: async () => {
      addLog('React Query: Starting dashboard stats fetch...');
      try {
        const result = await adminApi.getDashboardStats();
        addLog('React Query: Dashboard stats fetch successful');
        return result;
      } catch (err: any) {
        addLog(`React Query: Dashboard stats fetch failed: ${err.message}`);
        throw err;
      }
    },
    retry: false,
  });

  useEffect(() => {
    addLog('Component mounted');
    addLog(`API Base URL: ${process.env.NEXT_PUBLIC_API_URL}`);
  }, []);

  const testDirectFetch = async () => {
    addLog('Testing direct fetch...');
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-admin-token'
        }
      });
      
      addLog(`Direct fetch response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      addLog(`Direct fetch successful: ${JSON.stringify(data)}`);
    } catch (err: any) {
      addLog(`Direct fetch failed: ${err.message}`);
    }
  };

  const testAdminApi = async () => {
    addLog('Testing adminApi directly...');
    try {
      const data = await adminApi.getDashboardStats();
      addLog(`AdminApi successful: ${JSON.stringify(data)}`);
    } catch (err: any) {
      addLog(`AdminApi failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Page</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Environment</h2>
        <p><strong>API Base URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">React Query Test</h2>
        <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
        <p><strong>Error:</strong> {isError ? error?.message || 'Unknown error' : 'None'}</p>
        <p><strong>Data:</strong> {dashboardData ? JSON.stringify(dashboardData) : 'None'}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Manual Tests</h2>
        <div className="space-x-4">
          <button
            onClick={testDirectFetch}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Test Direct Fetch
          </button>
          <button
            onClick={testAdminApi}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            Test AdminApi
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Logs</h2>
        <div className="bg-gray-800 rounded p-4 max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="text-sm font-mono mb-1">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DebugPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <DebugContent />
    </QueryClientProvider>
  );
} 