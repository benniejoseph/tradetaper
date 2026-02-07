// src/app/page.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { PRICING_TIERS } from '@/config/pricing';
import { 
  FaChartLine, 
  FaRocket, 
  FaArrowRight, 
  FaCheck, 
  FaStar,
  FaShieldAlt,
  FaGlobe,
  FaUsers,
  FaLaptopCode,
  FaBrain,
  FaGem,
  FaBolt
} from 'react-icons/fa';

/**
 * 3D Background Animation Component
 * Renders floating orbs and grid lines for depth
 */
const HeroBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Deep Space Background */}
    <div className="absolute inset-0 bg-slate-950"></div>
    
    {/* Grid Floor */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:100px_100px] [transform:perspective(1000px)_rotateX(60deg)_translateY(-100px)_scale(3)] origin-top"></div>

    {/* Floating Orbs - Emerald & Teal */}
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-float"></div>
    <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-teal-500/10 rounded-full blur-3xl animate-float delay-1000"></div>
    
    {/* Radial Glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05),transparent_70%)]"></div>
  </div>
);

/**
 * 3D Card Component with Hover Effect
 */
const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="glass-card p-8 rounded-2xl group">
    <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
      <Icon className="text-2xl text-emerald-400" />
    </div>
    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors">{title}</h3>
    <p className="text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">
      {description}
    </p>
  </div>
);

export default function LandingPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  // Redirect if logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Loading State for Auth Check
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-emerald-400 font-medium">Initializing Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full bg-slate-950/80 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all">
              <FaChartLine className="text-white text-lg" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
              TradeTaper
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            {['Features', 'Pricing', 'Testimonials'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                className="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/login"
              className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Log In
            </Link>
            <Link 
              href="/register"
              className="px-5 py-2.5 text-sm font-bold bg-white text-slate-900 rounded-lg hover:bg-emerald-50 transition-colors shadow-lg shadow-white/10"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 overflow-hidden">
        <HeroBackground />
        
        <div className="relative max-w-7xl mx-auto px-6 text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            New: AI Pattern Recognition Engine v2.0
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
            Master the Markets with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-lime-300">
              Precision Intelligence
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            The advanced trading journal that evolves with you. Leverage AI-driven insights, 
            3D visualization, and institutional-grade analytics to refine your edge.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/register"
              className="btn-3d btn-primary-3d flex items-center gap-2"
            >
              Start Free Trial <FaRocket />
            </Link>
            <Link 
              href="/demo"
              className="btn-3d btn-secondary-3d flex items-center gap-2"
            >
              Live Demo <FaArrowRight />
            </Link>
          </div>

          {/* 3D Dashboard Preview Hero Image */}
          <div className="mt-20 relative mx-auto max-w-5xl perspective-1000 group">
             <div className="relative transform-style-3d rotate-x-12 group-hover:rotate-x-0 transition-transform duration-1000 ease-out">
                {/* Glow Effect behind image */}
                <div className="absolute -inset-4 bg-emerald-500/20 rounded-xl blur-2xl opacity-50"></div>
                
                {/* Mockup Container */}
                <div className="relative bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                  {/* Window Controls */}
                  <div className="h-8 bg-slate-800 flex items-center px-4 space-x-2 border-b border-white/5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  
                  {/* Content Placeholder (Eventually Real Screenshot) */}
                  <div className="aspect-video bg-slate-950 relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(6,78,59,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]"></div>
                    <div className="text-center">
                        <FaChartLine className="text-6xl text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-700 font-mono">Live Market Interface Loading...</p>
                    </div>
                    {/* Overlay Grid lines for tech feel */}
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Stats Section with Glassmorphism */}
      <section className="py-20 border-y border-white/5 bg-slate-900/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Active Traders', value: '10k+' },
              { label: 'Trades Logged', value: '2.5M+' },
              { label: 'Strategies Analyzed', value: '500+' },
              { label: 'Data Points', value: '1B+' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm font-medium text-emerald-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Engineered for <span className="text-gradient-emerald">Performance</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Our suite of tools is designed to help you identify patterns, manage risk, and execute with confidence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={FaBrain}
              title="Neural Analysis"
              description="AI algorithms analyze your trading history to identify profitable patterns and behavioral biases."
            />
             <FeatureCard 
              icon={FaChartLine}
              title="Advanced Charting"
              description="Interactive, multi-timeframe charts with over 100+ indicators and drawing tools built-in."
            />
             <FeatureCard 
              icon={FaShieldAlt}
              title="Risk Management"
              description="Real-time risk calculators and position sizing tools to protect your capital on every trade."
            />
             <FeatureCard 
              icon={FaLaptopCode}
              title="Journal Automation"
              description="Sync with MetaTrader and CTrader to automatically import and categorize your trade history."
            />
             <FeatureCard 
              icon={FaGem}
              title="Strategy Testing"
              description="Backtest your strategies with historical data to validate edge before risking real capital."
            />
             <FeatureCard 
              icon={FaUsers}
              title="Mentor Connect"
              description="Share verified performance reports with mentors or funding firms with a single click."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section (Showcase of new PlanCards style) */}
      <section id="pricing" className="py-32 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Transparent <span className="text-gradient-emerald">Pricing</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Start for free, upgrade as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {PRICING_TIERS.map((tier) => (
              <div 
                key={tier.id}
                className={`relative rounded-[2rem] p-8 border backdrop-blur-xl transition-all duration-300 flex flex-col group
                  ${tier.recommended 
                    ? 'bg-slate-900/60 border-emerald-500/50 shadow-2xl shadow-emerald-500/10 scale-105 z-10' 
                    : 'bg-slate-900/50 border-white/10 hover:bg-slate-900/60 hover:border-white/20'}`}
              >
                 {/* Glow Effect on Hover */}
                 <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                {tier.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-5 py-1.5 rounded-full text-xs uppercase tracking-wider shadow-lg">
                    Most Popular
                  </div>
                )}
                
                <h3 className="text-xl font-medium text-white mb-2">{tier.name}</h3>
                <div className="flex items-baseline mb-6 gap-1">
                  <span className="text-5xl font-bold text-white tracking-tight">${tier.price}</span>
                  <span className="text-slate-500 text-lg font-medium">/mo</span>
                </div>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed h-10">{tier.description}</p>
                
                <ul className="space-y-4 mb-10 flex-grow">
                  {tier.features.slice(0, 5).map((feature, idx) => (
                     <li key={idx} className="flex items-start gap-3">
                        <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                             <FaCheck className="text-[10px] text-emerald-400" />
                        </div>
                       <span className="text-slate-300 text-sm">{feature}</span>
                     </li>
                  ))}
                   {tier.features.length > 5 && (
                    <li className="text-xs text-slate-500 italic pl-8">
                        + {tier.features.length - 5} more features
                    </li>
                   )}
                </ul>

                <Link
                  href="/register"
                  className={`block w-full py-3.5 rounded-full font-bold text-center transition-all ${
                    tier.recommended 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' 
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/5'
                  }`}
                >
                  {tier.price === 0 ? 'Start Free' : 'Choose Plan'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
 
      {/* Footer */}
      {/* Footer */}
      <footer className="bg-slate-950 pt-20 pb-10 border-t border-white/5 relative z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
               <Link href="/" className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center">
                  <FaChartLine className="text-white text-sm" />
                </div>
                <span className="text-xl font-bold text-white">TradeTaper</span>
              </Link>
              <p className="text-slate-400 max-w-sm mb-6">
                The most advanced trading journal platform for modern traders. 
                Visualize success, manage risk, and master your psychology.
              </p>
              <div className="flex space-x-4 text-slate-400">
                <FaGlobe className="hover:text-white cursor-pointer" />
                <FaUsers className="hover:text-white cursor-pointer" />
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6">Product</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="/#features" className="hover:text-emerald-400 transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-emerald-400 transition-colors">Pricing</Link></li>
                <li><Link href="/register" className="hover:text-emerald-400 transition-colors">Get Started</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6">Company</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link></li>
                <li><Link href="/support" className="hover:text-emerald-400 transition-colors">Support</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} TradeTaper Inc. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
               <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
               <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
               <Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}