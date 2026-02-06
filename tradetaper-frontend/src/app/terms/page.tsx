"use client";

import React from 'react';
import Link from 'next/link';
import { FaFileContract, FaArrowLeft, FaBalanceScale, FaExclamationTriangle, FaUserCog, FaGavel } from 'react-icons/fa';

export default function TermsPage() {
  const sections = [
    {
      icon: FaUserCog,
      title: "Account Registration",
      content: "By creating an account, you agree to provide accurate, current, and complete information. You are solely responsible for safeguarding your password and for all activities that occur under your account."
    },
    {
      icon: FaBalanceScale,
      title: "Usage Guidelines",
      content: "You agree not to misuse our services. This includes not interfering with our platform's normal operation, not attempting to access it using a method other than the interface and instructions we provide."
    },
    {
      icon: FaExclamationTriangle,
      title: "Trading Risks",
      content: "Trading financial markets involves a high level of risk and may not be suitable for all investors. You acknowledge that TradeTaper is a journaling tool and not a financial advisor. We are not responsible for any trading losses."
    },
    {
      icon: FaGavel,
      title: "Termination",
      content: "We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-white relative overflow-hidden">
      {/* 3D Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px] animate-float"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] animate-float delay-1000"></div>
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] opacity-20"></div>
      </div>

      <div className="container mx-auto px-6 py-12 relative z-10">
        <Link 
          href="/" 
          className="inline-flex items-center space-x-2 text-slate-400 hover:text-white transition-colors mb-12 group"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-emerald-500/50 transition-all">
            <FaArrowLeft className="text-sm group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <span>Back to Home</span>
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6 animate-float">
              <FaFileContract className="text-3xl text-emerald-400" />
            </div>
            <h1 className="text-5xl font-bold mb-6">
              Terms of <span className="text-gradient-emerald">Service</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Please read these terms carefully before using our platform. Your agreement to these terms is required to use TradeTaper.
            </p>
          </div>

          <div className="space-y-8">
            <div className="glass-card p-8 md:p-10 rounded-3xl relative overflow-hidden">
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative z-10 space-y-12">
                <div className="border-b border-white/5 pb-8">
                  <p className="text-slate-300 leading-relaxed text-lg">
                    Effective Date: <span className="text-white font-semibold">January 1, 2026</span>
                  </p>
                  <p className="text-slate-300 leading-relaxed mt-4">
                    Welcome to TradeTaper. These Terms of Service ("Terms") govern your access to and use of our website, services, and applications.
                  </p>
                </div>

                {sections.map((section, index) => (
                  <div key={index} className="flex gap-6 group">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-900/50 flex items-center justify-center border border-white/10 group-hover:border-emerald-500/50 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.1)] transition-all duration-300">
                        <section.icon className="text-xl text-slate-400 group-hover:text-emerald-400 transition-colors" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                        {section.title}
                      </h3>
                      <p className="text-slate-400 leading-relaxed">
                        {section.content}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="mt-12 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                    <h3 className="text-lg font-bold text-emerald-400 mb-2 flex items-center gap-2">
                        <FaExclamationTriangle /> Disclaimer
                    </h3>
                    <p className="text-sm text-slate-400">
                        TradeTaper does not provide financial advice. All information and tools provided are for educational and journaling purposes only. You are solely responsible for your trading decisions.
                    </p>
                </div>
              </div>
            </div>

            <div className="text-center text-slate-500 text-sm mt-12">
              <p>
                Need clarification? <Link href="/contact" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">Contact our Legal Team</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
