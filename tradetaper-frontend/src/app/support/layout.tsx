import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SUPPORT_FAQ_ITEMS } from "@/config/seoFaq";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo";

const SUPPORT_TITLE = "Support Center";
const SUPPORT_DESCRIPTION =
  "Find TradeTaper help resources, troubleshooting guides, and direct support options.";

export const metadata: Metadata = {
  title: SUPPORT_TITLE,
  description: SUPPORT_DESCRIPTION,
  alternates: {
    canonical: "/support",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "TradeTaper",
    title: SUPPORT_TITLE,
    description: SUPPORT_DESCRIPTION,
    url: absoluteUrl("/support"),
    images: [{ url: "/support/opengraph-image" }],
  },
  twitter: {
    card: "summary",
    title: SUPPORT_TITLE,
    description: SUPPORT_DESCRIPTION,
    images: ["/support/opengraph-image"],
  },
};

const breadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Support", path: "/support" },
]);
const supportWebPageJsonLd = buildWebPageJsonLd({
  name: SUPPORT_TITLE,
  path: "/support",
  description: SUPPORT_DESCRIPTION,
});
const supportFaqJsonLd = buildFaqPageJsonLd(SUPPORT_FAQ_ITEMS);

export default function SupportLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        id="ld-breadcrumb-support"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        id="ld-webpage-support"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(supportWebPageJsonLd) }}
      />
      <script
        id="ld-faq-support"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(supportFaqJsonLd) }}
      />
      {children}
    </>
  );
}
