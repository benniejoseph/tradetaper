// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/store/StoreProvider"; // Adjust path

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} bg-gray-900`} data-new-gr-c-s-check-loaded="14.1235.0" data-gr-ext-installed="">
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}