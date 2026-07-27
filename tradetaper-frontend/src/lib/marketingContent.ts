// src/lib/marketingContent.ts
// Shared content model for SEO marketing pages (blog, comparisons, features).

/** A headed prose section. `body` paragraphs render as <p>; `bullets` as a list. */
export type ContentSection = {
  heading: string;
  body?: string[];
  bullets?: string[];
};

/** A question/answer pair — rendered on-page and emitted as FAQPage JSON-LD. */
export type FaqItem = {
  question: string;
  answer: string;
};
