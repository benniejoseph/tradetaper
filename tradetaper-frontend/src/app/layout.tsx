// src/app/layout.tsx
import type { Metadata } from "next";
import React from 'react';
import Script from 'next/script';
import { Poppins, JetBrains_Mono } from 'next/font/google';
import "./globals.css";
import { Providers } from "./providers";

// Self-hosted via next/font: no render-blocking CSS @import, no layout
// shift, fonts served from our own origin.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Trade Taper",
  description: "Your advanced trading journal",
  icons: {
    icon: "/tradetaperLogo.png",
    apple: "/tradetaperLogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>
            {children}
        </Providers>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
