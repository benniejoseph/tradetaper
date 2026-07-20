import { headers } from "next/headers";
import PricingPageClient from "./page.client";
import { resolveCurrencyCodeFromHeaders } from "@/lib/currency";

export default async function PricingPage() {
  const requestHeaders = await headers();
  const initialCurrencyCode = resolveCurrencyCodeFromHeaders(requestHeaders);

  return <PricingPageClient initialCurrencyCode={initialCurrencyCode} />;
}
