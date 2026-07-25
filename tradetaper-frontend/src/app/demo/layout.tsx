import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildBreadcrumbJsonLd, buildWebPageJsonLd, absoluteUrl } from "@/lib/seo";

const DEMO_TITLE = "Product Demo";
const DEMO_DESCRIPTION =
  "Explore the TradeTaper product demo and see how traders run structured review workflows from trade data to actionable decisions.";

export const metadata: Metadata = {
  title: DEMO_TITLE,
  description: DEMO_DESCRIPTION,
  alternates: {
    canonical: "/demo",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "TradeTaper",
    title: DEMO_TITLE,
    description: DEMO_DESCRIPTION,
    url: absoluteUrl("/demo"),
    images: [{ url: "/demo/opengraph-image" }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEMO_TITLE,
    description: DEMO_DESCRIPTION,
    images: ["/demo/opengraph-image"],
  },
};

const breadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Demo", path: "/demo" },
]);
const demoWebPageJsonLd = buildWebPageJsonLd({
  name: DEMO_TITLE,
  path: "/demo",
  description: DEMO_DESCRIPTION,
});

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        id="ld-breadcrumb-demo"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        id="ld-webpage-demo"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(demoWebPageJsonLd) }}
      />
      {children}
    </>
  );
}
