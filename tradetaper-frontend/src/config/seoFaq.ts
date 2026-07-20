export const HOME_FAQ_CATEGORIES = [
  "General",
  "Billing & Plans",
  "Security",
] as const;

export type HomeFaqCategory = (typeof HOME_FAQ_CATEGORIES)[number];

export type HomeFaqItem = {
  category: HomeFaqCategory;
  question: string;
  answer: string;
};

export const HOME_FAQ_ITEMS: HomeFaqItem[] = [
  {
    category: "General",
    question: "What makes TradeTaper different from a regular journal?",
    answer:
      "TradeTaper is workflow-first, not just note-taking. You get structured logging, AI-assisted review loops, and risk discipline systems designed to improve decision quality over time.",
  },
  {
    category: "General",
    question: "Can I use TradeTaper if I trade multiple accounts?",
    answer:
      "Yes. Plans include MetaApi auto-sync slots, and you can extend account capacity with add-on slots as your operation scales.",
  },
  {
    category: "Billing & Plans",
    question: "Do you support localized pricing?",
    answer:
      "Yes. INR pricing is shown for India and USD for international users. Billing currency is handled from your detected region and reflected at checkout.",
  },
  {
    category: "Billing & Plans",
    question: "Is there a free plan and how do upgrades work?",
    answer:
      "You can start on the free plan with clear usage limits. Upgrades are immediate, and your additional features and limits are enforced by the backend in real time.",
  },
  {
    category: "Security",
    question: "How is account security handled?",
    answer:
      "Authentication flows support secure session handling, MFA enrollment with recovery codes, and audit logging for login success/failure events, including SOC2-style traceability.",
  },
  {
    category: "Security",
    question: "Are data and billing controls production-ready?",
    answer:
      "Yes. Plan entitlements, feature gates, and subscription status checks are enforced server-side so premium paths stay protected and consistent across profile, billing, and app workflows.",
  },
];

export type PricingFaqItem = {
  question: string;
  answer: string;
};

export const PRICING_FAQ_ITEMS: PricingFaqItem[] = [
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. You can cancel at any time and keep access through your active billing period. No lock-in contract.",
  },
  {
    question: "Do you support geo pricing?",
    answer:
      "Yes. INR is shown for India and USD for other regions. Checkout follows the same billing currency.",
  },
  {
    question: "How are premium features protected?",
    answer:
      "Feature gates are enforced on the backend, so premium-only routes and actions stay protected in production.",
  },
  {
    question: "Can I add more MT5 sync slots?",
    answer:
      "Yes. Extra MT5 slots are available as add-ons on top of your base plan limits.",
  },
];

export type SupportFaqItem = {
  question: string;
  answer: string;
};

export const SUPPORT_FAQ_ITEMS: SupportFaqItem[] = [
  {
    question: "How do I connect my broker account?",
    answer:
      "Start from account setup in TradeTaper and connect MT5 or import trades manually. This is covered in Getting Started resources.",
  },
  {
    question: "Where can I find risk and performance guidance?",
    answer:
      "Use the support docs and guides for risk matrix concepts, analytics interpretation, and workflow best practices.",
  },
  {
    question: "Can I export reports for tax and review workflows?",
    answer:
      "Yes. TradeTaper supports export workflows, including report exports used for review and record-keeping.",
  },
  {
    question: "How do I contact support directly?",
    answer:
      "Use the Contact Support action on the support page to reach the team for account, billing, and product issues.",
  },
];
