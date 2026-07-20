# TradeTaper Email Template Matrix (2026-04-04)

This matrix is the app-wide email design contract for transactional, lifecycle, and marketing sends.

## Transactional + Lifecycle

| Template ID | Trigger | Audience | CTA |
| --- | --- | --- | --- |
| `system.notification_generic` | Fallback for unmapped notification types | Any user with email notifications enabled | Open TradeTaper |
| `auth.welcome` | Post-registration onboarding | New users | Open Dashboard |
| `auth.password_reset_request` | Forgot password request | User requesting reset | Reset Password |
| `auth.password_reset_success` | Password reset completion | User with successful reset | None |
| `auth.security_new_login` | New device/session alert | Existing users | Review Sessions |
| `billing.trial_started` | First paid-plan trial starts | Trial users | Set Up Workspace |
| `billing.trial_ending` | Trial about to expire | Trial users | Manage Billing |
| `billing.trial_ended` | Trial ended + downgrade | Former trial users | Upgrade Plan |
| `billing.subscription_renewed` | Recurring payment captured | Paying users | View Billing |
| `billing.subscription_expiring` | Canceled plan nearing end date | Canceled-at-period-end users | Reactivate Subscription |
| `billing.payment_failed` | Payment authorization/capture failure | Paying users with failed renewal | Retry Payment |
| `billing.subscription_canceled` | User canceled subscription | Paying users | Review Billing |
| `billing.invoice_receipt` | Successful charge receipt available | Paying users | Download Receipt |
| `billing.refund_processed` | Refund completed | Refunded users | View Billing |
| `billing.plan_changed` | Upgrade/downgrade applied | Users who changed plans | Open Billing |
| `billing.mt5_slot_unlocked` | MT5 add-on order paid | Users buying MT5 slot add-on | Manage MT5 Accounts |
| `referral.invite` | User shares referral invite | Referred prospects | Claim Referral Offer |
| `referral.reward_qualified` | Referral became qualified | Referrers | View Referral Dashboard |
| `referral.reward_paid` | Referral reward issued | Referrers | Open Billing |

## Product

| Template ID | Trigger | Audience | CTA |
| --- | --- | --- | --- |
| `product.trade_created` | `trade_created` notification | Active journal users | Open Journal |
| `product.trade_updated` | `trade_updated` notification | Active journal users | Review Trade |
| `product.trade_closed` | `trade_closed` notification | Active journal users | Open Trade Review |
| `product.ai_insight` | AI insight generated | Users with AI insight access | Review Insight |
| `product.strategy_alert` | Strategy guardrail/alert event | Strategy users | Open Strategy |
| `product.account_linked` | Manual/MT5 account linked | Users managing accounts | Open Accounts Hub |
| `product.account_unlinked` | Account unlinked/disconnected | Users managing accounts | Manage Accounts |
| `product.mt5_sync_complete` | MT5 import success | MT5 sync users | Open Accounts Hub |
| `product.mt5_sync_error` | MT5 sync failure | MT5 sync users | Fix MT5 Connection |
| `product.economic_event_alert` | 1h/15m/now economic alerts | Users subscribed to event alerts | Open Market Intelligence |
| `product.weekly_performance_digest` | Weekly digest job | Active users with digest preference | Review Analytics |
| `product.monthly_performance_digest` | Monthly digest job | Active users with digest preference | Open Monthly Review |

## Community

| Template ID | Trigger | Audience | CTA |
| --- | --- | --- | --- |
| `community.new_post` | Community post/activity event | Users following community feeds | Open Community |
| `community.mention` | Mention in post/reply | Mentioned users | View Mention |
| `community.reply` | Reply on followed thread | Thread participants | Open Thread |

## Marketing

| Template ID | Trigger | Audience | CTA |
| --- | --- | --- | --- |
| `marketing.reactivation_nudge` | Inactivity/reactivation campaign | Dormant users | Resume in Dashboard |
| `marketing.feature_release` | Product release campaign | Eligible users by plan/usage | Explore Release |

## Mapping Status
- Notification type mapping is implemented via:
  - `tradetaper-backend/src/notifications/email/notification-email-template.mapper.ts`
- HTML/text rendering is centralized in:
  - `tradetaper-backend/src/notifications/email/email-template-renderer.service.ts`
- Template definitions and copy are centralized in:
  - `tradetaper-backend/src/notifications/email/email-template-catalog.ts`
