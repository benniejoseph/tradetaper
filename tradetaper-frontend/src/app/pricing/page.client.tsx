"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  PRICING_TIERS,
  formatPlanPrice,
  getDiscountPercentage,
  getUpgradeHighlights,
  getPlanPrice,
  MT5_SLOT_PRICE,
} from "@/config/pricing";
import { PRICING_FAQ_ITEMS } from "@/config/seoFaq";
import { useCurrency } from "@/hooks/useCurrency";
import type { CurrencyCode } from "@/hooks/useCurrency";
import { usePublicAuthState } from "@/hooks/usePublicAuthState";

type BillingPeriod = "monthly" | "yearly";
const PLAN_RANK: Record<string, number> = { free: 0, essential: 1, premium: 2 };

const FAQ_ITEMS = PRICING_FAQ_ITEMS;

type PlanComparisonRow = {
  feature: string;
  free: string;
  essential: string;
  premium: string;
};

const PLAN_COMPARISON_ROWS: PlanComparisonRow[] = [
  { feature: "Manual & import accounts", free: "Unlimited", essential: "Unlimited", premium: "Unlimited" },
  { feature: "MT5 auto-sync slots", free: "0", essential: "2", premium: "4" },
  { feature: "Trades per month", free: "50", essential: "500", premium: "Unlimited" },
  { feature: "Strategies", free: "3", essential: "7", premium: "Unlimited" },
  { feature: "Notes creation", free: "Locked", essential: "50", premium: "Unlimited" },
  { feature: "Core Dashboard + Journal", free: "Included", essential: "Included", premium: "Included" },
  { feature: "Analytics (core overview)", free: "Included", essential: "Included", premium: "Included" },
  { feature: "Analytics (advanced)", free: "Locked", essential: "Locked", premium: "Included" },
  { feature: "Trader Mind (Discipline)", free: "Locked", essential: "Included", premium: "Included" },
  { feature: "Psychology insights", free: "Locked", essential: "Locked", premium: "Included" },
  { feature: "AI Trader Coach", free: "Locked", essential: "Included (120 calls/month)", premium: "Included (Unlimited)" },
  { feature: "Dashboard AI Coach Insight", free: "Locked", essential: "Included", premium: "Included" },
  { feature: "Community", free: "Locked", essential: "Included", premium: "Included" },
  { feature: "Market Intelligence (basic)", free: "Included", essential: "Included", premium: "Included" },
  { feature: "Market Intelligence (AI)", free: "Locked", essential: "Locked", premium: "Included" },
  { feature: "Backtesting + Replay", free: "Locked", essential: "Locked", premium: "Included" },
  { feature: "Mentor AI", free: "Locked", essential: "Locked", premium: "Included" },
  { feature: "Prop Firm tracker", free: "Locked", essential: "Locked", premium: "Included" },
  {
    feature: "Reports (weekly AI performance report)",
    free: "Locked",
    essential: "Locked",
    premium: "Included",
  },
];

type IconProps = {
  className?: string;
  size?: number;
};

const FaArrowRight = ({ className, size = 12 }: IconProps) => (
  <svg aria-hidden="true" viewBox="0 0 16 16" width={size} height={size} className={className} fill="currentColor">
    <path d="M8.78 2.22a.75.75 0 1 0-1.06 1.06L11.44 7H2.75a.75.75 0 0 0 0 1.5h8.69l-3.72 3.72a.75.75 0 1 0 1.06 1.06l5-5a.75.75 0 0 0 0-1.06l-5-5Z" />
  </svg>
);

const FaCheck = ({ className, size = 12 }: IconProps) => (
  <svg aria-hidden="true" viewBox="0 0 16 16" width={size} height={size} className={className} fill="currentColor">
    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-6.25 6.25a.75.75 0 0 1-1.06 0L2.22 7.28a.75.75 0 1 1 1.06-1.06L7 9.94l5.72-5.72a.75.75 0 0 1 1.06 0Z" />
  </svg>
);

const FaFireAlt = ({ className, size = 13 }: IconProps) => (
  <svg aria-hidden="true" viewBox="0 0 16 16" width={size} height={size} className={className} fill="currentColor">
    <path d="M8.06 1.2a.75.75 0 0 1 1.3.16c.48 1.22.45 2.37.08 3.4.78-.3 1.47-.87 1.9-1.78a.75.75 0 0 1 1.34.05c1.17 2.97.6 5.59-.81 7.34A4.9 4.9 0 0 1 8 12.25a4.9 4.9 0 0 1-3.87-1.88c-1.4-1.75-1.98-4.37-.81-7.34a.75.75 0 0 1 1.34-.05c.43.9 1.12 1.48 1.9 1.78-.37-1.03-.4-2.18.08-3.4a.75.75 0 0 1 1.42-.16Z" />
  </svg>
);

const FaLayerGroup = ({ className, size = 10 }: IconProps) => (
  <svg aria-hidden="true" viewBox="0 0 16 16" width={size} height={size} className={className} fill="currentColor">
    <path d="M8.33 1.15a.75.75 0 0 0-.66 0L1.92 4.02a.75.75 0 0 0 0 1.34l5.75 2.87a.75.75 0 0 0 .66 0l5.75-2.87a.75.75 0 0 0 0-1.34L8.33 1.15ZM3.6 7.5l4.07 2.03a.75.75 0 0 0 .66 0L12.4 7.5l1.68.84a.75.75 0 0 1 0 1.34l-5.75 2.87a.75.75 0 0 1-.66 0L1.92 9.68a.75.75 0 0 1 0-1.34L3.6 7.5Zm0 3.34 4.07 2.03a.75.75 0 0 0 .66 0l4.07-2.03 1.68.84a.75.75 0 0 1 0 1.34l-5.75 2.87a.75.75 0 0 1-.66 0L1.92 13.02a.75.75 0 0 1 0-1.34l1.68-.84Z" />
  </svg>
);

const FaSyncAlt = ({ className, size = 14 }: IconProps) => (
  <svg aria-hidden="true" viewBox="0 0 16 16" width={size} height={size} className={className} fill="currentColor">
    <path d="M8 2.25a5.75 5.75 0 0 1 4.77 2.53V3.5a.75.75 0 0 1 1.5 0v3.25a.75.75 0 0 1-.75.75h-3.25a.75.75 0 0 1 0-1.5h1.62a4.25 4.25 0 1 0 .24 4.66.75.75 0 0 1 1.32.7A5.75 5.75 0 1 1 8 2.25Z" />
  </svg>
);

function formatNumericAmount(amount: number, currencyCode: CurrencyCode): string {
  if (currencyCode === "INR") {
    return `₹${amount.toLocaleString("en-IN")}`;
  }
  return `$${amount % 1 === 0 ? amount : amount.toFixed(2)}`;
}

const normalizeCodeParam = (value: string | null): string =>
  String(value || '').trim().toUpperCase();

const emitPricingEvent = (
  event: string,
  properties?: Record<string, string | number | boolean | null | undefined>,
) => {
  if (typeof window === "undefined") {
    return;
  }
  void import("@/lib/observability/client").then(({ captureClientEvent }) => {
    captureClientEvent(event, properties);
  });
};

type PricingPageClientProps = {
  initialCurrencyCode?: CurrencyCode;
};

export default function PricingPageClient({
  initialCurrencyCode = "USD",
}: PricingPageClientProps) {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const { currency, loading: currencyLoading } = useCurrency({
    initialCurrencyCode,
    fetchMode: "idle",
    idleDelayMs: 1500,
  });
  const { isAuthenticated, user } = usePublicAuthState({
    fetchMode: "idle",
    idleDelayMs: 1200,
  });
  const viewedUnlockKeysRef = useRef<Set<string>>(new Set());
  const [discountCodeFromQuery, setDiscountCodeFromQuery] = useState('');

  const currentPlanId = user?.subscription?.plan || "free";
  const currentPlanRank = PLAN_RANK[currentPlanId] ?? 0;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    setDiscountCodeFromQuery(
      normalizeCodeParam(
        params.get('code') || params.get('coupon') || params.get('ref'),
      ),
    );
  }, []);

  const getCellTone = (value: string): string => {
    if (value === "Locked" || value === "0") {
      return "text-rose-300 border-rose-400/30 bg-rose-400/10";
    }
    if (value.includes("Unlimited")) {
      return "text-emerald-200 border-emerald-300/30 bg-emerald-400/10";
    }
    if (value.includes("Included") || value === "50" || value === "500" || value === "2" || value === "3" || value === "4" || value === "7") {
      return "text-emerald-100 border-emerald-300/20 bg-emerald-300/10";
    }
    return "text-slate-200 border-white/15 bg-white/5";
  };

  useEffect(() => {
    if (!isAuthenticated) {
      viewedUnlockKeysRef.current.clear();
      return;
    }

    PRICING_TIERS.forEach((tier) => {
      const tierRank = PLAN_RANK[tier.id] ?? 0;
      if (tierRank <= currentPlanRank) {
        return;
      }
      const unlockHighlights = getUpgradeHighlights(currentPlanId, tier.id, 4);
      if (unlockHighlights.length === 0) {
        return;
      }

      const key = `${currentPlanId}->${tier.id}`;
      if (viewedUnlockKeysRef.current.has(key)) {
        return;
      }

      emitPricingEvent("upgrade_unlocks_viewed", {
        surface: "pricing",
        from_plan: currentPlanId,
        to_plan: tier.id,
        unlock_count: unlockHighlights.length,
      });
      viewedUnlockKeysRef.current.add(key);
    });
  }, [currentPlanId, currentPlanRank, isAuthenticated]);

  const handleUpgradeUnlockCtaClick = (toPlanId: string) => {
    emitPricingEvent("upgrade_unlocks_cta_clicked", {
      surface: "pricing",
      from_plan: currentPlanId,
      to_plan: toPlanId,
      billing_period: billingPeriod,
    });
  };

  return (
    <div className="min-h-screen bg-[#030605] text-white selection:bg-emerald-500/30">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-[#020403]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:184px_184px] opacity-[0.15]" />
        <div className="absolute inset-y-0 left-0 w-[33%] bg-[repeating-linear-gradient(140deg,rgba(255,255,255,0.03)_0_1px,transparent_1px_5px)] opacity-35" />
        <div className="absolute inset-y-0 right-0 w-[33%] bg-[repeating-linear-gradient(40deg,rgba(255,255,255,0.03)_0_1px,transparent_1px_5px)] opacity-35" />
        <div className="absolute left-1/2 top-[-10rem] h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-emerald-400/22 blur-[90px] md:top-[-16rem] md:h-[36rem] md:w-[36rem] md:blur-[130px]" />
        <div className="hidden md:block absolute left-[76%] top-[18%] h-[18rem] w-[18rem] rounded-full bg-cyan-300/10 blur-[100px]" />
        <div className="hidden md:block absolute left-[16%] top-[36%] h-[22rem] w-[22rem] rounded-full bg-emerald-300/10 blur-[120px]" />
        <div className="hidden md:block absolute left-1/2 top-[28rem] h-40 w-[64rem] -translate-x-1/2 rounded-[999px] bg-gradient-to-b from-emerald-200/55 via-emerald-400/24 to-transparent blur-2xl" />

        <div className="hidden md:block">
          <div className="absolute -left-24 top-0 h-[15rem] w-[22rem] rounded-[4.8rem] border border-white/10" />
          <div className="absolute left-1/2 top-0 h-[15rem] w-[25rem] -translate-x-1/2 rounded-[5rem] border border-white/10" />
          <div className="absolute -right-24 top-0 h-[15rem] w-[22rem] rounded-[4.8rem] border border-white/10" />
          <div className="absolute -left-24 top-[36%] h-[28rem] w-[22rem] rounded-[36%] border border-white/10" />
          <div className="absolute -right-24 top-[34%] h-[28rem] w-[22rem] rounded-[36%] border border-white/10" />
          <div className="absolute left-1/2 top-16 h-56 w-56 -translate-x-1/2 rounded-full border border-white/10" />
          <div className="absolute left-1/2 top-24 h-40 w-40 -translate-x-1/2 rounded-full border border-white/10" />
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-emerald-100/10 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[min(1600px,94vw)] px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/tradetaperLogo.png"
              alt="TradeTaper"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
              priority
            />
            <span className="text-xl md:text-2xl font-semibold tracking-tight text-white">TradeTaper</span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm border border-white/15 text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
              >
                Dashboard
                <FaArrowRight size={10} />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-slate-300 hover:text-white transition-colors">
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-white text-black hover:bg-emerald-50 transition-colors"
                >
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-[min(1600px,94vw)] px-6 pt-14 pb-24 md:pt-20">
        <section className="relative isolate overflow-hidden text-center mb-12 md:mb-14">
          <p className="text-xs tracking-[0.12em] uppercase text-emerald-300 mb-4">Pricing</p>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-5">
            Transparent plans built for disciplined traders.
          </h1>
          <p className="text-slate-300 max-w-3xl mx-auto">
            Same product, clear limits, backend-enforced access control. Currency:
            <span className="text-white font-medium"> {currencyLoading ? "detecting..." : currency.code}</span>.
          </p>
        </section>

        <section className="mb-10 flex flex-col items-center gap-4">
          <div className="inline-flex rounded-2xl border border-white/10 bg-black/45 p-1">
            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className={`px-5 py-2 rounded-xl text-sm transition-colors ${
                billingPeriod === "monthly" ? "bg-white text-black font-semibold" : "text-slate-300"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod("yearly")}
              className={`px-5 py-2 rounded-xl text-sm transition-colors ${
                billingPeriod === "yearly" ? "bg-white text-black font-semibold" : "text-slate-300"
              }`}
            >
              Yearly
            </button>
          </div>
          <p className="text-xs text-emerald-300 uppercase tracking-[0.1em]">Yearly plans save up to 17%</p>
        </section>

        <section className="relative isolate overflow-hidden">
          <div className="pointer-events-none absolute left-1/2 top-[32%] h-[22rem] w-[70rem] max-w-[95vw] -translate-x-1/2 rounded-full bg-emerald-400/14 blur-[90px]" />
          <div className="pointer-events-none absolute left-1/2 top-[60%] h-[16rem] w-[58rem] max-w-[92vw] -translate-x-1/2 rounded-full bg-emerald-300/10 blur-[90px]" />

          <div className="relative grid gap-5 lg:grid-cols-3 items-stretch">
          {PRICING_TIERS.map((tier) => {
            const isCurrentPlan = currentPlanId === tier.id;
            const isRecommended = Boolean(tier.recommended);
            const currentPrice = formatPlanPrice(tier.id, billingPeriod, currency.code);
            const paidPlan = tier.id !== "free";
            const tierRank = PLAN_RANK[tier.id] ?? 0;
            const isUpgradeTarget = isAuthenticated && tierRank > currentPlanRank;
            const unlockHighlights = isUpgradeTarget ? getUpgradeHighlights(currentPlanId, tier.id, 4) : [];

            const monthlyAmount = getPlanPrice(tier.id, "monthly", currency.code);
            const yearlyAmount = getPlanPrice(tier.id, "yearly", currency.code);
            const listYearlyAmount = monthlyAmount * 12;
            const yearlyDiscount = getDiscountPercentage(monthlyAmount, yearlyAmount);

            const products = tier.features.slice(0, 4);
            const extras = tier.features.slice(4);

            return (
              <article
                key={tier.id}
                className={`relative group overflow-hidden rounded-[1.8rem] border flex flex-col min-h-[44rem] transition-all duration-300 ${
                  isRecommended
                    ? "border-emerald-300/40 bg-gradient-to-b from-emerald-400/18 via-emerald-500/10 to-[#04110d] shadow-[0_35px_120px_rgba(16,185,129,0.2)]"
                    : "border-white/12 bg-black/55 hover:border-emerald-200/25 hover:bg-black/60"
                }`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ${
                    isRecommended
                      ? "opacity-100 bg-[radial-gradient(circle_at_70%_78%,rgba(16,185,129,0.28),transparent_52%)]"
                      : "group-hover:opacity-100 bg-[radial-gradient(circle_at_75%_84%,rgba(16,185,129,0.18),transparent_56%)]"
                  }`}
                />
                <div
                  className={`pointer-events-none absolute inset-x-8 top-0 h-px ${
                    isRecommended ? "bg-emerald-200/45" : "bg-white/20 group-hover:bg-emerald-200/30"
                  }`}
                />
                {isRecommended && (
                  <div className="px-6 py-4 border-b border-emerald-200/20 text-center text-sm font-semibold">
                    <span className="inline-flex items-center gap-2 text-amber-200">
                      <FaFireAlt size={13} className="text-amber-300" />
                      {yearlyDiscount}% OFF
                    </span>
                  </div>
                )}

                <div className="relative px-8 pt-8 pb-7">
                  <h3 className={`text-5xl font-semibold tracking-tight mb-3 ${isRecommended ? "text-emerald-300" : "text-white"}`}>
                    {tier.name}
                  </h3>
                  <div className="mb-4">
                    {billingPeriod === "yearly" && paidPlan ? (
                      <div className="flex items-end gap-2">
                        <span className="text-2xl text-slate-500 line-through">
                          {formatNumericAmount(listYearlyAmount, currency.code)}
                        </span>
                        <span className="text-4xl font-semibold tracking-tight text-white">{currentPrice}</span>
                        <span className="text-lg text-slate-300 mb-1">/year</span>
                      </div>
                    ) : (
                      <div className="flex items-end gap-2">
                        <span className="text-4xl font-semibold tracking-tight text-white">{currentPrice}</span>
                        {paidPlan && (
                          <span className="text-lg text-slate-300 mb-1">
                            /{billingPeriod === "monthly" ? "month" : "year"}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">Includes core journaling, analytics, and plan-specific limits.</p>
                </div>

                <div className="h-px bg-white/10" />

                <div className="relative px-8 py-6">
                  <p className="text-xs tracking-[0.08em] uppercase text-slate-400 mb-3 flex items-center gap-2">
                    <FaLayerGroup size={10} />
                    Capacity
                  </p>
                  <p className="text-slate-200 text-sm">
                    {tier.accountLimit} MetaApi auto-sync slots · {tier.tradeLimit === 0 ? "Unlimited trades" : `${tier.tradeLimit} trades/month`}
                  </p>
                </div>

                <div className="h-px bg-white/10" />

                <div className="relative px-8 py-7 flex-1 flex flex-col">
                  <p className={`text-sm font-semibold mb-4 ${isRecommended ? "text-emerald-300" : "text-slate-200"}`}>Products</p>
                  <ul className="space-y-3 mb-7">
                    {products.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-slate-200">
                        <FaCheck className={`${isRecommended ? "text-emerald-300" : "text-slate-300"} mt-1 text-[11px]`} />
                        <span className="text-[15px] leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {extras.length > 0 && (
                    <>
                      <p className={`text-sm font-semibold mb-4 ${isRecommended ? "text-emerald-300" : "text-slate-200"}`}>Extra</p>
                      <ul className="space-y-3">
                        {extras.map((feature) => (
                          <li key={feature} className="flex items-start gap-3 text-slate-300">
                            <FaCheck className={`${isRecommended ? "text-emerald-300" : "text-slate-400"} mt-1 text-[11px]`} />
                            <span className="text-[15px] leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {unlockHighlights.length > 0 && (
                    <div className="mt-6 rounded-xl border border-emerald-300/25 bg-emerald-500/10 p-4">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-emerald-200 mb-2">
                        What unlocks on upgrade
                      </p>
                      <ul className="space-y-2">
                        {unlockHighlights.map((highlight) => (
                          <li key={highlight} className="flex items-start gap-2 text-sm text-emerald-100">
                            <FaCheck className="mt-1 text-[10px] text-emerald-300" />
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-auto pt-8">
                    {isCurrentPlan ? (
                      <button
                        type="button"
                        disabled
                        className="w-full rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-slate-400"
                      >
                        Current Plan
                      </button>
                    ) : (
                      <Link
                        href={
                          isAuthenticated
                            ? `/billing?plan=${tier.id}&interval=${billingPeriod}${discountCodeFromQuery ? `&code=${encodeURIComponent(discountCodeFromQuery)}` : ''}`
                            : `/register?plan=${tier.id}${discountCodeFromQuery ? `&code=${encodeURIComponent(discountCodeFromQuery)}` : ''}`
                        }
                        onClick={() => {
                          if (isUpgradeTarget) {
                            handleUpgradeUnlockCtaClick(tier.id);
                          }
                        }}
                        className={`w-full inline-flex items-center justify-center rounded-xl py-3 text-sm font-semibold transition-colors ${
                          isRecommended
                            ? "bg-white text-black hover:bg-emerald-50"
                            : "border border-white/15 text-white hover:bg-white/5 hover:border-emerald-200/30"
                        }`}
                      >
                        {isAuthenticated ? "Choose Plan" : "Sign up"}
                      </Link>
                    )}
                    <p className="mt-4 text-center text-sm text-slate-500">
                      {tier.id === "free" ? "Start for free. No commitment." : "Keep everything you build. Cancel anytime."}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-white/12 bg-black/45 p-5 md:p-7">
          <div className="mb-5">
            <p className="text-xs tracking-[0.12em] uppercase text-emerald-300 mb-2">Plan Comparison</p>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Exactly what each plan includes</h2>
            <p className="mt-2 text-sm text-slate-300">
              This matrix matches the current backend feature gates and usage limits.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-[960px] w-full border-collapse">
              <thead>
                <tr className="bg-white/5">
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-[0.12em] text-slate-300">Feature</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-[0.12em] text-slate-300">Free</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-[0.12em] text-slate-300">Essential</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-[0.12em] text-slate-300">Premium</th>
                </tr>
              </thead>
              <tbody>
                {PLAN_COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="border-t border-white/10">
                    <td className="px-4 py-3 text-sm text-white">{row.feature}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getCellTone(row.free)}`}>
                        {row.free}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getCellTone(row.essential)}`}>
                        {row.essential}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getCellTone(row.premium)}`}>
                        {row.premium}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="relative isolate overflow-hidden mt-8 rounded-2xl border border-white/10 bg-black/40 px-6 py-5 md:px-8 md:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-sm text-slate-300 flex items-center gap-2">
            <FaSyncAlt className="text-emerald-300" />
            Extra MT5 auto-sync slots available on all plans.
          </p>
          <p className="text-sm font-semibold text-emerald-200">
            {MT5_SLOT_PRICE[currency.code].label} / slot
          </p>
        </section>

        <section className="relative isolate overflow-hidden mt-16 max-w-4xl">
          <div className="relative z-10">
            <p className="text-xs tracking-[0.12em] uppercase text-emerald-300 mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-8">Common billing questions</h2>
          </div>
          <div className="relative z-10 space-y-3">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className="group rounded-2xl border border-white/10 bg-black/35" open={false}>
                <summary className="list-none cursor-pointer px-5 py-4 flex items-center justify-between gap-3 text-base font-medium">
                  <span>{item.question}</span>
                  <span className="text-slate-400 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                </summary>
                <p className="px-5 pb-5 text-sm text-slate-300 leading-relaxed">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
