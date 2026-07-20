// src/app/layout.tsx
import type { Metadata } from "next";
import { JetBrains_Mono, Poppins } from "next/font/google";
import React, { Suspense } from "react";
import "./globals.css";
import DatafastRouteScript from "@/components/analytics/DatafastRouteScript";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { DEFAULT_SITE_DESCRIPTION, SITE_URL } from "@/lib/seo";

const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION?.trim();
const BING_SITE_VERIFICATION = process.env.BING_SITE_VERIFICATION?.trim();
const YANDEX_SITE_VERIFICATION = process.env.YANDEX_SITE_VERIFICATION?.trim();
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

const verificationMetadata: Metadata["verification"] = {
  ...(GOOGLE_SITE_VERIFICATION
    ? { google: GOOGLE_SITE_VERIFICATION }
    : {}),
  ...(YANDEX_SITE_VERIFICATION
    ? { yandex: YANDEX_SITE_VERIFICATION }
    : {}),
  ...(BING_SITE_VERIFICATION
    ? {
        other: {
          "msvalidate.01": BING_SITE_VERIFICATION,
        },
      }
    : {}),
};

const hasVerificationMetadata =
  Boolean(GOOGLE_SITE_VERIFICATION) ||
  Boolean(BING_SITE_VERIFICATION) ||
  Boolean(YANDEX_SITE_VERIFICATION);

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["100", "300", "400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TradeTaper",
    template: "%s | TradeTaper",
  },
  description: DEFAULT_SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "TradeTaper",
    title: "TradeTaper",
    description: DEFAULT_SITE_DESCRIPTION,
    images: [
      {
        url: "/tradetaperLogo.png",
        width: 512,
        height: 512,
        alt: "TradeTaper",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "TradeTaper",
    description: DEFAULT_SITE_DESCRIPTION,
    images: ["/tradetaperLogo.png"],
  },
  icons: {
    icon: "/tradetaperLogo.png",
    apple: "/tradetaperLogo.png",
  },
  verification: hasVerificationMetadata ? verificationMetadata : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${jetBrainsMono.variable}`}
    >
      <body className="font-sans">
        {children}
        {GA_MEASUREMENT_ID ? (
          <Suspense fallback={null}>
            <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
          </Suspense>
        ) : null}
        <DatafastRouteScript />
      </body>
    </html>
  );
}
