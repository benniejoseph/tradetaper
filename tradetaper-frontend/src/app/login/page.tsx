/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/login/page.tsx
"use client";
import { useState, FormEvent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { loginUser } from '@/services/authService';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard'); // Or your main authenticated page
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await dispatch(loginUser({ email, password }));
      // Redirection is handled by useEffect
    } catch (err: any) {
      setFormError(err.message || "An unknown error occurred during login.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="p-8 bg-gray-800 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login to Tradetaper</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {formError && <p className="text-red-500 text-center mb-4">{formError}</p>}
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="email">Email</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                 className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline"/>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2" htmlFor="password">Password</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                 className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline"/>
        </div>
        <button type="submit" disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50">
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
         <p className="text-center mt-4 text-sm">
            Don&apos;t have an account? <a href="/register" className="text-blue-400 hover:underline">Register here</a>
        </p>
      </form>
    </div>
  );
}