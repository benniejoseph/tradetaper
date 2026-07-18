export const SITE_URL = "https://tradetaper.com";

export const DEFAULT_SITE_DESCRIPTION =
  "TradeTaper helps traders journal executions, analyze performance, and improve risk discipline with AI-powered insights.";

const ORGANIZATION_SAME_AS = (
  process.env.NEXT_PUBLIC_ORGANIZATION_SAME_AS || SITE_URL
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

type BreadcrumbItem = {
  name: string;
  path: string;
};

export function absoluteUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return normalizedPath === "/" ? SITE_URL : `${SITE_URL}${normalizedPath}`;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildOrganizationJsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TradeTaper",
    url: SITE_URL,
    logo: absoluteUrl("/tradetaperLogo.png"),
    description: DEFAULT_SITE_DESCRIPTION,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@tradetaper.com",
        areaServed: "Worldwide",
        availableLanguage: "English",
      },
    ],
  };

  if (ORGANIZATION_SAME_AS.length > 0) {
    return {
      ...organization,
      sameAs: ORGANIZATION_SAME_AS,
    };
  }

  return organization;
}

type WebPageJsonLdInput = {
  name: string;
  path: string;
  description: string;
};

export function buildWebPageJsonLd({ name, path, description }: WebPageJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    url: absoluteUrl(path),
    description,
    isPartOf: {
      "@type": "WebSite",
      name: "TradeTaper",
      url: SITE_URL,
    },
  };
}

type FaqItem = {
  question: string;
  answer: string;
};

export function buildFaqPageJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

type SoftwareOfferInput = {
  name: string;
  description?: string;
  price: number;
  priceCurrency: string;
  urlPath?: string;
};

type SoftwareApplicationJsonLdInput = {
  name: string;
  path: string;
  description: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers: SoftwareOfferInput[];
};

export function buildSoftwareApplicationJsonLd({
  name,
  path,
  description,
  applicationCategory = "FinanceApplication",
  operatingSystem = "Web",
  offers,
}: SoftwareApplicationJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url: absoluteUrl(path),
    applicationCategory,
    operatingSystem,
    provider: {
      "@type": "Organization",
      name: "TradeTaper",
      url: SITE_URL,
    },
    offers: offers.map((offer) => ({
      "@type": "Offer",
      name: offer.name,
      description: offer.description,
      price: offer.price,
      priceCurrency: offer.priceCurrency,
      availability: "https://schema.org/InStock",
      url: absoluteUrl(offer.urlPath || path),
    })),
  };
}
