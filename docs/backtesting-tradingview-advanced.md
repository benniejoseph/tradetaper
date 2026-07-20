# Backtesting: TradingView Advanced Integration

## Overview
TradeTaper now includes TradingView-compatible backtesting datafeed endpoints and a feature-flagged TradingView Advanced chart mode in replay sessions.

The existing lightweight replay chart remains the default to avoid workflow breakage.

## Backend Endpoints
All endpoints are authenticated and require backtesting feature access.

- `GET /api/v1/backtesting/tv/config`
- `GET /api/v1/backtesting/tv/time`
- `GET /api/v1/backtesting/tv/search?query=...&limit=...`
- `GET /api/v1/backtesting/tv/symbols?symbol=...`
- `GET /api/v1/backtesting/tv/history?symbol=...&resolution=...&from=...&to=...`

These follow a UDF-like shape for TradingView datafeed compatibility.

## Frontend Switch
Use environment variable:

```bash
NEXT_PUBLIC_BACKTEST_CHART_PROVIDER=legacy
```

Set to `tradingview` to enable TradingView mode:

```bash
NEXT_PUBLIC_BACKTEST_CHART_PROVIDER=tradingview
```

## Required TradingView Library Files
The TradingView Charting Library is private/licensed and not committed in this repo.

Copy licensed files to:

- `tradetaper-frontend/public/charting_library/`

Required runtime file:

- `charting_library.standalone.js`

If missing, the backtesting page auto-falls back to the legacy chart.

## Replay Safety
TradingView mode clamps historical data to current replay timestamp (`replayTo`) so future candles are not exposed during step-by-step replay.
