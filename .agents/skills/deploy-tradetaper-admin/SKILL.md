---
name: deploy-tradetaper-admin
description: Deploy TradeTaper Admin Next.js dashboard to Vercel. Use when a user asks to deploy the admin panel or admin dashboard.
---
# Deploy TradeTaper Admin

Run this workflow when asked to deploy the TradeTaper admin dashboard.

## 1. Confirm Requirements

Make sure you have the required Vercel token (`<VERCEL_TOKEN>`) before initiating the deployment.

## 2. Deploy to Vercel

1. Navigate to the `tradetaper-admin` application directory:
```bash
cd /Users/benniejoseph/Documents/TradeTaper/tradetaper-admin
```

2. Run the Vercel CLI production deployment:
```bash
vercel --prod --yes --token <VERCEL_TOKEN>
```

3. Capture the production URL and inspection URL provided in the terminal output.

## 3. Post-Deployment Verification

Perform a quick smoke check to ensure the deployed admin dashboard is reachable.

```bash
curl -I https://<YOUR_NEW_ADMIN_PRODUCTION_URL>
```

## 4. Report Status

Report back to the user with:
- The exact production URL
- The Vercel inspection link
- Confirmation that the smoke check passed (e.g., returned HTTP 200)
