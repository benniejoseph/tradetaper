import type { Metadata } from "next";
import MarketingChrome from "@/components/marketing/MarketingChrome";
import ContentSections, { ContentCta } from "@/components/marketing/ContentSections";
import type { ContentSection, FaqItem } from "@/lib/marketingContent";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
  buildFaqPageJsonLd,
} from "@/lib/seo";

const TITLE = "Trading Journal for Indian Traders (INR Pricing) — TradeTaper";
const DESCRIPTION =
  "A trading journal built for Indian traders: automatic MT5 sync, prop-firm tracking, AI review, and simple INR pricing with Razorpay checkout.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/trading-journal-india" },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: "/trading-journal-india",
    images: [{ url: "/opengraph-image" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

const INTRO =
  "TradeTaper is a trading journal that fits how Indian traders actually work: automatic syncing from MetaTrader 5, a prop-firm challenge tracker, AI-backed review, and straightforward pricing in Indian Rupees with Razorpay checkout — no forcing dollars or unsupported brokers.";

const SECTIONS: ContentSection[] = [
  {
    heading: "Made for the MT5 and prop-firm crowd",
    body: [
      "A large share of Indian forex, metals, and prop-firm traders run MetaTrader 5. TradeTaper syncs directly from your local MT5 terminal, so your trades import automatically regardless of which broker you use — you don't need a US-centric cloud integration. That makes it a natural fit for traders taking prop-firm challenges, where a built-in tracker follows your drawdown, targets, and rules.",
    ],
  },
  {
    heading: "INR pricing and Razorpay checkout",
    body: [
      "Pricing is shown in Indian Rupees and billed through Razorpay, so you pay in your own currency with a familiar checkout — UPI, cards, and net banking — instead of wrestling with USD conversions. Start free, and upgrade to Essential or Premium when you need more accounts, AI review, or advanced analytics.",
    ],
  },
  {
    heading: "The same edge, without the friction",
    bullets: [
      "Automatic MT5 sync — every trade captured, no manual entry.",
      "R-multiple analytics to find your best setups and sessions.",
      "Risk engine and pre-trade checks to enforce disciplined sizing.",
      "AI trade review to surface patterns and mistakes in your journal.",
      "Prop-firm challenge tracking for funded-account attempts.",
    ],
  },
];

const FAQS: FaqItem[] = [
  {
    question: "Is TradeTaper available in India with INR pricing?",
    answer:
      "Yes. Pricing is available in Indian Rupees with Razorpay checkout (UPI, cards, net banking), alongside a free tier to get started.",
  },
  {
    question: "Does it work with Indian brokers and MetaTrader 5?",
    answer:
      "Yes. TradeTaper syncs from your local MT5 terminal, so it works regardless of your broker as long as you trade on MetaTrader 5.",
  },
  {
    question: "Is TradeTaper suitable for prop-firm traders in India?",
    answer:
      "Yes — it includes a prop-firm challenge tracker that monitors your drawdown, profit target, and rules alongside your journal.",
  },
];

export default function TradingJournalIndiaPage() {
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Trading Journal for Indian Traders", path: "/trading-journal-india" },
  ]);
  const webpage = buildWebPageJsonLd({ name: TITLE, path: "/trading-journal-india", description: DESCRIPTION });
  const faq = buildFaqPageJsonLd(FAQS);

  return (
    <MarketingChrome>
      <script id="ld-breadcrumb-india" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script id="ld-webpage-india" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webpage) }} />
      <script id="ld-faq-india" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <main className="mx-auto w-full max-w-3xl px-6 pb-20 pt-12">
        <h1 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
          A Trading Journal Built for Indian Traders
        </h1>
        <p className="mb-10 text-lg leading-relaxed text-slate-300">{INTRO}</p>
        <ContentSections sections={SECTIONS} faqs={FAQS} />
        <ContentCta heading="Start journaling — free, in INR" />
      </main>
    </MarketingChrome>
  );
}
