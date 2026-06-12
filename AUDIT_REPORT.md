# TradeTaper — Principal Engineer Audit & Improvement Plan
**Date:** 2026-06-12 · **Scope:** full monorepo at commit `c559cec` · **Auditor:** Claude (Fable 5)

---

# Executive Summary

**Health Grade: C−** — Ambitious, feature-rich product with a genuinely interesting AI-agent layer, but carrying production-grade security holes, near-zero test coverage, and significant complexity debt. The architecture bones (NestJS modules, agent orchestrator, event bus) are good; the discipline around them is not.

### Top 3 Risks
1. **The admin API is completely unauthenticated and includes raw SQL-injectable database browsing and table-clearing endpoints.** Anyone who finds `api.tradetaper.com/api/v1/admin/*` can read every user, every trade, every subscription — and delete them. The admin frontend even documents this: `tradetaper-admin/src/lib/api.ts:14` — *"No authentication interceptors - open access"*. The docs claim this was fixed (`docs/security/walkthrough_security_cleanup.md`); the code says it was not, or it regressed.
2. **Live Google Gemini API keys are hardcoded and committed** in `tradetaper-backend/src/notes/ai.service.ts:18` and `deploy-cloudrun-quick.sh:51`. They are in git history forever and must be rotated, not just removed.
3. **Zero meaningful test safety net (10 spec files across ~600 source files) + 70 known dependency vulnerabilities (3 critical, 24 high across apps).** Every refactor and dependency bump is a leap of faith.

### Top 3 Opportunities
1. **The agent layer is your moat — productize it.** You already have an orchestrator, event bus, registry, 8 agents, multi-model LLM routing, semantic caching, and cost management. No competitor journal (TraderSync, Tradezella, Edgewonk) has a true multi-agent architecture. Expose it as one coherent "AI Mentor" experience instead of scattering AI across 6 pages.
2. **Radical simplification of the UX.** 17 app routes, 9+ main nav items, three different MT5 connection paths in settings. Collapsing to ~6 core surfaces (Dashboard, Journal, Mentor, Markets, Community, Settings) would make the product feel finished instead of sprawling.
3. **Psychology-first positioning.** You have discipline tracking, psychology agents, and emotional analytics that competitors lack. Lean into "the journal that knows how you feel" — that's a marketing wedge and a retention loop.

---

# Phase 1 — Repo Map

## Structure
```
tradetaper/
├── tradetaper-backend/    NestJS 11, TypeORM + Postgres (pgvector), Redis (Keyv/Upstash),
│   │                      BullMQ, Socket.IO, Razorpay, MetaAPI, Gemini — deployed to Cloud Run
│   └── src/ (38 modules, ~58.5k LOC): trades, users, auth, agents (orchestrator/event-bus/
│       registry/8 implementations), ai, analytics, backtesting, community, discipline,
│       knowledge-base, market-data, market-intelligence (ICT suite), notes, notifications,
│       predictive-trades, prop-firm, statement-parser, subscriptions, terminal-farm, websocket…
├── tradetaper-frontend/   Next.js 15 + React 19, Redux Toolkit + React Query (both!), Tailwind,
│   │                      three.js globe, lightweight-charts, recharts — deployed to Vercel
│   └── src/app/(app)/: 17 authed routes (dashboard, journal, analytics, trader-mind, mentor,
│       psychology, prop-firm, backtesting, community, market-intelligence, notes…)
├── tradetaper-admin/      Next.js admin dashboard — NO AUTH by design (26 source files)
├── terminal-farm/         Dockerized MT5 terminal farm (Wine + supervisor) for local MT5 sync
├── docs/                  Well-organized: INDEX.md, security/, infrastructure/, features/,
│                          overview/CLAUDE.md (~1700-line AI context file)
└── .github/workflows/ci.yml  Lint + typecheck + build all 3 apps; deploy to Cloud Run on main
```

## Entry points & flow
- **Backend:** `src/main.ts` → CORS → WS-JWT adapter → Helmet → cookie-parser → CSRF (prod) → global ValidationPipe → `/api/v1` prefix. `app.module.ts` wires 30+ feature modules; TypeORM via `database.module.ts`; Redis cache via Keyv.
- **Auth:** JWT (passport-jwt) + Google OAuth; token returned to frontend and stored in **localStorage** (`store/features/authSlice.ts:37`); per-controller `@UseGuards(JwtAuthGuard)` (no global guard).
- **Data flow:** MT5 trades arrive via three paths — MetaAPI cloud sync, local terminal-farm EA push, and manual CSV/statement import — into `trades` module; analytics/AI layers read from there.
- **AI flow:** controllers → `AgentOrchestratorService` (in-memory context Map) → `AgentRegistry` → agent implementations → `MultiModelOrchestrator` (Gemini) with `LLMCostManager`, `SemanticCache`, `AiQuotaService` (Upstash Redis).

## Notable repo hygiene
- `logs.json`, `logs2.json`, `api_logs.json` (≈200 KB of production Cloud Run logs), `COMMIT_MESSAGE.md`, `update-analytics.js`, `vercel.json.bak` committed at root.
- Only 10 `.spec.ts` files repo-wide; no e2e tests run in CI; CI runs lint/build only.

---

# Phase 2 — Audit Findings

Severity: **C**ritical / **H**igh / **M**edium / **L**ow. All paths relative to repo root.

## Security

| # | Sev | Finding | Evidence |
|---|-----|---------|----------|
| S1 | **C** | Entire `/admin` API unauthenticated: dashboard stats, all users, all trades, all accounts, DB table browser, **table clearing** | `tradetaper-backend/src/admin/admin.controller.ts:13` — `@Controller('admin')` with zero guards; no global APP_GUARD in `app.module.ts`; no `useGlobalGuards` in `main.ts` |
| S2 | **C** | SQL injection in admin DB endpoints — table name interpolated directly | `admin.service.ts:175` `` `SELECT * FROM "${tableName}" LIMIT 100;` ``, also `:209` and clear-table path |
| S3 | **C** | Hardcoded live Gemini API keys committed (fallback value + deploy script default) | `src/notes/ai.service.ts:18` (`AIzaSyBe259O…`), `deploy-cloudrun-quick.sh:51` (`AIzaSyAWQxW…`) — **rotate both** |
| S4 | **C** | Admin frontend ships with no auth at all | `tradetaper-admin/src/lib/api.ts:14` "No authentication interceptors - open access" |
| S5 | **H** | JWT fallback secret hardcoded — if `JWT_SECRET` env is missing, tokens are forgeable with a public string | `src/auth/auth.module.ts:25` |
| S6 | **H** | CSRF fallback secret hardcoded | `src/main.ts:90` `'default-csrf-secret-change-in-production'` |
| S7 | **H** | JWT stored in localStorage → stealable by any XSS; you already ship `html2canvas`, markdown rendering, and user-generated community content | `tradetaper-frontend/src/store/features/authSlice.ts:37` + 6 services reading `localStorage.getItem('token')` |
| S8 | **H** | 70 npm vulnerabilities: backend 54 (2 critical incl. crypto-js PBKDF2 GHSA-xwcq-pm8m-c4vf, vulnerable `ws`/engine.io chain), frontend 16 (1 critical) | `npm audit` both apps |
| S9 | **H** | No rate limiting: `@nestjs/throttler` is a dependency but `ThrottlerModule` is never registered — login, register, and AI endpoints are brute-forceable and cost-bombable | grep across `src/` finds no `ThrottlerModule` |
| S10 | **H** | DB fallback `synchronize: true` + default `postgres/postgres` credentials in the non-URL config branch | `src/database/database.module.ts:93-103` |
| S11 | **M** | Production logs committed to repo (instance IDs, project IDs, internal hostnames) | `logs.json`, `logs2.json`, `api_logs.json` at root |
| S12 | **M** | CORS allowlist hardcodes localhost + Vercel previews in production config | `src/main.ts:25-38` |
| S13 | **L** | Docs claim S1/S2 already fixed — dangerous false sense of security | `docs/security/walkthrough_security_cleanup.md`, `docs/INDEX.md:27-30` |

**Good security work worth keeping:** Razorpay webhook HMAC verification (`razorpay.service.ts:82-88`), Helmet CSP, WS-JWT adapter, CSRF double-submit pattern, `synchronize:false` in primary path, user-facing controllers consistently guarded (`trades.controller.ts:35`, `agents.controller.ts:24`).

## Architecture & Design

| # | Sev | Finding | Evidence |
|---|-----|---------|----------|
| A1 | **H** | God services: `trades.service.ts` (1,475 LOC), `mt5-accounts.service.ts` (1,465), `economic-calendar.service.ts` (1,463), `backtesting.service.ts` (1,037), `subscription.service.ts` (923) | `wc -l` over src |
| A2 | **H** | In-memory state in a Cloud Run (multi-instance, scale-to-zero) deployment: 50 module-level `new Map<>()` instances incl. agent conversation contexts — sessions silently vanish on scale events | `agent-orchestrator.service.ts:27` `contexts = new Map<…>` |
| A3 | **M** | Three overlapping AI subsystems: `src/agents/*` (orchestrator pattern), `src/notes/gemini-*.ts` + `ai.service.ts` (direct Gemini), `src/market-intelligence/ict/ict-ai-agent.service.ts` (its own agent). No single LLM gateway → inconsistent quota/cost/caching enforcement | 6 files instantiate `GoogleGenerativeAI` independently |
| A4 | **M** | Frontend dual state management — Redux Toolkit *and* React Query both fetch/cache server state; some services hand-roll axios + localStorage token instead of the shared `api.ts` client | `package.json`; `strategiesService.ts:7` |
| A5 | **M** | Three MT5 ingestion paths (MetaAPI, terminal-farm, statement import) with separate code paths and separate settings pages — no unified "connection" abstraction | `users/mt5-accounts.service.ts`, `terminal-farm/`, `statement-parser/` |
| A6 | **L** | 38 backend modules for one product — several are thin (`tags`, `upload` vs `files`) and could merge | `src/` listing |

## Code Quality, Testing, Performance

| # | Sev | Finding | Evidence |
|---|-----|---------|----------|
| Q1 | **C** | ~10 test files for ~600 source files; CI has no test step at all (lint+build only) | `.github/workflows/ci.yml` |
| Q2 | **H** | 326 `: any` usages across backend+frontend — TypeScript safety opt-outs concentrated in the most critical services | grep counts (150 BE / 176 FE) |
| Q3 | **M** | 80 `console.log` calls in frontend production code | grep |
| Q4 | **M** | 1,000+ line page components (`community/page.tsx` 1,246; notes editor pages 1,114/1,082) — unreviewable, untestable, slow to hydrate | `wc -l` |
| Q5 | **M** | Heavy bundle: three.js + three-globe + react-three (3D globe), framer-motion, recharts *and* lightweight-charts *and* react-calendar-heatmap all shipped | frontend `package.json` |
| Q6 | **L** | `tsconfig.tsbuildinfo`, `.bak` files committed | frontend root |

## DevEx, Ops, Documentation

| # | Sev | Finding | Evidence |
|---|-----|---------|----------|
| D1 | **H** | No test gate, no `npm audit` gate, no migration check in CI; deploy to Cloud Run happens on every main push after build only | `ci.yml` |
| D2 | **M** | Six deploy scripts in backend root (`deploy.sh`, `deploy-cloudrun.sh`, `deploy-cloudrun-quick.sh`, `deploy-with-database.sh`, `deploy-trade-taper.sh`, `deploy_helper.py`) — unclear which is canonical; the "quick" one embeds a secret | backend root listing |
| D3 | **M** | No observability strategy: a `/health` endpoint exists but no metrics, no error tracking (Sentry), no structured alerting; committed log dumps suggest debugging-by-download | `app.controller.ts:18`, root logs files |
| D4 | **L** | Docs are extensive but drifting from reality (security walkthrough vs actual code; CLAUDE.md references files by old names) | `docs/` |
| D5 | **L** | No architecture diagrams in repo despite a `docs/overview` that would house them | `docs/` |

## UX / Product / Psychology Review

| # | Sev | Finding |
|---|-----|---------|
| U1 | **H** | **Navigation sprawl:** 9 main nav items + user nav + 4 settings sub-items, while `mentor`, `psychology`, `prop-firm`, `plans` routes exist but aren't in main nav (`config/navigation.ts:13-21` vs `app/(app)/` listing) — features users can't find don't exist. "Trader Mind", "Mentor", "Psychology" sound like three names for one promise. |
| U2 | **M** | **Cognitive load at the moment of pain:** journaling happens right after losses, when willpower is lowest. A 782-line `TradeForm.tsx` with many fields fights human nature. The fastest path from "trade closed" to "journaled" should be near-zero (auto-sync + one-tap emotion tag + optional voice note). |
| U3 | **M** | **Theme:** dark mode uses pure black `0 0 0` background with pure white text (`globals.css` `.dark`) — maximal contrast causes halation/eye strain in long sessions; traders live in dark mode. Emerald-on-black is distinctive, but red/green P&L on pure black reads as a slot machine; muted surfaces (neutral-950/900 like the cards already use) should be the page background too. Two Google-font imports via CSS `@import` also block first paint — use `next/font`. |
| U4 | **M** | **No habit loop:** trading journals live or die on streaks. There's a heatmap dependency but no visible streak/“don't break the chain” mechanic, no end-of-day review ritual, no weekly AI recap email. Discipline module exists server-side — surface it. |
| U5 | **M** | **Trust & loss framing:** post-loss screens should never lead with bright red dollar amounts; lead with process metrics ("you followed your plan 4/5 times this week") — you have the discipline data to do this and competitors don't. |
| U6 | **L** | Three MT5 connection options presented as peer choices in settings — users can't tell which to pick. One "Connect your broker" wizard should route them. |

---

# Phase 3 — Improvement Strategy

## Themes (5 themes explain ~90% of findings)

**T1 — "The locks were never installed" (S1–S10):** Security features exist (guards, CSRF, HMAC) but the discipline of applying them universally doesn't. Root cause: no global-deny-by-default guard, no secret scanning, docs that record intent as fact.

**T2 — "No safety net" (Q1, D1, S8):** Velocity has been bought with debt: no tests, no audit gate, no staging. Every theme below is risky to execute until this one is addressed.

**T3 — "Three of everything" (A3, A4, A5, U6, D2):** AI integrations ×3, state managers ×2, MT5 paths ×3, deploy scripts ×6, chart libs ×2. Consolidation is the highest-leverage refactor.

**T4 — "Feature sprawl over product focus" (U1, U2, A6):** 17 routes diffuse the core loop (trade → journal → insight → behavior change). The agentic layer should be one omnipresent Mentor, not six scattered AI pages.

**T5 — "Stateless service, stateful code" (A2, D3):** In-memory Maps on Cloud Run is a correctness bug, not a style issue. All cross-request state goes to Redis/Postgres; add real observability.

## Target state
- Deny-by-default global `JwtAuthGuard` + `RolesGuard`; admin behind RBAC; zero secrets in repo (verified by CI scanner); 0 critical/high CVEs.
- One `LlmGateway` module fronting all Gemini calls (quota, cost, cache, model routing in one choke point).
- One "Connections" abstraction for all trade ingestion.
- Core-flow test suite (auth, trades CRUD, billing webhooks, agent routing) at ~40% coverage of services, running in CI before deploy; staged deploys.
- UX collapsed to 6 surfaces; Mentor as a persistent right-rail/command-bar presence; streak + weekly recap habit loop.

## What NOT to fix (and why)
- **Don't migrate off Redux to pure React Query now** — high churn, low user value; just stop adding new Redux server-state and converge gradually.
- **Don't rewrite god services wholesale** — extract only what you touch (strangler pattern); a big-bang split without tests is how you create outages.
- **Don't drop the 3D globe / brand flourishes yet** — differentiation matters for a consumer product; instead lazy-load them (`next/dynamic`) so they cost nothing on core pages.
- **Don't build more agents** until the existing 8 are reachable through one UX and measured (usage, cost, satisfaction). Breadth is already ahead of adoption.
- **Don't chase 100% type-strictness** — burn down `any` only in security- and money-touching code paths.

## Definition of done (measurable)
1. `npm audit --omit=dev` → 0 critical, 0 high in all three apps.
2. Unauthenticated request to every `/admin/*` route → 401 (asserted by an e2e test in CI).
3. Secret scanner (gitleaks) green in CI; both Gemini keys rotated and confirmed dead.
4. CI: tests must pass before deploy job; coverage floor 40% on `auth`, `trades`, `subscriptions`, `agents`.
5. Exactly one code path constructs a Gemini client (enforced by ESLint no-restricted-imports rule).
6. Main nav ≤ 6 items; time-to-journal-a-synced-trade ≤ 15 seconds in a usability test.
7. p95 API latency and error rate visible on a dashboard with alerting; zero `new Map` instances holding cross-request user state.

---

# Phase 4 — Task Plan

## ⚡ Quick wins — do immediately (all S effort, high impact)

| QW | Task | Risk |
|----|------|------|
| QW1 | **Rotate both Gemini keys** in Google Cloud console; delete fallbacks in `ai.service.ts:18` & `deploy-cloudrun-quick.sh:51`; fail fast if env missing | None |
| QW2 | Add `@UseGuards(JwtAuthGuard, AdminGuard)` to `AdminController` (an admin role check against `User`); deploy same day | Low — admin UI must send a token; acceptable breakage |
| QW3 | Whitelist-validate `tableName` in `admin.service.ts` against `information_schema` results; remove `clear-table` endpoint entirely | None |
| QW4 | Remove hardcoded JWT/CSRF fallback secrets — throw on missing env (`auth.module.ts:25`, `main.ts:90`) | Low |
| QW5 | `npm audit fix` (non-breaking) all three apps; pin `crypto-js`≥4.2, bump `ws` chain | Low |
| QW6 | Delete `logs*.json`, `api_logs.json`, `COMMIT_MESSAGE.md`, `*.bak`, `tsconfig.tsbuildinfo`; add to `.gitignore` | None |
| QW7 | Register `ThrottlerModule` globally; strict limits on `/auth/login`, `/auth/register`, all agent endpoints | Low |
| QW8 | Add gitleaks + `npm audit --audit-level=high` steps to `ci.yml` | None |
| QW9 | Correct `docs/security/walkthrough_security_cleanup.md` to reflect reality until QW2/QW3 ship | None |

## M0 — Safety Net (week 1–2)
| Task | Effort | Risk | Depends |
|------|--------|------|---------|
| M0.1 All quick wins above | S–M total | Low | — |
| M0.2 e2e smoke suite: auth flows, trades CRUD, admin-401s, Razorpay webhook signature reject | M | Low | — |
| M0.3 CI gate: tests + audit before `deploy-cloudrun`; add a manual-approval staging step | S | Low | M0.2 |
| M0.4 Error tracking (Sentry) in all 3 apps + Cloud Run alerting on 5xx/p95; delete debugging-by-log-download habit | M | Low | — |
| M0.5 Consolidate deploy scripts to one parameterized script + document; delete the other five | S | Low | — |

## M1 — Critical fixes (week 2–4)
| Task | Effort | Risk | Depends |
|------|--------|------|---------|
| M1.1 Global deny-by-default `APP_GUARD` (JwtAuthGuard) + `@Public()` decorator for the ~6 truly public routes; RBAC `RolesGuard` for admin | M | **High** (route inventory needed) | M0.2 |
| M1.2 Admin app real login (JWT + role) replacing "open access" | M | Med | M1.1 |
| M1.3 Move JWT to httpOnly cookies (backend already has cookie-parser + CSRF ready); keep localStorage fallback one release | L | Med | M1.1 |
| M1.4 Externalize all in-memory state: agent contexts → Redis with TTL; audit all 50 `new Map` sites, fix the cross-request ones | L | Med | M0.2 |
| M1.5 Breaking-change dependency upgrades from audit remainder | M | Med | M0.2 |

## M2 — High-leverage consolidation (month 2)
| Task | Effort | Risk | Depends |
|------|--------|------|---------|
| M2.1 `LlmGateway` module: single Gemini client factory; route notes/ICT/predictive/backtest AI through it; enforce quota+cost+semantic-cache centrally; ESLint rule banning direct `@google/generative-ai` imports | L | Med | M1.4 |
| M2.2 Strangler-split `trades.service.ts`: extract analytics, import, and enrichment sub-services with tests as you go | L | Med | M0.2 |
| M2.3 Unified "Connections" domain: one entity + state machine over MetaAPI / terminal-farm / statement import; one settings wizard UI | XL | High | M2.2 |
| M2.4 Service-layer tests to 40% on auth/trades/subscriptions/agents | L | Low | M0.2 |
| M2.5 Burn down `: any` in money/auth/agent paths (~150 sites) | M | Low | M2.4 |

## M3 — Product polish & differentiation (month 3+)
| Task | Effort | Risk | Depends |
|------|--------|------|---------|
| M3.1 **Nav collapse to 6 surfaces**: Dashboard, Journal, **Mentor** (absorbs trader-mind + mentor + psychology + AI chat), Markets (market-intelligence + backtesting), Community, Settings. Prop-firm + plans surfaced contextually | L | Med | — |
| M3.2 **15-second journaling**: auto-synced trade → push notification → one-tap emotion + rule-adherence chips → optional voice note (transcribed by LlmGateway) | L | Med | M2.1, M2.3 |
| M3.3 **Habit loop**: journaling streaks, end-of-day 3-question review ritual, Monday AI recap email (Resend is already integrated) | M | Low | M3.2 |
| M3.4 **Process-first loss framing**: post-loss views lead with discipline metrics, not red P&L; configurable "P&L hidden mode" for tilt-prone users | M | Low | M3.1 |
| M3.5 Theme refinement: dark bg to neutral-950 instead of pure black; `next/font` for Poppins/JetBrains Mono; audit red/green contrast for color-blind users (10% of male traders) — offer blue/orange alt palette | S | Low | — |
| M3.6 Lazy-load three.js globe & heavy charts via `next/dynamic`; split the 1,000+ line pages | M | Low | — |
| M3.7 Docs refresh: C4 architecture diagrams (mermaid in `docs/overview/`), per-feature user guides, regenerate CLAUDE.md from code | M | Low | M2.x |

### Unique enhancement ideas (backlog, post-M3)
- **Mentor command bar (⌘K):** one entry point to all 8 agents — "why did I lose money on NQ this week?" routes via the orchestrator you already built.
- **Pre-trade checkpoint:** terminal-farm EA pings backend before order placement → risk-manager agent returns plan-compliance verdict in <1s. No journal competitor does pre-trade intervention.
- **Tilt detection:** revenge-trading signature (shrinking intervals + growing size after a loss) triggers a gentle cool-down prompt; you have the data and the psychology agent.
- **Weekly "Trader Report Card" share image** — branded, P&L-optional (process metrics only) for social sharing; growth loop that respects privacy.
- **Broker-verified track record page** (public profile with verified stats) — prop-firm evaluators would value it; ties into the prop-firm module.

---

# Open Questions
1. Is the deployed production admin API actually reachable at a public URL right now? If yes, treat S1/S2 as an active incident: check access logs for exploitation before anything else.
2. Were the committed Gemini keys ever production keys with billing attached? (Rotation is mandatory either way; quota theft may already have occurred.)
3. Is `tradetaper-admin` meant to be deployed publicly (Vercel URL appears in CORS allowlist) or internal-only? If internal-only, IP-allowlist it at the platform layer in addition to M1.2.
4. What is the real usage split among the three MT5 ingestion paths? Telemetry should decide whether terminal-farm survives M2.3.
5. Razorpay is the only PSP — is the product India-first? That affects pricing-page design, GST handling, and whether Stripe is needed for global expansion.
6. The `.agents/` rules + `docs/overview/CLAUDE.md` suggest AI-assisted development; the docs-vs-code drift (security walkthrough) suggests generated docs are trusted without verification — consider a "docs assert reality" CI check (e.g., the admin-401 e2e doubles as proof).
