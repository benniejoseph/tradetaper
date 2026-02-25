---
description: Deploy the backend application to GCP Cloud Run
---
This workflow deploys the trading backend to Google Cloud Run and handles necessary build steps.
If the frontend or admin needs deployment, that is automatically handled by Vercel on git push.

// turbo

1. Execute the Cloud Run deployment script
```bash
cd tradetaper-backend && chmod +x deploy-cloudrun.sh && ./deploy-cloudrun.sh
```
