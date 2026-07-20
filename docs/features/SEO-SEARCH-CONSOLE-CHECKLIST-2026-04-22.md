# Search Console Token Wiring + Verification Checklist (2026-04-22)

## Scope
Operational checklist for `tradetaper-frontend` launch SEO tasks:
- environment token wiring for search engine verification tags
- production verification of robots/sitemap/canonical routing
- Search Console submission and indexing workflow

## 1) Environment token wiring
Set verification tokens in frontend runtime environment (Production first, then Preview if needed).

Required variables:
- `GOOGLE_SITE_VERIFICATION` (Google URL-prefix property token)

Optional variables (not required for current launch scope):
- `BING_SITE_VERIFICATION` (Bing Webmaster token for `msvalidate.01`)
- `YANDEX_SITE_VERIFICATION`

Code references:
- `tradetaper-frontend/src/app/layout.tsx` reads and emits verification metadata tags.
- `tradetaper-frontend/.env.example` documents expected variables.

Example CLI workflow (Vercel):
```bash
cd /Users/benniejoseph/Documents/TradeTaper/tradetaper-frontend
# Option A: one-shot helper (uses exported shell vars)
export GOOGLE_SITE_VERIFICATION="<google-token>"
# Optional only:
# export BING_SITE_VERIFICATION="<bing-token>"
# export YANDEX_SITE_VERIFICATION="<yandex-token>"
npm run set:seo:verification-env

# Option B: manual
vercel env add GOOGLE_SITE_VERIFICATION production
# Optional only:
# vercel env add BING_SITE_VERIFICATION production
# vercel env add YANDEX_SITE_VERIFICATION production
```

Then redeploy production.

## 2) Production verification (automated)
Run the operational check script after deploy:

```bash
cd /Users/benniejoseph/Documents/TradeTaper/tradetaper-frontend
npm run verify:seo:search-console -- https://tradetaper.com
```

Expected pass criteria:
- homepage reachable
- `robots.txt` reachable with:
  - `User-agent: *`
  - `Disallow: /api/`
  - `Sitemap: https://tradetaper.com/sitemap.xml`
- `sitemap.xml` reachable and includes canonical public URLs
- legacy URLs `/privacy`, `/terms`, `/refund` not present in sitemap
- legacy URLs permanently redirect to `/legal/*`

Token-specific checks:
- Google verification meta tag is checked by default
- Bing/Yandex checks are opt-in only (`SEO_CHECK_OPTIONAL_ENGINES=true`)

## 3) Search Console setup steps
1. Add and verify **Domain property** (`tradetaper.com`) using DNS TXT record.
2. Add and verify **URL-prefix property** (`https://tradetaper.com/`) using meta token (optional but useful for some workflows).
3. Submit sitemap: `https://tradetaper.com/sitemap.xml`.
4. Use URL Inspection for top URLs:
   - `/`
   - `/pricing`
   - `/about`
   - `/contact`
   - `/support`
   - `/demo`
   - `/legal/privacy`
   - `/legal/terms`
   - `/legal/cancellation-refund`
5. Request indexing where needed.

## 4) Acceptance checklist
- [ ] Env token set in production (`GOOGLE_SITE_VERIFICATION`)
- [ ] Production redeployed after token changes
- [ ] `npm run verify:seo:search-console -- https://tradetaper.com` passes with zero failures
- [ ] Search Console Domain property verified
- [ ] Search Console URL-prefix property verified (if used)
- [ ] Sitemap submitted and parsed successfully
- [ ] Top launch URLs inspected/requested for indexing

## 5) Ongoing weekly checks (first 4 weeks)
- [ ] Page Indexing report: no unintended private URLs indexed
- [ ] Performance report: impressions/CTR trend on `/` and `/pricing`
- [ ] No new sitemap or robots errors

## 6) Current status (2026-04-29)
- [x] `GOOGLE_SITE_VERIFICATION` set in Vercel production from DNS TXT token (`google-site-verification=D3UF31ghb5qJRDqAvlZ_Pt-W6rT66CkZmZeMnUKuwJE`)
- [x] Bing/Yandex verification intentionally out of scope for launch
- [x] Frontend redeployed after token change (Vercel deployment `TBbqJpmxP8dhvXHvXAJSih6Giaqg`)
- [x] Live homepage includes Google verification meta tag (`<meta name="google-site-verification" ...>`)
- [x] `npm run verify:seo:search-console -- https://tradetaper.com` is the launch gate (Google + robots/sitemap/canonical routing)
- [x] `npm run verify:seo:search-console -- https://www.tradetaper.com` remains optional and may show host mismatch warnings because canonical base is apex
