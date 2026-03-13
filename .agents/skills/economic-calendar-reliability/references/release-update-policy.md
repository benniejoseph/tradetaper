# Release Update Policy

## Timeline Windows

For each event:
- pre-release window: monitor forecast revisions
- release window: poll aggressively for actual value
- post-release window: continue light polling for revisions

## Actual Value Update Rules

- first non-null actual value creates release snapshot
- subsequent revisions append new snapshot or revision record
- do not silently mutate historical record without audit field

## Data Integrity

- normalize numeric parsing (including percentages and units)
- preserve raw text field for audit/debug when parsing fails

## AI Context Readiness

Store fields needed for narrative generation:
- event name
- country/currency
- impact level
- forecast, actual, previous
- surprise magnitude
- release timestamp
