// src/components/marketing/MarketingChrome.tsx
import Link from "next/link";
import Image from "next/image";

const NAV = [
  { label: "Best Journals", href: "/best-trading-journal" },
  { label: "Blog", href: "/blog" },
  { label: "Compare", href: "/compare" },
  { label: "Pricing", href: "/pricing" },
];

const FOOTER_RESOURCES = [
  { label: "Best Trading Journals", href: "/best-trading-journal" },
  { label: "Free Trading Journal", href: "/free-trading-journal" },
  { label: "Trading Journal App", href: "/trading-journal-app" },
  { label: "Trading Journal Template", href: "/trading-journal-template" },
  { label: "AI Trading Journal", href: "/features/ai-trade-review" },
  { label: "MT5 Trading Journal", href: "/features/mt5-trading-journal" },
  { label: "Prop Firm Journal", href: "/features/prop-firm-trading-journal" },
  // Was orphaned: in the sitemap but with no internal links pointing at it.
  { label: "Trading Journal India", href: "/trading-journal-india" },
];

const FOOTER_COMPARE = [
  { label: "Tradervue Alternative", href: "/compare/tradervue-alternative" },
  { label: "Tradezella Alternative", href: "/compare/tradezella-alternative" },
  { label: "TraderSync Alternative", href: "/compare/tradersync-alternative" },
  { label: "Edgewonk Alternative", href: "/compare/edgewonk-alternative" },
  { label: "Options Journal", href: "/options-trading-journal" },
  { label: "Forex Journal", href: "/forex-trading-journal" },
  { label: "Trading Journal Examples", href: "/blog/trading-journal-examples" },
];

/**
 * Shared header + footer for SEO marketing/content pages. Provides site
 * navigation and a resource-rich footer so every content page is internally
 * linked to the rest of the cluster (and vice-versa).
 */
export default function MarketingChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-black dark:text-white selection:bg-emerald-500/30">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/tradetaperLogo.png"
              alt="TradeTaper"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
              priority
            />
            <span className="text-lg font-semibold tracking-tight">
              Trade<span className="text-emerald-600 dark:text-emerald-400">Taper</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white sm:inline"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-gray-200 bg-gray-50 dark:border-zinc-800 dark:bg-black">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image
                src="/tradetaperLogo.png"
                alt="TradeTaper"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="text-lg font-semibold tracking-tight">
                Trade<span className="text-emerald-600 dark:text-emerald-400">Taper</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              An execution-grade trading journal with automatic MT5 sync,
              AI-backed review, and risk discipline tools.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-500">
              Product
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {FOOTER_RESOURCES.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-500">
              Compare
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {FOOTER_COMPARE.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-500">
              Company
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/blog" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Blog</Link></li>
              <li><Link href="/pricing" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Pricing</Link></li>
              <li><Link href="/about" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">About</Link></li>
              <li><Link href="/contact" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Contact</Link></li>
              <li><Link href="/legal/privacy" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Privacy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 py-6 text-center text-xs text-gray-500 dark:border-zinc-800 dark:text-gray-500">
          © {new Date().getFullYear()} TradeTaper. Educational tools for traders — not financial advice.
        </div>
      </footer>
    </div>
  );
}
