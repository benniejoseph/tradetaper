/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/register/page.tsx
"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { registerUser } from '@/services/authService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleAuthService } from '@/services/googleAuthService';
import { 
  FaChartLine, 
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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMarketToggle = (market: string) => {
    setFormData(prev => ({
      ...prev,
      primaryMarkets: prev.primaryMarkets.includes(market)
        ? prev.primaryMarkets.filter(m => m !== market)
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
        return formData.agreeToTerms;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-pink-500/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Left Side - Branding & Benefits */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 p-12 flex-col justify-center">
        <div className="max-w-lg">
          <div className="mb-12">
            <div className="flex items-center mb-8">
              <div className="p-3 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl backdrop-blur-sm border border-white/10 mr-4">
                <FaChartLine className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                TradeTaper
              </h1>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Join 10,000+ Successful Traders
            </h2>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Start your trading journal journey with the most advanced platform designed for serious traders.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                icon: FaRocket,
                title: "Quick Setup",
                description: "Get started in under 2 minutes with our streamlined onboarding process"
              },
              {
                icon: FaShieldAlt,
                title: "Bank-Level Security",
                description: "Your trading data is protected with enterprise-grade encryption"
              },
              {
                icon: FaCrown,
                title: "Premium Features",
                description: "Access advanced analytics, AI insights, and professional-grade tools"
              }
            ].map((benefit, index) => (
              <div key={index} className="flex items-start space-x-4 group">
                <div className="flex-shrink-0 p-3 bg-white/[0.05] backdrop-blur-sm rounded-2xl border border-white/10 group-hover:bg-white/[0.1] transition-all duration-300">
                  <benefit.icon className="text-xl text-purple-400" />
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
                <h4 className="font-semibold text-lg text-white">Free 30-Day Trial</h4>
                <p className="text-slate-300 text-sm">No credit card required • Cancel anytime</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl backdrop-blur-sm border border-white/10 mr-3">
                <FaChartLine className="h-8 w-8 text-purple-400" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                TradeTaper
              </h1>
            </div>
            <p className="text-slate-300">Start your trading journey!</p>
          </div>

          <div className={`bg-white/[0.02] backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl transition-all duration-500 ${
            isFormFocused ? 'shadow-purple-500/20 border-purple-500/20' : ''
          }`}>
            <div className="hidden lg:block text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
                Create Account
              </h2>
              <p className="text-slate-300">Join thousands of successful traders</p>
            </div>

            {/* Progress Indicators */}
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    index <= currentStepIndex 
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg' 
                      : 'bg-white/[0.05] text-slate-400 border border-white/10'
                  }`}>
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 transition-all duration-300 ${
                      index < currentStepIndex ? 'bg-purple-500' : 'bg-white/10'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {(error || formError) && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-300 text-sm">
                  {error || formError}
                </div>
              )}

              {/* Step 1: Personal Information */}
              {currentStep === 'personal' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="p-3 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl backdrop-blur-sm border border-white/10 inline-block mb-4">
                      <FaUser className="h-6 w-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Personal Information</h3>
                    <p className="text-slate-400 text-sm">Tell us about yourself</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        onFocus={() => setIsFormFocused(true)}
                        onBlur={() => setIsFormFocused(false)}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                      />
                    </div>
                    <div className="relative">
                      <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        onFocus={() => setIsFormFocused(true)}
                        onBlur={() => setIsFormFocused(false)}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 text-slate-400">
                          Or sign up with
                        </span>
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => GoogleAuthService.initiateGoogleLogin()}
                      className="w-full flex items-center justify-center space-x-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-2xl py-4 px-6 transition-all duration-300 text-white hover:border-white/20 group"
                    >
                      <FaGoogle className="text-lg group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-medium">Continue with Google</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!validateStep('personal')}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-slate-500 disabled:to-slate-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 group"
                  >
                    <span>Continue</span>
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              )}

              {/* Step 2: Account Details */}
              {currentStep === 'account' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="p-3 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl backdrop-blur-sm border border-white/10 inline-block mb-4">
                      <FaLock className="h-6 w-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Account Details</h3>
                    <p className="text-slate-400 text-sm">Secure your account</p>
                  </div>

                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onFocus={() => setIsFormFocused(true)}
                      onBlur={() => setIsFormFocused(false)}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                    />
                  </div>

                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password (min. 8 characters)"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      onFocus={() => setIsFormFocused(true)}
                      onBlur={() => setIsFormFocused(false)}
                      required
                      minLength={8}
                      className="w-full pl-12 pr-12 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      onFocus={() => setIsFormFocused(true)}
                      onBlur={() => setIsFormFocused(false)}
                      required
                      className="w-full pl-12 pr-12 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-red-400 text-sm">Passwords do not match</p>
                  )}

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <FaArrowLeft />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!validateStep('account')}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-slate-500 disabled:to-slate-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 group"
                    >
                      <span>Continue</span>
                      <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Trading Preferences */}
              {currentStep === 'preferences' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="p-3 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-2xl backdrop-blur-sm border border-white/10 inline-block mb-4">
                      <FaUserFriends className="h-6 w-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Trading Profile</h3>
                    <p className="text-slate-400 text-sm">Help us personalize your experience</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-4">Trading Experience</label>
                    <div className="space-y-3">
                      {tradingExperiences.map((exp) => (
                        <label key={exp.value} className="flex items-center cursor-pointer group">
                          <div className="relative">
                            <input
                              type="radio"
                              name="experience"
                              value={exp.value}
                              checked={formData.tradingExperience === exp.value}
                              onChange={(e) => handleInputChange('tradingExperience', e.target.value)}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                              formData.tradingExperience === exp.value 
                                ? 'border-purple-500 bg-purple-500' 
                                : 'border-white/20 group-hover:border-purple-400'
                            }`}>
                              {formData.tradingExperience === exp.value && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                          </div>
                          <div className="ml-3">
                            <span className="text-white font-medium">{exp.label}</span>
                            <span className="text-slate-400 text-sm ml-2">({exp.subtitle})</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-4">Primary Markets (optional)</label>
                    <div className="grid grid-cols-2 gap-3">
                      {markets.map((market) => (
                        <button
                          key={market.value}
                          type="button"
                          onClick={() => handleMarketToggle(market.value)}
                          className={`p-4 rounded-2xl border transition-all duration-300 flex items-center space-x-3 group ${
                            formData.primaryMarkets.includes(market.value)
                              ? 'bg-purple-500/20 border-purple-500/50 text-white shadow-lg'
                              : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.08] hover:border-white/20'
                          }`}
                        >
                          <span className="text-lg">{market.icon}</span>
                          <span className="text-sm font-medium">{market.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                    <label className="flex items-start cursor-pointer group">
                      <div className="relative mt-1">
                        <input
                          type="checkbox"
                          checked={formData.agreeToTerms}
                          onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border-2 transition-all duration-300 flex items-center justify-center ${
                          formData.agreeToTerms 
                            ? 'border-purple-500 bg-purple-500' 
                            : 'border-white/20 group-hover:border-purple-400'
                        }`}>
                          {formData.agreeToTerms && (
                            <FaCheck className="text-white text-xs" />
                          )}
                        </div>
                      </div>
                      <span className="text-slate-300 text-sm ml-3 leading-relaxed">
                        I agree to the{' '}
                        <a href="#" className="text-purple-400 hover:text-purple-300 font-medium">Terms of Service</a>
                        {' '}and{' '}
                        <a href="#" className="text-purple-400 hover:text-purple-300 font-medium">Privacy Policy</a>
                      </span>
                    </label>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <FaArrowLeft />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      disabled={!validateStep('preferences') || isLoading}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-slate-500 disabled:to-slate-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 group"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <span>Create Account</span>
                          <FaSparkles className="group-hover:scale-110 transition-transform duration-300" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>

            <p className="text-center mt-8 text-slate-300">
              Already have an account?{' '}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
                Sign in here
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