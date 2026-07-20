# TradeTaper SEO Launch Plan (2026-04-21)

## Scope
This plan is for `tradetaper-frontend` launch SEO, focused on technical SEO, metadata quality, index control, and launch monitoring.

## Research Base (Primary Sources)
- Google SEO fundamentals and title/snippet guidance:
  - https://developers.google.com/search/docs/fundamentals/seo-starter-guide
  - https://developers.google.com/search/docs/appearance/title-link
  - https://developers.google.com/search/docs/appearance/snippet
- Crawl/index controls:
  - https://developers.google.com/search/docs/crawling-indexing/robots/intro
  - https://developers.google.com/search/docs/crawling-indexing/block-indexing
  - https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
  - https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
  - https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Structured data:
  - https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
  - https://developers.google.com/search/docs/appearance/structured-data/organization
  - https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
  - https://developers.google.com/search/docs/appearance/structured-data/sd-policies
  - https://developers.google.com/search/docs/appearance/structured-data/faqpage
- Search Console ops:
  - https://support.google.com/webmasters/answer/34592
  - https://support.google.com/webmasters/answer/9008080
  - https://support.google.com/webmasters/answer/12482179
  - https://support.google.com/webmasters/answer/7440203
  - https://support.google.com/webmasters/answer/7576553
- Core Web Vitals / INP:
  - https://web.dev/inp/
  - https://web.dev/articles/optimize-inp
- Next.js App Router metadata files:
  - https://nextjs.org/docs/app/getting-started/metadata-and-og-images
  - https://nextjs.org/docs/app/api-reference/file-conventions/metadata
  - https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
  - https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap

## Current State Audit (Repo)
### Critical gaps
- No robots file: missing `src/app/robots.ts` or `src/app/robots.txt`.
- No sitemap file: missing `src/app/sitemap.ts` or `src/app/sitemap.xml`.
- Root metadata is minimal in `src/app/layout.tsx` (no title template, canonical, Open Graph/Twitter, `metadataBase`).
- Most public pages are missing page-level metadata (`title`, `description`, canonical).
- Authenticated app layout has metadata commented out in `src/app/(app)/layout.tsx`; no explicit `noindex` for private app routes.
- Duplicate legal-style route families exist (`/privacy` vs `/legal/privacy`, `/terms` vs `/legal/terms`) and canonical intent is not explicit.

### Likely impact
- Slow or inconsistent indexing and weaker snippets.
- Duplicate URL confusion for canonical selection.
- Private/product app URLs may be crawled/indexed unnecessarily.
- Lower CTR potential from weak title/description/OG coverage.

## Launch Goals (First 30 Days)
- Index only intended public pages; keep private app pages out of index.
- Reach >= 90% coverage for unique page titles and meta descriptions on public routes.
- Ensure sitemap submission and healthy index coverage in Search Console.
- Establish CWV baseline and keep INP p75 <= 200ms for key landing pages.

## Prioritized Execution Plan

## Phase 0 (Immediate, 24-48h, block launch risk)
1. Add crawl/index control files.
- Create `src/app/robots.ts`.
- Create `src/app/sitemap.ts` with canonical public URLs only.

2. Lock down private app routes from indexing.
- In `src/app/(app)/layout.tsx`, add metadata with:
  - `robots: { index: false, follow: false }`
  - `googleBot: { index: false, follow: false }`
- Keep this for all authenticated app pages (`/dashboard`, `/journal`, `/analytics`, etc.).

3. Establish global metadata baseline.
- Update `src/app/layout.tsx` with:
  - `metadataBase` for `https://tradetaper.com`
  - title template (`%s | TradeTaper`)
  - default description
  - default OG/Twitter metadata
  - default canonical via `alternates`.

4. Canonicalize duplicate public routes.
- Pick one legal URL family as canonical.
- 301 redirect alternate duplicates in `next.config.ts`.
- Ensure sitemap only includes canonical URLs.

## Phase 1 (Launch week, high CTR/value)
1. Add page-level metadata for top public pages.
- Priority routes:
  - `/` (`src/app/page.tsx`)
  - `/pricing`, `/about`, `/contact`, `/support`
  - canonical legal pages (`/privacy`, `/terms`, `/refund` or `/legal/*`, not both)
  - `/demo`, `/register`, `/login` (login/register can be `noindex` if desired)

2. Add structured data (JSON-LD) for brand/entity.
- Add `Organization` to homepage.
- Add `BreadcrumbList` to key non-home public pages.
- Do not rely on `FAQPage` rich results unless the property qualifies (Google now limits FAQ rich results primarily to health/government authoritative sites).

3. Add social preview assets.
- Add route-level or global `opengraph-image` and `twitter-image`.
- Ensure image dimensions and branding are consistent.

## Phase 2 (Performance and render quality, week 2)
1. Reduce homepage JS pressure.
- Current landing page is heavily client-rendered (`"use client"` in `src/app/page.tsx`).
- Split into server-rendered shell + client islands for interactive components.

2. Optimize CWV on landing and pricing pages.
- Track LCP, CLS, INP for `/` and `/pricing`.
- Prioritize responsive interaction paths (navigation menus, plan toggles, CTA interactions).

## Phase 3 (Search Console operations, week 2-4)
1. Verify Search Console domain property and URL-prefix property.
2. Submit sitemap and validate parsing.
3. Inspect and request indexing for top pages after deploy.
4. Monitor:
- Page Indexing report (coverage errors, excluded reasons).
- Performance report (queries, pages, CTR trends).

## Route Indexing Policy (Recommended)
- `index,follow`:
  - `/`, `/pricing`, `/about`, `/contact`, `/support`, legal canonical pages, selected marketing pages.
- `noindex,follow` or `noindex,nofollow`:
  - Authenticated app routes under `/(app)`.
  - Auth callback pages, internal utility/debug pages.
  - Thin/conversion-only utility pages where indexing is not useful.

## Implementation Checklist (Owner + Done/Not Done)
- [ ] Add `src/app/robots.ts`.
- [ ] Add `src/app/sitemap.ts`.
- [ ] Upgrade global metadata in `src/app/layout.tsx`.
- [ ] Add noindex metadata in `src/app/(app)/layout.tsx`.
- [ ] Canonical route decisions + redirects in `next.config.ts`.
- [ ] Public route metadata for `/`, `/pricing`, `/about`, `/contact`, `/support`.
- [ ] JSON-LD for Organization on homepage.
- [ ] Breadcrumb JSON-LD on major public child routes.
- [ ] OG/Twitter images.
- [ ] Search Console property verification and sitemap submission.
- [ ] URL Inspection pass for top 10 launch URLs.
- [ ] CWV baseline dashboard (LCP/CLS/INP) and weekly review.

## KPI Targets (First 30 days)
- Technical:
  - 0 critical sitemap/robots errors.
  - 0 unintended private routes indexed.
  - >= 95% of public routes with unique title + meta description.
- Search performance:
  - Impressions trend up week-over-week post-indexing.
  - CTR lift on `/` and `/pricing` after metadata improvements.
- UX quality:
  - INP p75 <= 200ms on key marketing pages.

## Notes
- Keep content and metadata aligned: avoid generic titles/descriptions.
- Avoid canonical conflicts: redirects, canonical tags, and sitemap URLs must agree.
- For small sites, crawl budget tuning is not a priority; sitemap freshness and clean internal linking are enough.
