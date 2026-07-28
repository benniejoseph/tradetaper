// src/config/blogContent.ts
import type { ContentSection, FaqItem } from "@/lib/marketingContent";

export type BlogPost = {
  slug: string;
  title: string;
  /** Meta description (~150-160 chars) */
  description: string;
  /** Short summary for list cards */
  excerpt: string;
  category: string;
  updated: string;
  readTime: string;
  /** Lead paragraph shown under the H1 */
  intro: string;
  sections: ContentSection[];
  faqs?: FaqItem[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-to-keep-a-trading-journal",
    title: "How to Keep a Trading Journal (2026 Guide)",
    description:
      "A step-by-step guide to keeping a trading journal: what to log, how to review it, and how to turn journal data into a measurable edge.",
    excerpt:
      "The complete, practical guide to building a trading journal habit that actually improves your results.",
    category: "Fundamentals",
    updated: "July 2026",
    readTime: "9 min",
    intro:
      "A trading journal is the single highest-leverage habit most traders never build. It converts a blur of trades into a dataset you can learn from — turning “I think I overtrade on Mondays” into a number you can prove and fix. This guide walks through exactly how to keep one, what to record, and how to review it so the effort compounds into real improvement.",
    sections: [
      {
        heading: "Why a trading journal matters",
        body: [
          "Markets give you noisy, delayed, and emotionally loaded feedback. You can follow your plan perfectly and still lose, or break every rule and get paid. Over a handful of trades, outcome tells you almost nothing about process. A journal separates the two: it records what you did and why, so you can judge your decisions independently of whether any single trade won.",
          "Once you have 50–100 logged trades, patterns you could never feel start to show up in the data — the setups that actually pay, the times of day you give money back, the position sizes where discipline breaks down. That is where the edge lives, and it is invisible without a record.",
        ],
      },
      {
        heading: "Manual journal vs. automatic sync",
        body: [
          "You can journal in a spreadsheet, and many great traders started there. The problem is friction and accuracy: manual entry is slow, it happens hours after the trade when memory has faded, and it is easy to quietly skip your worst days — exactly the ones you most need to review.",
          "Automatic syncing solves the accuracy half. When trades import straight from your platform — every fill, price, size, and timestamp — the objective data is complete and honest by default. You then add the subjective layer (your reasoning, your emotional state, screenshots) on top. TradeTaper syncs directly from your local MetaTrader 5 terminal, so the numbers are captured for you and you spend your time on reflection, not data entry.",
        ],
      },
      {
        heading: "A simple journaling workflow",
        body: [
          "The best journal is the one you actually keep, so start light and add depth as the habit sticks. A workflow that survives contact with a busy trading week looks like this:",
        ],
        bullets: [
          "Before the trade: note the setup, your entry/stop/target, and the one reason you are taking it.",
          "At the moment of entry: capture a chart screenshot and your confidence level (1–5).",
          "After the trade: record the outcome in R-multiples (how many multiples of your risk you made or lost), not just dollars.",
          "Same day: write one honest sentence about how you executed — not how it turned out.",
          "Weekly: review the week's trades together, tag recurring mistakes, and pick one thing to fix next week.",
        ],
      },
      {
        heading: "Reviewing your journal (where the edge appears)",
        body: [
          "Logging is only half the job; the review is where improvement happens. Once a week, filter your trades and ask concrete questions: Which setup has the best expectancy? What is your win rate and average R when you follow your plan versus when you don't? Are your losses clustered around a time, an instrument, or an emotional state?",
          "Group by dimension — setup, session, day of week, instrument, position size — and let the averages talk. You are hunting for the two or three things that, changed, would move your equity curve the most. Then you write those down as rules and check next week whether you followed them.",
        ],
      },
      {
        heading: "Turn insights into rules, then measure adherence",
        body: [
          "Insight without enforcement fades by Tuesday. The final loop is to convert what you learn into explicit, checkable rules — “no trades in the first 15 minutes,” “max 1% risk per trade,” “no adding to losers” — and then measure how often you actually follow them. Rule-adherence is a metric you can improve deliberately, and it usually matters more than any indicator.",
          "This is the compounding part. Journal → review → rule → adherence → journal again. Each loop tightens your process, and because it is all measured, you can see the discipline improving even during a losing stretch.",
        ],
      },
    ],
    faqs: [
      {
        question: "How often should I update my trading journal?",
        answer:
          "Log the objective trade data the same day (or automatically, if it syncs), and do a deeper subjective review once a week. Daily capture keeps memory fresh; the weekly review is where you find patterns and set the next week's focus.",
      },
      {
        question: "Should I journal in R-multiples or dollars?",
        answer:
          "Use R-multiples (profit or loss as a multiple of the amount you risked). Dollars change with account size and position size, which hides your real performance. R normalizes every trade so you can compare setups fairly and measure expectancy.",
      },
      {
        question: "Do I need journaling software or is a spreadsheet enough?",
        answer:
          "A spreadsheet works to start. You'll outgrow it once you want automatic trade import, tagging, analytics by setup/session, and screenshots in one place. Dedicated journals like TradeTaper remove the manual-entry friction that causes most people to quit.",
      },
    ],
  },
  {
    slug: "what-to-record-in-a-trading-journal",
    title: "What to Record in a Trading Journal",
    description:
      "The exact fields to log in a trading journal — objective trade data plus the subjective context that makes reviews useful.",
    excerpt:
      "A field-by-field checklist of what to capture on every trade so your reviews actually reveal something.",
    category: "Fundamentals",
    updated: "July 2026",
    readTime: "6 min",
    intro:
      "A journal is only as useful as the fields you capture. Too little and your reviews are guesswork; too much and you stop journaling. Here is the balanced set of data points that make reviews genuinely useful, split into the objective facts and the subjective context.",
    sections: [
      {
        heading: "Objective trade data (capture this automatically)",
        body: [
          "This is the factual record of what happened. If your journal syncs from your platform, all of it is captured for you with no room for selective memory:",
        ],
        bullets: [
          "Instrument, direction, and date/time of entry and exit.",
          "Entry price, exit price, stop-loss, and take-profit levels.",
          "Position size and the resulting risk in currency and in R.",
          "Outcome in R-multiples, plus fees and swap where relevant.",
          "Duration in the trade and maximum adverse/favorable excursion if available.",
        ],
      },
      {
        heading: "Subjective context (add this yourself)",
        body: [
          "The objective data tells you what; the subjective layer tells you why — and that is what makes patterns fixable. Add:",
        ],
        bullets: [
          "The setup or strategy name (so you can measure expectancy per setup).",
          "Your reason for the trade in one sentence.",
          "A confidence rating (1–5) taken at entry, before you know the outcome.",
          "Your emotional state — calm, rushed, revenge, bored, FOMO.",
          "A chart screenshot at entry, and ideally at exit.",
          "A one-line, honest note on execution quality, separate from the P&L.",
        ],
      },
      {
        heading: "Tags that make reviews searchable",
        body: [
          "Freeform notes are hard to analyze in bulk. A small, consistent set of tags turns your journal into something you can filter and aggregate. Tag mistakes (“moved stop,” “no plan,” “oversized”), conditions (“news,” “trend,” “range”), and sessions (“London,” “NY”). Then a weekly review is one filter away from telling you which mistake is costing you the most.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the single most important field to log?",
        answer:
          "Outcome in R-multiples and the setup name. Together they let you calculate expectancy per strategy — the number that tells you what to do more of and what to cut.",
      },
      {
        question: "Should I record my emotional state?",
        answer:
          "Yes. Emotional tags are how you discover that, say, most of your worst trades happen when you're trading to 'get back' a loss. You can't fix a pattern you never wrote down.",
      },
    ],
  },
  {
    slug: "trading-psychology-journaling",
    title: "Trading Psychology: Journaling Your Way Out of Emotional Trading",
    description:
      "How to use a trading journal to spot and break emotional trading patterns like revenge trades, FOMO, and oversizing.",
    excerpt:
      "Emotional trades feel invisible in the moment. A journal makes them countable — and countable problems are fixable.",
    category: "Psychology",
    updated: "July 2026",
    readTime: "7 min",
    intro:
      "Most blown accounts aren't a strategy failure — they're a psychology failure: the revenge trade after a loss, the oversized position on a 'sure thing,' the FOMO entry chasing a move that already ran. These feel invisible in the moment. A journal makes them countable, and countable problems are the ones you can actually solve.",
    sections: [
      {
        heading: "Name the pattern before you can break it",
        body: [
          "Emotional trades don't announce themselves — they feel justified while you're making them. The job of the journal is to make the pattern undeniable after the fact. By tagging emotional state and mistakes on every trade, you can pull up a filtered view at the end of the week and see, in black and white, that your revenge trades have a negative expectancy while your planned trades are profitable.",
          "That contrast is the intervention. It's much harder to take the next revenge trade once you've seen the exact amount those trades have cost you over the last three months.",
        ],
      },
      {
        heading: "The three costly patterns to tag",
        bullets: [
          "Revenge trading: re-entering quickly after a loss to 'win it back.' Tag it, and measure its expectancy separately — it is almost always negative.",
          "Oversizing on conviction: risking 3-5% because a trade feels certain. Log risk-per-trade in R and watch what oversized trades do to your drawdown.",
          "FOMO entries: chasing a move with no setup because you can't stand missing it. Tag 'no plan' and compare win rate against your planned entries.",
        ],
      },
      {
        heading: "Build a pre-trade and post-loss routine",
        body: [
          "Psychology improves through structure, not willpower. Two small routines, enforced and journaled, do most of the work. Before entering, confirm the trade has a written setup, a defined risk, and a confidence rating — if it doesn't, it doesn't get taken. After a loss, take a mandatory pause and write one sentence before you're allowed to place another order.",
          "Journaling whether you followed these routines turns discipline into a measurable adherence rate. You stop asking 'am I trading emotionally?' and start watching a number go up.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can journaling actually fix revenge trading?",
        answer:
          "Journaling doesn't remove the urge, but it removes the deniability. When you can see that revenge trades have cost you a measurable amount and have a negative expectancy, the behavior gets much easier to interrupt — especially paired with a mandatory post-loss pause.",
      },
      {
        question: "How do I measure trading discipline?",
        answer:
          "Define explicit rules (max risk per trade, no trading the first 15 minutes, no adding to losers) and tag each trade for whether you followed them. Your rule-adherence rate over time is a direct, improvable measure of discipline.",
      },
    ],
  },
  {
    slug: "risk-management-for-traders",
    title: "Risk Management for Traders: Position Sizing and the 1% Rule",
    description:
      "A practical guide to trading risk management: position sizing, the 1% rule, R-multiples, and how a journal keeps you honest.",
    excerpt:
      "Strategy gets the attention, but risk management is what keeps you in the game long enough for an edge to pay.",
    category: "Risk",
    updated: "July 2026",
    readTime: "7 min",
    intro:
      "Traders obsess over entries, but survival is decided by risk. You can be right less than half the time and still grow an account with disciplined sizing — and you can have a great strategy and still blow up with reckless sizing. This is the practical core of trading risk management.",
    sections: [
      {
        heading: "Think in R, not dollars",
        body: [
          "An R-multiple is your profit or loss expressed as a multiple of the amount you risked on that trade. If you risk $100 and make $250, that's +2.5R. Thinking in R makes every trade comparable regardless of account or position size, and it makes your whole system legible: a strategy that averages +0.3R per trade over many trades is a money-maker; one that averages -0.1R is a slow leak, no matter how good the winners feel.",
        ],
      },
      {
        heading: "The 1% rule and fixed-fractional sizing",
        body: [
          "The most robust sizing rule for most traders is simple: risk a fixed small fraction of your account — commonly 1% — on every trade. With 1% risk, it takes a long, brutal losing streak to do serious damage, which keeps you solvent and calm enough to execute. As the account grows or shrinks, your position size adjusts automatically, so you press size when you're winning and pull back when you're not, without having to decide in the heat of the moment.",
          "Position size then falls out of the math: risk amount divided by the distance to your stop, converted to units or lots. Define the stop first, and size to the stop — never widen the stop to fit a size you already decided you wanted.",
        ],
      },
      {
        heading: "Expectancy: the number that ties it together",
        body: [
          "Expectancy = (win rate × average win in R) − (loss rate × average loss in R). It's the average R you can expect per trade, and it's the single most important output of your journal. A positive expectancy with disciplined 1% sizing is a durable edge; the journal is how you measure it honestly and catch when a strategy stops working before it does real damage.",
        ],
      },
      {
        heading: "How a journal enforces risk discipline",
        body: [
          "Rules only help if you keep them, and risk rules are the easiest to quietly break. A journal that records risk-per-trade in R on every trade turns 'I usually risk 1%' into a checkable fact. When you can see the trades where you oversized — and what they did to your drawdown — the 1% rule stops being a slogan and becomes a habit you can prove you're keeping. TradeTaper's risk tools and pre-trade checks are built for exactly this loop.",
        ],
      },
    ],
    faqs: [
      {
        question: "What percentage of my account should I risk per trade?",
        answer:
          "Most traders are well served risking 1% or less of account equity per trade. It survives long losing streaks, keeps drawdowns shallow enough to trade calmly, and scales position size automatically as the account changes.",
      },
      {
        question: "What is a good expectancy for a trading strategy?",
        answer:
          "Any positive expectancy is an edge; the higher and more stable across market conditions, the better. Even a small positive average R per trade compounds meaningfully with disciplined sizing and enough trades — which is why measuring it in your journal matters more than chasing a high win rate.",
      },
    ],
  },
  {
    slug: "trading-journal-examples",
    title: "Trading Journal Examples: 4 Real Entries Broken Down (2026)",
    description:
      "Four worked trading journal examples — a winner, a loser, a broken-rule trade and a no-trade — showing exactly what to write in each field and why.",
    excerpt:
      "Four complete sample entries, field by field, showing what a useful journal entry actually looks like.",
    category: "Fundamentals",
    updated: "July 2026",
    readTime: "8 min",
    intro:
      "Most advice about journaling stops at “write down your trades.” That leaves the hard part unanswered: what do you actually put in each field, and how much detail is enough? Below are four complete example entries — a winner, a loser, a trade that broke the rules, and a trade not taken — with commentary on what makes each one useful in review. Copy the shape, not the specifics.",
    sections: [
      {
        heading: "What every entry needs",
        body: [
          "A journal entry has two halves. The objective half — instrument, direction, entry, exit, size, timestamps, fees, resulting R — should be captured automatically if at all possible, because it is the half you are most likely to get wrong or skip when you are tired or tilted. The subjective half — why you took it, what you felt, what you would repeat — only you can write, and it is where the learning lives.",
          "The test of a good entry is simple: if you read it in three months with no memory of the trade, could you tell whether the decision was sound? If the entry only records what happened and not why you did it, the answer is no, and the entry will not help you.",
        ],
        bullets: [
          "Setup name — so you can group trades and measure each setup's expectancy",
          "Reason for entry — the specific trigger, not “looked good”",
          "Planned invalidation — where you were wrong, decided before entry",
          "Emotional state — one honest word is more useful than a paragraph",
          "Rule compliance — did you follow your plan, yes or no, independent of outcome",
        ],
      },
      {
        heading: "Example 1 — A winning trade that was still a good decision",
        body: [
          "EURUSD long, 1.0842 entry, 1.0879 exit, 0.5% risked, +1.8R, held 3h20m. Setup: London open pullback to prior day's value area high. Trigger: rejection wick on the 15m plus a higher low holding above 1.0838. Invalidation: 1.0831, below the structural low. Emotion at entry: calm. Rules followed: yes.",
          "Why this entry is useful: it names a repeatable setup, states a trigger precise enough that someone else could have taken the same trade, and fixes invalidation before entry. In review you can ask whether the London pullback setup is genuinely profitable across 40 instances — not whether this one trade felt good.",
        ],
      },
      {
        heading: "Example 2 — A losing trade that was still executed correctly",
        body: [
          "XAUUSD short, 4062.40 entry, 4071.10 stop hit, 0.5% risked, −1.0R, held 47m. Setup: failed breakout at prior day high. Trigger: breakout above 4060 with no follow-through and immediate close back inside range. Invalidation: 4071, above the breakout high. Emotion: slightly impatient, entered on the first candle rather than waiting for the close. Rules followed: mostly — entry was one candle early.",
          "This is the most valuable kind of entry and the one most traders never write. The trade lost, but the process was sound and the note captures the one real flaw — early entry — which is a fixable, recurring behaviour. Without the honest emotional note, this would read as a clean loss and you would learn nothing from it.",
        ],
      },
      {
        heading: "Example 3 — A rule break you must log anyway",
        body: [
          "NAS100 long, 20140 entry, 20016 exit, 2.1% risked, −2.4R, held 4h. Setup: none — this was a revenge trade twenty minutes after the XAUUSD stop-out. Trigger: none. Invalidation: not defined before entry, which is the whole problem. Emotion: frustrated, wanted the loss back. Rules followed: no — size was four times normal and there was no setup.",
          "Every instinct will tell you to leave this one out. Log it anyway, and tag it. Rule-break trades are usually a small share of total trades and an outsized share of total losses, and you can only prove that — and see the pattern in what triggers them — if they are in the dataset. One trader's journal showing that 6% of trades caused 40% of drawdown is a far stronger argument for discipline than any amount of self-criticism.",
        ],
      },
      {
        heading: "Example 4 — The trade you did not take",
        body: [
          "GBPUSD, no position. Setup was present — London pullback, same as Example 1 — but spread was elevated ahead of a scheduled release and the pullback was already 70% retraced, giving a poor entry relative to invalidation. Decision: skip. Emotion: mild regret when it ran 40 pips without me.",
          "No-trade entries feel pointless because nothing happened, but they are how you find out whether your filters are actually helping. If skipped setups would have been consistently profitable, your filter is too tight and it is costing you real money. If they mostly would have lost, the filter is earning its keep and you should trust it more easily next time.",
        ],
      },
      {
        heading: "Turning example entries into a review habit",
        body: [
          "Individual entries are only raw material. The return comes at the weekly and monthly review, when you group entries by setup, by rule compliance and by time of day, and look at aggregate R rather than individual outcomes. Four entries teach you nothing; sixty entries grouped by setup will usually show one clear thing to stop doing.",
          "This is also the point where manual journaling tends to collapse. Grouping and averaging by hand is tedious enough that most people quit before the sample is large enough to be meaningful. TradeTaper imports fills automatically from your MT5 terminal so the objective half is always complete, leaving you to write only the reasoning — and it does the grouping for you.",
        ],
      },
    ],
    faqs: [
      {
        question: "What should a trading journal entry look like?",
        answer:
          "At minimum: instrument, direction, entry and exit, position size, risk in percent or R, the setup name, your specific trigger, your predefined invalidation, your emotional state, and whether you followed your rules. The objective fields are best captured automatically; the reasoning and emotion you write yourself.",
      },
      {
        question: "Should I log trades I did not take?",
        answer:
          "Yes. No-trade entries are the only way to test whether your filters help or hurt. If setups you skip would have been profitable on average, your filter is too tight and is costing you money — and you cannot know that without recording the skips.",
      },
      {
        question: "How detailed should each entry be?",
        answer:
          "Detailed enough that you could judge the quality of the decision three months later with no memory of the trade. In practice that is usually two or three sentences of reasoning on top of the automatically captured numbers. Longer entries are not better if they stop you journaling consistently.",
      },
      {
        question: "Do I need to journal losing trades?",
        answer:
          "Especially losing trades, and above all the ones where you broke your own rules. Rule-break trades are typically a small fraction of trades but a large fraction of total drawdown, and that pattern is only provable if they are in the record.",
      },
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
