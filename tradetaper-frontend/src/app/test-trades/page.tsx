"use client";
import { useState } from 'react';

export default function TestTradesPage() {
  const [trades, setTrades] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testFetch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First, login to get a token
      const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user1@example.com',
          password: 'password123'
        })
      });
      
      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);
      
      if (loginData.accessToken) {
        // Now fetch trades with the token
        const tradesResponse = await fetch('http://localhost:3000/api/v1/trades', {
          headers: {
            'Authorization': `Bearer ${loginData.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        const tradesData = await tradesResponse.json();
        console.log('Trades response:', tradesData);
        setTrades(tradesData);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Trades API</h1>
      
      <button 
        onClick={testFetch}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        {loading ? 'Loading...' : 'Test Fetch Trades'}
      </button>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Trades Count: {trades.length}</h2>
        {trades.length > 0 && (
          <div className="bg-gray-100 p-4 rounded">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(trades.slice(0, 3), null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 