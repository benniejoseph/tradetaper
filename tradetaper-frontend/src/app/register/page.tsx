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
  referralCode?: string;
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
    agreeToTerms: false,
    referralCode: ''
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
        lastName: formData.lastName,
        referralCode: formData.referralCode
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
    <div className="min-h-screen bg-background flex relative overflow-hidden font-sans text-foreground text-sm">
      {/* 3D Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid Floor */}
         <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [transform:perspective(1000px)_rotateX(60deg)_translateY(-100px)_scale(3)] origin-top opacity-50 dark:opacity-50 opacity-20"></div>
         
         <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[100px] animate-float"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[100px] animate-float delay-1000"></div>
      </div>

      {/* Left Side - 3D Visual & Benefits */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 p-12 flex-col justify-center border-r border-border bg-card/30 backdrop-blur-sm">
        <div className="max-w-lg mx-auto">
          <div className="mb-12">
            <Link href="/" className="flex items-center mb-8 group">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20 mr-4 group-hover:scale-110 transition-transform">
                <FaChartLine className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                TradeTaper
              </h1>
            </Link>
            <h2 className="text-4xl font-bold text-foreground mb-6 leading-tight">
              Join 10,000+ <span className="text-gradient-emerald">Successful Traders</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Start your trading journal journey with the most advanced platform designed for serious traders.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                icon: FaRocket,
                title: "Quick Setup",
                description: "Get started in under 2 minutes"
              },
              {
                icon: FaShieldAlt,
                title: "Bank-Level Security",
                description: "Enterprise-grade encryption"
              },
              {
                icon: FaCrown,
                title: "Premium Features",
                description: "Access advanced AI insights"
              }
            ].map((benefit, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 rounded-xl border border-border bg-card/40 hover:bg-card/60 transition-colors">
                <div className="flex-shrink-0 p-3 bg-primary/10 rounded-lg">
                  <benefit.icon className="text-lg text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">{benefit.title}</h3>
                  <p className="text-muted-foreground text-xs">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 3D Visual Element */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full"></div>
            <div className="relative glass-card p-6 flex items-center justify-between">
                <div>
                    <div className="text-2xl font-bold text-foreground">30-Day Trial</div>
                    <div className="text-muted-foreground text-xs">Full access. No credit card required.</div>
                </div>
                <FaSparkles className="text-yellow-400 text-3xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10 transition-all duration-500">
        <div className="w-full max-w-md">
           
           {/* Mobile Header */}
           <div className="lg:hidden text-center mb-8">
               <Link href="/" className="inline-flex items-center gap-2 mb-4">
                  <FaChartLine className="text-primary text-2xl" />
                  <span className="text-xl font-bold text-foreground">TradeTaper</span>
               </Link>
               <h2 className="text-2xl font-bold text-foreground">Create Account</h2>
           </div>

          <div className="glass-card p-6 md:p-8 rounded-3xl border border-border relative bg-card/50">
             {/* Progress Stepper */}
             <div className="flex items-center justify-between mb-8 relative">
                 {/* Progress Line Background */}
                 <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10"></div>
                 {/* Active Progress Line */}
                 <div 
                    className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 -z-10 transition-all duration-500"
                    style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                 ></div>

                 {steps.map((step, index) => (
                    <div key={step.id} className="relative group">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                            index <= currentStepIndex 
                                ? 'bg-background border-primary text-primary shadow-lg shadow-primary/20' 
                                : 'bg-background border-muted text-muted-foreground'
                        }`}>
                            {index < currentStepIndex ? <FaCheck /> : step.number}
                        </div>
                        <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium whitespace-nowrap transition-colors ${
                            index === currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                            {step.label}
                        </div>
                    </div>
                 ))}
             </div>

            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
              {(error || formError) && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive text-xs">
                  {error || formError}
                </div>
              )}

              {/* Step 1: Personal Information */}
              {currentStep === 'personal' && (
                <div className="space-y-5 animate-fade-in-up">
                   <div className="text-center mb-4">
                       <h3 className="text-lg font-bold text-foreground">Personal Information</h3>
                       <p className="text-muted-foreground text-xs">Let's get to know you</p>
                   </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                      <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type="text"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        onFocus={() => setIsFormFocused(true)}
                        onBlur={() => setIsFormFocused(false)}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-input/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm"
                      />
                    </div>
                    <div className="relative group">
                      <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        onFocus={() => setIsFormFocused(true)}
                        onBlur={() => setIsFormFocused(false)}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-input/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="px-4 bg-background backdrop-blur-xl text-muted-foreground">Or sign up with</span>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => GoogleAuthService.initiateGoogleLogin()}
                    className="w-full flex items-center justify-center space-x-3 bg-card border border-border hover:bg-muted rounded-xl py-3 transition-all text-foreground group"
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
                       <h3 className="text-lg font-bold text-foreground">Account Security</h3>
                       <p className="text-muted-foreground text-xs">Create your credentials</p>
                   </div>

                  <div className="relative group">
                    <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-input/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm"
                    />
                  </div>

                  <div className="relative group">
                    <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password (min. 8 chars)"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      minLength={8}
                      className="w-full pl-10 pr-10 py-3 bg-input/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  <div className="relative group">
                    <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                      className="w-full pl-10 pr-10 py-3 bg-input/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-destructive text-xs text-center">Passwords do not match</p>
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
                       <h3 className="text-lg font-bold text-foreground">Trading Profile</h3>
                       <p className="text-muted-foreground text-xs">Customize your experience</p>
                   </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Experience Level</label>
                    <div className="grid grid-cols-2 gap-3">
                      {tradingExperiences.map((exp) => (
                        <label 
                            key={exp.value} 
                            className={`cursor-pointer group flex flex-col p-3 rounded-xl border transition-all ${
                                formData.tradingExperience === exp.value 
                                    ? 'bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                                    : 'bg-card/50 border-border hover:bg-card'
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
                            <span className={`text-sm font-bold mb-1 ${formData.tradingExperience === exp.value ? 'text-primary' : 'text-foreground'}`}>
                                {exp.label}
                            </span>
                             <span className="text-xs text-muted-foreground">{exp.subtitle}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Primary Markets (Optional)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {markets.map((market) => (
                        <button
                          key={market.value}
                          type="button"
                          onClick={() => handleMarketToggle(market.value)}
                          className={`p-2 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 ${
                            formData.primaryMarkets.includes(market.value)
                              ? 'bg-primary/20 border-primary/50 text-primary'
                              : 'bg-card/50 border-border text-muted-foreground hover:text-foreground hover:bg-card'
                          }`}
                        >
                          <span className="text-lg">{market.icon}</span>
                          <span className="text-[10px] font-medium">{market.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-card/50 border border-border rounded-xl p-4 flex items-start gap-3">
                    <div className="relative mt-1">
                         <input
                           type="checkbox"
                           checked={formData.agreeToTerms}
                           onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                           className="sr-only peer"
                           id="terms"
                         />
                         <div className="w-5 h-5 rounded border border-input peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center transition-all cursor-pointer bg-card">
                            {formData.agreeToTerms && <FaCheck className="text-white text-xs" />}
                         </div>
                         <label htmlFor="terms" className="absolute inset-0 cursor-pointer"></label>
                    </div>
                    <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer select-none">
                        I agree to the <span className="text-primary hover:underline">Terms of Service</span> and <span className="text-primary hover:underline">Privacy Policy</span>.
                    </label>
                  </div>

                  <div>
                     <label className="block text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Referral Code (Optional)</label>
                     <div className="relative group">
                        <FaUserFriends className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Enter Referral Code"
                            value={formData.referralCode || ''}
                            onChange={(e) => handleInputChange('referralCode', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-input/50 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm uppercase"
                        />
                     </div>
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

            <div className="mt-8 text-center text-xs text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:text-primary/80 transition-colors font-bold">
                Sign in here
              </Link>
            </div>
          </div>
          
           <div className="text-center mt-6">
            <Link 
              href="/" 
              className="text-muted-foreground hover:text-foreground transition-colors text-xs inline-flex items-center gap-1"
            >
              <span>← Back to home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}