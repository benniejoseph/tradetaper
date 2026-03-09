TradingView Advanced Charting Library Placeholder

This folder is intentionally committed without TradingView source files.

To enable TradingView Advanced charts in backtesting:

1. Obtain a valid TradingView Charting Library license and access.
2. Copy the `charting_library` package contents into this folder.
3. Ensure this file exists after copy:
   - `/public/charting_library/charting_library.standalone.js`
4. Set frontend env:
   - `NEXT_PUBLIC_BACKTEST_CHART_PROVIDER=tradingview`
5. Redeploy frontend.

If the file is missing, the app automatically falls back to the legacy chart engine.
