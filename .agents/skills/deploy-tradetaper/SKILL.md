---
name: deploy-tradetaper
description: Deploy TradeTaper services to production with safe ordering and verification. Use when a user asks to deploy backend (Cloud Run), frontend (Vercel), or both, and when deployment targets must stay in the trade-taper project.
---
# Deploy TradeTaper

Run this workflow when production deployment is requested.

## 1. Confirm Deployment Scope

1. Confirm whether to deploy:
- backend only
- frontend only
- both

2. Collect required runtime inputs before deploy:
- Vercel token if frontend deploy needs CLI auth
- backend env source (`.env.yaml` or explicit `--update-env-vars`)

## 2. Deploy Backend (Cloud Run)

1. Work from backend folder:
```bash
cd tradetaper-backend
```

2. Deploy to the correct GCP project (`trade-taper`), never to unrelated projects:
```bash
gcloud run deploy tradetaper-backend \
  --source . \
  --project trade-taper \
  --region us-central1 \
  --allow-unauthenticated \
  --quiet
```

3. If environment changes are required, use one of these patterns:
```bash
gcloud run deploy tradetaper-backend --source . --project trade-taper --region us-central1 --allow-unauthenticated --quiet --env-vars-file .env.yaml
```
```bash
gcloud run deploy tradetaper-backend --source . --project trade-taper --region us-central1 --allow-unauthenticated --quiet --update-env-vars KEY=VALUE
```

4. Verify new revision and URL:
```bash
gcloud run services describe tradetaper-backend --project trade-taper --region us-central1 --format='value(status.url,status.latestReadyRevisionName)'
```

## 3. Deploy Frontend (Vercel)

1. Run from repo root because project rootDirectory is `tradetaper-frontend`:
```bash
cd /Users/benniejoseph/Documents/TradeTaper
```

2. Deploy with token:
```bash
vercel --prod --yes --token <VERCEL_TOKEN>
```

3. Capture and report both links from output:
- inspect URL
- production URL

## 4. Smoke Check After Deploy

Run targeted checks for the changed surface area.

- Backend health/auth endpoint relevant to change
- Frontend route that should reflect change
- One log scan for new runtime errors

Examples:
```bash
curl -sS https://api.tradetaper.com/api/v1/health
curl -sS https://www.tradetaper.com/login >/dev/null
```

## 5. Report Back

Always return:
- what was deployed
- exact service URL(s)
- revision/build identifier(s)
- smoke check result
- blocker/failure details if any

For common deployment commands and checks, see `references/deploy-checklist.md`.
