// src/config/landingContent.ts
// Commercial landing pages targeting validated keywords (SE Ranking data,
// July 2026). Each entry notes its target keyword + monthly volume/difficulty.
import type { ContentSection, FaqItem } from "@/lib/marketingContent";

export type LandingPage = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: ContentSection[];
  faqs?: FaqItem[];
};

export const LANDING_PAGES: LandingPage[] = [
  {
    // Target: "best trading journal" (US 480/mo, KD 37) + "best trading journal app" (110, KD 26)
    slug: "best-trading-journal",
    title: "The Best Trading Journal Apps in 2026 (Compared)",
    description:
      "A practical comparison of the best trading journal apps in 2026 — automatic sync, analytics, prop-firm tracking, and pricing compared side by side.",
    h1: "The Best Trading Journals in 2026",
    intro:
      "Every trading journal promises to make you a better trader. What actually separates them is friction: how much data you have to enter by hand, whether your platform is supported, and whether the analytics tell you something you can act on. Here's an honest look at the leading options and who each one suits.",
    sections: [
      {
        heading: "What makes a trading journal worth using",
        body: [
          "Before comparing tools, it's worth being clear about what matters. Nearly every journal can store a list of trades. The ones that change your results do three things well:",
        ],
        bullets: [
          "Automatic trade import — manual entry is the single biggest reason traders abandon journaling. If your fills, sizes, and timestamps import themselves, the record stays complete and honest.",
          "Analytics in R-multiples — performance measured as a multiple of risk, broken down by setup, session, and instrument, so you can see which strategies actually carry an edge.",
          "Discipline enforcement — risk rules, position sizing, and adherence tracking, not just a pretty chart of past P&L.",
        ],
      },
      {
        heading: "TradeTaper — best for MetaTrader 5 and prop-firm traders",
        body: [
          "TradeTaper syncs directly from your local MetaTrader 5 terminal, so trades import automatically regardless of which broker you use — no cloud-integration allowlist to be on. It pairs that with a prop-firm challenge tracker (drawdown, targets, rules), an AI review layer that reads your logged history to surface patterns, and a risk engine with pre-trade checks.",
          "It's the strongest fit if you trade forex, metals, or indices on MT5, run prop-firm challenges, or want pricing in INR with a familiar checkout. Start free, upgrade when you need more accounts or AI review.",
        ],
      },
      {
        heading: "Tradervue — the long-standing incumbent",
        body: [
          "Tradervue is one of the oldest and most established journals, with broad broker support and a large user base, particularly among US equities and futures traders. It's a safe, mature choice if your broker is natively supported and you want a proven tool with deep history.",
        ],
      },
      {
        heading: "Tradezella — polished and community-driven",
        body: [
          "Tradezella offers a modern interface, solid analytics, and an active community. It's well suited to traders on supported US brokers who value a smooth experience and don't specifically need MT5 terminal sync or prop-firm challenge tracking.",
        ],
      },
      {
        heading: "TraderSync — broad integrations",
        body: [
          "TraderSync covers a wide range of brokers and is popular with US equities and options traders. If integration breadth across US brokers is your main criterion, it's a strong contender.",
        ],
      },
      {
        heading: "Edgewonk — deep, manual, customizable",
        body: [
          "Edgewonk is analytics-heavy and highly customizable, built around a manual-first workflow. Traders who enjoy hand-crafting a bespoke stats setup and don't mind data entry get real depth here; traders who want automation will find the manual work a barrier.",
        ],
      },
      {
        heading: "How to choose",
        bullets: [
          "Trade on MetaTrader 5, or run prop-firm challenges → TradeTaper.",
          "US equities or options with a natively supported broker → Tradervue, Tradezella, or TraderSync.",
          "You want maximum customization and don't mind manual entry → Edgewonk.",
          "You want AI-assisted review of your own trade history → TradeTaper.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the best trading journal app?",
        answer:
          "It depends on your platform. For MetaTrader 5, forex/metals, and prop-firm traders, TradeTaper is the strongest fit thanks to local terminal sync and a built-in challenge tracker. For US equities and options on natively supported brokers, Tradervue, Tradezella, and TraderSync are all capable choices.",
      },
      {
        question: "Is there a free trading journal?",
        answer:
          "Yes — TradeTaper has a free tier you can start with, and several competitors offer limited free plans or trials. A spreadsheet is also free, but manual entry is the main reason most traders stop journaling.",
      },
      {
        question: "Do I need a trading journal if I already use a broker statement?",
        answer:
          "Broker statements record what happened, not why. A journal adds the setup, your reasoning, your emotional state, and rule adherence — the context that turns a list of trades into something you can actually learn from.",
      },
    ],
  },
  {
    // Target cluster: "trading journal excel" (320, KD 13), "trading journal spreadsheet" (110, KD 21),
    // "trading journal google sheets" (70, KD 10), "trading journal template" (India 480, KD 30)
    slug: "trading-journal-template",
    title: "Trading Journal Template (Excel & Google Sheets Guide)",
    description:
      "Build a trading journal template in Excel or Google Sheets — the exact columns to use, formulas for R-multiples and expectancy, and when to move beyond a spreadsheet.",
    h1: "Trading Journal Template for Excel & Google Sheets",
    intro:
      "A spreadsheet is a perfectly good place to start journaling — it's free, flexible, and yours. This guide gives you the exact column structure to use, the formulas that make the data meaningful, and an honest note on when a spreadsheet stops being enough.",
    sections: [
      {
        heading: "The columns your template needs",
        body: [
          "Most spreadsheet journals fail because they record too much of the wrong thing. These are the columns that actually earn their place:",
        ],
        bullets: [
          "Date, instrument, and direction (long/short).",
          "Entry price, stop-loss, exit price, and position size.",
          "Risk in currency — the distance from entry to stop, multiplied by size.",
          "Outcome in R — profit or loss divided by that risk amount. This is the most important column.",
          "Setup or strategy name — so you can group and compare expectancy.",
          "Confidence (1–5) recorded at entry, before you know the result.",
          "Emotional state and a mistake tag (e.g. 'moved stop', 'oversized', 'no plan').",
          "A one-line note on execution quality, separate from the outcome.",
        ],
      },
      {
        heading: "The formulas that make it useful",
        body: [
          "Raw rows don't teach you anything; the aggregates do. Add a summary sheet with these:",
        ],
        bullets: [
          "R-multiple: (Exit − Entry) × Size ÷ Risk, sign-adjusted for direction.",
          "Win rate: COUNTIF of R > 0 divided by total trades.",
          "Average win (R) and average loss (R): AVERAGEIF on the R column.",
          "Expectancy: (Win rate × Avg win R) − (Loss rate × Avg loss R). This single number tells you whether the system pays.",
          "Expectancy by setup: the same formula filtered per strategy name — this is where you learn what to trade more of.",
        ],
      },
      {
        heading: "Excel vs Google Sheets",
        body: [
          "Functionally they're equivalent for journaling. Google Sheets wins on access — it syncs across devices, so you can log a trade from your phone and review on a laptop without file juggling. Excel wins on speed with very large datasets and offline use. Either is fine; pick the one you'll actually open.",
        ],
      },
      {
        heading: "When to move beyond a spreadsheet",
        body: [
          "Spreadsheets break down on three fronts. First, manual entry: after a busy session, transcribing every fill is the task most people quietly skip — and the days you skip are usually your worst ones, exactly the data you need. Second, screenshots and tagging get unwieldy fast. Third, slicing performance by setup, session, and instrument turns into pivot-table maintenance instead of trading.",
          "That's the point to move to a dedicated journal. TradeTaper imports trades automatically from your MetaTrader 5 terminal, computes R-multiples and expectancy for you, and keeps screenshots, tags, and risk rules in one place — so the discipline survives a busy week.",
        ],
      },
    ],
    faqs: [
      {
        question: "How do I create a trading journal in Excel?",
        answer:
          "Create one row per trade with columns for date, instrument, direction, entry, stop, exit, size, risk, R-multiple, setup, confidence, and a notes/mistake tag. Then add a summary sheet calculating win rate, average win and loss in R, and expectancy — overall and per setup.",
      },
      {
        question: "Is a spreadsheet trading journal good enough?",
        answer:
          "It's a good place to start and far better than not journaling. Its limits are manual entry (which causes most people to quit), awkward screenshot handling, and the effort of slicing performance by setup or session. When those become the bottleneck, a dedicated journal with automatic import is worth it.",
      },
      {
        question: "What should I calculate in a trading journal template?",
        answer:
          "At minimum: R-multiple per trade, win rate, average win and average loss in R, and expectancy. Expectancy per setup is the most actionable number — it tells you which strategies to keep and which to cut.",
      },
    ],
  },
  {
    // Target: "trading journal app" (US 390 KD 27; India 480 KD 21, trending up 210→480)
    slug: "trading-journal-app",
    title: "Trading Journal App with Automatic Trade Sync",
    description:
      "A trading journal app that imports trades automatically from MetaTrader 5, computes R-multiple analytics, and tracks prop-firm rules — free to start.",
    h1: "A Trading Journal App That Does the Data Entry for You",
    intro:
      "The best trading journal app is the one you keep using in month three. That almost always comes down to friction: if logging trades is a chore, it stops happening. TradeTaper imports your trades automatically, so the only thing you add is the thinking.",
    sections: [
      {
        heading: "Automatic import, not data entry",
        body: [
          "TradeTaper connects to your local MetaTrader 5 terminal and pulls in every closed trade — instrument, entry and exit price, size, timestamps — without manual typing or CSV uploads. Because it reads from your own terminal rather than a cloud broker integration, it works with whichever broker you use.",
          "What you add on top is the part that actually improves your trading: the setup, your reasoning, a confidence rating, a screenshot, and an honest note on execution.",
        ],
      },
      {
        heading: "Analytics that answer real questions",
        bullets: [
          "Expectancy and win rate per setup, so you know what to trade more of.",
          "Performance by session, instrument, and day of week.",
          "R-multiple reporting that stays comparable as your account size changes.",
          "Drawdown and risk-adherence tracking to keep sizing honest.",
        ],
      },
      {
        heading: "Built for how modern traders work",
        body: [
          "Beyond the journal itself, TradeTaper includes an AI review layer that reads your logged history and surfaces recurring mistakes and behavioural patterns, plus a prop-firm challenge tracker for funded-account attempts. Pricing is available in INR with Razorpay checkout as well as USD, and there's a free tier to start.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is there a free trading journal app?",
        answer:
          "Yes — TradeTaper offers a free tier so you can start journaling without a subscription, then upgrade when you need more accounts, AI review, or advanced analytics.",
      },
      {
        question: "Does the app import trades automatically?",
        answer:
          "Yes. It syncs directly from your local MetaTrader 5 terminal via a lightweight connector, so trades import with accurate fills, sizes, and timestamps — no manual entry or CSV uploads.",
      },
    ],
  },
  {
    // Target: "options trading journal" (US 210/mo, KD 16 — low difficulty)
    slug: "options-trading-journal",
    title: "Options Trading Journal — Track Strategies & Performance",
    description:
      "An options trading journal to log spreads, track performance by strategy and expiry, and measure expectancy in R-multiples.",
    h1: "An Options Trading Journal Built for Real Strategies",
    intro:
      "Options journaling has a problem stock journaling doesn't: a single position can be four legs, and P&L alone tells you almost nothing about whether the thesis was right. A good options journal records the structure, not just the fill.",
    sections: [
      {
        heading: "What to log on an options trade",
        bullets: [
          "The strategy structure — long call, vertical spread, iron condor, calendar, and so on.",
          "Underlying, expiry, and strikes, so you can group by tenor and moneyness.",
          "Net debit or credit, plus maximum risk and maximum reward on the position.",
          "Your thesis: direction, volatility view, and time horizon.",
          "Outcome in R — profit or loss as a multiple of the capital you actually put at risk.",
        ],
      },
      {
        heading: "Measure by strategy, not by ticker",
        body: [
          "The most useful thing an options journal tells you is which structures actually pay for you. Grouping outcomes by strategy — rather than by underlying — often reveals that your credit spreads carry the edge while your long premium bleeds, or that your winners cluster in a specific tenor. That's a decision you can act on immediately.",
          "Tracking in R-multiples keeps this comparable across position sizes and account growth, so a good month doesn't flatter a weak strategy.",
        ],
      },
      {
        heading: "Discipline is where options accounts are won",
        body: [
          "Defined-risk structures make it easy to feel safe while quietly oversizing. Recording risk-per-trade on every position, and reviewing your adherence weekly, keeps the sizing honest — which matters more over a year than any single trade idea. TradeTaper's risk tools and pre-trade checks are built for exactly that loop.",
        ],
      },
    ],
    faqs: [
      {
        question: "How do I journal options trades?",
        answer:
          "Record the full structure (strategy type, strikes, expiry), your net debit or credit, maximum risk and reward, your thesis, and the outcome in R-multiples. Then group performance by strategy type rather than by underlying to see which structures carry your edge.",
      },
      {
        question: "Should options P&L be tracked in dollars or R?",
        answer:
          "R-multiples. Expressing profit and loss as a multiple of the capital at risk keeps trades comparable across position sizes and account growth, which is what makes expectancy per strategy meaningful.",
      },
    ],
  },
  {
    // Target: "forex trading journal" (US 210/mo, KD 29)
    slug: "forex-trading-journal",
    title: "Forex Trading Journal with Automatic MT5 Sync",
    description:
      "A forex trading journal that syncs automatically from MetaTrader 5 — track pairs, sessions, and R-multiple performance without manual entry.",
    h1: "A Forex Trading Journal That Syncs From MetaTrader 5",
    intro:
      "Forex traders have a specific journaling problem: the market runs 24 hours across three sessions, most trading happens on MetaTrader, and pip-based P&L hides what's really going on. A forex journal has to speak that language.",
    sections: [
      {
        heading: "Automatic sync from your MT5 terminal",
        body: [
          "TradeTaper connects to your local MetaTrader 5 terminal and imports every trade automatically — pair, direction, entry and exit, lot size, and timestamps. Because it reads from your own terminal, it works with any broker you trade through, which matters in forex where broker choice varies enormously by region.",
        ],
      },
      {
        heading: "Session and pair analysis",
        body: [
          "The two dimensions that most often explain a forex trader's results are session and pair. Journaling both lets you answer concrete questions: does your edge live in London or New York? Are you giving back profits in the Asian range? Do majors treat you better than crosses?",
          "Because outcomes are recorded in R-multiples rather than pips, comparisons stay fair across pairs with different volatility and pip values.",
        ],
      },
      {
        heading: "Risk discipline for leveraged markets",
        body: [
          "Leverage makes forex unforgiving of sloppy sizing. Logging risk-per-trade as a percentage of equity — and reviewing how often you actually stuck to it — turns the 1% rule from an intention into a measurable habit. Add a prop-firm challenge tracker if you're trading a funded account, and the same journal covers your drawdown limits too.",
        ],
      },
    ],
    faqs: [
      {
        question: "What should a forex trading journal track?",
        answer:
          "Pair, direction, entry/stop/exit, lot size, session, setup, and the outcome in R-multiples rather than pips. Session and pair breakdowns are usually the most revealing dimensions for forex traders.",
      },
      {
        question: "Does TradeTaper work with MetaTrader 5 for forex?",
        answer:
          "Yes — it syncs directly from your local MT5 terminal, so trades import automatically regardless of which forex broker you use.",
      },
    ],
  },
  {
    // Target: "trade journal free" (US 480/mo, KD 21, relevance 32 — highest
    // relevance in the SE Ranking set) + "best free trading journal" (170, KD 29)
    slug: "free-trading-journal",
    title: "Free Trading Journal — Log and Review Trades at No Cost (2026)",
    description:
      "A genuinely free trading journal: automatic MT5 sync, unlimited manual trades, and real analytics. What the free tier includes and where its limits are.",
    h1: "A Free Trading Journal That Isn't Crippled",
    intro:
      "Most \"free\" trading journals are trial windows or demos with the useful parts locked behind a paywall. That is a reasonable business model, but it makes it hard to judge whether journaling will actually help you before you commit money. This page sets out exactly what TradeTaper's free tier includes, exactly where the limits are, and how it compares to the free alternatives — so you can decide without signing up first.",
    sections: [
      {
        heading: "What you get without paying",
        body: [
          "The free tier is meant to be enough to build the habit and prove the value to yourself. That means the core loop — record a trade, add your reasoning, review the aggregate — works without a card.",
        ],
        bullets: [
          "Unlimited manually logged trades — no cap on how much history you keep",
          "Automatic import from your local MetaTrader 5 terminal",
          "Core analytics: win rate, average R, expectancy, and per-setup breakdowns",
          "Notes, screenshots and emotional tagging on every entry",
          "Export your data at any time — it is your record, not ours",
        ],
      },
      {
        heading: "Where the free tier actually stops",
        body: [
          "Being straight about limits is more useful than a feature grid. The free tier is capped on the expensive parts — the AI review passes that call a language model on your trade history, and the number of broker accounts you can sync at once. Everything that costs us little to run stays open.",
          "If you are a single-account discretionary trader who wants an honest record and weekly review, the free tier is likely all you need indefinitely. If you run several prop-firm accounts, or you want AI-written reviews of every trade, that is where paying starts to make sense.",
        ],
      },
      {
        heading: "Free journal vs. a spreadsheet",
        body: [
          "A spreadsheet is free too, and for the first few weeks it is genuinely competitive — you control the columns and there is nothing to learn. The problem shows up around trade fifty, when entry becomes a chore you skip on bad days, and again when you want to group by setup and compute expectancy without writing formulas.",
          "The specific thing a journal buys you over a spreadsheet is that the objective half is captured for you. Automatic sync means the numbers are complete and correct even on the days you would rather not look, which are exactly the days worth reviewing. If you would rather start in Excel, that is a perfectly sound way to begin — our template is free too.",
        ],
      },
      {
        heading: "Free alternatives worth knowing about",
        body: [
          "TradeZella, Tradervue, TraderSync and Edgewonk all have free or trial tiers with different shapes. Tradervue's free plan is long-standing and generous on trade count but limited on analytics. TraderSync and TradeZella lean on time-limited trials. Edgewonk is paid-only with a one-off licence rather than a subscription.",
          "The honest summary: if you trade US equities through a supported broker, several of these will import your trades as easily as we do. Our advantage is narrower and specific — direct sync from a local MT5 terminal regardless of broker, which matters mostly to forex, metals and prop-firm traders.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is TradeTaper's free trading journal actually free?",
        answer:
          "Yes — no card required and no time limit. Unlimited manual trades, MT5 sync and core analytics stay free. The paid tiers add AI trade reviews and multiple simultaneous broker accounts.",
      },
      {
        question: "Is there a trade limit on the free plan?",
        answer:
          "No. You can log and keep unlimited trades on the free tier. The limits are on AI review volume and how many broker accounts sync at once, not on your history.",
      },
      {
        question: "Can I export my data if I stop using it?",
        answer:
          "Yes, at any time and on any tier. Your trade history is exportable, so you are never locked in by your own record.",
      },
      {
        question: "What is the best free trading journal?",
        answer:
          "It depends on what you trade. For US equities through a mainstream broker, Tradervue's free tier is a strong option. For forex, metals or prop-firm accounts on MetaTrader 5, direct terminal sync matters more than anything else, which is where TradeTaper is built to fit.",
      },
    ],
  },
];

export function getLandingPageBySlug(slug: string): LandingPage | undefined {
  return LANDING_PAGES.find((p) => p.slug === slug);
}
