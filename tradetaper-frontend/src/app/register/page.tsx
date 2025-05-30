/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/register/page.tsx
"use client";
import { useState, FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { registerUser } from '@/services/authService';
import { useRouter } from 'next/navigation'; // For App Router

export default function RegisterPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await dispatch(registerUser({ email, password, firstName, lastName }));
      // Handle successful registration (e.g., redirect to login or show message)
      alert('Registration successful! Please login.'); // Simple alert for now
      router.push('/login');
    } catch (err: any) {
      setFormError(err.message || "An unknown error occurred during registration.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="p-8 bg-gray-800 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Register for Tradetaper</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {formError && <p className="text-red-500 text-center mb-4">{formError}</p>}
        {/* Form fields ... */}
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="firstName">First Name</label>
          <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required
                 className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline"/>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="lastName">Last Name</label>
          <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required
                 className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline"/>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2" htmlFor="email">Email</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                 className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline"/>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2" htmlFor="password">Password</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                 className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline"/>
        </div>
        <button type="submit" disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50">
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}