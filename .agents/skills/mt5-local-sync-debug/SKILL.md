---
name: mt5-local-sync-debug
description: Debug local MT5 terminal synchronization for TradeTaper end-to-end. Use when EA sync fails, heartbeats fail, connector token/pairing code is missing, account mapping is wrong, or local sync and MetaAPI modes conflict.
---
# MT5 Local Sync Debug

Use this workflow for EA-to-backend sync failures and account-mapping issues.

## 1. Capture Evidence

Collect:
- MT5 Experts log lines
- exact EA version (`TradeTaperSync.mq5`)
- terminal inputs used (endpoint, terminalId, authToken, pairingCode)
- account login/server in MT5 terminal
- backend error/log snippet

## 2. Validate EA Input Integrity

Check these fields first:
- `APIEndpoint`
- `TerminalId`
- `AuthToken` (preferred) or legacy `APIKey`
- `PairingCode` (for account-safe connector flow)

Common failures:
- `Error 4014`: WebRequest not allowlisted in MT5 terminal
- `HTTP 401 Invalid API key`: wrong/empty token or API key fallback path
- repeated heartbeat max retries: network, endpoint, or auth rejection

## 3. Validate Account Mapping Safety

Ensure payload includes identity fields:
- `mt5Login`
- `mt5Server`
- `terminalId`
- `runtimeId` (if available)

Verify backend uses these fields to route updates to correct MT5 account.

## 4. Validate Backend Connector Endpoints

Check availability and auth on connector endpoints (example):
- `/api/v1/mt5-accounts/:id/local-connector-config`
- `/api/v1/webhook/terminal/heartbeat`
- `/api/v1/webhook/terminal/trades`
- `/api/v1/webhook/terminal/positions`

## 5. Confirm Notification Behavior

Ensure sync notifications are created only when trades were created/updated.
Avoid spam records for zero-trade sync cycles.

For fast error mapping, see `references/error-map.md`.
