// src/app/layout.tsx
import type { Metadata } from "next";
// import { Inter } from "next/font/google"; // Removed Inter
import "./globals.css";
import StoreProvider from "@/store/StoreProvider"; // Adjust path
import { ThemeProvider } from "@/context/ThemeContext"; // Added ThemeProvider

// const inter = Inter({ subsets: ["latin"] }); // Removed Inter

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
    <html lang="en">{/* The 'dark' class will be applied here by ThemeProvider */}
      {/* Removed inter.className and default bg from body, handled by globals.css and ThemeProvider */}
      <body> 
        <StoreProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}