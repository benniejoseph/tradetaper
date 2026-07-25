import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildBreadcrumbJsonLd, buildWebPageJsonLd, absoluteUrl } from "@/lib/seo";

const CONTACT_TITLE = "Contact TradeTaper";
const CONTACT_DESCRIPTION =
  "Get in touch with TradeTaper for support, billing questions, and enterprise inquiries.";

export const metadata: Metadata = {
  title: CONTACT_TITLE,
  description: CONTACT_DESCRIPTION,
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "TradeTaper",
    title: CONTACT_TITLE,
    description: CONTACT_DESCRIPTION,
    url: absoluteUrl("/contact"),
    images: [{ url: "/contact/opengraph-image" }],
  },
  twitter: {
    card: "summary_large_image",
    title: CONTACT_TITLE,
    description: CONTACT_DESCRIPTION,
    images: ["/contact/opengraph-image"],
  },
};

const breadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Contact", path: "/contact" },
]);
const contactWebPageJsonLd = buildWebPageJsonLd({
  name: CONTACT_TITLE,
  path: "/contact",
  description: CONTACT_DESCRIPTION,
});

export default function ContactLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        id="ld-breadcrumb-contact"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        id="ld-webpage-contact"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactWebPageJsonLd) }}
      />
      {children}
    </>
  );
}
