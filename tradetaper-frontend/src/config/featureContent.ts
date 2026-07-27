// src/config/featureContent.ts
import type { ContentSection, FaqItem } from "@/lib/marketingContent";

export type FeaturePage = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  h1: string;
  intro: string;
  sections: ContentSection[];
  faqs?: FaqItem[];
};

export const FEATURE_PAGES: FeaturePage[] = [
  {
    slug: "mt5-trading-journal",
    title: "MT5 Trading Journal with Automatic Sync",
    description:
      "An MT5 trading journal that syncs trades automatically from your local MetaTrader 5 terminal — no manual entry, no CSV uploads.",
    excerpt: "Automatic journaling straight from your MetaTrader 5 terminal.",
    h1: "The MT5 Trading Journal That Syncs Itself",
    intro:
      "If you trade on MetaTrader 5, manual journaling is the tax that eventually makes you quit. TradeTaper connects to your local MT5 terminal and imports every trade automatically — fills, prices, sizes, and timestamps — so the objective record is complete and honest, and you only add the reflection on top.",
    sections: [
      {
        heading: "How local MT5 sync works",
        body: [
          "A lightweight connector runs alongside your MetaTrader 5 terminal and streams your closed trades and live positions to your TradeTaper journal. Because it reads from your own terminal, it doesn't depend on your broker being on a cloud-integration list — if you can trade it on MT5, you can journal it here.",
          "Every trade lands in your journal with its real execution data, ready for you to tag the setup, rate your confidence, attach a screenshot, and note how you executed.",
        ],
      },
      {
        heading: "Why automatic beats manual",
        bullets: [
          "No transcription: fills and sizes are captured for you, accurately.",
          "No selective memory: your worst days get logged too — the ones you most need to review.",
          "Faster reviews: analytics by setup, session, and instrument are ready instantly.",
          "More reflection, less admin: spend your energy on why, not on data entry.",
        ],
      },
      {
        heading: "Built for forex, metals, and prop-firm traders",
        body: [
          "MT5 is the home of forex, metals, indices, and most prop-firm challenges. TradeTaper is built around that world: automatic sync, R-multiple analytics, risk tools, and a dedicated prop-firm tracker, so your journal speaks the same language as your trading.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does TradeTaper support MetaTrader 5?",
        answer:
          "Yes. TradeTaper syncs directly from your local MT5 terminal through a lightweight connector, importing your trades automatically without manual entry or CSV uploads.",
      },
      {
        question: "Do I need my broker to be integrated?",
        answer:
          "No. Because the connector reads from your own MT5 terminal, it works regardless of whether your broker is on any cloud-integration list.",
      },
    ],
  },
  {
    slug: "prop-firm-trading-journal",
    title: "Prop Firm Trading Journal & Challenge Tracker",
    description:
      "A prop firm trading journal that tracks your challenge drawdown, profit targets, and rules alongside your trades — built for funded traders.",
    excerpt: "Track your prop-firm challenge rules, drawdown, and targets in one place.",
    h1: "A Trading Journal Built for Prop-Firm Traders",
    intro:
      "Passing a prop-firm challenge is a risk-management exam as much as a trading one. TradeTaper pairs a full trading journal with a dedicated challenge tracker that follows your drawdown limits, profit targets, and trading rules — so you always know exactly where you stand against the firm's requirements.",
    sections: [
      {
        heading: "Know where you stand, every trade",
        body: [
          "Prop-firm rules are unforgiving: breach a daily or maximum drawdown and the account is gone, no matter how good your setups are. TradeTaper's challenge tracker keeps your current drawdown, distance to target, and remaining risk budget visible, so you can size and stop with the firm's limits in mind rather than discovering them the hard way.",
        ],
      },
      {
        heading: "Journal + discipline in one workspace",
        bullets: [
          "Automatic MT5 sync so every challenge trade is captured accurately.",
          "R-multiple analytics to prove which setups actually pass challenges.",
          "Risk engine and pre-trade checks to protect your drawdown limits.",
          "Psychology tagging to catch the revenge trades that blow challenges.",
        ],
      },
      {
        heading: "From challenge to funded",
        body: [
          "The habits that pass a challenge are the ones that keep a funded account: consistent sizing, honest review, and rule adherence. Because TradeTaper measures all three, the same workspace that gets you funded is the one that keeps you funded.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can TradeTaper track my prop-firm challenge?",
        answer:
          "Yes — a built-in challenge tracker follows your drawdown, profit target, and rules alongside your journal, so you always know your standing against the firm's requirements.",
      },
    ],
  },
  {
    slug: "ai-trade-review",
    title: "AI Trade Review & Trading Mentor",
    description:
      "AI-backed trade review that surfaces patterns, mistakes, and high-probability setups in your journal — like a mentor for your trading.",
    excerpt: "Let AI surface the patterns and mistakes hiding in your journal.",
    h1: "AI-Backed Trade Review for Faster Improvement",
    intro:
      "A journal captures the data; the hard part is reading it. TradeTaper's AI review works over your logged trades to surface recurring mistakes, behavioural patterns, and the setups that actually pay — turning weeks of trades into a short list of things to fix.",
    sections: [
      {
        heading: "Patterns you can't feel",
        body: [
          "Over a busy trading week, patterns hide in the noise. AI review reads your journal at scale — outcomes in R, tags, sessions, emotional states — and points out the signal: the setup with the best expectancy, the time of day you give money back, the emotional tag that shows up on your biggest losers.",
        ],
      },
      {
        heading: "A mentor that reads your actual trades",
        body: [
          "Generic trading advice can't see your trades. Because the AI mentor works from your own logged history, its feedback is specific to how you actually trade — what you're doing well, what's costing you, and one or two concrete changes to test next week.",
          "It complements, not replaces, your own review: you still write the honest notes; the AI helps you see the aggregate.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does AI review replace my own journaling?",
        answer:
          "No — it complements it. You still capture the subjective context; the AI reads your aggregate history to surface patterns and mistakes you'd struggle to spot by hand.",
      },
      {
        question: "Is the AI review giving financial advice?",
        answer:
          "No. It's an educational tool that analyzes your own trading data to help you review and improve your process. It is not financial advice.",
      },
    ],
  },
];

export function getFeaturePageBySlug(slug: string): FeaturePage | undefined {
  return FEATURE_PAGES.find((f) => f.slug === slug);
}
