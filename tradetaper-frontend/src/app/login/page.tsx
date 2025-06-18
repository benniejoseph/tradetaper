/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/login/page.tsx
"use client";
import React, { useState, FormEvent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { loginUser, forgotPassword } from '@/services/authService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaChartLine, 
  FaEye, 
  FaEyeSlash, 
  FaArrowRight, 
  FaLock,
  FaEnvelope,
  FaGoogle,
  FaSparkles,
  FaTrendingUp,
  FaShield,
  FaRocket
} from 'react-icons/fa';

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isFormFocused, setIsFormFocused] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailSent, setForgotEmailSent] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Load remembered credentials
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    try {
      await dispatch(loginUser({ email, password }));
      
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
    } catch (err: any) {
      setFormError(err.message || "An unknown error occurred during login.");
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword({ email: forgotEmail });
      setForgotEmailSent(true);
    } catch (err: any) {
      setFormError(err.message || "Failed to send reset email.");
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/[0.02] backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="p-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl backdrop-blur-sm border border-white/10">
                  <FaLock className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-2">
                Reset Password
              </h2>
              <p className="text-slate-300">Enter your email to receive reset instructions</p>
            </div>

            {forgotEmailSent ? (
              <div className="text-center space-y-6">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                  <p className="text-green-400">Reset instructions sent! Check your email.</p>
                </div>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotEmailSent(false);
                    setForgotEmail('');
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                {formError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-300 text-sm">
                    {formError}
                  </div>
                )}

                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setFormError(null);
                    }}
                    className="flex-1 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-32 h-32 bg-purple-500/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Left Side - Benefits */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 p-12 flex-col justify-center">
        <div className="max-w-lg">
          <div className="mb-12">
            <div className="flex items-center mb-8">
              <div className="p-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl backdrop-blur-sm border border-white/10 mr-4">
                <FaChartLine className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                TradeTaper
              </h1>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Master Your Trading Journey
            </h2>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Join thousands of traders who've transformed their performance with our advanced analytics platform.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                icon: FaTrendingUp,
                title: "Performance Analytics",
                description: "Deep insights into your trading patterns with advanced metrics and visualizations"
              },
              {
                icon: FaShield,
                title: "Risk Management",
                description: "Smart position sizing and risk-reward optimization tools"
              },
              {
                icon: FaRocket,
                title: "Growth Tracking",
                description: "Monitor your progress with comprehensive performance dashboards"
              }
            ].map((benefit, index) => (
              <div key={index} className="flex items-start space-x-4 group">
                <div className="flex-shrink-0 p-3 bg-white/[0.05] backdrop-blur-sm rounded-2xl border border-white/10 group-hover:bg-white/[0.1] transition-all duration-300">
                  <benefit.icon className="text-xl text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-white">{benefit.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10">
            <div className="flex items-center mb-4">
              <FaSparkles className="text-yellow-400 text-2xl mr-3" />
              <div>
                <h4 className="font-semibold text-lg text-white">Trusted by 10,000+ Traders</h4>
                <p className="text-slate-300 text-sm">Average 23% improvement in trading performance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl backdrop-blur-sm border border-white/10 mr-3">
                <FaChartLine className="h-8 w-8 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                TradeTaper
              </h1>
            </div>
            <p className="text-slate-300">Welcome back, trader!</p>
          </div>

          <div className={`bg-white/[0.02] backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl transition-all duration-500 ${
            isFormFocused ? 'shadow-blue-500/20 border-blue-500/20' : ''
          }`}>
            <div className="hidden lg:block text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-2">
                Welcome Back
              </h2>
              <p className="text-slate-300">Sign in to your trading dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {(error || formError) && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-300 text-sm">
                  {error || formError}
                </div>
              )}

              <div className="space-y-4">
                {/* Google Sign In */}
                <button 
                  type="button"
                  className="w-full flex items-center justify-center space-x-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-2xl py-4 px-6 transition-all duration-300 text-white hover:border-white/20 group"
                >
                  <FaGoogle className="text-lg group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-medium">Continue with Google</span>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-slate-400">
                      Or continue with email
                    </span>
                  </div>
                </div>

                {/* Email Input */}
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
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
                    className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                  />
                </div>

                {/* Password Input */}
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
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
                    className="w-full pl-12 pr-12 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-slate-300 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/20 text-blue-500 bg-white/5 focus:ring-blue-500/50 focus:ring-2 focus:ring-offset-0 mr-2" 
                  />
                  <span className="group-hover:text-white transition-colors">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-slate-500 disabled:to-slate-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 group"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <span>Sign In</span>
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center mt-8 text-slate-300">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                Create one here
              </Link>
            </p>
          </div>

          <div className="text-center mt-8">
            <Link 
              href="/" 
              className="text-slate-400 hover:text-white transition-colors text-sm flex items-center justify-center space-x-1 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform duration-300">←</span>
              <span>Back to home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}