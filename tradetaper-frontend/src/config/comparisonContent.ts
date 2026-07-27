// src/config/comparisonContent.ts
import type { ContentSection, FaqItem } from "@/lib/marketingContent";

export type ComparisonRow = {
  feature: string;
  tradetaper: string;
  competitor: string;
};

export type Comparison = {
  slug: string;
  competitor: string;
  title: string;
  description: string;
  excerpt: string;
  updated: string;
  readTime: string;
  intro: string;
  rows: ComparisonRow[];
  sections: ContentSection[];
  faqs?: FaqItem[];
};

const SHARED_NOTE =
  "Details about other products are based on their publicly documented features and can change — always check the vendor's site for the latest. TradeTaper is a research and journaling tool, not financial advice.";

export const COMPARISONS: Comparison[] = [
  {
    slug: "tradezella-alternative",
    competitor: "Tradezella",
    title: "A TradeTaper vs Tradezella Comparison (2026)",
    description:
      "Looking for a Tradezella alternative? Compare TradeTaper vs Tradezella on MT5 sync, pricing, AI review, and prop-firm support.",
    excerpt:
      "How TradeTaper compares to Tradezella — especially for MetaTrader 5, prop-firm, and non-US traders.",
    updated: "July 2026",
    readTime: "6 min",
    intro:
      "Tradezella is a popular, well-designed trading journal focused largely on US markets and cloud broker integrations. TradeTaper takes a different angle: automatic syncing straight from your local MetaTrader 5 terminal, built-in prop-firm tracking, AI-backed review, and pricing that works for traders outside the US. Here's an honest side-by-side to help you choose.",
    rows: [
      { feature: "Automatic MT5 sync", tradetaper: "Yes — direct from your local MT5 terminal", competitor: "Broker/cloud integrations; MT5 varies" },
      { feature: "Prop-firm tracking", tradetaper: "Built-in prop-firm challenge tracker", competitor: "General journaling" },
      { feature: "AI-backed review", tradetaper: "AI mentor & trade review included", competitor: "AI features on higher tiers" },
      { feature: "Risk discipline tools", tradetaper: "Risk engine + pre-trade checks", competitor: "Analytics-focused" },
      { feature: "Pricing / currency", tradetaper: "Affordable tiers, INR & USD (India-friendly)", competitor: "USD, premium positioning" },
    ],
    sections: [
      {
        heading: "Where TradeTaper fits best",
        body: [
          "If you trade on MetaTrader 5 — common for forex, metals, and prop-firm traders — TradeTaper's local terminal sync means your trades import automatically without depending on a cloud broker connection. That's a meaningful difference for traders whose broker isn't on a US-centric integration list.",
          "It's also built for the prop-firm world: a dedicated challenge tracker follows your drawdown, targets, and rules, which general-purpose journals treat as an afterthought.",
        ],
      },
      {
        heading: "Where Tradezella is strong",
        body: [
          "Tradezella is polished, mature, and has a large community, with strong analytics and a smooth experience for traders on supported US brokers. If your broker is natively integrated and you don't need MT5-terminal sync or prop-firm-specific tracking, it's a capable choice.",
        ],
      },
      {
        heading: "Bottom line",
        body: [
          "Choose based on your stack. For MetaTrader 5, prop-firm challenges, AI-assisted review, and non-US pricing, TradeTaper is the more natural fit. For a US-broker-native workflow with a big community, Tradezella is a strong incumbent. Both encourage the same winning habit: journal every trade and review it.",
          SHARED_NOTE,
        ],
      },
    ],
    faqs: [
      {
        question: "Is there a free way to try TradeTaper?",
        answer:
          "Yes — you can start free and upgrade when you need more accounts, AI review, or advanced analytics. See the pricing page for current tiers in INR and USD.",
      },
      {
        question: "Does TradeTaper work with MetaTrader 5?",
        answer:
          "Yes. TradeTaper syncs trades directly from your local MT5 terminal via a lightweight connector, so fills, prices, and sizes are captured automatically.",
      },
    ],
  },
  {
    slug: "edgewonk-alternative",
    competitor: "Edgewonk",
    title: "A TradeTaper vs Edgewonk Comparison (2026)",
    description:
      "Considering an Edgewonk alternative? Compare TradeTaper vs Edgewonk on automatic sync, AI review, prop-firm tracking, and ease of use.",
    excerpt:
      "How TradeTaper compares to Edgewonk — automatic sync and AI review versus manual, deep customization.",
    updated: "July 2026",
    readTime: "6 min",
    intro:
      "Edgewonk is a long-standing, analytics-heavy journal known for deep customization and a one-account, manual-first workflow. TradeTaper emphasizes automatic MT5 sync, AI-assisted review, prop-firm tracking, and a modern, low-friction experience. Here's how they compare.",
    rows: [
      { feature: "Trade import", tradetaper: "Automatic from local MT5 terminal", competitor: "Largely manual / CSV import" },
      { feature: "AI-backed review", tradetaper: "AI mentor & trade review", competitor: "Manual analytics" },
      { feature: "Prop-firm tracking", tradetaper: "Built-in challenge tracker", competitor: "Not specialized" },
      { feature: "Experience", tradetaper: "Modern, low-friction UI", competitor: "Powerful but data-entry heavy" },
      { feature: "Risk tools", tradetaper: "Risk engine + pre-trade checks", competitor: "Custom stats, self-directed" },
    ],
    sections: [
      {
        heading: "Automatic vs manual journaling",
        body: [
          "The biggest practical difference is friction. Edgewonk's manual workflow gives you total control and forces deliberate reflection, but manual entry is also the number-one reason traders abandon a journal. TradeTaper captures the objective trade data automatically from your MT5 terminal, so you spend your energy on the reflection — reasoning, screenshots, tags — rather than transcription.",
        ],
      },
      {
        heading: "Who should pick which",
        body: [
          "If you love hand-crafting a bespoke analytics setup and don't mind manual entry, Edgewonk is genuinely deep. If you want your trades to import themselves, AI to help surface patterns, and built-in prop-firm tracking, TradeTaper removes the friction that stops most people from keeping the habit.",
          SHARED_NOTE,
        ],
      },
    ],
    faqs: [
      {
        question: "Does TradeTaper import trades automatically?",
        answer:
          "Yes — from your local MetaTrader 5 terminal via a lightweight connector, so you don't have to enter trades by hand or upload CSVs.",
      },
    ],
  },
  {
    slug: "tradersync-alternative",
    competitor: "TraderSync",
    title: "A TradeTaper vs TraderSync Comparison (2026)",
    description:
      "Searching for a TraderSync alternative? Compare TradeTaper vs TraderSync on MT5 sync, prop-firm tracking, AI review, and pricing.",
    excerpt:
      "How TradeTaper compares to TraderSync — MT5-first sync and prop-firm tracking versus broad broker integrations.",
    updated: "July 2026",
    readTime: "6 min",
    intro:
      "TraderSync is a feature-rich journal with broad broker integrations and solid analytics, popular with US equities and options traders. TradeTaper is MT5-first, with local-terminal sync, prop-firm challenge tracking, AI review, and India-friendly pricing. Here's the comparison.",
    rows: [
      { feature: "MT5 terminal sync", tradetaper: "Direct local-terminal sync", competitor: "Broker integrations; MT5 varies" },
      { feature: "Prop-firm tracking", tradetaper: "Built-in challenge tracker", competitor: "General journaling" },
      { feature: "AI-backed review", tradetaper: "Included AI mentor & review", competitor: "AI features by tier" },
      { feature: "Pricing / currency", tradetaper: "Affordable, INR & USD", competitor: "USD tiers" },
      { feature: "Best for", tradetaper: "Forex / metals / prop-firm on MT5", competitor: "US equities & options" },
    ],
    sections: [
      {
        heading: "Different markets, different fit",
        body: [
          "TraderSync shines for US equities and options traders who want wide broker coverage. TradeTaper is built around MetaTrader 5 and the prop-firm ecosystem — forex, metals, indices — where local-terminal sync and challenge tracking matter more than a long list of US-broker integrations.",
        ],
      },
      {
        heading: "Bottom line",
        body: [
          "Match the tool to your market. If you're a US equities/options trader, TraderSync's integrations are compelling. If you trade on MT5, run prop-firm challenges, or want AI-assisted review with non-US pricing, TradeTaper is the closer fit.",
          SHARED_NOTE,
        ],
      },
    ],
    faqs: [
      {
        question: "Is TradeTaper good for prop-firm traders?",
        answer:
          "Yes — it includes a prop-firm challenge tracker that follows your drawdown, profit targets, and rules alongside your journal, which general journals don't specialize in.",
      },
    ],
  },
  {
    slug: "tradervue-alternative",
    competitor: "Tradervue",
    title: "A TradeTaper vs Tradervue Comparison (2026)",
    description:
      "Looking for a Tradervue alternative? Compare TradeTaper vs Tradervue on MT5 sync, prop-firm tracking, AI review, and pricing.",
    excerpt:
      "How TradeTaper compares to Tradervue — modern MT5-first journaling versus a long-established incumbent.",
    updated: "July 2026",
    readTime: "6 min",
    intro:
      "Tradervue is one of the longest-running trading journals, with a large user base and deep history among US equities and futures traders. TradeTaper is a newer, MT5-first alternative built around automatic local-terminal sync, prop-firm challenge tracking, and AI-assisted review. Here's how they compare.",
    rows: [
      { feature: "MT5 terminal sync", tradetaper: "Direct local-terminal sync, any broker", competitor: "Broker integrations; MT5 varies" },
      { feature: "Prop-firm tracking", tradetaper: "Built-in challenge tracker", competitor: "General journaling" },
      { feature: "AI-backed review", tradetaper: "AI mentor reads your trade history", competitor: "Manual analytics" },
      { feature: "Interface", tradetaper: "Modern, low-friction UI", competitor: "Established, utilitarian" },
      { feature: "Pricing / currency", tradetaper: "Free tier; INR & USD", competitor: "USD tiers" },
    ],
    sections: [
      {
        heading: "Maturity versus modern workflow",
        body: [
          "Tradervue's biggest strength is longevity: it's proven, stable, and widely used, with years of refinement behind its analytics and broad support for US brokers. If you trade US equities or futures through a natively supported broker, that track record counts for a lot.",
          "TradeTaper's advantage is workflow. Local MT5 terminal sync means trades import automatically no matter which broker you use — important for forex, metals, and prop-firm traders whose brokers rarely appear on US-centric integration lists. Add the prop-firm challenge tracker and AI review over your own trade history, and it fits a different kind of trader.",
        ],
      },
      {
        heading: "Bottom line",
        body: [
          "Pick by platform and market. US equities/futures on a supported broker: Tradervue is a dependable, battle-tested choice. MetaTrader 5, forex/metals, prop-firm challenges, or you want AI-assisted review and INR pricing: TradeTaper is the closer fit.",
          "Details about other products are based on their publicly documented features and can change — always check the vendor's site for the latest. TradeTaper is a research and journaling tool, not financial advice.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is there a good Tradervue alternative for MetaTrader 5?",
        answer:
          "TradeTaper syncs directly from your local MT5 terminal, so trades import automatically regardless of broker — a common gap for traders whose broker isn't natively integrated elsewhere.",
      },
    ],
  },
];

export function getComparisonBySlug(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}
