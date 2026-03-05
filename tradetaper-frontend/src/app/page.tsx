"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { IconType } from 'react-icons';
import {
  FaArrowRight,
  FaBars,
  FaBolt,
  FaChartLine,
  FaCheck,
  FaChevronDown,
  FaPlayCircle,
  FaRobot,
  FaShieldAlt,
  FaTimes,
  FaUsers,
} from 'react-icons/fa';
import { PRICING_TIERS, formatPlanPrice } from '@/config/pricing';
import { useCurrency } from '@/hooks/useCurrency';
import type { RootState } from '@/store/store';

type FeatureItem = {
  icon: IconType;
  title: string;
  description: string;
};

type TestimonialItem = {
  quote: string;
  name: string;
  role: string;
  result: string;
};

type FaqCategory = 'General' | 'Billing & Plans' | 'Security';

type FaqItem = {
  category: FaqCategory;
  question: string;
  answer: string;
};

type FooterColumn = {
  title: string;
  links: Array<{ label: string; href: string }>;
};

const FEATURE_ITEMS: FeatureItem[] = [
  {
    icon: FaChartLine,
    title: 'Execution-Grade Journal',
    description:
      'Capture every trade with clean structure, rich context, and disciplined post-trade review.',
  },
  {
    icon: FaRobot,
    title: 'AI Review Layer',
    description:
      'Use AI to detect behavioral patterns, repeat mistakes, and high-probability setups in your data.',
  },
  {
    icon: FaShieldAlt,
    title: 'Risk Discipline Engine',
    description:
      'Enforce position sizing and downside rules before a bad day turns into a blown account.',
  },
  {
    icon: FaBolt,
    title: 'MT5 Sync Pipeline',
    description:
      'Reliable sync for active trading workflows with transparent account and slot management.',
  },
  {
    icon: FaUsers,
    title: 'Coach and Team Ready',
    description:
      'Share consistent, trustworthy performance views with mentors, teams, and funding evaluators.',
  },
  {
    icon: FaPlayCircle,
    title: 'Backtest + Replay',
    description:
      'Move from assumptions to measured edge with realistic replay and post-session analytics.',
  },
];

const TESTIMONIALS: TestimonialItem[] = [
  {
    quote:
      'I stopped guessing. My review cycle now tells me exactly where my edge breaks down each week.',
    name: 'Arjun M.',
    role: 'FX Intraday Trader',
    result: '+18% consistency gain in 60 days',
  },
  {
    quote:
      'The discipline layer changed how I size risk. Drawdown got controlled before performance improved.',
    name: 'Katherine L.',
    role: 'Prop Challenge Trader',
    result: 'Passed 2-step evaluation',
  },
  {
    quote:
      'Trade sync and analytics are finally in one place. No more spreadsheet stitching after every session.',
    name: 'Mateo R.',
    role: 'Multi-Account Trader',
    result: 'Saved ~6 hrs/week in review ops',
  },
];

const FAQ_CATEGORIES: FaqCategory[] = ['General', 'Billing & Plans', 'Security'];

const FAQ_ITEMS: FaqItem[] = [
  {
    category: 'General',
    question: 'What makes TradeTaper different from a regular journal?',
    answer:
      'TradeTaper is workflow-first, not just note-taking. You get structured logging, AI-assisted review loops, and risk discipline systems designed to improve decision quality over time.',
  },
  {
    category: 'General',
    question: 'Can I use TradeTaper if I trade multiple accounts?',
    answer:
      'Yes. Plans include MetaApi auto-sync slots, and you can extend account capacity with add-on slots as your operation scales.',
  },
  {
    category: 'Billing & Plans',
    question: 'Do you support localized pricing?',
    answer:
      'Yes. INR pricing is shown for Indian users and USD for international users. Billing currency is handled from your detected region and reflected at checkout.',
  },
  {
    category: 'Billing & Plans',
    question: 'Is there a free plan and how do upgrades work?',
    answer:
      'You can start on the free plan with clear usage limits. Upgrades are immediate, and your additional features and limits are enforced by the backend in real time.',
  },
  {
    category: 'Security',
    question: 'How is account security handled?',
    answer:
      'Authentication flows support secure session handling, MFA enrollment with recovery codes, and audit logging for login success/failure events, including SOC2-style traceability.',
  },
  {
    category: 'Security',
    question: 'Are data and billing controls production-ready?',
    answer:
      'Yes. Plan entitlements, feature gates, and subscription status checks are enforced server-side so premium paths stay protected and consistent across profile, billing, and app workflows.',
  },
];

const STATS = [
  { label: 'Traders Using TradeTaper', value: '10k+' },
  { label: 'Trades Logged', value: '2.5M+' },
  { label: 'Review Sessions', value: '430k+' },
  { label: 'Backtest Runs', value: '120k+' },
];

const NAV_ITEMS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
];

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Demo', href: '/demo' },
      { label: 'Register', href: '/register' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Support', href: '/support' },
      { label: 'Login', href: '/login' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Refund', href: '/refund' },
    ],
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { currency, loading: isCurrencyLoading } = useCurrency();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [faqCategory, setFaqCategory] = useState<FaqCategory>('General');

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050607] text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <div className="h-4 w-4 rounded-full border-2 border-emerald-400/30 border-t-emerald-300 animate-spin" />
          Redirecting to dashboard...
        </div>
      </div>
    );
  }

  const formatPriceForLanding = (tierId: string) => {
    const label = formatPlanPrice(tierId, 'monthly', currency.code);
    return label === 'Free' ? label : `${label}/mo`;
  };

  const filteredFaqs = FAQ_ITEMS.filter((item) => item.category === faqCategory);

  return (
    <div className="min-h-screen bg-[#030605] text-white selection:bg-emerald-500/30">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-[#020403]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:184px_184px] opacity-[0.2]" />
        <div className="absolute inset-y-0 left-0 w-[33%] bg-[repeating-linear-gradient(140deg,rgba(255,255,255,0.03)_0_1px,transparent_1px_5px)] opacity-35" />
        <div className="absolute inset-y-0 right-0 w-[33%] bg-[repeating-linear-gradient(40deg,rgba(255,255,255,0.03)_0_1px,transparent_1px_5px)] opacity-35" />

        <div className="hidden md:block">
          <div className="absolute -left-24 top-0 h-[17rem] w-[23rem] rounded-[4.8rem] border border-white/10" />
          <div className="absolute left-1/2 top-0 h-[17rem] w-[26rem] -translate-x-1/2 rounded-[5.2rem] border border-white/10" />
          <div className="absolute -right-24 top-0 h-[17rem] w-[23rem] rounded-[4.8rem] border border-white/10" />

          <div className="absolute -left-20 top-[33%] h-[32rem] w-[27rem] rounded-[38%] border border-white/10" />
          <div className="absolute -left-12 top-[40%] h-[26rem] w-[20rem] rotate-[32deg] rounded-[45%] border border-white/10 opacity-60" />
          <div className="absolute -right-20 top-[35%] h-[32rem] w-[27rem] rounded-[38%] border border-white/10" />
          <div className="absolute -right-12 top-[42%] h-[26rem] w-[20rem] -rotate-[28deg] rounded-[45%] border border-white/10 opacity-60" />

          <div className="absolute left-1/2 top-[5.5rem] h-[18rem] w-[18rem] -translate-x-1/2 rounded-full border border-white/10" />
          <div className="absolute left-1/2 top-[7rem] h-[15rem] w-[15rem] -translate-x-1/2 rounded-full border border-white/10" />
          <div className="absolute left-1/2 top-[8.5rem] h-[12rem] w-[12rem] -translate-x-1/2 rounded-full border border-white/10" />
        </div>

        <div className="absolute left-1/2 top-[11.6rem] h-36 w-[46rem] -translate-x-1/2 rounded-[999px] bg-gradient-to-b from-emerald-200/65 via-emerald-400/28 to-transparent blur-[22px] opacity-70" />
        <div className="hidden lg:block absolute left-[10%] top-[48%] h-36 w-80 rotate-[12deg] rounded-[48%] bg-gradient-to-b from-emerald-100/75 via-emerald-400/35 to-transparent blur-[14px] opacity-75" />
        <div className="absolute right-[-2rem] bottom-[-0.8rem] h-24 w-80 rounded-[999px] bg-gradient-to-r from-emerald-100/80 via-emerald-400/35 to-transparent blur-[12px] opacity-75" />
        <div className="absolute left-[55%] top-[26%] h-44 w-44 rounded-full bg-emerald-300/12 blur-[90px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-emerald-100/10 bg-black/55 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[min(1600px,94vw)] px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/tradetaperLogo.png"
              alt="TradeTaper"
              width={44}
              height={44}
              className="h-11 w-11 object-contain"
              priority
            />
            <span className="text-xl md:text-2xl font-semibold tracking-tight text-white">
              TradeTaper
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/demo"
              className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Demo
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-black hover:bg-emerald-50 transition-colors"
            >
              Start Free
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-slate-200 hover:text-white"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden border-t border-white/10 bg-black/90">
            <div className="px-6 py-5 flex flex-col gap-3">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-slate-300 hover:text-white transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/demo"
                className="text-slate-300 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Demo
              </Link>
              <div className="h-px bg-white/10 my-2" />
              <Link
                href="/login"
                className="text-slate-300 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="inline-flex justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-white text-black hover:bg-emerald-50 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Start Free
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative isolate mx-auto w-full max-w-[min(1600px,94vw)] px-6 pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[clamp(24rem,40vw,46rem)]">
            <div className="absolute left-1/2 top-[5%] h-[clamp(16rem,32vw,26rem)] w-[min(1200px,92vw)] -translate-x-1/2 [perspective:1800px]">
              <div className="hidden md:block absolute left-[8%] top-[30%] h-[clamp(8rem,14vw,12rem)] w-[clamp(22rem,42vw,38rem)] rounded-[2.8rem] border border-emerald-100/15 bg-[linear-gradient(180deg,rgba(16,185,129,0.26),rgba(0,0,0,0.05)_62%,rgba(0,0,0,0))] shadow-[0_32px_125px_rgba(16,185,129,0.24)] transform-gpu [transform:rotateX(64deg)_rotateZ(-16deg)]" />

              <div className="hidden lg:block absolute left-[1%] top-[7%] h-[clamp(9rem,15vw,13rem)] w-[clamp(12rem,21vw,18rem)] [transform-style:preserve-3d]">
                <div className="absolute inset-0 rounded-[1.4rem] border border-emerald-100/20 bg-[linear-gradient(165deg,rgba(16,185,129,0.18),rgba(5,9,8,0.92)_68%)] shadow-[0_20px_75px_rgba(16,185,129,0.22)] transform-gpu animate-float [transform:rotateX(56deg)_rotateY(-10deg)_rotateZ(-19deg)]" />
                <div className="absolute inset-[0.75rem] rounded-[1rem] border border-white/10 bg-black/45 transform-gpu animate-float [transform:rotateX(56deg)_rotateY(-10deg)_rotateZ(-19deg)]">
                  <p className="px-3 pt-2 font-mono text-[9px] tracking-[0.16em] uppercase text-emerald-100/70">
                    Journal Log
                  </p>
                  <div className="px-3 pt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      <span className="h-1.5 w-[75%] rounded-full bg-emerald-100/30" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/70" />
                      <span className="h-1.5 w-[58%] rounded-full bg-white/20" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/70" />
                      <span className="h-1.5 w-[70%] rounded-full bg-white/20" />
                    </div>
                    <div className="h-[2.25rem] rounded-lg border border-white/10 bg-emerald-300/10" />
                  </div>
                </div>
              </div>

              <div className="hidden lg:block absolute right-[1%] top-[6%] h-[clamp(9rem,15vw,13rem)] w-[clamp(12rem,21vw,18rem)] [transform-style:preserve-3d]">
                <div className="absolute inset-0 rounded-[1.55rem] border border-emerald-100/20 bg-[linear-gradient(165deg,rgba(5,8,7,0.96),rgba(16,185,129,0.18))] shadow-[0_20px_76px_rgba(16,185,129,0.24)] transform-gpu animate-float delay-200 [transform:rotateX(56deg)_rotateY(10deg)_rotateZ(18deg)]" />
                <div className="absolute inset-[0.75rem] rounded-[1.05rem] border border-white/10 bg-black/45 transform-gpu animate-float delay-200 [transform:rotateX(56deg)_rotateY(10deg)_rotateZ(18deg)]">
                  <p className="px-3 pt-2 font-mono text-[9px] tracking-[0.16em] uppercase text-emerald-100/70">
                    Trade Ticket
                  </p>
                  <div className="mx-3 mt-2 mb-2 h-px bg-white/10" />
                  <div className="mx-3 h-[3.2rem] grid grid-cols-7 items-end gap-1">
                    <span className="h-[48%] rounded-sm bg-emerald-300/55" />
                    <span className="h-[65%] rounded-sm bg-emerald-300/70" />
                    <span className="h-[36%] rounded-sm bg-rose-300/45" />
                    <span className="h-[76%] rounded-sm bg-emerald-300/85" />
                    <span className="h-[52%] rounded-sm bg-rose-300/45" />
                    <span className="h-[70%] rounded-sm bg-emerald-300/75" />
                    <span className="h-[88%] rounded-sm bg-emerald-200/90" />
                  </div>
                </div>
              </div>

              <div className="hidden md:flex absolute left-1/2 top-[50%] h-[clamp(3.2rem,5vw,4.3rem)] w-[clamp(11rem,20vw,16rem)] -translate-x-1/2 items-center justify-between rounded-[1.2rem] border border-white/15 bg-[linear-gradient(120deg,rgba(5,9,8,0.95),rgba(16,185,129,0.24),rgba(5,9,8,0.95))] px-4 shadow-[0_18px_65px_rgba(16,185,129,0.28)] transform-gpu animate-float delay-100 [transform:rotateX(58deg)_rotateZ(6deg)]">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-emerald-100/70">Risk per trade</p>
                  <p className="text-sm font-semibold text-white">0.50R</p>
                </div>
                <div className="rounded-lg border border-emerald-200/25 bg-emerald-300/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100">
                  A+ Setup
                </div>
              </div>

              <div className="hidden xl:block absolute left-[50%] top-[11%] h-24 w-24 -translate-x-1/2 rounded-[1.3rem] border border-white/20 bg-black/45 shadow-[0_20px_55px_rgba(0,0,0,0.55)] transform-gpu animate-float delay-300 [transform:rotateX(58deg)_rotateZ(44deg)]" />
              <div className="absolute left-1/2 top-[34%] h-[clamp(8rem,14vw,13rem)] w-[clamp(20rem,40vw,42rem)] -translate-x-1/2 rounded-[999px] bg-gradient-to-b from-emerald-100/70 via-emerald-400/30 to-transparent blur-[18px] opacity-75" />
            </div>
            <div className="absolute left-[16%] top-[35%] h-64 w-64 rounded-full bg-emerald-300/15 blur-[95px]" />
            <div className="absolute right-[10%] top-[24%] h-72 w-72 rounded-full bg-cyan-300/10 blur-[105px]" />
            <div className="absolute left-[45%] top-[52%] h-56 w-56 rounded-full bg-emerald-500/12 blur-[100px]" />
          </div>

          <div className="relative z-10 grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center rounded-full border border-emerald-200/25 bg-emerald-500/10 px-3 py-1 text-xs tracking-[0.12em] uppercase text-emerald-200 mb-7">
                Built for serious traders
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl leading-[1.05] font-semibold tracking-tight mb-6">
                A cleaner way to
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-200 to-emerald-400">
                  measure and improve
                </span>
                every trade.
              </h1>
              <p className="text-slate-300 text-base md:text-lg max-w-2xl leading-relaxed mb-9">
                TradeTaper gives you an execution-grade journal, AI-led review, and risk discipline tools
                in one focused workspace. Less noise, better decisions, measurable growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold bg-white text-black hover:bg-emerald-50 transition-colors"
                >
                  Start Free
                  <FaArrowRight size={12} />
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 border border-white/20 text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Watch Product Demo
                  <FaPlayCircle size={13} />
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-10 rounded-[2.6rem] bg-emerald-400/28 blur-[95px]" />
              <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100/20 bg-[#060b0a]/95 shadow-[0_30px_120px_rgba(16,185,129,0.26)]">
                <div className="h-11 px-4 border-b border-white/10 flex items-center gap-2 bg-black/45">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
                  <span className="ml-3 text-[11px] text-slate-400">trade-review.workspace</span>
                </div>
                <div className="grid md:grid-cols-[1.25fr_0.75fr]">
                  <div className="border-b md:border-b-0 md:border-r border-white/10 p-5 md:p-6 bg-black/35">
                    <p className="font-mono text-[11px] text-slate-400 mb-3">&lt;TradeReview session=&quot;LDN-NY&quot;&gt;</p>
                    <div className="space-y-2 font-mono text-[11px] text-slate-300">
                      <p>
                        <span className="text-emerald-300">WinRate</span>: 63.4%
                      </p>
                      <p>
                        <span className="text-emerald-300">Expectancy</span>: +0.42R
                      </p>
                      <p>
                        <span className="text-emerald-300">RuleAdherence</span>: 91%
                      </p>
                    </div>
                    <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <p className="text-xs text-slate-400 mb-2">AI Review Summary</p>
                      <ul className="space-y-2 text-sm text-slate-200">
                        <li className="flex items-start gap-2">
                          <FaCheck className="text-emerald-300 mt-1 text-[11px]" />
                          Entries are strongest during London + NY overlap.
                        </li>
                        <li className="flex items-start gap-2">
                          <FaCheck className="text-emerald-300 mt-1 text-[11px]" />
                          Most losses come from over-sizing after two winners.
                        </li>
                        <li className="flex items-start gap-2">
                          <FaCheck className="text-emerald-300 mt-1 text-[11px]" />
                          Session checklist adherence improved to 91%.
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="p-5 md:p-6 bg-gradient-to-b from-emerald-300/15 via-emerald-500/6 to-transparent">
                    <div className="rounded-2xl border border-emerald-100/20 bg-black/45 p-4">
                      <p className="text-xs uppercase tracking-[0.08em] text-emerald-200 mb-2">Session Health</p>
                      <p className="text-3xl font-semibold mb-4">84%</p>
                      <div className="space-y-2">
                        {[76, 58, 88, 64].map((value) => (
                          <div key={value} className="h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-emerald-500"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-4">Risk breaches down 42% month-over-month.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-14 grid grid-cols-2 md:grid-cols-4 gap-5">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-5 backdrop-blur-sm"
              >
                <p className="text-2xl md:text-3xl font-semibold text-white mb-1">{stat.value}</p>
                <p className="text-xs uppercase tracking-[0.08em] text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="features"
          className="relative isolate overflow-hidden mx-auto w-full max-w-[min(1600px,94vw)] px-6 py-20 md:py-24"
        >

          <div className="relative z-10 max-w-2xl mb-12 md:mb-14">
            <p className="text-xs tracking-[0.12em] uppercase text-emerald-300 mb-4">Platform Capabilities</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-5">
              Designed like a trading desk, not a template.
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Inspired by clean product systems, the interface is intentional: fewer distractions, stronger
              hierarchy, and fast access to signal.
            </p>
          </div>
          <div className="relative z-10 grid md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
            {FEATURE_ITEMS.map((item) => (
              <article
                key={item.title}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-6 transition-all duration-300 hover:border-emerald-200/25 hover:bg-black/55"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/0 via-transparent to-emerald-300/0 group-hover:from-emerald-300/10 group-hover:to-emerald-400/5 transition-all duration-300" />
                <div className="relative h-10 w-10 rounded-lg bg-emerald-400/15 text-emerald-200 flex items-center justify-center mb-5">
                  <item.icon size={16} />
                </div>
                <h3 className="relative text-lg font-semibold mb-2">{item.title}</h3>
                <p className="relative text-sm text-slate-300 leading-relaxed">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="pricing"
          className="relative isolate overflow-hidden mx-auto w-full max-w-[min(1600px,94vw)] px-6 py-20 md:py-24"
        >

          <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-10">
            <div>
              <p className="text-xs tracking-[0.12em] uppercase text-emerald-300 mb-3">Pricing</p>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4">Simple plans, clear limits.</h2>
              <p className="text-slate-300 max-w-2xl">
                Plans are displayed in your local billing currency:
                <span className="text-white font-medium">
                  {' '}
                  {isCurrencyLoading ? 'detecting...' : currency.code}
                </span>
                . Upgrade when your process needs more capacity.
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-sm text-slate-200 hover:text-white"
            >
              View full pricing details
              <FaArrowRight size={11} />
            </Link>
          </div>

          <div className="relative z-10 grid md:grid-cols-3 gap-5">
            {PRICING_TIERS.map((tier) => (
              <article
                key={tier.id}
                className={`relative overflow-hidden rounded-3xl border p-6 md:p-7 flex flex-col ${
                  tier.recommended
                    ? 'border-emerald-300/40 bg-gradient-to-b from-emerald-300/20 via-emerald-500/10 to-[#06100d]'
                    : 'border-white/10 bg-black/35'
                }`}
              >
                {tier.recommended && (
                  <span className="inline-flex self-start mb-4 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.12em] border border-emerald-200/40 bg-emerald-300/20 text-emerald-50">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-semibold mb-1">{tier.name}</h3>
                <p className="text-slate-300 text-sm mb-5">{tier.description}</p>
                <p className="text-4xl font-semibold tracking-tight mb-5">{formatPriceForLanding(tier.id)}</p>
                <div className="h-px bg-white/10 mb-5" />
                <ul className="space-y-2.5 mb-7 flex-grow">
                  {tier.features.slice(0, 6).map((feature) => (
                    <li key={feature} className="text-sm text-slate-200 flex items-start gap-2">
                      <FaCheck className="text-emerald-300 mt-1 text-[10px]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`inline-flex justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    tier.recommended
                      ? 'bg-white text-black hover:bg-emerald-50'
                      : 'border border-white/15 text-white hover:bg-white/5'
                  }`}
                >
                  {tier.id === 'free' ? 'Start Free' : 'Choose Plan'}
                </Link>
                <p className="mt-3 text-center text-xs text-slate-400">
                  {tier.id === 'free' ? 'No card required.' : 'Cancel anytime.'}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="testimonials"
          className="relative isolate overflow-hidden mx-auto w-full max-w-[min(1600px,94vw)] px-6 py-20 md:py-24"
        >

          <div className="relative z-10 max-w-2xl mb-10">
            <p className="text-xs tracking-[0.12em] uppercase text-emerald-300 mb-3">Testimonials</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4">
              Trusted by traders who review like pros.
            </h2>
            <p className="text-slate-300">
              Real outcomes from traders using TradeTaper to tighten process, control risk, and improve
              consistency.
            </p>
          </div>
          <div className="relative z-10 grid lg:grid-cols-3 gap-4 md:gap-5">
            {TESTIMONIALS.map((item) => (
              <article key={item.name} className="rounded-2xl border border-white/10 bg-black/40 p-6">
                <p className="text-slate-100 leading-relaxed mb-6">&ldquo;{item.quote}&rdquo;</p>
                <p className="text-sm font-semibold text-white">{item.name}</p>
                <p className="text-xs text-slate-400 mb-3">{item.role}</p>
                <p className="text-xs uppercase tracking-[0.08em] text-emerald-300">{item.result}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="faq"
          className="relative isolate overflow-hidden mx-auto w-full max-w-[min(1600px,94vw)] px-6 py-20 md:py-24"
        >

          <div className="relative z-10 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-xs tracking-[0.12em] uppercase text-emerald-300 mb-3">FAQ</p>
              <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-5">
                Frequently asked questions
              </h2>
              <p className="text-slate-300 max-w-md">
                Learn how TradeTaper handles workflow, billing, and security so you can scale with confidence.
              </p>
              <p className="text-sm text-slate-400 mt-6">
                Need a custom walkthrough?
                <Link href="/contact" className="text-emerald-300 hover:text-emerald-200 ml-1">
                  Talk to our team
                </Link>
                .
              </p>
            </div>

            <div>
              <div className="mb-5 inline-flex rounded-2xl border border-white/10 bg-black/45 p-1">
                {FAQ_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setFaqCategory(category)}
                    className={`px-4 md:px-5 py-2 rounded-xl text-sm transition-colors ${
                      faqCategory === category
                        ? 'bg-white/20 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {filteredFaqs.map((item, index) => (
                  <details
                    key={item.question}
                    className="group rounded-2xl border border-white/10 bg-black/35"
                    open={index === 0}
                  >
                    <summary className="list-none cursor-pointer px-5 py-4 flex items-center justify-between gap-3 text-base md:text-lg font-medium">
                      <span>{item.question}</span>
                      <FaChevronDown className="text-xs text-slate-400 transition-transform duration-300 group-open:rotate-180" />
                    </summary>
                    <p className="px-5 pb-5 text-sm md:text-[15px] text-slate-300 leading-relaxed">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative isolate overflow-hidden mx-auto w-full max-w-[min(1600px,94vw)] px-6 pb-20 md:pb-24">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-white/[0.06] to-black/70 px-8 py-14 md:px-12 md:py-16 text-center">
            <div className="pointer-events-none absolute left-1/2 top-[105%] h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute left-1/2 top-[105%] h-[23rem] w-[23rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-emerald-300/35 via-emerald-500/20 to-transparent blur-2xl" />
            <p className="text-xs tracking-[0.12em] uppercase text-emerald-200 mb-3">Next step</p>
            <h3 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4">Ship your edge, regularly.</h3>
            <p className="text-slate-300 max-w-2xl mx-auto mb-8">
              Explore the guided demo, then start free. Upgrade only when your process demands more power.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 border border-white/20 text-slate-100 hover:bg-white/5 transition-colors"
              >
                Open Demo
                <FaArrowRight size={11} />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold bg-white text-black hover:bg-emerald-50 transition-colors"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative overflow-hidden border-t border-white/10 bg-[#020403]/95">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-36 top-14 h-72 w-72 rounded-[35%] border border-white/10 opacity-30" />
          <div className="absolute -right-24 top-10 h-72 w-72 rounded-[35%] border border-white/10 opacity-25" />
          <div className="absolute left-20 top-56 h-36 w-80 rotate-[-12deg] rounded-[45%] bg-gradient-to-r from-transparent via-emerald-200/45 to-emerald-500/35 blur-xl" />
          <div className="absolute right-24 bottom-2 h-28 w-64 rounded-[45%] bg-gradient-to-r from-emerald-200/45 via-emerald-500/30 to-transparent blur-xl" />
        </div>
        <div className="relative mx-auto w-full max-w-[min(1600px,94vw)] px-6 pt-14 pb-8">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1.8fr]">
            <div>
              <Link href="/" className="inline-flex items-center gap-3 mb-4">
                <Image
                  src="/tradetaperLogo.png"
                  alt="TradeTaper"
                  width={38}
                  height={38}
                  className="h-9 w-9 object-contain"
                />
                <span className="text-lg font-semibold tracking-tight text-white">TradeTaper</span>
              </Link>
              <p className="text-sm text-slate-300 max-w-sm">
                Execution-grade journaling, analytics, and discipline systems for traders who care about
                measurable progress.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1">Emerald UI</span>
                <span className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1">AI Review</span>
                <span className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1">MT5 Sync</span>
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {FOOTER_COLUMNS.map((column) => (
                <div key={column.title}>
                  <h4 className="text-sm font-semibold text-white mb-3">{column.title}</h4>
                  <div className="flex flex-col gap-2.5 text-sm text-slate-400">
                    {column.links.map((link) => (
                      <Link key={link.label} href={link.href} className="hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-5 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-slate-500">
            <p>© {new Date().getFullYear()} TradeTaper. All rights reserved.</p>
            <p>Journal. Review. Improve.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
