# Economic Calendar Reliability Patterns

## Fetch Cadence

- low-frequency baseline poll for future events
- high-frequency poll only around near-term/high-impact release windows

## Caching

- cache list responses by date range + filters
- cache source responses briefly to avoid duplicate pull storms

## Fallback

- if source A fails, query source B
- annotate response with source used and freshness timestamp

## Degraded Mode

- serve last-known snapshot with explicit stale marker
- avoid returning empty list unless no snapshot exists
