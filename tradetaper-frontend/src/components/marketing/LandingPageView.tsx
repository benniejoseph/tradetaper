// src/components/marketing/LandingPageView.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingChrome from "@/components/marketing/MarketingChrome";
import ContentSections, { ContentCta } from "@/components/marketing/ContentSections";
import { LANDING_PAGES, getLandingPageBySlug } from "@/config/landingContent";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
  buildFaqPageJsonLd,
} from "@/lib/seo";

/** Build Next.js metadata for a landing page slug. */
export function buildLandingMetadata(slug: string): Metadata {
  const page = getLandingPageBySlug(slug);
  if (!page) return { title: "Not found", robots: { index: false, follow: false } };
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/${page.slug}` },
    openGraph: {
      type: "website",
      title: page.title,
      description: page.description,
      url: absoluteUrl(`/${page.slug}`),
      images: [{ url: "/opengraph-image" }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: ["/opengraph-image"],
    },
  };
}

/** Shared renderer for commercial landing pages. */
export default function LandingPageView({ slug }: { slug: string }) {
  const page = getLandingPageBySlug(slug);
  if (!page) notFound();

  const others = LANDING_PAGES.filter((p) => p.slug !== page.slug).slice(0, 4);

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: page.h1, path: `/${page.slug}` },
  ]);
  const webpage = buildWebPageJsonLd({
    name: page.title,
    path: `/${page.slug}`,
    description: page.description,
  });
  const faq = page.faqs?.length ? buildFaqPageJsonLd(page.faqs) : null;

  return (
    <MarketingChrome>
      <script id={`ld-breadcrumb-${page.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script id={`ld-webpage-${page.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webpage) }} />
      {faq && <script id={`ld-faq-${page.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />}
      <main className="mx-auto w-full max-w-3xl px-6 pb-20 pt-12">
        <h1 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
          {page.h1}
        </h1>
        <p className="mb-10 text-lg leading-relaxed text-gray-600 dark:text-gray-300">{page.intro}</p>

        <ContentSections sections={page.sections} faqs={page.faqs} />

        <ContentCta />

        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold">Related guides</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/${o.slug}`}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 transition-colors hover:border-emerald-600/40 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-gray-200 dark:hover:border-emerald-400/40"
              >
                {o.h1}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </MarketingChrome>
  );
}
