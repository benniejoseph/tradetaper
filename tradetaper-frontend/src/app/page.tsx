// src/app/page.tsx
"use client"; // This component needs to be a client component for useEffect and useState

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { PRICING_TIERS } from '@/config/pricing';
import { 
  FaChartLine, 
  FaFileExport, 
  FaArrowRight, 
  FaCheck, 
  FaStar,
  FaBullseye,
  FaBook,
  FaCalendarAlt,
  FaChartPie,
  FaBalanceScale,
  FaEye,
  FaRocket,
  FaCrown
} from 'react-icons/fa';

const FeatureCard = ({ icon: Icon, title, description, gradient }: {
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  title: string;
  description: string;
  gradient: string;
}) => (
  <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700">
    <div className={`w-16 h-16 rounded-xl ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
      <Icon className="text-2xl text-white" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-green-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
  </div>
);

const TestimonialCard = ({ name, title, content, rating }: {
  name: string;
  title: string;
  content: string;
  rating: number;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
    <div className="flex items-center mb-4">
      {[...Array(rating)].map((_, i) => (
        <FaStar key={i} className="text-yellow-400 text-sm" />
      ))}
    </div>
    <p className="text-gray-600 dark:text-gray-300 mb-6 italic leading-relaxed">&quot;{content}&quot;</p>
    <div className="flex items-center">
      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
        {name.charAt(0)}
      </div>
      <div className="ml-4">
        <h4 className="font-semibold text-gray-900 dark:text-white">{name}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      </div>
    </div>
  </div>
);

const AnimatedCounter = ({ target, label }: { target: number; label: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const increment = target / 100;
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev < target) {
          return Math.min(prev + increment, target);
        }
        clearInterval(timer);
        return target;
      });
    }, 20);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-white mb-2">
        {Math.floor(count).toLocaleString()}+
      </div>
      <div className="text-blue-100 text-sm uppercase tracking-wide">{label}</div>
    </div>
  );
};

export default function LandingPage() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: FaBook,
      title: "Trading Journal",
      description: "Log and track every trade with detailed entries, notes, and performance metrics.",
      gradient: "bg-gradient-to-r from-blue-500 to-blue-600"
    },
    {
      icon: FaChartPie,
      title: "Performance Analytics",
      description: "Deep insights into your trading performance with advanced charts and statistics.",
      gradient: "bg-gradient-to-r from-green-500 to-green-600"
    },
    {
      icon: FaCalendarAlt,
      title: "Calendar View",
      description: "Visualize your trading activity and P&L across time with our interactive calendar.",
      gradient: "bg-gradient-to-r from-purple-500 to-purple-600"
    },
    {
      icon: FaBalanceScale,
      title: "Daily Balances",
      description: "Track your account balance changes and equity curve progression over time.",
      gradient: "bg-gradient-to-r from-orange-500 to-orange-600"
    },
    {
      icon: FaBullseye,
      title: "Risk Management",
      description: "Calculate R-multiples, risk-reward ratios, and position sizing for better risk control.",
      gradient: "bg-gradient-to-r from-red-500 to-red-600"
    },
    {
      icon: FaFileExport,
      title: "Export & Reports",
      description: "Generate comprehensive reports and export your data for tax purposes or analysis.",
      gradient: "bg-gradient-to-r from-indigo-500 to-indigo-600"
    }
  ];

  const testimonials = [
    {
      name: "Alex Rodriguez",
      title: "Professional Day Trader",
      content: "TradeTaper transformed how I analyze my trades. The detailed analytics helped me identify patterns and improve my win rate by 15%.",
      rating: 5
    },
    {
      name: "Sarah Chen",
      title: "Forex Trader",
      content: "Finally, a trading journal that actually makes sense. The calendar view and daily balance tracking are game-changers for my workflow.",
      rating: 5
    },
    {
      name: "Michael Thompson",
      title: "Swing Trader",
      content: "The export features and detailed reporting make tax season a breeze. Plus, the performance insights are incredibly valuable.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <FaChartLine className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mr-2" />
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
                  TradeTaper
                </span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4 lg:space-x-8">
                <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors">Features</a>
                <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors">Testimonials</a>
                <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors">Pricing</a>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/login" className="text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="text-sm sm:text-base bg-gradient-to-r from-blue-500 to-green-500 text-white px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg hover:from-blue-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
              Your Trading Journey
              <span className="bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent block">
                Starts Here
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              The most advanced trading journal for serious traders. Track, analyze, and optimize your trading performance with professional-grade tools and insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/register" className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-2xl">
                Start Free Trial
                <FaArrowRight className="ml-2 inline" />
              </Link>
              <button className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl text-lg font-semibold hover:border-blue-500 hover:text-blue-500 transition-all duration-300">
                Watch Demo
                <FaEye className="ml-2 inline" />
              </button>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 md:p-12 shadow-2xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <AnimatedCounter target={10000} label="Active Traders" />
                <AnimatedCounter target={500000} label="Trades Logged" />
                <AnimatedCounter target={25} label="Countries" />
                <AnimatedCounter target={99} label="Uptime %" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Powerful Features for
              <span className="bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent"> Pro Traders</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Everything you need to track, analyze, and improve your trading performance in one comprehensive platform.
        </p>
      </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Trusted by Thousands of
              <span className="bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent"> Successful Traders</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Simple, Transparent
              <span className="bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent"> Pricing</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Start for free, scale as you grow</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {PRICING_TIERS.map((tier) => (
              <div 
                key={tier.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border ${
                  tier.recommended 
                    ? 'border-blue-500 dark:border-blue-400 transform scale-105 relative' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {tier.recommended && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                  <FaCrown className="mr-1" />
                  Most Popular
                </span>
              </div>
                )}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{tier.name}</h3>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                    {tier.price === 0 ? (
                      'Free'
                    ) : (
                      <>
                        ${tier.price}<span className="text-lg">/{tier.interval}</span>
                      </>
                    )}
                </div>
                  <ul className="space-y-4 mb-8 text-left">
                    {tier.features.slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-start text-gray-600 dark:text-gray-300">
                        <FaCheck className="text-green-500 mr-3 mt-1 flex-shrink-0" />
                        <span>{feature}</span>
                  </li>
                    ))}
                </ul>
                  <Link 
                    href="/register" 
                    className={`w-full py-3 rounded-lg font-semibold transition-colors block text-center ${
                      tier.recommended 
                        ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white hover:from-blue-600 hover:to-green-600' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {tier.price === 0 ? 'Get Started' : 'Start Free Trial'}
                </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of successful traders who trust TradeTaper to track and improve their performance.
          </p>
          <Link href="/register" className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-2xl inline-flex items-center">
            Start Your Free Trial
            <FaRocket className="ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <FaChartLine className="h-8 w-8 text-blue-500 mr-2" />
                <span className="text-2xl font-bold">TradeTaper</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                The most advanced trading journal for serious traders. Track, analyze, and optimize your trading performance.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TradeTaper. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
  );
}