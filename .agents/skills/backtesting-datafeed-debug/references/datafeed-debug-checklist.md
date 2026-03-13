# Datafeed Debug Checklist

## Library and UI

- Advanced library JS files load with 200 status.
- Chart container fills viewport and resizes correctly.

## Symbol Resolution

- `searchSymbols` returns expected item.
- `resolveSymbol` returns matching ticker/name/session/pricescale.

## Bars API

- `getBars` returns bars for requested time range.
- timestamps are increasing and timeframe-consistent.
- no duplicate timestamps.

## Live/Replay Updates

- `subscribeBars` emits updates for active symbol/timeframe.
- updates are monotonic in time.
- playback speed does not skip due to missing bars.

## Source Selection

- primary source and fallback source behavior are explicit.
- source failures degrade gracefully with clear logging.
