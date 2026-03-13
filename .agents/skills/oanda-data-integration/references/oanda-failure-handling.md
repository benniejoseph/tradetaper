# OANDA Failure Handling

## 401/403

Likely causes:
- invalid token
- wrong environment (live token on practice host or reverse)

Actions:
- verify host/token pairing
- fail quickly with actionable error

## 429

Likely causes:
- excessive polling

Actions:
- exponential backoff with jitter
- short-lived cache for repeated windows
- avoid full-window refetch loops

## 5xx/Timeout

Actions:
- bounded retries
- fallback to secondary source if available
- emit structured warning logs with symbol/timeframe/window

## Data Quality Guardrails

- reject out-of-order bars
- reject non-finite OHLC
- dedupe by unique candle key
