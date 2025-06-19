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
  FaFileExport, 
  FaArrowRight, 
  FaCheck, 
  FaStar,
  FaBullseye,
  FaBook,
  FaCalendarAlt,
  FaChartPie,
  FaBalanceScale,
  FaRocket,
  FaCrown,
  FaPlay,
  FaBolt,
  FaFire,
  FaGem,
  FaShieldAlt,
  FaUsers,
  FaGlobe,
  FaCog
} from 'react-icons/fa';

const FloatingParticle = ({ delay = 0, duration = 20 }: { delay?: number; duration?: number }) => (
  <div 
    className="absolute opacity-20"
    style={{
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`
    }}
  >
    <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
  </div>
);

const MorphingShape = ({ className }: { className?: string }) => (
  <div className={`absolute ${className}`}>
    <div className="w-96 h-96 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl animate-ping"></div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, gradient, delay = 0 }: {
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  title: string;
  description: string;
  gradient: string;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div 
      ref={cardRef}
      className={`group relative bg-white/[0.02] backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl 
                 transition-all duration-700 transform hover:scale-105 hover:rotate-1 
                 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className={`w-20 h-20 rounded-2xl ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-xl`}>
        <Icon className="text-3xl text-white" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 transition-all duration-300">{title}</h3>
      <p className="text-slate-300 leading-relaxed group-hover:text-white transition-colors duration-300">{description}</p>
      <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-ping"></div>
    </div>
  );
};

const TestimonialCard = ({ name, title, content, rating, delay = 0 }: {
  name: string;
  title: string;
  content: string;
  rating: number;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div 
      ref={cardRef}
      className={`group bg-white/[0.03] backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl
                 transition-all duration-700 hover:scale-105 hover:-rotate-1
                 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="flex items-center mb-6">
        {[...Array(rating)].map((_, i) => (
          <FaStar key={i} className="text-yellow-400 text-lg mr-1 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      <p className="text-slate-300 mb-8 italic text-lg leading-relaxed group-hover:text-white transition-colors duration-300">&quot;{content}&quot;</p>
      <div className="flex items-center">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
          {name.charAt(0)}
        </div>
        <div className="ml-4">
          <h4 className="font-bold text-xl text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 transition-all duration-300">{name}</h4>
          <p className="text-slate-400 group-hover:text-slate-300 transition-colors duration-300">{title}</p>
        </div>
      </div>
    </div>
  );
};

const AnimatedCounter = ({ target, label, symbol = "+", duration = 2000 }: { 
  target: number; 
  label: string; 
  symbol?: string;
  duration?: number;
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const counterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev < target) {
          return Math.min(prev + increment, target);
        }
        clearInterval(timer);
        return target;
      });
    }, 16);

    return () => clearInterval(timer);
  }, [isVisible, target, duration]);

  return (
    <div ref={counterRef} className="text-center group">
      <div className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200 mb-2 group-hover:scale-110 transition-transform duration-300">
        {Math.floor(count).toLocaleString()}{symbol}
      </div>
      <div className="text-blue-100 text-sm uppercase tracking-wider font-semibold">{label}</div>
    </div>
  );
};

const HeroAnimation = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated background elements */}
      <MorphingShape className="-top-1/2 -left-1/2" />
      <MorphingShape className="-bottom-1/2 -right-1/2" />
      <MorphingShape className="top-1/4 left-1/3" />
      
      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <FloatingParticle key={i} delay={i * 0.5} duration={15 + Math.random() * 10} />
      ))}
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px] animate-pulse"></div>
    </div>
  );
};

const GlowingButton = ({ children, href, variant = "primary", className = "", ...props }: {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary";
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}) => {
  const baseClasses = "relative group px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95";
  const variants = {
    primary: "bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white shadow-2xl hover:shadow-purple-500/25",
    secondary: "bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
  };

  const content = (
    <>
      <span className="relative z-10 flex items-center justify-center">
        {children}
      </span>
      {variant === "primary" && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 opacity-75 blur-xl group-hover:opacity-100 transition-opacity duration-300"></div>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {content}
    </button>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-purple-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 opacity-20 animate-ping"></div>
          </div>
          <p className="text-white text-xl font-semibold">Launching your trading dashboard...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: FaBook,
      title: "Neural Trading Journal",
      description: "AI-powered trade logging with smart pattern recognition and predictive insights that learn from your trading behavior.",
      gradient: "bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"
    },
    {
      icon: FaChartPie,
      title: "Quantum Analytics Engine",
      description: "Revolutionary performance metrics with multi-dimensional analysis, fractal risk assessment, and probability matrices.",
      gradient: "bg-gradient-to-br from-green-500 via-teal-500 to-blue-500"
    },
    {
      icon: FaCalendarAlt,
      title: "Time-Space Calendar",
      description: "4D visualization of your trading timeline with heat maps, time-based correlations, and temporal success patterns.",
      gradient: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500"
    },
    {
      icon: FaBalanceScale,
      title: "Holographic Risk Matrix",
      description: "Advanced risk visualization with 3D portfolio modeling, stress testing, and real-time exposure monitoring.",
      gradient: "bg-gradient-to-br from-orange-500 via-red-500 to-pink-500"
    },
    {
      icon: FaBullseye,
      title: "Precision Targeting System",
      description: "Laser-focused goal tracking with milestone achievements, performance trajectories, and success probability algorithms.",
      gradient: "bg-gradient-to-br from-red-500 via-purple-500 to-blue-500"
    },
    {
      icon: FaFileExport,
      title: "Dimensional Reports",
      description: "Multi-layered reporting system with tax optimization, compliance automation, and regulatory intelligence.",
      gradient: "bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500"
    }
  ];

  const testimonials = [
    {
      name: "Alexandra Chen",
      title: "Quantum Trader & AI Researcher",
      content: "TradeTaper's neural engine identified patterns in my trading I never knew existed. My performance improved 340% in just 6 months. It's like having a crystal ball for trading.",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      title: "Algorithmic Trading Pioneer",
      content: "The holographic risk matrix revolutionized my portfolio management. I can now visualize correlations in ways that seemed impossible before. This is the future of trading.",
      rating: 5
    },
    {
      name: "Dr. Sarah Kim",
      title: "Quantitative Finance Director",
      content: "The precision targeting system helped me achieve my annual goals in just 4 months. The predictive analytics are so accurate, it feels like trading from the future.",
      rating: 5
    }
  ];

  const stats = [
    { target: 50000, label: "Neural Traders", symbol: "+" },
    { target: 2500000, label: "Quantum Trades", symbol: "+" },
    { target: 847, label: "Success Rate", symbol: "%" },
    { target: 99.9, label: "Uptime", symbol: "%" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/20 backdrop-blur-2xl border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center group">
              <div className="relative">
                <FaChartLine className="h-10 w-10 text-purple-400 mr-3 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                <div className="absolute inset-0 bg-purple-400 rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                TradeTaper
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors relative group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#testimonials" className="text-slate-300 hover:text-white transition-colors relative group">
                Testimonials
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#pricing" className="text-slate-300 hover:text-white transition-colors relative group">
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 group-hover:w-full transition-all duration-300"></span>
              </a>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-slate-300 hover:text-white transition-colors font-medium">
                Neural Login
              </Link>
              <GlowingButton href="/register">
                Start Quantum Trading
                <FaRocket className="ml-2" />
              </GlowingButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
        <HeroAnimation />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 animate-pulse">
                Trade Beyond
              </span>
              <br />
              <span className="text-white">
                Reality
              </span>
            </h1>
            <p className="text-2xl md:text-3xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Enter the quantum dimension of trading with AI-powered insights, holographic analytics, and neural pattern recognition that transcends traditional market analysis.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
            <GlowingButton href="/register" className="text-xl px-12 py-6">
              <FaBolt className="mr-3" />
              Launch Neural Mode
              <FaArrowRight className="ml-3" />
            </GlowingButton>
            <GlowingButton variant="secondary" className="text-xl px-12 py-6">
              <FaPlay className="mr-3" />
              Experience Demo
            </GlowingButton>
          </div>

          {/* Quantum Stats */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-black/30 backdrop-blur-2xl rounded-3xl p-8 md:p-16 border border-white/10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <AnimatedCounter 
                    key={index}
                    target={stat.target} 
                    label={stat.label} 
                    symbol={stat.symbol}
                    duration={2000 + index * 200}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-purple-900/50"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-bold mb-8">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400">
                Quantum Features
              </span>
              <br />
              <span className="text-white">Beyond Imagination</span>
            </h2>
            <p className="text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
              Revolutionary trading tools that harness the power of quantum computing, neural networks, and multidimensional analytics.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard 
                key={index} 
                {...feature} 
                delay={index * 200}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-blue-900/30"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,119,198,0.1),transparent)] "></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-bold mb-8">
              <span className="text-white">Trusted by</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400">
                Quantum Pioneers
              </span>
            </h2>
            <p className="text-2xl text-slate-300">Revolutionizing trading across dimensions</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard 
                key={index} 
                {...testimonial} 
                delay={index * 200}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-slate-900/50"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-bold mb-8">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-400 to-purple-400">
                Quantum Pricing
              </span>
              <br />
              <span className="text-white">Choose Your Dimension</span>
            </h2>
            <p className="text-2xl text-slate-300">Unlock the multiverse of trading possibilities</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {PRICING_TIERS.map((tier) => (
              <div 
                key={tier.id}
                className={`relative group bg-black/30 backdrop-blur-2xl rounded-3xl p-8 border transition-all duration-500 hover:scale-105 ${
                  tier.recommended 
                    ? 'border-purple-500 shadow-2xl shadow-purple-500/25 transform scale-105' 
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                {tier.recommended && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-6 py-2 rounded-full text-sm font-bold flex items-center shadow-xl">
                      <FaCrown className="mr-2" />
                      Quantum Choice
                    </div>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10 text-center">
                  <h3 className="text-2xl font-bold text-white mb-6 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 transition-all duration-300">
                    {tier.name}
                  </h3>
                  <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 mb-8">
                    {tier.price === 0 ? (
                      'Free'
                    ) : (
                      <>
                        ${tier.price}<span className="text-2xl">/{tier.interval}</span>
                      </>
                    )}
                  </div>
                  
                  <ul className="space-y-4 mb-10 text-left">
                    {tier.features.slice(0, 5).map((feature, i) => (
                      <li key={i} className="flex items-start text-slate-300 group-hover:text-white transition-colors duration-300">
                        <FaCheck className="text-green-400 mr-3 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <GlowingButton 
                    href="/register" 
                    variant={tier.recommended ? "primary" : "secondary"}
                    className="w-full"
                  >
                    {tier.price === 0 ? 'Start Free Journey' : 'Begin Quantum Trial'}
                  </GlowingButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/80 via-blue-600/80 to-cyan-600/80"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Ready to Trade in the
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300"> Quantum Realm?</span>
          </h2>
          <p className="text-2xl text-blue-100 mb-12 leading-relaxed">
            Join the neural revolution and transcend the boundaries of traditional trading with AI-powered quantum analytics.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <GlowingButton href="/register" className="text-2xl px-16 py-8">
              <FaFire className="mr-3" />
              Activate Neural Mode
              <FaBolt className="ml-3" />
            </GlowingButton>
            <GlowingButton variant="secondary" className="text-2xl px-16 py-8">
              <FaGem className="mr-3" />
              Explore Quantum Demo
            </GlowingButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-black/50 backdrop-blur-2xl border-t border-white/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6 group">
                <FaChartLine className="h-10 w-10 text-purple-400 mr-3 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">TradeTaper</span>
              </div>
              <p className="text-slate-300 mb-6 text-lg leading-relaxed max-w-md">
                Transcending traditional trading with quantum analytics, neural pattern recognition, and multidimensional insights.
              </p>
              <div className="flex space-x-4">
                {[FaGlobe, FaUsers, FaShieldAlt, FaCog].map((Icon, index) => (
                  <div key={index} className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors duration-300 cursor-pointer group">
                    <Icon className="text-slate-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-bold text-xl text-white mb-6">Quantum Features</h3>
              <ul className="space-y-3 text-slate-300">
                <li><a href="#features" className="hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Neural Analytics</a></li>
                <li><a href="#features" className="hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Holographic Charts</a></li>
                <li><a href="#features" className="hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">AI Predictions</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Quantum Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-xl text-white mb-6">Neural Network</h3>
              <ul className="space-y-3 text-slate-300">
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Quantum Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Neural Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Privacy Matrix</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Terms Quantum</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-16 pt-8 text-center">
            <p className="text-slate-400 text-lg">
              © 2024 TradeTaper. Transcending reality through quantum trading technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}