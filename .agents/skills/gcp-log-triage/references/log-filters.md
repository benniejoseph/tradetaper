# Cloud Run Log Filters

## By service

`resource.type="cloud_run_revision" AND resource.labels.service_name="tradetaper-backend"`

## By HTTP status

Append:
`AND httpRequest.status>=500`
or
`AND httpRequest.status=400`

## By request path fragment

Append:
`AND textPayload:"/api/v1/notes"`

## By request id

Append:
`AND textPayload:"req_"`

## Typical triage order

1. 5xx in last 30-60 minutes
2. matching stack traces
3. related 4xx patterns
4. upstream provider errors (429/401/timeouts)
