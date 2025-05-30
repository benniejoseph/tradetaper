// src/app/page.tsx
"use client"; // This component needs to be a client component for useEffect and useState

import { useEffect, useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState<string>("Loading...");

  useEffect(() => {
    async function fetchData() {
      try {
        // Ensure your backend is running and CORS is configured
        const response = await fetch('http://localhost:3000/api/v1/test');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setMessage(data.message);
      } catch (error) {
        console.error("Failed to fetch message:", error);
        setMessage("Failed to load message from backend.");
      }
    }
    fetchData();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-12">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-700 bg-gradient-to-b from-zinc-800 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-800 lg:p-4">
          Welcome to your Trading Journal
        </p>
      </div>

      <h1 className="text-4xl font-bold mb-8">Trading Journal</h1>
      <p className="text-xl">Backend Message: <span className="font-semibold text-green-400">{message}</span></p>

      {/* Placeholder for future content */}
      <div className="mt-10">
        <p>Your trading dashboard will appear here.</p>
      </div>
    </main>
  );
}