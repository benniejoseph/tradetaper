/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/register/page.tsx
"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { registerUser } from '@/services/authService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { GoogleAuthService } from '@/services/googleAuthService';
import { 
  FaEye, 
  FaEyeSlash, 
  FaArrowRight, 
  FaArrowLeft,
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaCheck,
  FaGoogle,
  FaShieldAlt,
  FaCrown,
  FaRocket,
  FaUserFriends,
  FaChartBar as FaTrendingUp,
  FaStar as FaSparkles
} from 'react-icons/fa';

type FormStep = 'personal' | 'account' | 'preferences';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  tradingExperience: string;
  primaryMarkets: string[];
  agreeToTerms: boolean;
}

export default function RegisterPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [currentStep, setCurrentStep] = useState<FormStep>('personal');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isFormFocused, setIsFormFocused] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    tradingExperience: '',
    primaryMarkets: [],
    agreeToTerms: false
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleInputChange = (field: keyof FormData, value: string | boolean | string[]) => {
    setFormData((prev: FormData) => ({ ...prev, [field]: value }));
  };

  const handleMarketToggle = (market: string) => {
    setFormData((prev: FormData) => ({
      ...prev,
      primaryMarkets: prev.primaryMarkets.includes(market)
        ? prev.primaryMarkets.filter((m: string) => m !== market)
        : [...prev.primaryMarkets, market]
    }));
  };

  const validateStep = (step: FormStep): boolean => {
    switch (step) {
      case 'personal':
        return formData.firstName.trim() !== '' && formData.lastName.trim() !== '';
      case 'account':
        return formData.email.trim() !== '' && 
               formData.password.length >= 8 && 
               formData.password === formData.confirmPassword;
      case 'preferences':
        // Ensure user selected an experience level and agreed to terms
        return formData.tradingExperience !== '' && formData.agreeToTerms;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep === 'personal' && validateStep('personal')) {
      setCurrentStep('account');
    } else if (currentStep === 'account' && validateStep('account')) {
      setCurrentStep('preferences');
    }
  };

  const prevStep = () => {
    if (currentStep === 'account') {
      setCurrentStep('personal');
    } else if (currentStep === 'preferences') {
      setCurrentStep('account');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep('preferences')) return;

    setFormError(null);
    try {
      await dispatch(registerUser({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName
      }));
      // After successful registration, redirect to login page
      router.push('/login?registered=true');
    } catch (err: any) {
      setFormError(err.message || "An unknown error occurred during registration.");
    }
  };

  const steps = [
    { id: 'personal', label: 'Personal Info', number: 1 },
    { id: 'account', label: 'Account Details', number: 2 },
    { id: 'preferences', label: 'Trading Profile', number: 3 }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const tradingExperiences = [
    { value: 'beginner', label: 'Beginner', subtitle: '0-1 years' },
    { value: 'intermediate', label: 'Intermediate', subtitle: '1-3 years' },
    { value: 'advanced', label: 'Advanced', subtitle: '3-5 years' },
    { value: 'expert', label: 'Expert', subtitle: '5+ years' }
  ];

  const markets = [
    { value: 'forex', label: 'Forex', icon: '💱' },
    { value: 'stocks', label: 'Stocks', icon: '📈' },
    { value: 'crypto', label: 'Crypto', icon: '₿' },
    { value: 'commodities', label: 'Commodities', icon: '🥇' },
    { value: 'indices', label: 'Indices', icon: '📊' },
    { value: 'options', label: 'Options', icon: '⚡' }
  ];

  return (
    <div className="min-h-screen bg-black flex relative overflow-hidden font-sans text-white text-sm">
      {/* 3D Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid Floor */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [transform:perspective(1000px)_rotateX(60deg)_translateY(-100px)_scale(3)] origin-top opacity-50"></div>
         
         <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[100px] animate-float"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[100px] animate-float delay-1000"></div>
      </div>

      {/* Left Side - Elegant Emerald Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 p-12 flex-col justify-center border-r border-emerald-100/10 bg-[#020403] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.24),transparent_46%),radial-gradient(circle_at_80%_72%,rgba(16,185,129,0.16),transparent_48%),linear-gradient(145deg,#010302_0%,#03110c_48%,#020403_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.08)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20 [mask-image:radial-gradient(circle_at_center,black_44%,transparent_92%)]" />
        <div className="pointer-events-none absolute left-[6%] top-[10%] h-52 w-72 rotate-[-10deg] rounded-[2rem] border border-emerald-200/15 bg-emerald-300/5 blur-[1px]" />
        <div className="pointer-events-none absolute right-[6%] bottom-[10%] h-56 w-72 rotate-[9deg] rounded-[2rem] border border-emerald-200/15 bg-emerald-300/5 blur-[1px]" />

        <div className="max-w-lg mx-auto relative">
          <div className="mb-10">
            <Link href="/" className="inline-flex items-center mb-7 group">
              <span className="text-5xl xl:text-6xl font-semibold tracking-tight leading-none text-white">
                Trade<span className="text-emerald-300">Taper</span>
              </span>
            </Link>
            <span className="inline-flex items-center rounded-full border border-emerald-200/25 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-emerald-200 mb-7">
              Start Strong
            </span>
            <h2 className="text-[2.3rem] leading-[1.08] font-semibold text-white mb-5">
              Build a disciplined trading system from day one.
            </h2>
            <p className="text-[15px] text-slate-300 leading-relaxed">
              Set up your account, define your profile, and begin tracking execution with a clean,
              review-first workflow.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: FaRocket,
                title: "Fast Onboarding",
                description: "Create your workspace quickly and move straight into journaling."
              },
              {
                icon: FaShieldAlt,
                title: "Secure by Default",
                description: "Production-grade authentication and session protection built in."
              },
              {
                icon: FaCrown,
                title: "Premium Ready",
                description: "Unlock advanced analysis and scale as your process matures."
              }
            ].map((benefit, index) => (
              <div
                key={index}
                className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-black/45 px-4 py-4 backdrop-blur-md transition-all duration-300 hover:border-emerald-200/30 hover:bg-black/60"
              >
                <div className="flex-shrink-0 h-11 w-11 rounded-xl bg-emerald-400/15 border border-emerald-200/20 text-emerald-200 flex items-center justify-center">
                  <benefit.icon className="text-base" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{benefit.title}</h3>
                  <p className="text-slate-300 text-xs leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-emerald-200/20 bg-gradient-to-r from-emerald-400/15 via-emerald-500/10 to-black/70 px-5 py-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-emerald-100/80 mb-1">Free Start</p>
            <div className="flex items-end justify-between gap-4">
              <p className="text-3xl font-semibold text-white">0$</p>
              <p className="text-xs text-emerald-200">Begin now. Upgrade when needed.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10 transition-all duration-500">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
        </div>
        <div className="w-full max-w-md">
          <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 relative">
             <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-emerald-500/20 rounded-full blur-xl pointer-events-none"></div>

             <div className="text-center mb-7">
               <Link href="/" className="inline-flex flex-col items-center justify-center mb-5">
                 <Image
                   src="/tradetaperLogo.png"
                   alt="TradeTaper"
                   width={140}
                   height={140}
                   className="h-20 w-20 md:h-28 md:w-28 object-contain"
                 />
               </Link>
               <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
               <p className="text-slate-400 text-sm">Set up your TradeTaper workspace in minutes</p>
             </div>

             {/* Progress Stepper */}
             <div className="flex items-center justify-between mb-8 relative">
                 {/* Progress Line Background */}
                 <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -z-10"></div>
                 {/* Active Progress Line */}
                 <div 
                    className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-300 -z-10 transition-all duration-500"
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                 ></div>

                 {steps.map((step, index) => (
                    <div key={step.id} className="relative group">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                            index <= currentStepIndex 
                                ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                                : 'bg-slate-900 border-slate-700 text-slate-500'
                        }`}>
                            {index < currentStepIndex ? <FaCheck /> : step.number}
                        </div>
                        <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium whitespace-nowrap transition-colors ${
                            index === currentStepIndex ? 'text-emerald-400' : 'text-slate-500'
                        }`}>
                            {step.label}
                        </div>
                    </div>
                 ))}
             </div>

            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
              {(error || formError) && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300 text-xs">
                  {error || formError}
                </div>
              )}

              {/* Step 1: Personal Information */}
              {currentStep === 'personal' && (
                <div className="space-y-5 animate-fade-in-up">
                   <div className="text-center mb-4">
                       <h3 className="text-lg font-bold text-white">Personal Information</h3>
                       <p className="text-slate-400 text-xs">Let's get to know you</p>
                   </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                      <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                      <input
                        type="text"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        onFocus={() => setIsFormFocused(true)}
                        onBlur={() => setIsFormFocused(false)}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-sm"
                      />
                    </div>
                    <div className="relative group">
                      <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        onFocus={() => setIsFormFocused(true)}
                        onBlur={() => setIsFormFocused(false)}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="px-4 bg-slate-900/50 backdrop-blur-xl text-slate-500">Or sign up with</span>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => GoogleAuthService.initiateGoogleLogin()}
                    className="w-full flex items-center justify-center space-x-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 transition-all text-white hover:border-white/20 group"
                  >
                    <FaGoogle className="text-base group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-sm">Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!validateStep('personal')}
                    className="w-full btn-3d btn-primary-3d flex items-center justify-center gap-2 mt-4"
                  >
                    Continue <FaArrowRight />
                  </button>
                </div>
              )}

              {/* Step 2: Account Details */}
              {currentStep === 'account' && (
                <div className="space-y-5 animate-fade-in-up">
                   <div className="text-center mb-4">
                       <h3 className="text-lg font-bold text-white">Account Security</h3>
                       <p className="text-slate-400 text-xs">Create your credentials</p>
                   </div>

                  <div className="relative group">
                    <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-sm"
                    />
                  </div>

                  <div className="relative group">
                    <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password (min. 8 chars)"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      minLength={8}
                      className="w-full pl-10 pr-10 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  <div className="relative group">
                    <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                      className="w-full pl-10 pr-10 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-red-400 text-xs text-center">Passwords do not match</p>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 btn-3d btn-secondary-3d flex items-center justify-center gap-2"
                    >
                      <FaArrowLeft /> Back
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!validateStep('account')}
                      className="flex-1 btn-3d btn-primary-3d flex items-center justify-center gap-2"
                    >
                      Next <FaArrowRight />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Trading Preferences */}
              {currentStep === 'preferences' && (
                <div className="space-y-6 animate-fade-in-up">
                   <div className="text-center mb-4">
                       <h3 className="text-lg font-bold text-white">Trading Profile</h3>
                       <p className="text-slate-400 text-xs">Customize your experience</p>
                   </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Experience Level</label>
                    <div className="grid grid-cols-2 gap-3">
                      {tradingExperiences.map((exp) => (
                        <label 
                            key={exp.value} 
                            className={`cursor-pointer group flex flex-col p-3 rounded-xl border transition-all ${
                                formData.tradingExperience === exp.value 
                                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                                    : 'bg-slate-900/50 border-white/5 hover:bg-slate-800'
                            }`}
                        >
                            <input
                              type="radio"
                              name="experience"
                              value={exp.value}
                              checked={formData.tradingExperience === exp.value}
                              onChange={(e) => handleInputChange('tradingExperience', e.target.value)}
                              className="sr-only"
                            />
                            <span className={`text-sm font-bold mb-1 ${formData.tradingExperience === exp.value ? 'text-emerald-400' : 'text-white'}`}>
                                {exp.label}
                            </span>
                             <span className="text-xs text-slate-500">{exp.subtitle}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">Primary Markets (Optional)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {markets.map((market) => (
                        <button
                          key={market.value}
                          type="button"
                          onClick={() => handleMarketToggle(market.value)}
                          className={`p-2 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 ${
                            formData.primaryMarkets.includes(market.value)
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                              : 'bg-slate-900/50 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <span className="text-lg">{market.icon}</span>
                          <span className="text-[10px] font-medium">{market.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4 flex items-start gap-3">
                    <div className="relative mt-1">
                         <input
                           type="checkbox"
                           checked={formData.agreeToTerms}
                           onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                           className="sr-only peer"
                           id="terms"
                         />
                         <div className="w-5 h-5 rounded border border-white/20 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 flex items-center justify-center transition-all cursor-pointer bg-white/5">
                            {formData.agreeToTerms && <FaCheck className="text-white text-xs" />}
                         </div>
                         <label htmlFor="terms" className="absolute inset-0 cursor-pointer"></label>
                    </div>
                    <label htmlFor="terms" className="text-xs text-slate-400 leading-relaxed cursor-pointer select-none">
                        I agree to the <span className="text-emerald-400 hover:underline">Terms of Service</span> and <span className="text-emerald-400 hover:underline">Privacy Policy</span>.
                    </label>
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 btn-3d btn-secondary-3d flex items-center justify-center gap-2"
                    >
                      <FaArrowLeft /> Back
                    </button>
                    <button
                      type="submit"
                      disabled={!validateStep('preferences') || isLoading}
                      className="flex-1 btn-3d btn-primary-3d flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                      ) : (
                        <>
                          Create Account <FaSparkles />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>

            <div className="mt-8 text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-bold">
                Sign in here
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
