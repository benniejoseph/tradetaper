import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaArrowLeft, FaCheck } from "react-icons/fa";
import MarketingChrome from "@/components/marketing/MarketingChrome";
import ContentSections, { ContentCta } from "@/components/marketing/ContentSections";
import { COMPARISONS, getComparisonBySlug } from "@/config/comparisonContent";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
  buildFaqPageJsonLd,
} from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getComparisonBySlug(slug);
  if (!c) return { title: "Comparison", robots: { index: false, follow: false } };
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: `/compare/${c.slug}` },
    openGraph: {
      type: "article",
      title: c.title,
      description: c.description,
      url: absoluteUrl(`/compare/${c.slug}`),
      images: [{ url: "/opengraph-image" }],
    },
    twitter: {
      card: "summary_large_image",
      title: c.title,
      description: c.description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function ComparisonPage({ params }: Props) {
  const { slug } = await params;
  const c = getComparisonBySlug(slug);
  if (!c) notFound();

  const others = COMPARISONS.filter((x) => x.slug !== c.slug);

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Compare", path: "/compare" },
    { name: `TradeTaper vs ${c.competitor}`, path: `/compare/${c.slug}` },
  ]);
  const webpage = buildWebPageJsonLd({ name: c.title, path: `/compare/${c.slug}`, description: c.description });
  const faq = c.faqs?.length ? buildFaqPageJsonLd(c.faqs) : null;

  return (
    <MarketingChrome>
      <script id={`ld-breadcrumb-${c.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script id={`ld-webpage-${c.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webpage) }} />
      {faq && <script id={`ld-faq-${c.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />}
      <main className="mx-auto w-full max-w-3xl px-6 pb-20 pt-12">
        <Link href="/compare" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
          <FaArrowLeft className="text-xs" />
          All comparisons
        </Link>

        <h1 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
          {c.title}
        </h1>
        <p className="mb-8 text-lg leading-relaxed text-slate-300">{c.intro}</p>

        {/* Comparison table */}
        <div className="mb-10 overflow-x-auto rounded-3xl border border-white/10 bg-black/35">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="px-4 py-3 font-medium">Feature</th>
                <th className="px-4 py-3 font-semibold text-emerald-300">TradeTaper</th>
                <th className="px-4 py-3 font-medium">{c.competitor}</th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((row) => (
                <tr key={row.feature} className="border-b border-white/5 align-top">
                  <td className="px-4 py-3 font-medium text-slate-200">{row.feature}</td>
                  <td className="px-4 py-3 text-slate-200">
                    <span className="inline-flex items-start gap-1.5">
                      <FaCheck className="mt-0.5 shrink-0 text-emerald-400" />
                      {row.tradetaper}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{row.competitor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ContentSections sections={c.sections} faqs={c.faqs} />

        <ContentCta heading={`See why traders switch to TradeTaper`} />

        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold">More comparisons</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/compare/${o.slug}`}
                className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-slate-200 transition-colors hover:border-emerald-400/40"
              >
                TradeTaper vs {o.competitor}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </MarketingChrome>
  );
}
