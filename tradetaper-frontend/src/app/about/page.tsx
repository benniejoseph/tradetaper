"use client";

import React from 'react';
import Link from 'next/link';
import { FaRocket, FaCode, FaChartLine, FaGlobe } from 'react-icons/fa';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30 font-sans overflow-hidden">
      {/* Background FX */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-teal-500/5 rounded-full blur-[100px]"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]"></div>
      </div>

      <nav className="relative z-50 p-6 flex justify-between items-center max-w-7xl mx-auto">
         <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
            TradeTaper
         </Link>
         <Link href="/" className="text-slate-400 hover:text-white transition-colors">Back to Home</Link>
      </nav>

      {/* Hero */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-32 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
           Bridging the Gap Between <br/>
           <span className="text-gradient-emerald">Data & Discipline</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-12">
            We are building the world's most advanced trading journal, powered by neural networks and designed for the modern trader who demands precision.
        </p> 
        <div className="h-1 w-24 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mx-auto"></div>
      </div>

      {/* Mission Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
                <div className="glass-card p-8 rounded-2xl border-l-4 border-l-emerald-500">
                    <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                        <FaRocket className="text-emerald-400" /> Our Mission
                    </h3>
                    <p className="text-slate-400 leading-relaxed">
                        To empower 1 million traders with institutional-grade analytics and AI-driven psychological insights, removing the noise and focusing on what truly drives profitability.
                    </p>
                </div>
                <div className="glass-card p-8 rounded-2xl border-l-4 border-l-teal-500">
                    <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                        <FaCode className="text-teal-400" /> The Tech
                    </h3>
                    <p className="text-slate-400 leading-relaxed">
                        Built on a high-performance Next.js core with Python-based AI microservices. We use advanced pattern recognition to analyze historic trade data and predict future pitfalls.
                    </p>
                </div>
            </div>
            
            {/* 3D Visual or Image Placeholder */}
            <div className="relative group perspective-1000">
                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl transform rotate-3 scale-90 rounded-full"></div>
                <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-8 transform transition-transform duration-700 hover:rotate-y-12 shadow-2xl">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 rounded-lg p-4 h-32 animate-pulse"></div>
                        <div className="bg-slate-800/50 rounded-lg p-4 h-32 animate-pulse delay-100"></div>
                        <div className="col-span-2 bg-slate-800/50 rounded-lg p-4 h-40 animate-pulse delay-200"></div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Stats / Team */}
      <div className="relative z-10 bg-slate-900/30 border-y border-white/5 py-24">
          <div className="max-w-7xl mx-auto px-6 text-center">
              <h2 className="text-3xl font-bold mb-16">Built by Traders, for Traders</h2>
              <div className="grid md:grid-cols-3 gap-8">
                  {[
                      { icon: FaGlobe, title: "Global Reach", val: "150+ Countries" },
                      { icon: FaChartLine, title: "Trades Analyzed", val: "10M+" },
                      { icon: FaCode, title: "Code Commits", val: "50k+" },
                  ].map((stat, i) => (
                      <div key={i} className="glass-card p-8 rounded-xl text-center">
                          <stat.icon className="text-4xl text-emerald-500 mx-auto mb-4" />
                          <div className="text-3xl font-bold text-white mb-2">{stat.val}</div>
                          <div className="text-slate-500 uppercase text-sm font-bold tracking-wider">{stat.title}</div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
      
       {/* Footer */}
       <footer className="py-12 text-center text-slate-500 text-sm relative z-10">
        <p>&copy; {new Date().getFullYear()} TradeTaper. All rights reserved.</p>
      </footer>
    </div>
  );
}
