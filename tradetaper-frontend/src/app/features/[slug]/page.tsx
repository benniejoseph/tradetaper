import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import MarketingChrome from "@/components/marketing/MarketingChrome";
import ContentSections, { ContentCta } from "@/components/marketing/ContentSections";
import { FEATURE_PAGES, getFeaturePageBySlug } from "@/config/featureContent";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
  buildFaqPageJsonLd,
} from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return FEATURE_PAGES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const f = getFeaturePageBySlug(slug);
  if (!f) return { title: "Feature", robots: { index: false, follow: false } };
  return {
    title: f.title,
    description: f.description,
    alternates: { canonical: `/features/${f.slug}` },
    openGraph: {
      type: "website",
      title: f.title,
      description: f.description,
      url: absoluteUrl(`/features/${f.slug}`),
      images: [{ url: "/opengraph-image" }],
    },
    twitter: {
      card: "summary_large_image",
      title: f.title,
      description: f.description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function FeaturePageView({ params }: Props) {
  const { slug } = await params;
  const f = getFeaturePageBySlug(slug);
  if (!f) notFound();

  const others = FEATURE_PAGES.filter((x) => x.slug !== f.slug);

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: f.title, path: `/features/${f.slug}` },
  ]);
  const webpage = buildWebPageJsonLd({ name: f.title, path: `/features/${f.slug}`, description: f.description });
  const faq = f.faqs?.length ? buildFaqPageJsonLd(f.faqs) : null;

  return (
    <MarketingChrome>
      <script id={`ld-breadcrumb-${f.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script id={`ld-webpage-${f.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webpage) }} />
      {faq && <script id={`ld-faq-${f.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />}
      <main className="mx-auto w-full max-w-3xl px-6 pb-20 pt-12">
        <Link href="/blog" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          <FaArrowLeft className="text-xs" />
          Explore guides
        </Link>

        <h1 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
          {f.h1}
        </h1>
        <p className="mb-10 text-lg leading-relaxed text-gray-600 dark:text-gray-300">{f.intro}</p>

        <ContentSections sections={f.sections} faqs={f.faqs} />

        <ContentCta />

        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold">More from TradeTaper</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/features/${o.slug}`}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 transition-colors hover:border-emerald-600/40 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-gray-200 dark:hover:border-emerald-400/40"
              >
                {o.title}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </MarketingChrome>
  );
}
