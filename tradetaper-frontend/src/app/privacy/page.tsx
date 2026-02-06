"use client";

import React from 'react';
import Link from 'next/link';
import { FaShieldAlt, FaArrowLeft, FaLock, FaUserSecret, FaServer, FaCookie } from 'react-icons/fa';

export default function PrivacyPage() {
  const sections = [
    {
      icon: FaUserSecret,
      title: "Information We Collect",
      content: "We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us. This includes your name, email address, and any trading data you choose to log in our system."
    },
    {
      icon: FaLock,
      title: "How We Use Your Data",
      content: "We use your information to provide, maintain, and improve our services. We do NOT share your personal trading strategies or data with third parties. Your trading journal is private and encrypted."
    },
    {
      icon: FaServer,
      title: "Data Security",
      content: "We implement enterprise-grade security measures to protect your personal information. We use industry-standard encryption protocols (SSL/TLS) for data transmission and secure storage for your sensitive data."
    },
    {
      icon: FaCookie,
      title: "Cookies & Tracking",
      content: "We use cookies to improve your experience and analyze how our services are used. You can control cookies through your browser settings."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-white relative overflow-hidden">
      {/* 3D Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px] animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[100px] animate-float delay-1000"></div>
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
              <FaShieldAlt className="text-3xl text-emerald-400" />
            </div>
            <h1 className="text-5xl font-bold mb-6">
              Privacy <span className="text-gradient-emerald">Policy</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Your privacy is our priority. We are committed to protecting your personal data and trading information.
            </p>
          </div>

          <div className="space-y-8">
            <div className="glass-card p-8 md:p-10 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10 space-y-12">
                <div className="border-b border-white/5 pb-8">
                  <p className="text-slate-300 leading-relaxed text-lg">
                    Last updated: <span className="text-white font-semibold">January 2026</span>
                  </p>
                  <p className="text-slate-300 leading-relaxed mt-4">
                    At TradeTaper, we believe in transparency. This Privacy Policy explains how we collect, use, and protect your information when you use our trading journal platform.
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
              </div>
            </div>

            <div className="text-center text-slate-500 text-sm mt-12">
              <p>
                Questions about our privacy policy? <Link href="/contact" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4">Contact Support</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
