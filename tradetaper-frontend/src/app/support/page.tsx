"use client";

import React from 'react';
import Link from 'next/link';
import { FaSearch, FaBook, FaYoutube, FaHeadset, FaTerminal } from 'react-icons/fa';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30 font-sans relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_50%)]"></div>

      <nav className="relative z-50 p-6 flex justify-between items-center max-w-7xl mx-auto border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
         <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
            TradeTaper <span className="text-white font-light opacity-50">Docs</span>
         </Link>
         <Link href="/" className="text-slate-400 hover:text-white transition-colors">Back to App</Link>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
         {/* Search Hero */}
         <div className="text-center max-w-3xl mx-auto mb-20">
             <h1 className="text-4xl md:text-5xl font-bold mb-6">How can we help you?</h1>
             <div className="relative group">
                 <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-2xl group-hover:bg-emerald-500/30 transition-all duration-500"></div>
                 <div className="relative bg-slate-900 border border-emerald-500/30 rounded-2xl p-2 flex items-center shadow-2xl">
                     <FaSearch className="text-slate-400 ml-4 text-xl" />
                     <input 
                        type="text" 
                        placeholder="Search for answers (e.g., 'How to connect MetaTrader')"
                        className="w-full bg-transparent border-none text-white px-4 py-3 text-lg focus:ring-0 placeholder:text-slate-500"
                     />
                     <span className="hidden md:inline-block bg-slate-800 text-slate-400 px-3 py-1 rounded text-xs font-mono mr-2 border border-white/10">CMD + K</span>
                 </div>
             </div>
         </div>

         {/* Categories */}
         <div className="grid md:grid-cols-3 gap-6 mb-20">
             {[
                 { icon: FaBook, title: "Getting Started", desc: "Quick start guides and account setup" },
                 { icon: FaTerminal, title: "API Reference", desc: "For developers and algo traders" },
                 { icon: FaYoutube, title: "Video Tutorials", desc: "Watch walkthroughs and masterclasses" },
             ].map((cat, i) => (
                 <div key={i} className="glass-card p-6 rounded-xl hover:bg-slate-800/50 cursor-pointer group">
                     <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                         <cat.icon className="text-emerald-400 text-xl" />
                     </div>
                     <h3 className="text-xl font-bold text-white mb-2">{cat.title}</h3>
                     <p className="text-slate-400 text-sm">{cat.desc}</p>
                 </div>
             ))}
         </div>

         {/* Frequent Articles */}
         <div className="grid md:grid-cols-2 gap-12">
             <div>
                 <h2 className="text-2xl font-bold mb-6">Popular Articles</h2>
                 <ul className="space-y-4">
                     {["Connecting your Broker Account", "Understanding the Risk Matrix", "Exporting Tax Reports", "Setting up 2FA Security"].map((item, i) => (
                         <li key={i} className="flex items-center group cursor-pointer">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-4 group-hover:scale-150 transition-transform"></div>
                             <span className="text-slate-300 group-hover:text-emerald-400 transition-colors">{item}</span>
                         </li>
                     ))}
                 </ul>
             </div>

             <div className="glass-card p-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                 <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                     <FaHeadset /> Still need help?
                 </h3>
                 <p className="text-slate-400 mb-6">Our support team is available 24/7 for Enterprise customers and during business hours for other tiers.</p>
                 <Link href="/contact" className="btn-3d btn-secondary-3d inline-block w-full text-center">
                     Contact Support
                 </Link>
             </div>
         </div>
      </div>
    </div>
  );
}