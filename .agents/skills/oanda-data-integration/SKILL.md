---
name: oanda-data-integration
description: Integrate and troubleshoot OANDA REST v20 market data for TradeTaper charting and backtesting. Use when adding OANDA as a candle source, fixing symbol/timeframe mapping, handling rate limits, or validating candle correctness against replay behavior.
---
# OANDA Data Integration

Use this skill for production-safe OANDA market-data wiring and debugging.

## 1. Implement Provider Adapter

Create or update a single OANDA adapter that owns:
- auth header construction (`Authorization: Bearer <token>`)
- base URL selection (`api-fxtrade.oanda.com` live, `api-fxpractice.oanda.com` practice)
- endpoint call shaping for candles

Keep OANDA-specific logic in one service. Do not spread mapping and parsing across multiple files.

## 2. Normalize Symbol and Granularity Mapping

Map internal symbol/timeframe to OANDA parameters in one place.

Examples:
- `EURUSD` -> `EUR_USD`
- `XAUUSD` -> `XAU_USD` (if enabled on account)
- `1m` -> `M1`
- `15m` -> `M15`
- `1h` -> `H1`
- `1d` -> `D`

If symbol unsupported by OANDA account/instrument set, fail fast with explicit message and fallback plan.

## 3. Parse and Validate Candle Payload

Accept only complete candles for backtesting unless use-case requires partial candles.

Validate each candle:
- timestamp parse success
- `open/high/low/close` numeric and finite
- ascending timestamp ordering
- no duplicate timestamps

Normalize into internal candle schema before persistence.

## 4. Persist with Idempotency

Prevent duplicates by upsert/ignore on unique key.

Recommended unique key basis:
- `symbol`
- `timeframe`
- `timestamp`
- `source`

Never use blind bulk inserts that explode on duplicate key.

## 5. Add Fallback and Degradation Path

If OANDA fails (401/403/429/5xx/timeout):
- log provider-specific error context
- return fallback source when configured
- keep UI functional with explicit “source degraded” signal

## 6. Verify End-to-End

Run checks for:
- symbol resolve in chart
- correct candle count for window
- monotonic replay progression
- stable behavior during intermittent provider failures

For OANDA parameter and error mapping details, use:
- `references/oanda-candles-contract.md`
- `references/oanda-failure-handling.md`
