import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildBreadcrumbJsonLd, buildWebPageJsonLd, absoluteUrl } from "@/lib/seo";

const ABOUT_TITLE = "About TradeTaper";
const ABOUT_DESCRIPTION =
  "Learn how TradeTaper helps traders improve execution quality through structured journaling, analytics, and behavior-focused review.";

export const metadata: Metadata = {
  title: ABOUT_TITLE,
  description: ABOUT_DESCRIPTION,
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "TradeTaper",
    title: ABOUT_TITLE,
    description: ABOUT_DESCRIPTION,
    url: absoluteUrl("/about"),
    images: [{ url: "/about/opengraph-image" }],
  },
  twitter: {
    card: "summary_large_image",
    title: ABOUT_TITLE,
    description: ABOUT_DESCRIPTION,
    images: ["/about/opengraph-image"],
  },
};

const breadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
]);
const aboutWebPageJsonLd = buildWebPageJsonLd({
  name: ABOUT_TITLE,
  path: "/about",
  description: ABOUT_DESCRIPTION,
});

export default function AboutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        id="ld-breadcrumb-about"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        id="ld-webpage-about"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutWebPageJsonLd) }}
      />
      {children}
    </>
  );
}
