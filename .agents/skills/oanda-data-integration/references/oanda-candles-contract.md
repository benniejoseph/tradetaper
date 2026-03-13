# OANDA Candles Contract

## Endpoint

`GET /v3/instruments/{instrument}/candles`

## Common Query Parameters

- `granularity`: `S5,S10,S15,S30,M1,M2,M4,M5,M10,M15,M30,H1,H2,H3,H4,H6,H8,H12,D,W,M`
- `price`: commonly `M` (mid), optionally `B`,`A`
- `from`: RFC3339 timestamp
- `to`: RFC3339 timestamp
- `count`: bounded count for short windows

## Response Shape (important fields)

- `candles[].time`
- `candles[].complete`
- `candles[].mid.o/h/l/c` (if `price=M`)
- `candles[].volume`

## Mapping Guidance

Internal candle should include:
- `timestamp` <- parsed `time`
- `open/high/low/close` <- `mid.o/h/l/c`
- `volume` <- `volume`
- `source` <- `oanda`

## Common Integration Mistakes

- wrong instrument format (`EURUSD` instead of `EUR_USD`)
- using unsupported granularity token
- storing incomplete candle as final bar in backtest timeline
- timezone conversion drift due to mixed parsers
