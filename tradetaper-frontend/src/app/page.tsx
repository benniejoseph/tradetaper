// src/app/page.tsx
"use client";

import React, { useEffect, Suspense } from 'react';
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
  FaBrain,
  FaShieldAlt,
  FaLaptopCode,
  FaGem,
  FaUsers,
  FaGlobe,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import HeroGlobe from '@/components/landing/HeroGlobe';

/**
 * 3D Card Component with Glassmorphism
 */
const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="group relative p-8 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-500 overflow-hidden">
    {/* Hover Glow */}
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-purple-500/5 transition-all duration-500"></div>
    
    <div className="relative z-10">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-emerald-500/5">
        <Icon className="text-2xl text-emerald-400 group-hover:text-emerald-300 transition-colors" />
      </div>
      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-emerald-200 transition-all">{title}</h3>
      <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);

export default function LandingPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Redirect if logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Loading State for Auth Check
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-emerald-400 font-medium">Initializing Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30 overflow-x-hidden">
      
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full bg-black/50 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group z-50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all">
              <FaChartLine className="text-white text-lg" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              TradeTaper
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            {['Features', 'Pricing', 'Testimonials'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors hover:bg-white/5 rounded-lg"
              >
                {item}
              </a>
            ))}
          </div>

            {/* Auth Buttons & Mobile Toggle */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <Link 
                href="/login"
                className="px-5 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link 
                href="/register"
                className="px-5 py-2 text-sm font-bold bg-white text-black rounded-lg hover:bg-emerald-50 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
             <button 
              className="md:hidden text-neutral-300 hover:text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-black/95 border-b border-white/10 p-6 flex flex-col space-y-4 shadow-2xl animate-fade-in-down">
             {['Features', 'Pricing', 'Testimonials'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                className="text-lg font-medium text-slate-300 hover:text-emerald-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item}
              </a>
            ))}
            <div className="h-px bg-white/10 my-2"></div>
             <Link 
                href="/login"
                className="block text-center py-3 text-slate-300 border border-white/10 rounded-lg hover:bg-white/5"
              >
                Log In
              </Link>
              <Link 
                href="/register"
                className="block text-center py-3 font-bold bg-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-900/50"
              >
                Get Started
              </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden min-h-screen flex flex-col justify-center">
        {/* 3D Background */}
        <div className="absolute inset-0">
           <Suspense fallback={null}>
             <HeroGlobe />
           </Suspense>
        </div>
        
        {/* Gradient Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/50 to-black z-0 pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-6 text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-medium mb-8 backdrop-blur-md animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            AI-Powered Trading Journal v2.0
          </div>
          
          <h1 className="text-5xl md:text-8xl font-bold tracking-tight mb-8 leading-tight">
            Trade with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-white animate-text-shimmer">
              Digital Precision
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            Evolve your edge with institutional-grade analytics, 
            <span className="text-white font-medium"> AI-driven insights</span>, and 
            <span className="text-white font-medium"> immersive visualization</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/register"
              className="group relative px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-emerald-50 transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-2 overflow-hidden"
            >
              <span className="relative z-10">Start Free Trial</span>
              <FaRocket className="relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-200 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            <Link 
              href="/demo"
              className="px-8 py-4 rounded-full border border-white/20 text-white font-medium hover:bg-white/10 transition-all backdrop-blur-md flex items-center gap-2"
            >
              Live Demo <FaArrowRight />
            </Link>
          </div>

          {/* 3D Dashboard Preview Hero Image */}
          <div className="mt-24 relative mx-auto max-w-6xl perspective-1000 group">
             <div className="relative transform-style-3d rotate-x-6 group-hover:rotate-x-0 transition-transform duration-1000 ease-out">
                {/* Glow Effect behind image */}
                <div className="absolute -inset-10 bg-emerald-500/10 rounded-[3rem] blur-3xl opacity-50 animate-pulse-slow"></div>
                
                {/* Mockup Container */}
                <div className="relative bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/20">
                  {/* Window Controls */}
                  <div className="h-10 bg-black/50 backdrop-blur-xl flex items-center px-4 space-x-2 border-b border-white/5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    <div className="ml-4 px-3 py-1 bg-white/5 rounded-md text-[10px] text-slate-500 font-mono">tradetaper.com/dashboard</div>
                  </div>
                  
                  {/* Content Placeholder (Eventually Real Screenshot) */}
                  <div className="aspect-[16/9] bg-black relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(16,185,129,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[shimmer_8s_infinite]"></div>
                    <div className="text-center z-10">
                        <FaChartLine className="text-7xl text-white/5 mx-auto mb-6" />
                        <p className="text-emerald-500 font-mono text-sm tracking-widest uppercase">System Operational</p>
                    </div>
                    {/* Overlay Grid lines for tech feel */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(255,255,255,0.03)_25%,rgba(255,255,255,0.03)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.03)_75%,rgba(255,255,255,0.03)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,255,255,0.03)_25%,rgba(255,255,255,0.03)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.03)_75%,rgba(255,255,255,0.03)_76%,transparent_77%,transparent)] bg-[length:50px_50px]"></div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Stats Section with Glassmorphism */}
      <section className="py-24 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: 'Active Traders', value: '10,000+' },
              { label: 'Trades Logged', value: '2.5M+' },
              { label: 'Strategies', value: '500+' },
              { label: 'Processing', value: '1.2B Ops' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center group">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors duration-500">{stat.value}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] group-hover:text-emerald-500/70 transition-colors">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-3xl md:text-6xl font-bold mb-8">
              Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Performance</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
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

      {/* Pricing Section */}
      <section id="pricing" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Transparent <span className="text-emerald-400">Pricing</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Start for free, upgrade as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {PRICING_TIERS.map((tier) => (
              <div 
                key={tier.id}
                className={`relative rounded-[2.5rem] p-10 border backdrop-blur-xl transition-all duration-500 flex flex-col group
                  ${tier.recommended 
                    ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-black border-emerald-500/50 shadow-2xl shadow-emerald-900/20 scale-105 z-10' 
                    : 'bg-black/40 border-white/5 hover:bg-white/5 hover:border-white/10'}`}
              >
                 {/* Glow Effect on Hover */}
                 <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                {tier.recommended && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold px-6 py-2 rounded-full text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                    Most Popular
                  </div>
                )}
                
                <h3 className="text-xl font-medium text-white mb-2">{tier.name}</h3>
                <div className="flex items-baseline mb-8 gap-1">
                  <span className="text-6xl font-bold text-white tracking-tighter">${tier.price}</span>
                  <span className="text-slate-500 text-lg font-medium">/{tier.interval || 'mo'}</span>
                </div>
                <p className="text-slate-400 text-sm mb-10 leading-relaxed font-light h-10">{tier.description}</p>
                
                <ul className="space-y-5 mb-12 flex-grow">
                  {tier.features.slice(0, 8).map((feature: string, idx: number) => (
                     <li key={idx} className="flex items-start gap-4">
                        <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                             <FaCheck className="text-[10px] text-emerald-400" />
                        </div>
                       <span className="text-neutral-400 text-sm">{feature}</span>
                     </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`block w-full py-4 rounded-xl font-bold text-center transition-all duration-300 ${
                    tier.recommended 
                      ? 'bg-white text-black hover:bg-emerald-50 hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/5'
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
      <footer className="bg-black pt-24 pb-12 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2">
               <Link href="/" className="flex items-center space-x-3 mb-8">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                  <FaChartLine className="text-white text-sm" />
                </div>
                <span className="text-xl font-bold text-white">TradeTaper</span>
              </Link>
              <p className="text-slate-400 max-w-sm mb-8 leading-relaxed">
                The most advanced trading journal platform for modern traders. 
                Visualize success, manage risk, and master your psychology.
              </p>
              <div className="flex space-x-6 text-slate-500">
                <FaGlobe className="hover:text-emerald-400 cursor-pointer transition-colors text-xl" />
                <FaUsers className="hover:text-emerald-400 cursor-pointer transition-colors text-xl" />
                <FaBrain className="hover:text-emerald-400 cursor-pointer transition-colors text-xl" />
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-8">Product</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><Link href="/#features" className="hover:text-emerald-400 transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-emerald-400 transition-colors">Pricing</Link></li>
                <li><Link href="/register" className="hover:text-emerald-400 transition-colors">Get Started</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-8">Company</h4>
              <ul className="space-y-4 text-sm text-slate-400">
                <li><Link href="/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link></li>
                <li><Link href="/support" className="hover:text-emerald-400 transition-colors">Support</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-sm text-slate-600">
            <p>&copy; {new Date().getFullYear()} TradeTaper Inc. All rights reserved.</p>
            <div className="flex space-x-8 mt-6 md:mt-0">
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