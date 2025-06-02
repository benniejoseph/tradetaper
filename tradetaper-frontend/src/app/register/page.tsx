/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/register/page.tsx
"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { registerUser } from '@/services/authService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  FaApple,
  FaShieldAlt,
  FaCrown,
  FaRocket,
  FaArrowUp
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
      router.push('/dashboard');
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
    { value: 'beginner', label: 'Beginner (0-1 years)' },
    { value: 'intermediate', label: 'Intermediate (1-3 years)' },
    { value: 'advanced', label: 'Advanced (3-5 years)' },
    { value: 'expert', label: 'Expert (5+ years)' }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex">
      {/* Left Side - Branding & Benefits */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 to-blue-600/90"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <FaChartLine className="h-12 w-12 text-white mr-4" />
              <h1 className="text-4xl font-bold">TradeTaper</h1>
            </div>
            <h2 className="text-3xl font-bold mb-4 leading-tight">
              Join 10,000+ Successful Traders
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              Start your trading journal journey with the most advanced platform for serious traders.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FaRocket className="text-xl text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Quick Setup</h3>
                <p className="text-purple-100 text-sm">Get started in under 2 minutes with our streamlined onboarding process.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FaShieldAlt className="text-xl text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Bank-Level Security</h3>
                <p className="text-purple-100 text-sm">Your trading data is protected with enterprise-grade encryption.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FaArrowUp className="text-xl text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Proven Results</h3>
                <p className="text-purple-100 text-sm">Our users report an average 23% improvement in trading performance.</p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="flex items-center mb-4">
              <FaCrown className="text-yellow-400 text-2xl mr-3" />
              <div>
                <h4 className="font-semibold text-lg">Free Plan Includes:</h4>
                <p className="text-purple-100 text-sm">Up to 100 trades/month • Basic analytics • Mobile access</p>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-24 h-24 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-32 w-16 h-16 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <FaChartLine className="h-10 w-10 text-purple-500 mr-3" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                TradeTaper
              </h1>
            </div>
            <p className="text-gray-400">Create your trading journal account</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    index <= currentStepIndex 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' 
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {index < currentStepIndex ? <FaCheck /> : step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-2 transition-all duration-300 ${
                      index < currentStepIndex ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-gray-700'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {steps.map((step) => (
                <span key={step.id} className="text-xs text-gray-400">{step.label}</span>
              ))}
            </div>
          </div>

          <div className={`bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 transition-all duration-300 ${
            isFormFocused ? 'shadow-2xl scale-105' : 'shadow-xl'
          }`}>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
              <p className="text-gray-300">Join the trading revolution</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {(error || formError) && (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-100 text-sm">
                  {error || formError}
                </div>
              )}

              {/* Step 1: Personal Information */}
              {currentStep === 'personal' && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Personal Information</h3>
                    <p className="text-gray-400 text-sm">Let&apos;s start with the basics</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        onFocus={() => setIsFormFocused(true)}
                        onBlur={() => setIsFormFocused(false)}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      />
                    </div>
                    <div className="relative">
                      <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        onFocus={() => setIsFormFocused(true)}
                        onBlur={() => setIsFormFocused(false)}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!validateStep('personal')}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    <span>Continue</span>
                    <FaArrowRight />
                  </button>
                </div>
              )}

              {/* Step 2: Account Details */}
              {currentStep === 'account' && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Account Details</h3>
                    <p className="text-gray-400 text-sm">Secure your account</p>
                  </div>

                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onFocus={() => setIsFormFocused(true)}
                      onBlur={() => setIsFormFocused(false)}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password (min. 8 characters)"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      onFocus={() => setIsFormFocused(true)}
                      onBlur={() => setIsFormFocused(false)}
                      required
                      minLength={8}
                      className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      onFocus={() => setIsFormFocused(true)}
                      onBlur={() => setIsFormFocused(false)}
                      required
                      className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
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
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <FaArrowLeft />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!validateStep('account')}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                    >
                      <span>Continue</span>
                      <FaArrowRight />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Trading Preferences */}
              {currentStep === 'preferences' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Trading Profile</h3>
                    <p className="text-gray-400 text-sm">Help us personalize your experience</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Trading Experience</label>
                    <div className="space-y-2">
                      {tradingExperiences.map((exp) => (
                        <label key={exp.value} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="experience"
                            value={exp.value}
                            checked={formData.tradingExperience === exp.value}
                            onChange={(e) => handleInputChange('tradingExperience', e.target.value)}
                            className="mr-3 text-purple-500 focus:ring-purple-500"
                          />
                          <span className="text-gray-300">{exp.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Primary Markets (optional)</label>
                    <div className="grid grid-cols-2 gap-3">
                      {markets.map((market) => (
                        <button
                          key={market.value}
                          type="button"
                          onClick={() => handleMarketToggle(market.value)}
                          className={`p-3 rounded-xl border transition-all duration-300 flex items-center space-x-2 ${
                            formData.primaryMarkets.includes(market.value)
                              ? 'bg-purple-500/20 border-purple-500 text-white'
                              : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-lg">{market.icon}</span>
                          <span className="text-sm font-medium">{market.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.agreeToTerms}
                        onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                        className="mt-1 mr-3 text-purple-500 focus:ring-purple-500"
                      />
                      <span className="text-gray-300 text-sm">
                        I agree to the{' '}
                        <a href="#" className="text-purple-400 hover:text-purple-300">Terms of Service</a>
                        {' '}and{' '}
                        <a href="#" className="text-purple-400 hover:text-purple-300">Privacy Policy</a>
                      </span>
                    </label>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <FaArrowLeft />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      disabled={!validateStep('preferences') || isLoading}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <span>Create Account</span>
                          <FaRocket />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Social Login Options (Step 1 only) */}
              {currentStep === 'personal' && (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/20"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-transparent text-gray-300">Or sign up with</span>
                    </div>
                  </div>

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
                </div>
              )}
            </form>

            <p className="text-center mt-6 text-gray-300">
              Already have an account?{' '}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
                Sign in here
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