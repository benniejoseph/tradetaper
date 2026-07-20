import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Theme Debug",
  description: "Internal theme validation utility page.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function ThemeDebugLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
