/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/login/page.tsx
"use client";
import React, { useState, FormEvent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { loginUser, forgotPassword } from '@/services/authService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { GoogleAuthService } from '@/services/googleAuthService';
import { 
  FaEye, 
  FaEyeSlash, 
  FaArrowRight, 
  FaLock,
  FaEnvelope,
  FaGoogle,
  FaRocket,
  FaShieldAlt as FaShield,
  FaChartBar as FaTrendingUp,
  FaStar as FaSparkles
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
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Check for registration success parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
      setShowRegistrationSuccess(true);
      // Clear the URL parameter
      router.replace('/login');
    }
  }, [router]);

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

  // Forgot Password Modal/View
  if (showForgotPassword) {
    return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] animate-float"></div>
           <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-teal-500/10 rounded-full blur-[100px] animate-float delay-1000"></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="glass-card rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <FaLock className="h-8 w-8 text-emerald-400" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Reset Password
              </h2>
              <p className="text-slate-400">Enter your email to receive reset instructions</p>
            </div>

            {forgotEmailSent ? (
              <div className="text-center space-y-6">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <p className="text-emerald-400">Reset instructions sent! Check your email.</p>
                </div>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotEmailSent(false);
                    setForgotEmail('');
                  }}
                  className="w-full btn-3d btn-primary-3d"
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

                <div className="relative group">
                  <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-black/60 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setFormError(null);
                    }}
                    className="flex-1 btn-3d btn-secondary-3d"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-3d btn-primary-3d"
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
    <div className="min-h-screen bg-black flex relative overflow-hidden font-sans text-white">
      {/* 3D Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         {/* Grid Floor */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [transform:perspective(1000px)_rotateX(60deg)_translateY(-100px)_scale(3)] origin-top opacity-40"></div>
         
         <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/8 rounded-full blur-[120px] animate-float"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/6 rounded-full blur-[140px] animate-float delay-1000"></div>
      </div>

      {/* Left Side - 3D Visual & Benefits */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 p-12 flex-col justify-center border-r border-white/5 bg-black/60 backdrop-blur-sm">
        <div className="max-w-lg mx-auto">
          <div className="mb-12">
            <div className="mb-8">
              <h1 className="text-5xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-white">
                TradeTaper
              </h1>
            </div>
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              Master the Markets with <span className="text-gradient-emerald">Precision</span>
            </h2>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              Access your institutional-grade trading journal and start refining your edge today.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                icon: FaTrendingUp,
                title: "Neural Analytics",
                description: "AI that learns your trading patterns"
              },
              {
                icon: FaShield,
                title: "Risk Engine",
                description: "Pro-grade position sizing & controls"
              },
              {
                icon: FaRocket,
                title: "Performance Tracking",
                description: "Real-time P&L and growth metrics"
              }
            ].map((benefit, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                <div className="flex-shrink-0 p-3 bg-emerald-500/10 rounded-lg">
                  <benefit.icon className="text-lg text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{benefit.title}</h3>
                  <p className="text-slate-400 text-xs">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 3D Floating Element */}
          <div className="mt-16 relative h-32 perspective-1000">
             <div className="absolute inset-0 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl transform rotate-x-12 rotate-y-6 flex items-center justify-center backdrop-blur-md">
                <div className="text-center">
                    <div className="text-4xl font-bold text-white mb-1">10k+</div>
                    <div className="text-emerald-400 text-xs uppercase tracking-wider font-bold">Active Traders</div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 rounded-3xl border border-white/10 bg-black/70 relative">
            {/* Top Glow */}
             <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-emerald-500/20 rounded-full blur-xl pointer-events-none"></div>

            <div className="text-center mb-8">
              <Link href="/" className="inline-flex flex-col items-center justify-center mb-6">
                <Image
                  src="/tradetaperLogo.png"
                  alt="TradeTaper"
                  width={140}
                  height={140}
                  className="h-24 w-24 md:h-32 md:w-32 object-contain"
                />
              </Link>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-slate-400 text-sm">Sign in to your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {showRegistrationSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                  <FaSparkles className="text-emerald-400 flex-shrink-0" />
                  <p className="text-emerald-300 text-sm">Account created! Please sign in.</p>
                </div>
              )}
              
              {(error || formError) && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300 text-sm">
                  {error || formError}
                </div>
              )}

              {/* Google Sign In */}
              <button 
                type="button"
                onClick={() => GoogleAuthService.initiateGoogleLogin()}
                className="w-full flex items-center justify-center space-x-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3.5 px-6 transition-all text-white hover:border-white/20 group"
              >
                <FaGoogle className="text-lg group-hover:scale-110 transition-transform" />
                <span className="font-medium text-sm">Continue with Google</span>
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-4 bg-black/60 backdrop-blur-xl text-slate-500">Or continue with email</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative group">
                  <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsFormFocused(true)}
                    onBlur={() => setIsFormFocused(false)}
                    placeholder="Email address"
                    autoComplete="email"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-black/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-sm"
                  />
                </div>

                <div className="relative group">
                  <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsFormFocused(true)}
                    onBlur={() => setIsFormFocused(false)}
                    placeholder="Password"
                    autoComplete="current-password"
                    required
                    className="w-full pl-12 pr-12 py-3.5 bg-black/60 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-slate-400 cursor-pointer hover:text-slate-300">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/20 text-emerald-500 bg-white/5 focus:ring-emerald-500/50 focus:ring-offset-0 mr-2" 
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium text-xs hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-3d btn-primary-3d flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                ) : (
                  <>
                    <span>Sign In</span>
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-400">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
                Create Account
              </Link>
            </div>
          </div>
          
           <div className="text-center mt-6">
            <Link 
              href="/" 
              className="text-slate-500 hover:text-white transition-colors text-xs inline-flex items-center gap-1"
            >
              <span>← Back to home</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
