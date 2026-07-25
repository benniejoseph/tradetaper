import type { Metadata } from "next";
import type { ReactNode } from "react";
import { INR_PRICES, PRICING_TIERS, PRICING_TIERS_ANNUAL } from "@/config/pricing";
import { PRICING_FAQ_ITEMS } from "@/config/seoFaq";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildFaqPageJsonLd,
  buildSoftwareApplicationJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo";

const PRICING_TITLE = "Pricing Plans";
const PRICING_DESCRIPTION =
  "Compare Free, Essential, and Premium TradeTaper plans with feature gates, AI capabilities, and MT5 sync capacity.";

export const metadata: Metadata = {
  title: PRICING_TITLE,
  description: PRICING_DESCRIPTION,
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "TradeTaper",
    title: PRICING_TITLE,
    description: PRICING_DESCRIPTION,
    url: absoluteUrl("/pricing"),
    images: [{ url: "/pricing/opengraph-image" }],
  },
  twitter: {
    card: "summary_large_image",
    title: PRICING_TITLE,
    description: PRICING_DESCRIPTION,
    images: ["/pricing/opengraph-image"],
  },
};

const breadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Pricing", path: "/pricing" },
]);
const pricingWebPageJsonLd = buildWebPageJsonLd({
  name: PRICING_TITLE,
  path: "/pricing",
  description: PRICING_DESCRIPTION,
});
const pricingFaqJsonLd = buildFaqPageJsonLd(PRICING_FAQ_ITEMS);
const annualTierPriceById = new Map(
  PRICING_TIERS_ANNUAL.map((tier) => [tier.id, tier.price]),
);
const pricingOffers = PRICING_TIERS.flatMap((tier) => {
  const annualUsdPrice = annualTierPriceById.get(tier.id) ?? tier.price;
  const inrTierPrice = INR_PRICES[tier.id] ?? { monthly: 0, yearly: 0 };

  return [
    {
      name: `${tier.name} Monthly (USD)`,
      description: `${tier.description}. Billed monthly.`,
      price: tier.price,
      priceCurrency: "USD",
      urlPath: "/pricing",
    },
    {
      name: `${tier.name} Yearly (USD)`,
      description: `${tier.description}. Billed yearly.`,
      price: annualUsdPrice,
      priceCurrency: "USD",
      urlPath: "/pricing",
    },
    {
      name: `${tier.name} Monthly (INR)`,
      description: `${tier.description}. Billed monthly for India.`,
      price: inrTierPrice.monthly,
      priceCurrency: "INR",
      urlPath: "/pricing",
    },
    {
      name: `${tier.name} Yearly (INR)`,
      description: `${tier.description}. Billed yearly for India.`,
      price: inrTierPrice.yearly,
      priceCurrency: "INR",
      urlPath: "/pricing",
    },
  ];
});
const pricingSoftwareApplicationJsonLd = buildSoftwareApplicationJsonLd({
  name: "TradeTaper",
  path: "/pricing",
  description: PRICING_DESCRIPTION,
  offers: pricingOffers,
});

export default function PricingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        id="ld-breadcrumb-pricing"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        id="ld-webpage-pricing"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingWebPageJsonLd) }}
      />
      <script
        id="ld-faq-pricing"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqJsonLd) }}
      />
      <script
        id="ld-software-pricing"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pricingSoftwareApplicationJsonLd),
        }}
      />
      {children}
    </>
  );
}
