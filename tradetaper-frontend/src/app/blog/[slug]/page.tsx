import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import MarketingChrome from "@/components/marketing/MarketingChrome";
import ContentSections, { ContentCta } from "@/components/marketing/ContentSections";
import { BLOG_POSTS, getBlogPostBySlug } from "@/config/blogContent";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
  buildFaqPageJsonLd,
} from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) {
    return { title: "Article", robots: { index: false, follow: false } };
  }
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: absoluteUrl(`/blog/${post.slug}`),
      images: [{ url: "/opengraph-image" }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) notFound();

  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);
  const webpage = buildWebPageJsonLd({
    name: post.title,
    path: `/blog/${post.slug}`,
    description: post.description,
  });
  const faq = post.faqs?.length
    ? buildFaqPageJsonLd(
        post.faqs.map((f) => ({ question: f.question, answer: f.answer })),
      )
    : null;

  return (
    <MarketingChrome>
      <script id={`ld-breadcrumb-${post.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script id={`ld-webpage-${post.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webpage) }} />
      {faq && (
        <script id={`ld-faq-${post.slug}`} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      )}
      <main className="mx-auto w-full max-w-3xl px-6 pb-20 pt-12">
        <Link href="/blog" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
          <FaArrowLeft className="text-xs" />
          Back to Blog
        </Link>

        <article>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 uppercase tracking-[0.08em]">
              {post.category}
            </span>
            <span>Updated {post.updated}</span>
            <span>•</span>
            <span>{post.readTime} read</span>
          </div>
          <h1 className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
            {post.title}
          </h1>
          <p className="mb-10 text-lg leading-relaxed text-slate-300">
            {post.intro}
          </p>

          <ContentSections sections={post.sections} faqs={post.faqs} />
        </article>

        <ContentCta />

        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold">Keep reading</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-slate-200 transition-colors hover:border-emerald-400/40"
              >
                {r.title}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </MarketingChrome>
  );
}
