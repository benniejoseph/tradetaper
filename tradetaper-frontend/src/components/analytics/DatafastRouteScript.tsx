"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

const ENABLED_ROUTES = ["/", "/pricing", "/about", "/contact", "/support", "/demo"];

function isEnabledPath(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }

  return ENABLED_ROUTES.some((route) => {
    if (route === "/") {
      return false;
    }
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export default function DatafastRouteScript() {
  const pathname = usePathname() || "/";

  if (!isEnabledPath(pathname)) {
    return null;
  }

  return (
    <Script
      src="https://datafa.st/js/script.js"
      data-website-id="dfid_4j7Evt2Hhmlb1CbPLbHK3"
      data-domain="tradetaper.com"
      strategy="lazyOnload"
    />
  );
}
