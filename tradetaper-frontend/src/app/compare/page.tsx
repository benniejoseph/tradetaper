import type { Metadata } from "next";
import Link from "next/link";
import MarketingChrome from "@/components/marketing/MarketingChrome";
import { COMPARISONS } from "@/config/comparisonContent";
import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from "@/lib/seo";

const TITLE = "Compare TradeTaper — Trading Journal Alternatives";
const DESCRIPTION =
  "See how TradeTaper compares to Tradezella, Edgewonk, and TraderSync on MT5 sync, prop-firm tracking, AI review, and pricing.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/compare" },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: "/compare",
    images: [{ url: "/opengraph-image" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

export default function CompareIndexPage() {
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Compare", path: "/compare" },
  ]);
  const webpage = buildWebPageJsonLd({ name: TITLE, path: "/compare", description: DESCRIPTION });

  return (
    <MarketingChrome>
      <script id="ld-breadcrumb-compare" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script id="ld-webpage-compare" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webpage) }} />
      <main className="mx-auto w-full max-w-5xl px-6 pb-20 pt-12">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Compare TradeTaper
          </h1>
          <p className="mt-3 max-w-2xl text-base text-gray-600 dark:text-gray-300">
            Honest side-by-side comparisons with other popular trading journals,
            so you can pick the tool that matches your market, platform, and
            budget.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COMPARISONS.map((c) => (
            <Link
              key={c.slug}
              href={`/compare/${c.slug}`}
              className="group rounded-3xl border border-gray-200 bg-gray-50 p-6 transition-colors hover:border-emerald-600/40 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-emerald-400/40"
            >
              <h2 className="text-lg font-semibold tracking-tight text-gray-900 group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-300">
                TradeTaper vs {c.competitor}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {c.excerpt}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </MarketingChrome>
  );
}
