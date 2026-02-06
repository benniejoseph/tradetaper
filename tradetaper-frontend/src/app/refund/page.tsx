// src/app/refund/page.tsx
import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy - TradeTaper',
  description: 'Understand our cancellation and refund policies.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-emerald-500/30">
      
      {/* Navbar Placeholder / Back Button */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-white/5 h-16 flex items-center px-6">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <FaArrowLeft /> Back to Home
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-32">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Cancellation & Refund Policy
        </h1>
        <p className="text-slate-400 mb-12">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="space-y-8 text-lg leading-relaxed">
            
            <section className="glass-card p-8 rounded-2xl border border-white/5">
                <h2 className="text-2xl font-semibold text-emerald-400 mb-4">1. Cancellation Policy</h2>
                <p className="mb-4">
                    You may cancel your TradeTaper subscription at any time directly from your account dashboard. 
                    Upon cancellation, your subscription will remain active until the end of your current billing period.
                </p>
                <p>
                    After your current billing period ends, your account will be downgraded to the Free tier, and you will not be charged again. 
                    We do not charge cancellation fees.
                </p>
            </section>
            
            <section className="glass-card p-8 rounded-2xl border border-white/5">
                <h2 className="text-2xl font-semibold text-emerald-400 mb-4">2. Refund Policy</h2>
                <p className="mb-4">
                    <strong>Monthly Subscriptions:</strong> We generally do not offer refunds for partial months of service. 
                    However, if you believe you were charged in error or have a technical issue that prevented you from using the service, 
                    please contact our support team within 7 days of the charge.
                </p>
                <p className="mb-4">
                    <strong>Annual Subscriptions:</strong> If you cancel an annual subscription within 14 days of the initial purchase, 
                    you are eligible for a full refund. After 14 days, no refunds will be issued, but your service will continue until the end of the yearly term.
                </p>
                <p>
                    <strong>Refund Processing:</strong> Approved refunds are typically processed within 5-10 business days and returned to the original payment method.
                </p>
            </section>

            <section className="glass-card p-8 rounded-2xl border border-white/5">
                <h2 className="text-2xl font-semibold text-emerald-400 mb-4">3. Contact Us</h2>
                <p>
                    If you have any questions about our Cancellation and Refund Policy, please contact us:
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2 text-slate-400">
                    <li>By email: <a href="mailto:support@tradetaper.com" className="text-emerald-400 hover:underline">support@tradetaper.com</a></li>
                    <li>By visiting the support page on our website: <Link href="/support" className="text-emerald-400 hover:underline">/support</Link></li>
                </ul>
            </section>

        </div>
      </main>

      <footer className="py-8 text-center text-slate-600 text-sm">
        &copy; {new Date().getFullYear()} TradeTaper Inc. All rights reserved.
      </footer>
    </div>
  );
}
