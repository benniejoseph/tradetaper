---
name: feature-gate-subscriptions
description: Implement and repair subscription feature gating for Essential and Premium plans across backend and frontend. Use when adding paid features, limiting Essential usage, enforcing Premium-only endpoints, or fixing entitlement mismatch bugs.
---
# Subscription Feature Gates

Apply this workflow whenever plan-based access or limits are changed.

## 1. Define Entitlement Contract First

Declare for each feature:
- availability (`free`, `essential`, `premium`)
- limits (daily/monthly quota, seat/account caps)
- reset strategy (rolling window or billing-cycle reset)

## 2. Enforce on Backend (Source of Truth)

Implement/verify backend checks before business logic:
- guard/decorator/service-level entitlement check
- standardized `403` response for forbidden usage
- standardized `429`/domain error for quota exhaustion

Never rely on frontend-only gating.

## 3. Mirror on Frontend UX

Add UI states that match backend behavior:
- locked CTA for unavailable features
- usage meter and limit warnings
- upgrade prompt for blocked actions

Keep UI labels aligned with backend plan names.

## 4. Protect Against Drift

When profile page and billing page disagree, reconcile from one authoritative entitlement source.

Validate:
- auth/me response entitlement
- billing/subscription response entitlement
- rendered badges/labels in profile + billing pages

## 5. Validate End-to-End

Test at least:
- Essential user within quota
- Essential user at quota limit
- Premium user full access
- expired subscription fallback behavior

Use `references/gating-checklist.md` as release checklist.
