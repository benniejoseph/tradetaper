/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/login/page.tsx
"use client";
import React, { useState, FormEvent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { loginUser } from '@/services/authService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaChartLine, 
  FaEye, 
  FaEyeSlash, 
  FaArrowRight, 
  FaBook, 
  FaChartPie, 
  FaBullseye, 
  FaCalendarAlt,
  FaGoogle,
  FaApple,
  FaLock,
  FaEnvelope
} from 'react-icons/fa';

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isFormFocused, setIsFormFocused] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await dispatch(loginUser({ email, password }));
    } catch (err: any) {
      setFormError(err.message || "An unknown error occurred during login.");
    }
  };

  const benefits = [
    {
      icon: FaBook,
      title: "Advanced Trade Journaling",
      description: "Log every detail of your trades with comprehensive analytics"
    },
    {
      icon: FaChartPie,
      title: "Performance Analytics",
      description: "Deep insights into your trading patterns and profitability"
    },
    {
      icon: FaBullseye,
      title: "Risk Management",
      description: "Calculate R-multiples and optimize your risk-reward ratios"
    },
    {
      icon: FaCalendarAlt,
      title: "Calendar View",
      description: "Visualize your trading activity across time"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-green-900 flex">
      {/* Left Side - Benefits */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-green-600/90"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <FaChartLine className="h-12 w-12 text-white mr-4" />
              <h1 className="text-4xl font-bold">TradeTaper</h1>
            </div>
            <h2 className="text-3xl font-bold mb-4 leading-tight">
              Transform Your Trading Journey
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              The most advanced trading journal for serious traders. Track, analyze, and optimize your performance.
            </p>
          </div>

          <div className="space-y-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-4 group">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
                  <benefit.icon className="text-xl text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{benefit.title}</h3>
                  <p className="text-blue-100 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="flex items-center mb-3">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 bg-gradient-to-r from-blue-400 to-green-400 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <span className="ml-3 text-sm text-blue-100">10,000+ traders trust TradeTaper</span>
            </div>
            <p className="text-sm text-blue-100 italic">
              &quot;TradeTaper helped me identify my trading patterns and improve my win rate by 25%&quot;
            </p>
            <p className="text-xs text-blue-200 mt-2">- Sarah Chen, Professional Trader</p>
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-24 h-24 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-32 w-16 h-16 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <FaChartLine className="h-10 w-10 text-blue-500 mr-3" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                TradeTaper
              </h1>
            </div>
            <p className="text-gray-400">Welcome back, trader!</p>
          </div>

          <div className={`bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 transition-all duration-300 ${
            isFormFocused ? 'shadow-2xl scale-105' : 'shadow-xl'
          }`}>
            <div className="hidden lg:block text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-gray-300">Sign in to your TradeTaper account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {(error || formError) && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-100 text-sm">
                  {error || formError}
                </div>
              )}

              <div className="space-y-4">
                {/* Quick Login Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    className="flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl py-3 px-4 transition-all duration-300 text-white hover:scale-105"
                  >
                    <FaGoogle className="text-lg" />
                    <span className="text-sm font-medium">Google</span>
                  </button>
                  <button 
                    type="button"
                    className="flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl py-3 px-4 transition-all duration-300 text-white hover:scale-105"
                  >
                    <FaApple className="text-lg" />
                    <span className="text-sm font-medium">Apple</span>
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-transparent text-gray-300">Or continue with email</span>
                  </div>
                </div>

                {/* Email Input */}
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsFormFocused(true)}
                    onBlur={() => setIsFormFocused(false)}
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsFormFocused(true)}
                    onBlur={() => setIsFormFocused(false)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-gray-300">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2" />
                  Remember me
                </label>
                <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>Sign In</span>
                    <FaArrowRight />
                  </>
                )}
              </button>

              {/* Demo Account Quick Login */}
              <div className="border-t border-white/20 pt-6">
                <p className="text-center text-gray-400 text-sm mb-3">Try the demo account:</p>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('user1@example.com');
                      setPassword('password123');
                    }}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-gray-300 hover:text-white transition-all duration-300"
                  >
                    Demo User 1: user1@example.com
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('user2@example.com');
                      setPassword('password123');
                    }}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-gray-300 hover:text-white transition-all duration-300"
                  >
                    Demo User 2: user2@example.com
                  </button>
                </div>
              </div>
            </form>

            <p className="text-center mt-6 text-gray-300">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                Create one here
              </Link>
            </p>
          </div>

          <div className="text-center mt-8">
            <Link 
              href="/" 
              className="text-gray-400 hover:text-white transition-colors text-sm flex items-center justify-center space-x-1"
            >
              <span>← Back to home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}