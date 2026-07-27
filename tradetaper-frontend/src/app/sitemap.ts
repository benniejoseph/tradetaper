import type { MetadataRoute } from "next";
import { SUPPORT_ARTICLES } from "@/config/supportContent";
import { BLOG_POSTS } from "@/config/blogContent";
import { COMPARISONS } from "@/config/comparisonContent";
import { FEATURE_PAGES } from "@/config/featureContent";

const SITE_URL = "https://tradetaper.com";
const FALLBACK_LAST_MODIFIED_ISO = "2026-04-21T00:00:00.000Z";

const BASE_ROUTES = [
  { path: "/", changeFrequency: "daily" as const, priority: 1 },
  { path: "/pricing", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/about", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/support", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "/demo", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/blog", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/compare", changeFrequency: "monthly" as const, priority: 0.8 },
  {
    path: "/trading-journal-india",
    changeFrequency: "monthly" as const,
    priority: 0.7,
  },
  { path: "/legal", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/legal/privacy", changeFrequency: "yearly" as const, priority: 0.5 },
  { path: "/legal/terms", changeFrequency: "yearly" as const, priority: 0.5 },
  {
    path: "/legal/cancellation-refund",
    changeFrequency: "yearly" as const,
    priority: 0.5,
  },
];

const SUPPORT_ARTICLE_ROUTES = SUPPORT_ARTICLES.map((article) => ({
  path: `/support/${article.slug}`,
  changeFrequency: "monthly" as const,
  priority: 0.6,
}));

const BLOG_ROUTES = BLOG_POSTS.map((post) => ({
  path: `/blog/${post.slug}`,
  changeFrequency: "monthly" as const,
  priority: 0.7,
}));

const COMPARISON_ROUTES = COMPARISONS.map((c) => ({
  path: `/compare/${c.slug}`,
  changeFrequency: "monthly" as const,
  priority: 0.7,
}));

const FEATURE_ROUTES = FEATURE_PAGES.map((f) => ({
  path: `/features/${f.slug}`,
  changeFrequency: "monthly" as const,
  priority: 0.7,
}));

const ROUTES = [
  ...BASE_ROUTES,
  ...SUPPORT_ARTICLE_ROUTES,
  ...BLOG_ROUTES,
  ...COMPARISON_ROUTES,
  ...FEATURE_ROUTES,
];

export default function sitemap(): MetadataRoute.Sitemap {
  const configuredLastModified = process.env.NEXT_PUBLIC_SEO_LAST_MODIFIED;
  const parsedLastModified = configuredLastModified
    ? new Date(configuredLastModified)
    : new Date(FALLBACK_LAST_MODIFIED_ISO);
  const lastModified = Number.isNaN(parsedLastModified.getTime())
    ? new Date(FALLBACK_LAST_MODIFIED_ISO)
    : parsedLastModified;

  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
