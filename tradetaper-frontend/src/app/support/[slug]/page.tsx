import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaArrowLeft, FaExternalLinkAlt } from "react-icons/fa";
import {
  SUPPORT_ARTICLES,
  getSupportArticleBySlug,
} from "@/config/supportContent";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo";

type SupportArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return SUPPORT_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: SupportArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getSupportArticleBySlug(slug);
  if (!article) {
    return {
      title: "Support Article",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: article.title,
    description: article.excerpt,
    alternates: {
      canonical: `/support/${article.slug}`,
    },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      url: absoluteUrl(`/support/${article.slug}`),
      images: [{ url: "/support/opengraph-image" }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: ["/support/opengraph-image"],
    },
  };
}

export default async function SupportArticlePage({
  params,
}: SupportArticlePageProps) {
  const { slug } = await params;
  const article = getSupportArticleBySlug(slug);
  if (!article) {
    notFound();
  }

  const relatedArticles = SUPPORT_ARTICLES.filter(
    (candidate) =>
      candidate.slug !== article.slug && candidate.category === article.category,
  ).slice(0, 3);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Support", path: "/support" },
    { name: article.title, path: `/support/${article.slug}` },
  ]);
  const articleWebPageJsonLd = buildWebPageJsonLd({
    name: article.title,
    path: `/support/${article.slug}`,
    description: article.excerpt,
  });

  return (
    <>
      <script
        id={`ld-breadcrumb-support-${article.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        id={`ld-webpage-support-${article.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleWebPageJsonLd) }}
      />
      <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
        <div className="mx-auto w-full max-w-5xl px-6 pb-20 pt-12">
          <Link
            href="/support"
            className="mb-8 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
          >
            <FaArrowLeft className="text-xs" />
            Back to Support Center
          </Link>

          <article className="rounded-3xl border border-white/10 bg-black/35 p-7 md:p-9">
            <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 uppercase tracking-[0.08em]">
                {article.category.replace("-", " ")}
              </span>
              <span>{article.updated}</span>
              <span>•</span>
              <span>{article.readTime} read</span>
            </div>
            <h1 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
              {article.title}
            </h1>
            <p className="mb-7 max-w-3xl text-base leading-relaxed text-slate-300 md:text-lg">
              {article.excerpt}
            </p>

            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/8 p-5">
              <h2 className="mb-3 text-lg font-semibold">Checklist</h2>
              <ul className="space-y-2 text-sm text-slate-200">
                {article.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <section className="mt-8 rounded-3xl border border-white/10 bg-black/35 p-6 md:p-7">
            <h2 className="mb-4 text-xl font-semibold">Related Articles</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {relatedArticles.length > 0 ? (
                relatedArticles.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/support/${related.slug}`}
                    className="group rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-all hover:border-emerald-300/35 hover:bg-emerald-500/10"
                  >
                    <p className="mb-1 font-medium text-white">{related.title}</p>
                    <p className="text-sm text-slate-300">{related.excerpt}</p>
                  </Link>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-300">
                  Additional articles are being prepared for this topic.
                </div>
              )}
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-white/10 bg-black/35 p-6 text-sm text-slate-300">
            <p className="mb-3">
              Still blocked? Contact support with your account email, broker,
              and issue summary.
            </p>
            <a
              href="mailto:support@tradetaper.com?subject=TradeTaper%20Support%20Request"
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/35 bg-emerald-500/12 px-4 py-2 font-medium text-emerald-100 hover:bg-emerald-500/18"
            >
              Email Support
              <FaExternalLinkAlt className="text-[10px]" />
            </a>
          </section>
        </div>
      </div>
    </>
  );
}
