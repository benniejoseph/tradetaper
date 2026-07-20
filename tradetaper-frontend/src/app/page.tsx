import type { Metadata } from "next";
import { headers } from "next/headers";
import HomePageClient from "./page.client";
import { HOME_FAQ_ITEMS } from "@/config/seoFaq";
import { resolveCurrencyCodeFromHeaders } from "@/lib/currency";
import {
  buildFaqPageJsonLd,
  buildOrganizationJsonLd,
  buildWebPageJsonLd,
  SITE_URL,
} from "@/lib/seo";

const HOME_TITLE = "AI Trading Journal for Disciplined Traders";
const HOME_DESCRIPTION =
  "TradeTaper gives traders an execution-grade journal, AI-backed review loops, and risk discipline tools to improve consistency.";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "TradeTaper",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/opengraph-image" }],
  },
  twitter: {
    card: "summary",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

const organizationJsonLd = buildOrganizationJsonLd();
const homeWebPageJsonLd = buildWebPageJsonLd({
  name: HOME_TITLE,
  path: "/",
  description: HOME_DESCRIPTION,
});
const homeFaqJsonLd = buildFaqPageJsonLd(HOME_FAQ_ITEMS);

export default async function HomePage() {
  const requestHeaders = await headers();
  const initialCurrencyCode = resolveCurrencyCodeFromHeaders(requestHeaders);

  return (
    <>
      <script
        id="ld-org-home"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        id="ld-webpage-home"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeWebPageJsonLd) }}
      />
      <script
        id="ld-faq-home"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqJsonLd) }}
      />
      <HomePageClient initialCurrencyCode={initialCurrencyCode} />
    </>
  );
}
