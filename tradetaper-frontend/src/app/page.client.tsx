"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PRICING_TIERS, formatPlanPrice } from '@/config/pricing';
import {
  HOME_FAQ_CATEGORIES,
  HOME_FAQ_ITEMS,
  type HomeFaqCategory,
} from '@/config/seoFaq';
import { useCurrency } from '@/hooks/useCurrency';
import type { CurrencyCode } from '@/hooks/useCurrency';
import { usePublicAuthState } from '@/hooks/usePublicAuthState';

type IconProps = {
  className?: string;
  size?: number;
};

const IconArrowRight = ({ className, size = 12 }: IconProps) => (
  <svg aria-hidden="true" viewBox="0 0 16 16" width={size} height={size} className={className} fill="currentColor">
    <path d="M8.78 2.22a.75.75 0 1 0-1.06 1.06L11.44 7H2.75a.75.75 0 0 0 0 1.5h8.69l-3.72 3.72a.75.75 0 1 0 1.06 1.06l5-5a.75.75 0 0 0 0-1.06l-5-5Z" />
  </svg>
);

const IconMenu = ({ className, size = 20 }: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
  </svg>
);

const IconClose = ({ className, size = 20 }: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
  </svg>
);

const IconBolt = ({ className, size = 16 }: IconProps) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M13 2 3 14h6l-1 8 10-12h-6l1-8Z" />
  </svg>
);

const IconChartLine = ({ className, size = 16 }: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M4 19h16M6 16l4-5 3 3 5-7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconCheck = ({ className, size = 12 }: IconProps) => (
  <svg aria-hidden="true" viewBox="0 0 16 16" width={size} height={size} className={className} fill="currentColor">
    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-6.25 6.25a.75.75 0 0 1-1.06 0L2.22 7.28a.75.75 0 1 1 1.06-1.06L7 9.94l5.72-5.72a.75.75 0 0 1 1.06 0Z" />
  </svg>
);

const IconChevronDown = ({ className, size = 12 }: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconPlayCircle = ({ className, size = 13 }: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="m10 9 6 3-6 3z" fill="currentColor" stroke="none" />
  </svg>
);

const IconRobot = ({ className, size = 16 }: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 3v3M6 9h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z" />
    <circle cx="9" cy="14" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="14" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const IconShield = ({ className, size = 16 }: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 3 5 6v6c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconUsers = ({ className, size = 16 }: IconProps) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="8" cy="9" r="3" />
    <circle cx="16" cy="10" r="2.5" />
    <path d="M3 19c0-3 2.5-5 5-5s5 2 5 5M14 19c0-2.2 1.6-3.8 3.8-4.2" strokeLinecap="round" />
  </svg>
);

type FeatureItem = {
  icon: React.ComponentType<IconProps>;
  title: string;
  description: string;
};

type TestimonialItem = {
  quote: string;
  name: string;
  role: string;
  result: string;
};

type FaqCategory = HomeFaqCategory;

type ShowcaseView = 'Dashboard' | 'Analytics';
type LoopAccent = 'emerald' | 'amber' | 'rose';

type LoopStep = {
  id: string;
  title: string;
  detail: string;
  kpiLabel: string;
  kpiValue: string;
  confidence: number;
  accent: LoopAccent;
};

type BillingPeriod = 'monthly' | 'yearly';

type PricingMeter = {
  label: string;
  value: number;
  hint: string;
};

type FooterColumn = {
  title: string;
  links: Array<{ label: string; href: string }>;
};

const FEATURE_ITEMS: FeatureItem[] = [
  {
    icon: IconChartLine,
    title: 'Execution-Grade Journal',
    description:
      'Capture every trade with clean structure, rich context, and disciplined post-trade review.',
  },
  {
    icon: IconRobot,
    title: 'AI Review Layer',
    description:
      'Use AI to detect behavioral patterns, repeat mistakes, and high-probability setups in your data.',
  },
  {
    icon: IconShield,
    title: 'Risk Discipline Engine',
    description:
      'Enforce position sizing and downside rules before a bad day turns into a blown account.',
  },
  {
    icon: IconBolt,
    title: 'MT5 Sync Pipeline',
    description:
      'Reliable sync for active trading workflows with transparent account and slot management.',
  },
  {
    icon: IconUsers,
    title: 'Coach and Team Ready',
    description:
      'Share consistent, trustworthy performance views with mentors, teams, and funding evaluators.',
  },
  {
    icon: IconPlayCircle,
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

const FAQ_CATEGORIES: FaqCategory[] = [...HOME_FAQ_CATEGORIES];
const FAQ_ITEMS = HOME_FAQ_ITEMS;

const STATS = [
  { label: 'Traders Using TradeTaper', value: '10k+' },
  { label: 'Trades Logged', value: '2.5M+' },
  { label: 'Review Sessions', value: '430k+' },
  { label: 'Backtest Runs', value: '120k+' },
];

const CTA_MILESTONES = [
  { label: 'Structured Journal Live', metric: 'Day 1', progress: 34 },
  { label: 'Behavioral Pattern Signal', metric: 'Week 1', progress: 66 },
  { label: 'Refined Execution Plan', metric: 'Week 2', progress: 92 },
];

const BILLING_PERIOD_OPTIONS: Array<{ id: BillingPeriod; label: string; helper: string }> = [
  { id: 'monthly', label: 'Monthly', helper: 'Flexible start' },
  { id: 'yearly', label: 'Yearly', helper: 'Save with annual billing' },
];

const PLAN_CAPACITY_METERS: Record<string, PricingMeter[]> = {
  free: [
    { label: 'Trade Capacity', value: 14, hint: '50 trades / month' },
    { label: 'Auto-sync Accounts', value: 0, hint: 'Manual + import only' },
    { label: 'Analytics Depth', value: 40, hint: 'Core journaling metrics' },
  ],
  essential: [
    { label: 'Trade Capacity', value: 52, hint: '500 trades / month' },
    { label: 'Auto-sync Accounts', value: 48, hint: '2 MetaApi accounts' },
    { label: 'Analytics Depth', value: 78, hint: 'Advanced performance + risk' },
  ],
  premium: [
    { label: 'Trade Capacity', value: 100, hint: 'Unlimited trades' },
    { label: 'Auto-sync Accounts', value: 82, hint: '4 MetaApi accounts' },
    { label: 'Analytics Depth', value: 100, hint: 'Full AI + backtesting suite' },
  ],
};

const DEFAULT_FOCUSED_PLAN_ID = PRICING_TIERS.find((tier) => tier.recommended)?.id ?? PRICING_TIERS[0]?.id ?? 'free';

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
    title: 'Resources',
    links: [
      { label: 'Best Trading Journals', href: '/best-trading-journal' },
      { label: 'Trading Journal App', href: '/trading-journal-app' },
      { label: 'Journal Template', href: '/trading-journal-template' },
      { label: 'Blog', href: '/blog' },
      { label: 'Compare', href: '/compare' },
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
      { label: 'Privacy', href: '/legal/privacy' },
      { label: 'Terms', href: '/legal/terms' },
      { label: 'Refund', href: '/legal/cancellation-refund' },
    ],
  },
];

const FOOTER_TRUST_LINES = [
  'Data-backed journaling workflows',
  'Server-enforced billing and feature gates',
  'Production-grade MT5 sync architecture',
];

const toDomSafeId = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const SHOWCASE_VIEWS: Array<{
  id: ShowcaseView;
  label: string;
  description: string;
}> = [
  {
    id: 'Dashboard',
    label: 'Dashboard',
    description: 'Execution control and session context.',
  },
  {
    id: 'Analytics',
    label: 'Analytics',
    description: 'Performance diagnostics and edge tracking.',
  },
];

const DASHBOARD_ACTIONS = [
  { title: 'Log Trade', subtitle: 'Capture execution fast' },
  { title: 'Journal', subtitle: 'Review structure daily' },
  { title: 'Market Intel', subtitle: 'Session + catalyst context' },
];

const DASHBOARD_HEALTH_ROWS = [
  { label: 'Execution Consistency', value: 91 },
  { label: 'Risk Compliance', value: 87 },
  { label: 'Playbook Adherence', value: 94 },
];

const ANALYTICS_COST_ROWS = [
  { label: 'Avg Fees / Trade', value: '$16.17', percent: 62 },
  { label: 'P&L to Fees Ratio', value: '17.71', percent: 84 },
  { label: 'Avg Fees / Day', value: '$121.25', percent: 58 },
];

const EXECUTION_LOOP_STEPS: LoopStep[] = [
  {
    id: 'capture',
    title: 'Capture Fast',
    detail: 'Log setup, risk, and execution context in under 20 seconds.',
    kpiLabel: 'Avg Log Time',
    kpiValue: '18s',
    confidence: 92,
    accent: 'emerald',
  },
  {
    id: 'review',
    title: 'Review Discipline',
    detail: 'Coach insight highlights recurring execution and psychology mistakes.',
    kpiLabel: 'Rule Adherence',
    kpiValue: '91%',
    confidence: 88,
    accent: 'amber',
  },
  {
    id: 'diagnose',
    title: 'Diagnose Edge',
    detail: 'Analytics isolates expectancy drift, fee drag, and session weak spots.',
    kpiLabel: 'Edge Stability',
    kpiValue: '+0.42R',
    confidence: 84,
    accent: 'rose',
  },
  {
    id: 'adapt',
    title: 'Adapt Next Session',
    detail: 'Convert findings into focused actions for the next 5-trade cycle.',
    kpiLabel: 'Plan Completion',
    kpiValue: '94%',
    confidence: 94,
    accent: 'emerald',
  },
];

type LandingPageProps = {
  initialCurrencyCode?: CurrencyCode;
};

export default function LandingPage({
  initialCurrencyCode = 'USD',
}: LandingPageProps) {
  const router = useRouter();
  const { isAuthenticated } = usePublicAuthState({
    fetchMode: 'idle',
    idleDelayMs: 1200,
  });
  const { currency, loading: isCurrencyLoading } = useCurrency({
    initialCurrencyCode,
    fetchMode: 'idle',
    idleDelayMs: 1500,
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeNavHref, setActiveNavHref] = useState<string>(NAV_ITEMS[0]?.href ?? '#features');
  const [faqCategory, setFaqCategory] = useState<FaqCategory>('General');
  const [activeFaqQuestion, setActiveFaqQuestion] = useState<string>(FAQ_ITEMS[0]?.question ?? '');
  const [showcaseView, setShowcaseView] = useState<ShowcaseView>('Dashboard');
  const [activeLoopIndex, setActiveLoopIndex] = useState(0);
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [focusedPlanId, setFocusedPlanId] = useState<string>(DEFAULT_FOCUSED_PLAN_ID);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const loopTicker = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      setActiveLoopIndex((previous) => (previous + 1) % EXECUTION_LOOP_STEPS.length);
    }, 3200);

    return () => window.clearInterval(loopTicker);
  }, []);

  useEffect(() => {
    const testimonialTicker = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      setActiveTestimonialIndex((previous) => (previous + 1) % TESTIMONIALS.length);
    }, 4600);

    return () => window.clearInterval(testimonialTicker);
  }, []);

  useEffect(() => {
    const availableQuestions = FAQ_ITEMS.filter((item) => item.category === faqCategory);
    if (!availableQuestions.length) {
      setActiveFaqQuestion('');
      return;
    }

    setActiveFaqQuestion((current) => {
      const isCurrentVisible = availableQuestions.some((item) => item.question === current);
      return isCurrentVisible ? current : availableQuestions[0].question;
    });
  }, [faqCategory]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const sections = NAV_ITEMS.map((item) => item.href.replace('#', ''))
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!sections.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (!visibleEntries.length) {
          return;
        }

        visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const topSectionId = visibleEntries[0].target.id;
        if (topSectionId) {
          setActiveNavHref(`#${topSectionId}`);
        }
      },
      {
        threshold: [0.2, 0.35, 0.5, 0.65],
        rootMargin: '-20% 0px -55% 0px',
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

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

  const formatPriceForLanding = (tierId: string, period: BillingPeriod) => {
    const label = formatPlanPrice(tierId, period, currency.code);
    return label === 'Free' ? label : `${label}/${period === 'monthly' ? 'mo' : 'yr'}`;
  };

  const filteredFaqs = FAQ_ITEMS.filter((item) => item.category === faqCategory);
  const activeExecutionStep = EXECUTION_LOOP_STEPS[activeLoopIndex] ?? EXECUTION_LOOP_STEPS[0];
  const activeTestimonial = TESTIMONIALS[activeTestimonialIndex] ?? TESTIMONIALS[0];
  const focusedTier = PRICING_TIERS.find((tier) => tier.id === focusedPlanId) ?? PRICING_TIERS[0]!;
  const focusedTierMeters = PLAN_CAPACITY_METERS[focusedTier.id] ?? PLAN_CAPACITY_METERS.free;

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

        <div className="hidden md:block absolute left-1/2 top-[11.6rem] h-36 w-[46rem] -translate-x-1/2 rounded-[999px] bg-gradient-to-b from-emerald-200/65 via-emerald-400/28 to-transparent blur-[22px] opacity-70" />
        <div className="hidden lg:block absolute left-[10%] top-[48%] h-36 w-80 rotate-[12deg] rounded-[48%] bg-gradient-to-b from-emerald-100/75 via-emerald-400/35 to-transparent blur-[14px] opacity-75" />
        <div className="hidden md:block absolute right-[-2rem] bottom-[-0.8rem] h-24 w-80 rounded-[999px] bg-gradient-to-r from-emerald-100/80 via-emerald-400/35 to-transparent blur-[12px] opacity-75" />
        <div className="hidden md:block absolute left-[55%] top-[26%] h-44 w-44 rounded-full bg-emerald-300/12 blur-[90px]" />
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
                onClick={() => setActiveNavHref(item.href)}
                aria-current={activeNavHref === item.href ? 'page' : undefined}
                className={`relative px-4 py-2 rounded-lg text-sm border transition-all ${
                  activeNavHref === item.href
                    ? 'text-emerald-100 border-emerald-300/35 bg-emerald-500/12'
                    : 'text-slate-300 border-transparent hover:text-white hover:bg-white/5'
                }`}
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
            {isMobileMenuOpen ? <IconClose size={20} /> : <IconMenu size={20} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden border-t border-white/10 bg-black/90">
            <div className="px-6 py-5 flex flex-col gap-3">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-2 py-1 text-sm transition-all ${
                    activeNavHref === item.href
                      ? 'bg-emerald-500/12 text-emerald-100 border border-emerald-300/35'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  onClick={() => {
                    setActiveNavHref(item.href);
                    setIsMobileMenuOpen(false);
                  }}
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
            <div className="hidden md:block absolute left-[16%] top-[35%] h-64 w-64 rounded-full bg-emerald-300/15 blur-[95px]" />
            <div className="hidden md:block absolute right-[10%] top-[24%] h-72 w-72 rounded-full bg-cyan-300/10 blur-[105px]" />
            <div className="hidden md:block absolute left-[45%] top-[52%] h-56 w-56 rounded-full bg-emerald-500/12 blur-[100px]" />
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
                  <IconArrowRight size={12} />
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 border border-white/20 text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Watch Product Demo
                  <IconPlayCircle size={13} />
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
                </div>
                <div className="relative aspect-[16/9] overflow-hidden bg-black/45">
                  <Image
                    src="/landing/Dashboard.png"
                    alt="TradeTaper dashboard screenshot"
                    fill
                    className="object-contain object-top"
                    sizes="(min-width: 1024px) 42vw, 92vw"
                    priority
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-emerald-500/8" />
                  <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-emerald-300/40 bg-black/55 px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-emerald-200">
                      Live Dashboard UI
                    </span>
                    <span className="rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-slate-200">
                      Dashboard
                    </span>
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

          <div className="relative z-10 mt-7 rounded-[1.8rem] border border-white/10 bg-black/35 p-4 md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-emerald-300 mb-1">Execution Loop</p>
                <h3 className="text-xl md:text-2xl font-semibold tracking-tight">
                  From trade capture to improvement, one connected flow.
                </h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-slate-300">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-70 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
                </span>
                Live workflow preview
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-2.5">
                {EXECUTION_LOOP_STEPS.map((step, index) => {
                  const isActive = activeLoopIndex === index;
                  const accentClasses =
                    step.accent === 'amber'
                      ? 'border-amber-300/35 bg-amber-500/12 text-amber-100'
                      : step.accent === 'rose'
                        ? 'border-rose-300/35 bg-rose-500/12 text-rose-100'
                        : 'border-emerald-300/35 bg-emerald-500/12 text-emerald-100';

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setActiveLoopIndex(index)}
                      className={`w-full rounded-xl border px-3.5 py-3 text-left transition-all ${
                        isActive
                          ? `shadow-[0_8px_30px_rgba(16,185,129,0.12)] ${accentClasses}`
                          : 'border-white/10 bg-black/35 text-slate-300 hover:border-white/20'
                      }`}
                      aria-pressed={isActive}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{`0${index + 1} · ${step.title}`}</p>
                          <p className="text-xs mt-1 text-current/80">{step.kpiLabel}</p>
                        </div>
                        <p className="text-sm font-semibold">{step.kpiValue}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-black/40 p-4 md:p-5">
                
                  <div
                    key={activeExecutionStep.id}
                    className="space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] text-emerald-300 mb-1">Current Focus</p>
                        <h4 className="text-lg md:text-xl font-semibold">{activeExecutionStep.title}</h4>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${
                          activeExecutionStep.accent === 'amber'
                            ? 'border-amber-300/35 bg-amber-500/14 text-amber-100'
                            : activeExecutionStep.accent === 'rose'
                              ? 'border-rose-300/35 bg-rose-500/14 text-rose-100'
                              : 'border-emerald-300/35 bg-emerald-500/14 text-emerald-100'
                        }`}
                      >
                        {activeExecutionStep.kpiLabel}
                      </span>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed">{activeExecutionStep.detail}</p>

                    <div className="rounded-xl border border-white/10 bg-black/35 p-3">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-slate-300">Confidence Band</span>
                        <span className="font-semibold text-white">{activeExecutionStep.confidence}%</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-emerald-500"
                          style={{ width: `${activeExecutionStep.confidence}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-6 gap-1.5">
                      {[48, 62, 74, 59, 82, 68].map((height, index) => (
                        <div
                          key={`${activeExecutionStep.id}-${height}-${index}`}
                          className="rounded-md border border-emerald-300/20 bg-emerald-500/16"
                          style={{ height: `${height}px` }}
                        />
                      ))}
                    </div>
                  </div>
                
              </div>
            </div>
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

        <section className="relative isolate overflow-hidden mx-auto w-full max-w-[min(1600px,94vw)] px-6 py-20 md:py-24">
          <div className="absolute left-[8%] top-24 h-48 w-56 rounded-[42%] bg-gradient-to-br from-emerald-200/28 via-emerald-400/10 to-transparent blur-2xl" />
          <div className="absolute right-[6%] bottom-10 h-44 w-64 rounded-[42%] bg-gradient-to-br from-emerald-300/24 via-emerald-500/12 to-transparent blur-2xl" />

          <div className="relative z-10 mb-14 rounded-[2rem] border border-white/10 bg-black/35 p-5 md:p-7">
            <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
              <div className="space-y-5">
                <div>
                  <p className="text-xs tracking-[0.12em] uppercase text-emerald-300 mb-3">
                    Feature Walkthrough 01
                  </p>
                  <h2 className="text-2xl md:text-4xl font-semibold tracking-tight mb-4">
                    Dashboard + analytics, shown in one operating flow.
                  </h2>
                  <p className="text-slate-300 leading-relaxed">
                    This keeps your existing visual DNA and highlights how TradeTaper moves a trader from
                    quick action to measurable review in a single session loop.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-emerald-200 mb-3">
                    What this block communicates
                  </p>
                  <ul className="space-y-2 text-sm text-slate-200">
                    <li className="flex items-start gap-2">
                      <IconCheck className="mt-1 text-[10px] text-emerald-300" />
                      One-tap actions stay visible and contextual.
                    </li>
                    <li className="flex items-start gap-2">
                      <IconCheck className="mt-1 text-[10px] text-emerald-300" />
                      Coaching and session metrics feel live with subtle motion.
                    </li>
                    <li className="flex items-start gap-2">
                      <IconCheck className="mt-1 text-[10px] text-emerald-300" />
                      Analytics keeps diagnostic depth without visual noise.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[1.8rem] border border-emerald-100/20 bg-[#040907] shadow-[0_22px_80px_rgba(16,185,129,0.16)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.18),transparent_45%),radial-gradient(circle_at_90%_0%,rgba(16,185,129,0.14),transparent_55%)] pointer-events-none" />
                <div className="relative border-b border-white/10 px-4 py-3 md:px-5 md:py-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex rounded-xl border border-white/10 bg-black/45 p-1">
                    {SHOWCASE_VIEWS.map((view) => (
                      <button
                        key={view.id}
                        type="button"
                        onClick={() => setShowcaseView(view.id)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                          showcaseView === view.id
                            ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-300/35'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {view.label}
                      </button>
                    ))}
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-[11px] text-emerald-100/85">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75 animate-ping" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    </span>
                    <span>{SHOWCASE_VIEWS.find((view) => view.id === showcaseView)?.description}</span>
                  </div>
                </div>

                <div className="relative p-4 md:p-5">
                  
                    {showcaseView === 'Dashboard' ? (
                      <div
                        key="showcase-dashboard"
                        className="space-y-4"
                      >
                        <div className="grid gap-3 sm:grid-cols-3">
                          {DASHBOARD_ACTIONS.map((action) => (
                            <div
                              key={action.title}
                              className="rounded-xl border border-emerald-200/20 bg-gradient-to-r from-emerald-500/18 to-emerald-500/8 px-3.5 py-3"
                            >
                              <p className="text-sm font-semibold text-white">{action.title}</p>
                              <p className="text-[11px] text-emerald-100/75 mt-1">{action.subtitle}</p>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-600/35 via-emerald-500/20 to-black/20 p-4 md:p-5">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-emerald-100/85 mb-1">
                                Trading Coach Insight
                              </p>
                              <p className="text-lg md:text-xl font-semibold text-white leading-tight">
                                AI-powered execution review
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl md:text-4xl font-semibold text-white">65</p>
                              <p className="text-[11px] uppercase tracking-[0.12em] text-emerald-100/75">
                                Trader Score
                              </p>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-3">
                            {DASHBOARD_HEALTH_ROWS.map((item) => (
                              <div key={item.label} className="rounded-xl border border-white/10 bg-black/25 p-3">
                                <p className="text-[11px] text-slate-300 mb-2">{item.label}</p>
                                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-emerald-500"
                                    style={{ width: `${item.value}%` }}
                                  />
                                </div>
                                <p className="mt-2 text-xs font-semibold text-emerald-200">{item.value}%</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
                          <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
                            <p className="text-xs uppercase tracking-[0.12em] text-emerald-200 mb-2">
                              Market Sessions
                            </p>
                            <div className="flex items-end justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">European Session</p>
                                <p className="text-xs text-slate-400 mt-1">closes in 5h 56m</p>
                              </div>
                              <p className="font-mono text-2xl text-emerald-200 animate-[pulse_2.6s_ease-in-out_infinite]">
                                06:04:16
                              </p>
                            </div>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
                            <p className="text-xs uppercase tracking-[0.12em] text-emerald-200 mb-2">
                              P&L Calendar
                            </p>
                            <div className="grid grid-cols-5 gap-1.5">
                              {['+', '+', '-', '+', '-'].map((day, index) => (
                                <div
                                  key={`${day}-${index}`}
                                  className={`h-8 rounded-md border ${
                                    day === '+'
                                      ? 'border-emerald-400/40 bg-emerald-500/15'
                                      : 'border-rose-400/35 bg-rose-500/12'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        key="showcase-analytics"
                        className="space-y-4"
                      >
                        <div className="grid gap-3 lg:grid-cols-[1.08fr_0.92fr]">
                          <div className="rounded-xl border border-white/10 bg-black/45 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm font-semibold text-white">Trade Consistency</p>
                              <span className="text-xs text-slate-400">7d</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5 mb-3">
                              <div className="rounded-lg border border-emerald-300/30 bg-emerald-500/12 p-3">
                                <p className="text-[11px] text-emerald-100/80 mb-1">Max Win Streak</p>
                                <p className="text-2xl font-semibold text-emerald-200">7</p>
                              </div>
                              <div className="rounded-lg border border-rose-300/30 bg-rose-500/10 p-3">
                                <p className="text-[11px] text-rose-100/75 mb-1">Max Loss Streak</p>
                                <p className="text-2xl font-semibold text-rose-200">3</p>
                              </div>
                            </div>
                            <div className="h-20 rounded-lg border border-white/10 bg-black/45 p-2">
                              <svg viewBox="0 0 280 64" className="h-full w-full">
                                <path
                                  d="M2 58 L30 51 L58 54 L86 29 L114 36 L142 25 L170 40 L198 34 L226 46 L254 24 L278 30"
                                  fill="none"
                                  stroke="rgba(52,211,153,0.92)"
                                  strokeWidth="2.4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M2 58 L30 51 L58 54 L86 29 L114 36 L142 25 L170 40 L198 34 L226 46 L254 24 L278 30 L278 64 L2 64 Z"
                                  fill="url(#consistencyFill)"
                                  opacity="0.52"
                                />
                                <defs>
                                  <linearGradient id="consistencyFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="rgba(16,185,129,0.45)" />
                                    <stop offset="100%" stopColor="rgba(16,185,129,0)" />
                                  </linearGradient>
                                </defs>
                              </svg>
                            </div>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-black/45 p-4">
                            <p className="text-sm font-semibold text-white mb-3">Win Rate Analysis</p>
                            <div className="flex items-center gap-4">
                              <div className="relative h-28 w-28 rounded-full bg-[conic-gradient(rgba(16,185,129,0.95)_0deg,rgba(16,185,129,0.95)_216deg,rgba(255,255,255,0.08)_216deg,rgba(255,255,255,0.08)_360deg)] animate-[spin_12s_linear_infinite]">
                                <div className="absolute inset-3 rounded-full bg-[#040907] border border-white/10" />
                              </div>
                              <div>
                                <p className="text-3xl font-semibold text-white">60%</p>
                                <p className="text-xs text-slate-400 mt-1">Win Rate</p>
                                <p className="text-xs text-emerald-200 mt-3">Risk-reward: 1.51</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-black/45 p-4">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <p className="text-sm font-semibold text-white">Trading Costs</p>
                            <span className="text-xs text-slate-400">All sessions</span>
                          </div>
                          <div className="space-y-2.5">
                            {ANALYTICS_COST_ROWS.map((row) => (
                              <div key={row.label} className="rounded-lg border border-white/10 bg-black/35 px-3 py-2">
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                  <span className="text-slate-300">{row.label}</span>
                                  <span className="font-semibold text-white">{row.value}</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-400/70 to-emerald-300"
                                    style={{ width: `${row.percent}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  
                </div>
              </div>
            </div>
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
            <div className="flex flex-col items-start md:items-end gap-3">
              <div className="inline-flex rounded-xl border border-white/10 bg-black/45 p-1">
                {BILLING_PERIOD_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setBillingPeriod(option.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                      billingPeriod === option.id
                        ? 'bg-emerald-400/20 border border-emerald-300/35 text-emerald-100'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    aria-pressed={billingPeriod === option.id}
                    title={option.helper}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                {billingPeriod === 'yearly' ? 'Save with annual billing.' : 'Switch to yearly for savings.'}
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 text-sm text-slate-200 hover:text-white"
              >
                View full pricing details
                <IconArrowRight size={11} />
              </Link>
            </div>
          </div>

          <div className="relative z-10 mb-6 rounded-[1.8rem] border border-white/10 bg-black/35 p-4 md:p-5">
            
              <div
                key={`${focusedTier.id}-${billingPeriod}`}
                className="grid gap-4 lg:grid-cols-[1fr_1fr]"
              >
                <div className="rounded-xl border border-emerald-200/20 bg-gradient-to-br from-emerald-500/12 via-emerald-500/5 to-black/45 p-4">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-emerald-300 mb-2">Plan Focus</p>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-2xl md:text-3xl font-semibold">{focusedTier.name}</h3>
                    {focusedTier.recommended && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/35 bg-emerald-500/12 px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                        Most popular
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-sm mb-4">{focusedTier.description}</p>
                  <p className="text-3xl font-semibold mb-4">{formatPriceForLanding(focusedTier.id, billingPeriod)}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-slate-200">
                      {focusedTier.tradeLimit === 0 ? 'Unlimited trades' : `${focusedTier.tradeLimit.toLocaleString()} trades / month`}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-slate-200">
                      {focusedTier.accountLimit === 0 ? 'No auto-sync slots' : `${focusedTier.accountLimit} auto-sync slots`}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/35 p-4">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-emerald-300 mb-3">Capacity Snapshot</p>
                  <div className="space-y-3">
                    {focusedTierMeters.map((meter) => (
                      <div key={`${focusedTier.id}-${meter.label}`}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                          <span className="text-slate-300">{meter.label}</span>
                          <span className="font-semibold text-emerald-100">{meter.hint}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-emerald-500"
                            style={{ width: `${meter.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            
          </div>

          <div className="relative z-10 grid md:grid-cols-3 gap-5">
            {PRICING_TIERS.map((tier) => (
              <article
                key={tier.id}
                onMouseEnter={() => setFocusedPlanId(tier.id)}
                onClick={() => setFocusedPlanId(tier.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setFocusedPlanId(tier.id);
                  }
                }}
                onFocus={() => setFocusedPlanId(tier.id)}
                role="button"
                tabIndex={0}
                aria-pressed={focusedPlanId === tier.id}
                aria-label={`Focus ${tier.name} plan`}
                className={`relative overflow-hidden rounded-3xl border p-6 md:p-7 flex flex-col transition-all ${
                  focusedPlanId === tier.id
                    ? 'border-emerald-300/40 bg-gradient-to-b from-emerald-300/20 via-emerald-500/10 to-[#06100d] shadow-[0_18px_48px_rgba(16,185,129,0.12)]'
                    : tier.recommended
                      ? 'border-emerald-300/35 bg-gradient-to-b from-emerald-300/16 via-emerald-500/8 to-[#06100d]'
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
                <p className="text-4xl font-semibold tracking-tight mb-5">{formatPriceForLanding(tier.id, billingPeriod)}</p>
                <div className="h-px bg-white/10 mb-5" />
                <ul className="space-y-2.5 mb-7 flex-grow">
                  {tier.features.slice(0, 6).map((feature) => (
                    <li key={feature} className="text-sm text-slate-200 flex items-start gap-2">
                      <IconCheck className="text-emerald-300 mt-1 text-[10px]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`inline-flex justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    focusedPlanId === tier.id || tier.recommended
                      ? 'bg-white text-black hover:bg-emerald-50'
                      : 'border border-white/15 text-white hover:bg-white/5'
                  }`}
                >
                  {tier.id === 'free' ? 'Start Free' : billingPeriod === 'yearly' ? 'Choose Yearly' : 'Choose Plan'}
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

          <div className="relative z-10 mb-5 rounded-[1.8rem] border border-white/10 bg-black/35 p-4 md:p-5">
            <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-2xl border border-emerald-200/20 bg-gradient-to-br from-emerald-500/12 via-emerald-500/6 to-black/40 p-5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-emerald-300 mb-3">Trader Spotlight</p>
                
                  <div
                    key={activeTestimonial.name}
                  >
                    <p className="text-lg md:text-xl leading-relaxed text-slate-100 mb-4">
                      &ldquo;{activeTestimonial.quote}&rdquo;
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{activeTestimonial.name}</p>
                        <p className="text-xs text-slate-400">{activeTestimonial.role}</p>
                      </div>
                      <span className="rounded-full border border-emerald-300/35 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-100">
                        {activeTestimonial.result}
                      </span>
                    </div>
                  </div>
                
              </div>

              <div className="grid gap-2.5">
                {TESTIMONIALS.map((item, index) => {
                  const isActive = index === activeTestimonialIndex;

                  return (
                    <button
                      key={`spotlight-${item.name}`}
                      type="button"
                      onClick={() => setActiveTestimonialIndex(index)}
                      aria-pressed={isActive}
                      className={`rounded-xl border p-3.5 text-left transition-all ${
                        isActive
                          ? 'border-emerald-300/35 bg-emerald-500/12 text-emerald-100'
                          : 'border-white/10 bg-black/35 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{item.name}</p>
                        <span className="text-[11px] uppercase tracking-[0.1em] text-current/80">
                          {`0${index + 1}`}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-current/75">{item.role}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="relative z-10 grid lg:grid-cols-3 gap-4 md:gap-5">
            {TESTIMONIALS.map((item, index) => {
              const isActive = index === activeTestimonialIndex;

              return (
                <article
                  key={item.name}
                  onMouseEnter={() => setActiveTestimonialIndex(index)}
                  className={`relative overflow-hidden rounded-2xl border bg-black/40 p-6 transition-all ${
                    isActive
                      ? 'border-emerald-300/35 shadow-[0_14px_40px_rgba(16,185,129,0.12)]'
                      : 'border-white/10'
                  }`}
                >
                  <p className="text-slate-100 leading-relaxed mb-6">&ldquo;{item.quote}&rdquo;</p>
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-slate-400 mb-3">{item.role}</p>
                  <p className="text-xs uppercase tracking-[0.08em] text-emerald-300">{item.result}</p>
                  <div
                    className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-emerald-300 to-emerald-500"
                    style={{ width: isActive ? '100%' : '0%' }}
                  />
                </article>
              );
            })}
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
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-xs">
                <span className="text-slate-400">
                  {filteredFaqs.length} question{filteredFaqs.length === 1 ? '' : 's'} in this section
                </span>
                <span className="rounded-full border border-emerald-300/35 bg-emerald-500/12 px-2.5 py-1 font-semibold uppercase tracking-[0.1em] text-emerald-100">
                  Fast read
                </span>
              </div>
              <div className="space-y-3">
                {filteredFaqs.map((item, index) => {
                  const isActive = item.question === activeFaqQuestion;
                  const faqKey = toDomSafeId(`${faqCategory}-${item.question}`);
                  const triggerId = `faq-trigger-${faqKey}`;
                  const panelId = `faq-panel-${faqKey}`;

                  return (
                    <article
                      key={item.question}
                      className={`group rounded-2xl border bg-black/35 transition-all ${
                        isActive ? 'border-emerald-300/35 shadow-[0_12px_36px_rgba(16,185,129,0.1)]' : 'border-white/10'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveFaqQuestion((current) => (current === item.question ? '' : item.question))}
                        className="w-full cursor-pointer px-5 py-4 flex items-center justify-between gap-3 text-left text-base md:text-lg font-medium"
                        aria-expanded={isActive}
                        id={triggerId}
                        aria-controls={panelId}
                      >
                        <span>{item.question}</span>
                        <span className="flex items-center gap-2">
                          <span className="hidden sm:inline text-[11px] uppercase tracking-[0.1em] text-slate-500">
                            {`0${index + 1}`}
                          </span>
                          <IconChevronDown
                            className={`text-xs transition-transform duration-300 ${
                              isActive ? 'text-emerald-200 rotate-180' : 'text-slate-400'
                            }`}
                          />
                        </span>
                      </button>

                      
                        {isActive && (
                          <div
                            key={`${item.question}-answer`}
                            className="overflow-hidden"
                            id={panelId}
                            role="region"
                            aria-labelledby={triggerId}
                          >
                            <p className="px-5 pb-5 text-sm md:text-[15px] text-slate-300 leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        )}
                      
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="relative isolate overflow-hidden mx-auto w-full max-w-[min(1600px,94vw)] px-6 pb-20 md:pb-24">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-white/[0.06] to-black/70 px-8 py-14 md:px-12 md:py-16 text-center">
            <div
              className="pointer-events-none absolute top-0 h-px w-40 bg-gradient-to-r from-transparent via-emerald-300/85 to-transparent"
            />
            <div className="pointer-events-none absolute left-1/2 top-[105%] h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute left-1/2 top-[105%] h-[23rem] w-[23rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-emerald-300/35 via-emerald-500/20 to-transparent blur-2xl" />
            <p className="text-xs tracking-[0.12em] uppercase text-emerald-200 mb-3">Next step</p>
            <h3 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4">Ship your edge, regularly.</h3>
            <p className="text-slate-300 max-w-2xl mx-auto mb-8">
              Explore the guided demo, then start free. Upgrade only when your process demands more power.
            </p>
            <div className="mx-auto mb-8 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
              {CTA_MILESTONES.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/10 bg-black/35 px-3.5 py-3 text-left"
                >
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-300">{item.label}</span>
                    <span className="font-semibold text-emerald-200">{item.metric}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-emerald-500"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 border border-white/20 text-slate-100 hover:bg-white/5 transition-colors"
              >
                Open Demo
                <IconArrowRight size={11} />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold bg-white text-black hover:bg-emerald-50 transition-colors"
              >
                Create Free Account
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">No card required</span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">Live demo included</span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">Upgrade when ready</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative overflow-hidden border-t border-white/10 bg-[#020403]/95">
        <div
          className="pointer-events-none absolute top-0 h-px w-44 bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent"
        />
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
                      <Link
                        key={link.label}
                        href={link.href}
                        className="group inline-flex items-center gap-1.5 hover:text-white transition-colors"
                      >
                        <span>{link.label}</span>
                        <IconArrowRight className="text-[9px] opacity-0 -translate-x-1 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-2 sm:grid-cols-3">
            {FOOTER_TRUST_LINES.map((line) => (
              <div
                key={line}
                className="rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-[11px] text-slate-400"
              >
                {line}
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-white/10 pt-5 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-slate-500">
            <p>© {new Date().getFullYear()} TradeTaper. All rights reserved.</p>
            <p>Journal. Review. Improve.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
