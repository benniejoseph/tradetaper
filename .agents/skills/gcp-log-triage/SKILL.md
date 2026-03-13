---
name: gcp-log-triage
description: Triage TradeTaper production failures using GCP Cloud Run logs and request context. Use when users report API errors, failed endpoints, crashes, validation failures, or missing data in production.
---
# GCP Log Triage

Use this workflow to isolate root cause quickly and produce an actionable fix path.

## 1. Gather Error Context

Collect from user report or console:
- endpoint and method
- timestamp window
- status code
- requestId (if available)
- user/account identifiers (if safe)

## 2. Query Logs by Service and Time Window

Start with backend service logs:
```bash
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="tradetaper-backend"' --project trade-taper --limit=100 --format=json
```

Then narrow by status/route/requestId.

## 3. Classify Failure Type

- `4xx` validation/authz: identify payload mismatch, guard failure, feature gate denial.
- `5xx` runtime/database: identify exception class, SQL error, external provider error.
- timeouts/retries: identify upstream dependency and retry path.

## 4. Correlate to Code Path

Map stack/module to concrete files, then verify:
- DTO validation rules
- guard/plan checks
- database constraints and migrations
- external API assumptions

## 5. Produce Output

Return findings in this order:
1. Root cause
2. Impacted endpoint/users
3. Minimal fix
4. Verification command/query
5. Follow-up hardening item (if needed)

For reusable query patterns, see `references/log-filters.md`.
