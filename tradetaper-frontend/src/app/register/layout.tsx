import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProviders } from "../providers";

export const metadata: Metadata = {
  title: "Register",
  alternates: {
    canonical: "/register",
  },
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

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return <AuthProviders>{children}</AuthProviders>;
}
