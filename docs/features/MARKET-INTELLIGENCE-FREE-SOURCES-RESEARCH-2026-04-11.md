# Market Intelligence Free Sources Research (April 11, 2026)

## Goal
Build and maintain a free or free-tier pipeline for market-moving:

- News
- Fundamentals (macro/economic)
- Social/crowd attention

for the `Market Intelligence` page without adding paid vendor lock-in.

## What Moves Markets (Practical Priority)

1. Macro policy and surprise data: central bank decisions, inflation, labor, growth.
2. Regulatory and policy headlines: SEC/Fed/ECB statements, enforcement, geopolitical shifts.
3. Broad narrative shifts: rapid attention spikes around risk themes.
4. Retail/crowd positioning: high-engagement social bursts (context only, never standalone trigger).

## Source Research (Free or Free-Tier)

### A) Fundamentals (Highest Signal Quality)

1. FRED API (St. Louis Fed)
   - Why: high-quality macro series with stable identifiers and long history.
   - Free access model: API key required (free key issuance).
   - Notes: suited for inflation/rates/labor/growth dashboards.
   - Docs:
     - https://fred.stlouisfed.org/docs/api/fred/
     - https://fred.stlouisfed.org/docs/api/api_key.html

2. BLS Public Data API (US labor/inflation context)
   - Why: direct labor and CPI-family series.
   - Free access model: public API; registration key unlocks optional parameters.
   - Notes: useful for labor-sensitive FX/rates narratives.
   - Docs:
     - https://www.bls.gov/developers/api_signature_v2.htm

3. ECB Data Portal API (SDMX 2.1)
   - Why: official Eurozone macro/monetary coverage.
   - Free access model: public web service.
   - Notes: strong complement for EUR pairs and EU macro context.
   - Docs:
     - https://data.ecb.europa.eu/help/api/overview

4. World Bank Indicators API
   - Why: broad long-horizon structural indicators.
   - Free access model: open programmatic access.
   - Notes: lower frequency but valuable for macro background cards.
   - Docs:
     - https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation

### B) News (Fast Context Layer)

1. GDELT DOC 2.0 API
   - Why: broad multilingual global media monitoring and direct article-list mode.
   - Free access model: open endpoint usage.
   - Notes: excellent for broad macro headline discovery; add dedupe/ranking internally.
   - Docs/examples:
     - https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/

2. Policy/Regulator RSS (Fed, SEC, ECB)
   - Why: official primary-source announcements reduce rumor noise.
   - Free access model: RSS.
   - Notes: should be weighted above secondary media.

3. NewsAPI (free tier not production-safe)
   - Why: easy aggregator for prototyping.
   - Constraint: Developer plan is development-only and explicitly not for staging/production; 100 req/day, delayed data.
   - Docs:
     - https://newsapi.org/pricing

4. Alpha Vantage
   - Why: broad market + macro endpoints in one vendor.
   - Constraint: free tier has standard daily cap (25 requests/day).
   - Docs:
     - https://www.alphavantage.co/documentation/
     - https://www.alphavantage.co/premium/

### C) Social/Crowd Signals

1. Reddit Data ecosystem
   - Why: strong retail positioning/attention signal.
   - Constraint: commercial usage requires Reddit approval/contract; APIs are rate-limited.
   - Docs/policies:
     - https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data
     - https://redditinc.com/policies/developer-terms
     - https://redditinc.com/policies/data-api-terms

2. Wikimedia Analytics AQS (pageviews)
   - Why: free, low-friction crowd-attention proxy for themes/assets.
   - Access model: no fixed hard rate cap, but must send User-Agent / Api-User-Agent and be well-behaved.
   - License: CC0 for API data.
   - Docs:
     - https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/documentation/access-policy.html
     - https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/concepts/page-views.html

3. YouTube Data API
   - Why: useful for narrative/education channel momentum if needed later.
   - Free-tier model: default 10,000 units/day, per-method cost model.
   - Docs:
     - https://developers.google.com/youtube/v3/determine_quota_cost

4. X API
   - Why: high market impact potential.
   - Constraint: v2 is pay-per-usage; not a free-first default.
   - Docs:
     - https://docs.x.com/x-api/getting-started/about-x-api
     - https://docs.x.com/fundamentals/rate-limits

## Recommended Free-First Stack For TradeTaper

### MVP (Now)

- Fundamentals: FRED (already aligned with existing service).
- News: GDELT + policy/regulator RSS + selective finance RSS.
- Social/crowd: Reddit (non-commercial-safe usage only) + Wikimedia pageview momentum.

### Next (If Needed)

- Add BLS + ECB endpoints directly into macro cards.
- Add World Bank for structural overlays (non-real-time context).
- Add YouTube attention layer behind a feature flag.

## Integration Into Current App

Current implementation already fits the requested placement:

- Backend endpoint:
  - `GET /market-intelligence/market-movers/free`
  - File: `tradetaper-backend/src/market-intelligence/market-intelligence.controller.ts`
- Aggregation service:
  - `tradetaper-backend/src/market-intelligence/free-data-sources/free-market-movers.service.ts`
- Frontend component:
  - `tradetaper-frontend/src/components/market-intelligence/MarketMoversFeed.tsx`
- Page tab integration:
  - `tradetaper-frontend/src/app/(app)/market-intelligence/page.tsx`

## Compliance Guardrails (Required)

1. Keep source attribution visible in UI and payload metadata.
2. Never present social engagement as direct buy/sell advice.
3. Respect per-source usage terms and commercial restrictions (especially Reddit and NewsAPI free tier).
4. Cache aggressively and avoid high-frequency polling.
5. Add fallback behavior when a source fails (partial-success rendering).

## Delivery Decision

For free and production-viable operation, prioritize:

- FRED + GDELT + policy RSS + Wikimedia pageviews

and treat:

- NewsAPI free tier and unrestricted Reddit commercialization

as constrained paths requiring plan/contract upgrade or legal review.
