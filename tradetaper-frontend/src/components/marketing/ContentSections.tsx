// src/components/marketing/ContentSections.tsx
import Link from "next/link";
import type { ContentSection, FaqItem } from "@/lib/marketingContent";

/** Renders headed prose sections + an optional FAQ block for content pages. */
export default function ContentSections({
  sections,
  faqs,
}: {
  sections: ContentSection[];
  faqs?: FaqItem[];
}) {
  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section key={section.heading}>
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            {section.heading}
          </h2>
          {section.body?.map((para, i) => (
            <p
              key={i}
              className="mb-3 text-base leading-relaxed text-gray-600 dark:text-gray-300"
            >
              {para}
            </p>
          ))}
          {section.bullets && section.bullets.length > 0 && (
            <ul className="mt-2 space-y-2">
              {section.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  <span className="text-base leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {faqs && faqs.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50"
              >
                <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
                  {faq.question}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Reusable CTA band for the bottom of content pages. */
export function ContentCta({
  heading = "Start journaling with discipline",
  sub = "Automatic MT5 sync, AI-backed review, and risk tools in one focused workspace.",
}: {
  heading?: string;
  sub?: string;
}) {
  return (
    <section className="mt-12 rounded-3xl border border-emerald-600/20 bg-emerald-50 p-7 text-center dark:border-emerald-600/30 dark:bg-emerald-500/10 md:p-10">
      <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white md:text-3xl">
        {heading}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-300 md:text-base">
        {sub}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/register"
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          Start Free
        </Link>
        <Link
          href="/pricing"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-zinc-700 dark:text-gray-200 dark:hover:bg-white/5"
        >
          See pricing
        </Link>
      </div>
    </section>
  );
}
