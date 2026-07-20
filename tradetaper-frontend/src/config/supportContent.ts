export type SupportCategoryKey =
  | "getting-started"
  | "api-reference"
  | "video-tutorials";

export type SupportCategory = {
  key: SupportCategoryKey;
  title: string;
  description: string;
  href: string;
};

export type SupportArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: SupportCategoryKey;
  updated: string;
  readTime: string;
  highlights: string[];
};

export const SUPPORT_CATEGORIES: SupportCategory[] = [
  {
    key: "getting-started",
    title: "Getting Started",
    description: "Quick start guides and account setup",
    href: "/support/quick-start-account-setup",
  },
  {
    key: "api-reference",
    title: "API Reference",
    description: "For developers and algo traders",
    href: "/support/api-reference-overview",
  },
  {
    key: "video-tutorials",
    title: "Video Tutorials",
    description: "Watch walkthroughs and masterclasses",
    href: "/support/video-tutorials-learning-path",
  },
];

export const SUPPORT_ARTICLES: SupportArticle[] = [
  {
    slug: "connecting-broker-account",
    title: "Connecting Your Broker Account",
    excerpt:
      "Link your account safely and verify sync health before you start journaling live positions.",
    category: "getting-started",
    updated: "April 2026",
    readTime: "4 min",
    highlights: [
      "Add your broker account from Settings > Accounts.",
      "Complete required credentials and verify account ownership.",
      "Confirm first sync and check balance, equity, and trade history.",
      "If sync stalls, re-open account settings and refresh token permissions.",
    ],
  },
  {
    slug: "understanding-risk-matrix",
    title: "Understanding the Risk Matrix",
    excerpt:
      "Use risk matrix signals to control downside and enforce session-level discipline.",
    category: "getting-started",
    updated: "April 2026",
    readTime: "5 min",
    highlights: [
      "Set max risk per trade and max risk per session first.",
      "Review matrix color states before opening a new position.",
      "Treat repeated yellow/red states as behavior warnings, not noise.",
      "Adjust sizing rules weekly based on execution consistency metrics.",
    ],
  },
  {
    slug: "exporting-tax-reports",
    title: "Exporting Tax Reports",
    excerpt:
      "Generate structured exports for accountant handoff and audit-ready trade records.",
    category: "getting-started",
    updated: "April 2026",
    readTime: "3 min",
    highlights: [
      "Open Reports and choose the exact date range required.",
      "Select the account scope before generating the export.",
      "Download CSV and verify timezone alignment with your broker statements.",
      "Keep a monthly export archive to simplify year-end reconciliation.",
    ],
  },
  {
    slug: "setting-up-2fa-security",
    title: "Setting Up 2FA Security",
    excerpt:
      "Harden account access by enabling two-factor authentication and backup recovery codes.",
    category: "getting-started",
    updated: "April 2026",
    readTime: "4 min",
    highlights: [
      "Navigate to Profile > Security and enable 2FA.",
      "Scan the authenticator QR code and verify with a first token.",
      "Store backup recovery codes in an offline password vault.",
      "Rotate backup codes after device changes or suspected compromise.",
    ],
  },
  {
    slug: "quick-start-account-setup",
    title: "Quick Start Account Setup",
    excerpt:
      "Go from sign-up to first logged trade in under 10 minutes with the recommended setup order.",
    category: "getting-started",
    updated: "April 2026",
    readTime: "6 min",
    highlights: [
      "Create your workspace and configure account currency.",
      "Connect broker data source and verify session timezone.",
      "Set baseline risk rules before your next trading session.",
      "Log your first trade and run the AI review summary.",
    ],
  },
  {
    slug: "api-reference-overview",
    title: "API Reference Overview",
    excerpt:
      "Core endpoint patterns and authentication expectations for developer integrations.",
    category: "api-reference",
    updated: "April 2026",
    readTime: "5 min",
    highlights: [
      "Authenticate with bearer tokens and secure rotation policy.",
      "Prefer paginated endpoints for trade and journal history pulls.",
      "Honor rate limits and backoff on 429 responses.",
      "Validate payload schemas before automated writes.",
    ],
  },
  {
    slug: "video-tutorials-learning-path",
    title: "Video Tutorials Learning Path",
    excerpt:
      "Recommended sequence of walkthroughs for traders, mentors, and ops teams.",
    category: "video-tutorials",
    updated: "April 2026",
    readTime: "3 min",
    highlights: [
      "Start with workspace setup and account connection videos.",
      "Move to journaling and risk discipline walkthroughs.",
      "Finish with analytics review loops and weekly report flow.",
      "Share team training links for consistent operating standards.",
    ],
  },
];

export const POPULAR_SUPPORT_ARTICLE_SLUGS = [
  "connecting-broker-account",
  "understanding-risk-matrix",
  "exporting-tax-reports",
  "setting-up-2fa-security",
] as const;

const SUPPORT_ARTICLES_BY_SLUG = new Map(
  SUPPORT_ARTICLES.map((article) => [article.slug, article]),
);

export function getSupportArticleBySlug(slug: string): SupportArticle | undefined {
  return SUPPORT_ARTICLES_BY_SLUG.get(slug);
}
