---
name: economic-calendar-reliability
description: Harden TradeTaper economic-calendar ingestion and release tracking under provider limits and outages. Use when fixing 429 issues, missing actual values, stale events, weak historical context for AI, or inconsistent impact details shown to users.
---
# Economic Calendar Reliability

Use this skill to make calendar data accurate, resilient, and AI-ready.

## 1. Enforce Source Strategy

Define provider priority and fallback order explicitly.

Required behavior:
- primary source fetch
- fallback source on failure/limit
- cache-based serve path during outages

Never rely on a single brittle source for critical calendar flows.

## 2. Handle Rate Limits and Failures

For 429 and transient upstream failures:
- exponential backoff with jitter
- short circuit + cooldown window
- store last successful snapshot for degraded responses

Log source, endpoint, and rate-limit markers to speed triage.

## 3. Separate Event Schedule vs Release Snapshot

Maintain two data layers:
- calendar events metadata (title, currency, impact, scheduled time)
- release snapshots (actual/forecast/previous + captured time)

Update actual values via periodic refresh windows around release times.

## 4. Preserve Historical Context for AI

Persist release history so AI can reason on:
- recent surprises vs forecast
- trend in key macro indicators
- past market reaction context

Avoid overwriting old releases without history trail.

## 5. Improve User-Facing Detail Quality

Expose meaningful context in UI/API:
- expected volatility band by impact
- affected asset classes/pairs
- previous vs forecast vs actual deltas
- stale-data indicator and source timestamp

## 6. Validate in Production Conditions

Test scenarios:
- upstream 429 spikes
- primary source unavailable
- delayed actual-value availability
- high event days with bursty polling

Use the checklists in:
- `references/reliability-patterns.md`
- `references/release-update-policy.md`
