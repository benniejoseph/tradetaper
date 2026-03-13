---
name: backtesting-datafeed-debug
description: Diagnose and stabilize TradeTaper backtesting chart datafeeds using TradingView Advanced Charts. Use when candles are wrong, symbols fail to resolve, replay is jumpy, chart is not responsive, or data source integration is inconsistent.
---
# Backtesting Datafeed Debug

Use this workflow for any chart/datafeed correctness or replay-quality issue.

## 1. Confirm Charting Library Baseline

Verify Advanced Charts assets are present and served:
- `public/charting_library/charting_library.js`
- `public/charting_library/charting_library.standalone.js`

If missing or 404, fix asset placement before debugging datafeed.

## 2. Validate Datafeed Contract

Check the full TradingView datafeed flow:
- `onReady`
- `searchSymbols`
- `resolveSymbol`
- `getBars`
- `subscribeBars`
- `unsubscribeBars`

A symbol that resolves incorrectly will often surface as "This symbol doesn't exist".

## 3. Normalize Symbol Mapping

Use one canonical mapping layer between UI symbol and provider symbol.
Examples:
- `XAUUSD` <-> provider-specific instrument id
- index contracts and CFD symbols

Do not map ad hoc in multiple files.

## 4. Validate Candle Storage and Retrieval

For backend candle persistence:
- enforce uniqueness by `(symbol, timeframe, timestamp, source)` policy
- use upsert/conflict handling to avoid duplicate insert failures
- ensure requested time window returns sorted candles with no gaps/overlaps

## 5. Replay Smoothness and Responsiveness

To improve replay quality:
- serve evenly spaced candles for selected timeframe
- avoid large discontinuities during stepping
- keep chart container full-height and react to resize events

Use `references/datafeed-debug-checklist.md` for issue isolation order.
