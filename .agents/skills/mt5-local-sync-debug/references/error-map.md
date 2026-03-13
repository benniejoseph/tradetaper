# MT5 Sync Error Map

## `Heartbeat failed: HTTP 401 ... Invalid API key`

Likely cause:
- invalid/expired `AuthToken`
- EA sending legacy `APIKey` path unexpectedly

Checks:
- re-copy token from local connector config
- ensure `AuthToken` is non-empty and trimmed
- ensure endpoint points to `https://api.tradetaper.com`

## `Error 4014: WebRequest blocked`

Likely cause:
- MT5 terminal missing Allow WebRequest URL

Fix:
- add API base URL to MT5 Options -> Expert Advisors -> Allow WebRequest

## `Validation failed: server/login/password must be a string`

Likely cause:
- frontend sent wrong payload type to enable-autosync

Fix:
- send string values from UI DTO
- verify backend DTO and transform pipe behavior

## Trades landing on wrong account

Likely cause:
- missing mt5 login/server context in webhook payload
- non-unique mapping by terminal only

Fix:
- include and enforce `mt5Login` + `mt5Server` in mapping path
