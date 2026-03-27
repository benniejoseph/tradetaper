# Settings Accounts Restructure Plan (Unified Accounts Hub)

Date: March 24, 2026
Scope: `tradetaper-frontend` + existing account-related APIs in `tradetaper-backend`
Status: Draft for approval

## 1) Goal

Create one unified **Accounts Hub** page under Settings that:
- categorizes account management clearly (Manual, Cloud MT5, Local MT5, Prop Firm),
- provides a guided workflow for setup and operation,
- preserves all existing functionality and API contracts,
- introduces Prop Firm account/challenge management into the same operational surface.

No destructive migrations in phase 1.

## 2) Current State (Code-validated)

Frontend routes are fragmented today:
- `/settings/accounts` (manual account + import shell)
- `/settings/mt5-accounts` (cloud mt5 + statement upload)
- `/settings/local-mt5` (local terminal setup)

Navigation currently exposes them as separate items.

Backend capabilities are already split but complete enough to unify in UI:
- Manual accounts: `/users/accounts` CRUD
- Cloud MT5: `/mt5-accounts` (+ create/sync/pause/resume/disconnect)
- Local MT5 connector: `/mt5-accounts/:id/enable-autosync`, `terminal-status`, `local-connector-config`, `sync-terminal`, `live-positions`
- Prop firm challenges: `/prop-firm-challenges` (feature-gated with `RequireFeature('propFirm')`)

## 3) Non-breaking Constraints

To avoid regressions:
- Keep all existing backend endpoints unchanged.
- Keep both redux account slices unchanged in phase 1:
  - `accounts` (manual)
  - `mt5Accounts` (cloud/local)
- Do not change account IDs or selector semantics used by Dashboard/Analytics/Journal/Trader Mind/AI Coach.
- Existing legacy routes should continue to work as aliases during migration.

## 4) Research-backed UX Decisions

### A) Use a task/workflow structure for onboarding + operation
Reference: GOV.UK "Complete multiple tasks" pattern
- Users should see grouped tasks with clear statuses (`Not started`, `In progress`, `Completed`, `Action required`).
- Works well for account setup flows requiring multiple steps and return sessions.

### B) Use settings-appropriate two-column layout and card grouping
Reference: Shopify layout guidance + settings pattern
- Left: setup steps and action groups (primary tasks)
- Right: status, limits, connectors, and risk notices (secondary context)
- Strong grouping by account type to reduce mode confusion.

### C) Cloud connection lifecycle clarity
Reference: MetaApi provisioning docs
- account creation and deployment are asynchronous; UI must surface states (`provisioning`, `deployed`, `error`) and retry actions.
- show provider failure as non-blocking where local/manual path is still viable.

### D) Prop-firm rule visibility
Reference: FTMO objective definitions
- users need explicit visibility of daily drawdown, max drawdown, and target mechanics.
- keep challenge metrics near account operations to reduce context switching.

## 5) Proposed Information Architecture

Create a new Settings page:
- **`/settings/accounts-hub`** (new)

Sections on this page:
1. **Overview Rail**
   - total active accounts, sync mode distribution, warning count
   - plan limits (mt5 slots, premium-only features)
2. **Connection Workflow (Task List)**
   - Step 1: Add account (manual/cloud)
   - Step 2: Choose sync mode (MetaApi vs Local Terminal)
   - Step 3: Verify terminal/connector heartbeat
   - Step 4: Optional imports and backfill
   - Step 5: Monitoring and alerts
3. **Manual Accounts**
   - embedded existing `ManageAccounts`
4. **Cloud MT5 (MetaApi)**
   - embedded existing `MT5AccountsList`
5. **Local MT5 Sync**
   - embedded existing connector config/status actions from current local page
6. **Prop Firm Management**
   - embedded challenge summary table + CTA to full challenge management
   - show lock state if feature-gated
7. **Statement Import**
   - preserve existing statement upload in-context

Legacy routes remain accessible, but nav points users to Accounts Hub first.

## 6) Workflow Logic (Unified)

For each account row/card, show one "sync source of truth":
- `Cloud Active`
- `Local Active`
- `Manual`
- `Conflict/Action Needed`

Mode switch rules:
- enabling Local auto-sync prompts to pause MetaApi if active.
- resuming MetaApi while Local active prompts stop/disable Local.
- transitions are explicit and reversible.

## 7) Prop Firm Integration Model

Phase 1 (safe):
- embed a **Prop Firm panel** in Accounts Hub:
  - active challenge count
  - at-risk challenge count
  - next breach risk
  - CTA: "Open full challenge manager"
- no schema changes.

Phase 2 (optional enhancement):
- optional mapping from challenge to trading account ID for richer linkage.

## 8) Stitch Design Deliverable

Generated Stitch project and exported review artifacts:
- Project: `5905214880670625673`
- Primary screen: `41dff63e070542bdbeb81be5045e8e1a` (Accounts & Connections Unified)

Local exported files:
- `docs/design/stitch-accounts-connections/accounts-connections-unified.png`
- `docs/design/stitch-accounts-connections/accounts-connections-unified.html`
- `docs/design/stitch-accounts-connections/README.md`

## 9) Implementation Plan (After Approval)

### Phase 0 - Safe foundation
- Add new route `/settings/accounts-hub`
- Build container layout and task-status model
- Wire read-only aggregate data from existing endpoints

### Phase 1 - Functional embedding
- Mount existing components into categorized cards:
  - `ManageAccounts`
  - `MT5AccountsList`
  - Local MT5 controls
  - `StatementUpload`
- Add prop-firm summary panel via `/prop-firm-challenges`
- Preserve current route behavior

### Phase 2 - Workflow orchestration
- Add guided task statuses and completion logic
- Add non-breaking mode switch confirmations and conflict badges
- Add centralized toasts and validation UX

### Phase 3 - Navigation migration
- Update settings nav to point to Accounts Hub as primary
- keep legacy pages available as fallback/advanced links

### Phase 4 - QA and release hardening
- regression checks across Dashboard/Journal/Analytics selectors
- validate feature gating behavior for prop firm and plan limits
- mobile + desktop responsive verification

## 10) Acceptance Criteria

- Single Settings page manages Manual, Cloud, Local, and Prop Firm operations.
- No existing endpoint contract changes required.
- Existing functionality remains reachable and operational.
- Sync mode conflicts are explicit and user-resolvable.
- Prop firm panel visible in hub and respects feature gates.
- Legacy routes continue to function.

## 11) Risks and Mitigations

- Risk: Selector regressions across app pages.
  - Mitigation: no selector model change in phase 1.
- Risk: Mode-switch edge cases (MetaApi/local).
  - Mitigation: explicit transition prompts + server-confirmed state refresh.
- Risk: Feature-gate mismatch in prop firm panel.
  - Mitigation: use existing `FeatureGate` and backend guard response handling.

## 12) Research Sources

- GOV.UK Design System, Complete multiple tasks:
  - https://design-system.service.gov.uk/patterns/complete-multiple-tasks/
- Shopify Layout guidance:
  - https://shopify.dev/docs/apps/design/layout
  - https://polaris-react.shopify.com/design/layout
  - https://polaris-react.shopify.com/components/layout-and-structure/layout
- MetaApi account lifecycle docs:
  - https://metaapi.cloud/docs/provisioning/api/account/createAccount/
  - https://metaapi.cloud/docs/provisioning/api/account/deployAccount/
- FTMO trading objective references:
  - https://ftmo.com/en/trading-objectives/
  - https://academy.ftmo.com/lesson/maximum-daily-loss/
  - https://academy.ftmo.com/lesson/maximum-loss/
