// src/app/layout.tsx
import type { Metadata } from "next";
import React from 'react';
import Script from 'next/script';
import "./globals.css";
import { Providers } from "./providers";


export const metadata: Metadata = {
  title: "Trade Taper",
  description: "Your advanced trading journal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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