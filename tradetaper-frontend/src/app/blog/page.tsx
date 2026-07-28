import type { Metadata } from "next";
import Link from "next/link";
import MarketingChrome from "@/components/marketing/MarketingChrome";
import { BLOG_POSTS } from "@/config/blogContent";
import { buildBreadcrumbJsonLd, buildWebPageJsonLd } from "@/lib/seo";

const TITLE = "Trading Journal Blog — Guides on Journaling, Psychology & Risk";
const DESCRIPTION =
  "Practical guides on keeping a trading journal, trading psychology, and risk management — from the team behind TradeTaper.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: "/blog",
    images: [{ url: "/opengraph-image" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

export default function BlogIndexPage() {
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
  ]);
  const webpage = buildWebPageJsonLd({
    name: TITLE,
    path: "/blog",
    description: DESCRIPTION,
  });

  return (
    <MarketingChrome>
      <script id="ld-breadcrumb-blog" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script id="ld-webpage-blog" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webpage) }} />
      <main className="mx-auto w-full max-w-5xl px-6 pb-20 pt-12">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Trading Journal Blog
          </h1>
          <p className="mt-3 max-w-2xl text-base text-gray-600 dark:text-gray-300">
            Practical, no-fluff guides on keeping a trading journal, mastering
            trading psychology, and managing risk — so your journaling turns
            into a measurable edge.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-3xl border border-gray-200 bg-gray-50 p-6 transition-colors hover:border-emerald-600/40 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-emerald-400/40"
            >
              <div className="mb-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 uppercase tracking-[0.08em] dark:border-zinc-800 dark:bg-white/5">
                  {post.category}
                </span>
                <span>{post.readTime} read</span>
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-gray-900 group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-300">
                {post.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {post.excerpt}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </MarketingChrome>
  );
}
