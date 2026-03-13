# Deploy Checklist

## Backend

- Service: `tradetaper-backend`
- Project: `trade-taper`
- Region: `us-central1`
- Confirm latest ready revision after deploy.

## Frontend

- Run Vercel deploy from repo root.
- Do not run Vercel deploy from `tradetaper-frontend` if project rootDirectory is already `tradetaper-frontend`.

## Quick Verification

- API reachable: `https://api.tradetaper.com`
- Frontend reachable: `https://www.tradetaper.com`
- No new 5xx spikes in Cloud Run logs.
