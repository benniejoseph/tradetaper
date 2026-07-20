# TradeTaper Email Services + Marketing Deep Dive (2026-04-04)

## Scope
- Backend email delivery, template design, and trigger coverage.
- Subscription/referral/coupon email readiness.
- Product lifecycle + marketing funnel coverage and instrumentation.
- Gaps affecting conversion, retention, and trust.

## Code Surfaces Reviewed
- `tradetaper-backend/src/notifications/notifications.service.ts`
- `tradetaper-backend/src/notifications/notification-scheduler.service.ts`
- `tradetaper-backend/src/notifications/entities/notification.entity.ts`
- `tradetaper-backend/src/notifications/entities/notification-preference.entity.ts`
- `tradetaper-backend/src/subscriptions/services/subscription.service.ts`
- `tradetaper-backend/src/subscriptions/services/subscription-scheduler.service.ts`
- `tradetaper-backend/src/subscriptions/subscriptions.controller.ts`
- `tradetaper-backend/src/subscriptions/services/razorpay.service.ts`
- `tradetaper-backend/src/common/services/observability.service.ts`
- `tradetaper-frontend/src/lib/observability/client.ts`
- `tradetaper-frontend/src/app/(app)/billing/page.tsx`
- `tradetaper-frontend/src/app/pricing/page.tsx`
- `tradetaper-frontend/src/app/contact/page.tsx`
- `tradetaper-frontend/src/services/authService.ts`

## Current State (Before This Pass)
- Email provider: `Resend` via `RESEND_API_KEY`, send path inside notifications service.
- Email body previously: single inline generic HTML block for all notification types.
- User-level channel preferences exist and already support per-type email toggles.
- Subscription lifecycle already generates notification events (renewal, trial ending, trial ended, expiry, slot unlock), but template intent was generic.
- Referral/coupon data model exists and is wired to checkout/offer resolution, but referral lifecycle messaging was not fully productized.
- Push channel is still a placeholder (`deliverPush` warns "not yet implemented").
- Daily digest preferences exist in DB + UI, but digest generation/send workflow is not implemented.

## Implemented in This Update

### 1) Template-driven email renderer
- Added reusable renderer service:
  - `tradetaper-backend/src/notifications/email/email-template-renderer.service.ts`
- Notification emails now use:
  - Template ID resolution
  - Structured context extraction
  - Branded HTML + text output
  - Safe escaping for message/title fields
  - Manage-preferences + support footer links

### 2) Notification-to-template mapping
- Added explicit mapper:
  - `tradetaper-backend/src/notifications/email/notification-email-template.mapper.ts`
- `NotificationType` is now mapped to specific email template IDs with fallback logic (including MT5 slot and trial reminder branching).

### 3) Expanded template catalog to cover app notifications
- Updated:
  - `tradetaper-backend/src/notifications/email/email-template-catalog.ts`
- Added missing product/community templates for live app events:
  - `product.trade_created`
  - `product.trade_updated`
  - `product.trade_closed`
  - `product.ai_insight`
  - `product.strategy_alert`
  - `product.account_linked`
  - `product.account_unlinked`
  - `community.new_post`
  - `community.mention`
  - `community.reply`

### 4) Notifications service integration
- Updated:
  - `tradetaper-backend/src/notifications/notifications.service.ts`
  - `tradetaper-backend/src/notifications/notifications.module.ts`
- Email delivery now sends rendered subject/html/text from the renderer instead of inline hardcoded HTML.

### 5) Build verification
- Backend build passed after integration:
  - `npm run build` in `tradetaper-backend`

## Full Template Inventory (Designed + In Catalog)

### Transactional / Lifecycle Core
- `system.notification_generic`
- `auth.welcome`
- `auth.password_reset_request`
- `auth.password_reset_success`
- `auth.security_new_login`
- `billing.trial_started`
- `billing.trial_ending`
- `billing.trial_ended`
- `billing.subscription_renewed`
- `billing.subscription_expiring`
- `billing.payment_failed`
- `billing.subscription_canceled`
- `billing.invoice_receipt`
- `billing.refund_processed`
- `billing.plan_changed`
- `billing.mt5_slot_unlocked`
- `referral.invite`
- `referral.reward_qualified`
- `referral.reward_paid`

### Product Templates
- `product.trade_created`
- `product.trade_updated`
- `product.trade_closed`
- `product.ai_insight`
- `product.strategy_alert`
- `product.account_linked`
- `product.account_unlinked`
- `product.mt5_sync_complete`
- `product.mt5_sync_error`
- `product.economic_event_alert`
- `product.weekly_performance_digest`
- `product.monthly_performance_digest`

### Community Templates
- `community.new_post`
- `community.mention`
- `community.reply`

### Marketing Templates
- `marketing.reactivation_nudge`
- `marketing.feature_release`

## Marketing Strategy Assessment

## What is strong
- Billing and entitlement architecture is now robust enough for plan-aware lifecycle messaging.
- Currency-aware pricing flow exists (INR/India, USD/rest).
- PostHog client/server foundation exists.
- Upgrade value framing ("What unlocks on upgrade") is already present on pricing + billing pages.

## Key gaps (high-impact)
- No persistent attribution model for acquisition metadata (UTM/source/campaign) in auth/subscription flows.
- No lifecycle campaign orchestration layer for onboarding/reactivation/winback (currently event-level only).
- Contact page is UI-only and does not submit to backend CRM/helpdesk flow.
- Password-reset API mismatch remains:
  - Frontend calls `/auth/forgot-password`
  - Backend has no matching endpoint.
- Digest preference exists, but digest jobs/template sends are not wired.

## Recommended funnel architecture
- Acquisition:
  - Capture `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `ref`, landing page, first referrer.
  - Persist at session + user level on first touch and last touch.
- Activation (Day 0-7):
  - Trigger welcome + "first trade logged" + "first review completed" nudges.
  - Goal: first value action within 24h.
- Conversion:
  - Trigger trial ending and feature-lock context emails with direct upgrade path.
  - Use plan-specific value props from usage data (not generic upsell text).
- Retention:
  - Weekly/monthly digest with behavior KPIs and one concrete next action.
  - Inactivity-based reactivation sequence.
- Referral:
  - Invite, qualified, rewarded lifecycle already modeled in DB; complete with automated sends and dashboard attribution.

## Recommended PostHog Event Backlog
- Acquisition:
  - `landing_cta_clicked`
  - `pricing_plan_viewed`
  - `pricing_plan_selected`
  - `referral_code_applied`
  - `coupon_code_applied`
- Activation:
  - `first_trade_logged`
  - `first_trade_review_completed`
  - `first_strategy_created`
- Conversion:
  - `checkout_started`
  - `subscription_created`
  - `payment_failed`
  - `subscription_renewed`
- Retention:
  - `weekly_digest_opened`
  - `monthly_digest_opened`
  - `reactivation_email_clicked`
- Referral:
  - `referral_code_generated`
  - `referral_share_clicked`
  - `referral_qualified`
  - `referral_reward_issued`

## Deliverability + Compliance Checklist
- Add and enforce:
  - SPF, DKIM, DMARC on sender domain.
  - Distinct sender identities by stream:
    - `notifications@...` (transactional)
    - `updates@...` (product marketing)
    - `billing@...` (receipts/subscription)
- Add list-unsubscribe headers for marketing templates.
- Keep transactional and marketing suppression lists separate.
- Add send logs and bounce/complaint webhook handling if not already configured at provider level.

## Gating + Plan Communication Recommendations
- Current gating direction is broadly correct:
  - Free = limited journaling/core.
  - Essential = active trader workflow.
  - Premium = full intelligence/replay/reports stack.
- Marketing improvement:
  - Shift upgrade messaging from feature list only to outcome claims tied to user usage:
    - "You hit 80% trade limit"
    - "Unlock X to review Y missed setups"
    - "You generated N data points; unlock advanced analytics to detect pattern drift"

## Priority Execution Plan
- P0 (now):
  - Finish password reset backend flow to match frontend call.
  - Add attribution persistence at auth/register + checkout entry.
  - Wire digest scheduler for users with `dailyDigestEnabled = true`.
- P1:
  - Introduce campaign orchestrator tables (`campaigns`, `email_jobs`, `email_events`).
  - Add funnel event coverage listed above.
  - Wire contact form submit endpoint + CRM/email routing.
- P2:
  - A/B test subject lines and CTA copy for trial-ending + reactivation.
  - Add per-template performance dashboard (open/click/convert).

## Suggested KPI Targets (first 60 days)
- Trial-to-paid conversion: +15-25% relative.
- Trial-ending email click-through: >12%.
- Reactivation campaign re-login within 7 days: >8%.
- Referral invite-to-qualified conversion: >5%.
- Email deliverability: >98% accepted, complaint rate <0.1%.
