# TradeTaper Feature Gating and Entitlement Audit

Date: 2026-03-28  
Author: Codex (implementation + audit pass)  
Scope: Full app entitlement model across backend enforcement and frontend UX gates.

---

## 1) Executive Summary

This audit confirms that core paid surfaces are now enforced server-side with matching frontend gate UX for the major premium/essential features.  
The largest previous gaps (voice parse, notes analyze, predictive trades, replay route parity, MT5 manual account quota path, entitlement status drift) have been fixed.

Key remaining risk:
- Some authenticated AI/agent utilities (notably `agents/risk/*`) are still ungated by plan, which may be intentional, but should be explicitly decided.
- AI quota enforcement is currently fail-open if Redis is unavailable.

---

## 2) Entitlement Contract (Current Source of Truth)

Primary source:
- `tradetaper-backend/src/subscriptions/services/subscription.service.ts`

### Plan tiers

| Plan | Core intent |
|---|---|
| `free` | Basic journaling with strict limits |
| `essential` | Mid-tier with discipline/community/coach access and capped usage |
| `premium` | Full product access |

### Limits and capabilities (as implemented)

| Capability | Free | Essential | Premium |
|---|---:|---:|---:|
| Manual accounts | Unlimited | Unlimited | Unlimited |
| MT5 accounts (base) | 0 | 2 | 4 |
| Trades | 50 | 500 | Unlimited |
| Strategies | 3 | 7 | Unlimited |
| Notes | 0 | 50 | Unlimited |
| Discipline | No | Yes | Yes |
| Backtesting | Restricted | Restricted | Full |
| Psychology | No | No | Yes |
| Reports | No | No | Yes |
| AI analysis | No | No | Yes |
| AI coach | No | Yes | Yes |
| Community | No | Yes | Yes |
| Mentor | No | No | Yes |
| Prop firm | No | No | Yes |
| Advanced analytics | No | No | Yes |
| Market Intelligence AI | No | No | Yes |

### AI monthly quota (separate limiter)

Primary source:
- `tradetaper-backend/src/ai/ai-quota.service.ts`
- `tradetaper-backend/src/subscriptions/guards/feature-access.guard.ts`

| Plan | AI quota/month |
|---|---:|
| `free` | 0 |
| `essential` | 120 |
| `premium` | Unlimited |

Notes:
- Quota is enforced on AI-consuming features via `FeatureAccessGuard`.
- Psychology GET endpoints skip quota consumption by design.
- If Redis is unavailable, quota enforcement is fail-open (logged).

---

## 3) Entitlement Status Handling

### Correct behavior now implemented

Entitlements are now status-aware:
- Paid access applies only when subscription status is `active` or `trialing`.
- Any non-paid status (for a paid plan record) is downgraded to free entitlements at decision time.

Primary implementation:
- `tradetaper-backend/src/subscriptions/services/subscription.service.ts`
  - `resolvePlanForEntitlements(...)`
  - Used by `hasFeatureAccess(...)` and `checkUsageLimit(...)`

### Where status-aligned plan is propagated

- Backend auth snapshot payload:
  - `tradetaper-backend/src/auth/auth.service.ts`
  - `attachSubscription(...)` and `getSubscriptionSnapshot(...)` now expose effective entitlement plan.
- Frontend gate rendering:
  - `tradetaper-frontend/src/components/common/FeatureGate.tsx`
  - `tradetaper-frontend/src/components/layout/Sidebar.tsx`
  - Both now treat non-`active`/`trialing` as effective `free`.

---

## 4) Backend Enforcement Coverage

### A) Feature-gated domains (server-enforced)

| Domain | Enforcement | Plan gate |
|---|---|---|
| Discipline APIs | Class-level `RequireFeature('discipline')` | Essential+ |
| Community APIs | Class-level `RequireFeature('community')` | Essential+ |
| Backtesting APIs | Class-level `RequireFeature('backtesting')` | Premium |
| Replay APIs | Class-level `RequireFeature('backtesting')` | Premium |
| Prop Firm APIs | Class-level `RequireFeature('propFirm')` | Premium |
| Mentor APIs | Endpoint-level `RequireFeature('mentor')` | Premium |
| AI coach APIs | Endpoint-level `RequireFeature('aiCoach')` | Essential+ |
| AI analytics endpoints | Endpoint-level `RequireFeature('aiAnalysis')` / `advancedAnalytics` | Premium |
| Market Intelligence AI endpoints | Endpoint-level `RequireFeature('marketIntelligenceAi')` | Premium |
| Notes psychology APIs | Endpoint/class-level `RequireFeature('psychology')` | Premium |
| Notes AI APIs | Class/endpoint-level `RequireFeature('aiAnalysis')` | Premium |

### B) Usage-limited domains (server-enforced)

| Domain | Guard | Feature key |
|---|---|---|
| Trades create/import | `UsageLimitGuard` + service-level hard check | `trades` |
| Notes create | `UsageLimitGuard` | `notes` |
| Strategies create | `UsageLimitGuard` | `strategies` |
| Manual accounts create | `UsageLimitGuard` | `accounts` |
| MT5 accounts create/manual | `UsageLimitGuard` | `mt5Accounts` |

Important hardening added:
- `TradesService.create(...)` now checks subscription usage directly, covering non-controller ingestion paths.

### C) Specific fixes applied in this pass

1. `POST /trades/voice-parse` now requires `aiAnalysis` (Premium).  
2. `POST /notes/:id/analyze` now requires `aiAnalysis` (Premium).  
3. `POST /predictive-trades/predict` now requires `aiAnalysis` (Premium).  
4. Agent endpoints now gated with `aiCoach` where expected:
   - `POST /agents/market/predict`
   - `POST /agents/psychology/analyze`
   - `POST /agents/workflow/full-analysis`
5. `POST /mt5-accounts/manual` now enforces `mt5Accounts` usage quota.
6. MT5 account limit resolution now status-aware (`active`/`trialing` only).

---

## 5) Frontend Gate Coverage

### Route-level gates

| Route group | Gate component | Plan gate |
|---|---|---|
| `/backtesting/*` | Layout `FeatureGate(feature="backtesting")` | Premium |
| `/replay/*` | Layout `FeatureGate(feature="backtesting")` | Premium |
| `/ai-coach` | Page `FeatureGate(feature="aiCoach")` | Essential+ |
| `/community` | Page `FeatureGate(feature="community")` | Essential+ |
| `/mentor` | Page `FeatureGate(feature="mentor")` | Premium |
| `/prop-firm` | Page `FeatureGate(feature="propFirm")` | Premium |
| `/psychology` | Page `FeatureGate(feature="psychology")` | Premium |

### Section/component-level gates

| Surface | Gate used |
|---|---|
| Dashboard AI insight card | `FeatureGate(feature="aiAnalysis")` |
| Analytics advanced section | `FeatureGate(feature="advancedAnalytics")` |
| Market Intelligence premium AI section | `FeatureGate(feature="aiAnalysis")` |
| Trader Mind discipline/psychology blocks | `FeatureGate(feature="discipline")`, `FeatureGate(feature="psychology")` |

Note:
- `marketIntelligenceAi` (backend key) vs `aiAnalysis` (frontend key) both map to Premium currently, so behavior matches by plan, but naming drift exists.

---

## 6) Gaps, Flaws, and Risks (Current)

### High-priority

1. **Ungated authenticated agent utilities**
   - `agents/risk/*` endpoints currently require auth but not plan features.
   - Risk: potential paid-value leakage if these are intended paid.

2. **AI quota fail-open on Redis outage**
   - In `AiQuotaService`, Redis connection/runtime failures bypass quota checks.
   - Risk: temporary unlimited AI calls under infra incident conditions.

### Medium-priority

3. **Feature key naming drift**
   - `marketIntelligenceAi` vs `aiAnalysis` naming split across backend/frontend.
   - Risk: future mismatch during refactors.

4. **No explicit “reports” route-level frontend gate**
   - Backend capability exists in feature map, frontend route usage appears limited.
   - Risk: later UI additions may forget gate unless a shared contract is used.

### Low-priority

5. **Repo-wide lint/type warning debt**
   - Large pre-existing warning volume can hide new issues.

---

## 7) What Was Verified

Validation run results in this implementation cycle:

- Backend build: pass (`npm run build` in `tradetaper-backend`)
- Frontend build: pass (`npm run build` in `tradetaper-frontend`)
- Targeted ESLint on touched files: no blocking errors (warnings remain from existing codebase baseline)

Also fixed one unrelated blocking backend type regression encountered during validation:
- `tradetaper-backend/src/market-intelligence/economic-calendar.service.ts`
  - narrowed `direction` union type for top movers mapping.

---

## 8) Recommended Next Actions (Priority Order)

1. Decide policy for `agents/risk/*`:
   - If paid: add `FeatureAccessGuard` + `RequireFeature` explicitly.
   - If free: document as intentionally free in entitlement contract.

2. Harden AI quota reliability:
   - Move from fail-open to controlled degrade (for example temporary capped fallback counter) or introduce circuit-breaker policy with explicit alerting.

3. Normalize feature key vocabulary:
   - Unify frontend/backend naming (`marketIntelligenceAi` vs `aiAnalysis`) through a shared enum/contract.

4. Add automated entitlement regression tests:
   - free/essential/premium + canceled/trialing matrix on key endpoints.
   - include service-level ingestion paths.

5. Add docs-backed entitlement source:
   - Keep one canonical table synchronized with `subscription.service.ts`.

---

## 9) Files Most Relevant to Entitlement Logic

Backend:
- `tradetaper-backend/src/subscriptions/services/subscription.service.ts`
- `tradetaper-backend/src/subscriptions/guards/feature-access.guard.ts`
- `tradetaper-backend/src/subscriptions/guards/usage-limit.guard.ts`
- `tradetaper-backend/src/ai/ai-quota.service.ts`
- `tradetaper-backend/src/auth/auth.service.ts`
- `tradetaper-backend/src/trades/trades.service.ts`
- `tradetaper-backend/src/users/mt5-accounts.service.ts`

Frontend:
- `tradetaper-frontend/src/components/common/FeatureGate.tsx`
- `tradetaper-frontend/src/components/layout/Sidebar.tsx`
- `tradetaper-frontend/src/app/(app)/backtesting/layout.tsx`
- `tradetaper-frontend/src/app/(app)/replay/layout.tsx`

---

## 10) Audit Conclusion

The platform now has materially stronger and more consistent plan enforcement across server and UI than before this pass.  
The main remaining work is policy clarity and hardening around ungated authenticated utility endpoints and AI quota resilience during Redis outages.

