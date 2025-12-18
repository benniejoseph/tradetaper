# TradeTaper Backend - Quick Deployment Summary

## ⚡ Quick Deploy Commands

```bash
# 1. Verify Cloud SQL is ready
gcloud sql instances describe tradetaper-postgres --format="value(state)"

# 2. Add Cloud SQL connection to Cloud Run
gcloud run services update tradetaper-backend --region us-central1 --add-cloudsql-instances=tradetaper:us-central1:tradetaper-postgres

# 3. Deploy application
npm run build
gcloud run deploy tradetaper-backend --source . --platform managed --region us-central1 --allow-unauthenticated --port 8080 --memory 2Gi --cpu 2 --max-instances 10 --timeout 900

# 4. Apply environment variables using YAML file approach (create env-vars.yaml first)
gcloud run services replace env-vars.yaml --region us-central1

# 5. Verify deployment
curl https://tradetaper-backend-326520250422.us-central1.run.app/health
```

## 🔑 Critical Environment Variables (Must Have All 12)

1. `NODE_ENV=production`
2. `DATABASE_HOST=/cloudsql/tradetaper:us-central1:tradetaper-postgres`
3. `DATABASE_PORT=5432`
4. `DATABASE_USERNAME=tradetaper`
5. `DATABASE_PASSWORD=TradeTaper2024`
6. `DATABASE_NAME=tradetaper`
7. `JWT_SECRET=your-jwt-secret-here-make-it-long-and-secure-production-key-2024`
8. `FRONTEND_URL=https://tradetaper-frontend-benniejosephs-projects.vercel.app`
9. `ADMIN_URL=https://tradetaper-admin.vercel.app`
10. `GCS_BUCKET_NAME=tradetaper-uploads`
11. `TRADERMADE_API_KEY=X4FgwHzL7HpukWs4FjYV`
12. `GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"tradetaper","private_key_id":"161a7b4779bc41e6e14ee6596a63dc2ada6713e6","private_key":""}` (full JSON credentials)

## ⚠️ Critical Rules

- **NEVER** use individual `gcloud run services update --set-env-vars` commands
- **ALWAYS** use the YAML file approach for environment variables
- **VERIFY** all 12 environment variables are present after deployment
- **USE** Unix socket path for Cloud SQL: `/cloudsql/tradetaper:us-central1:tradetaper-postgres`
- **ENSURE** all modules are enabled in `src/app.module.ts` 

## 🎯 Expected Results

- **Service URL**: `https://tradetaper-backend-326520250422.us-central1.run.app`
- **Health Check**: `{"status":"ok",...}`
- **Test Endpoint**: `/api/v1/test-deployment` should return success message
- **All Environment Variables**: Must show all 12 when verified

## 📖 Full Guide

See `DEPLOYMENT_GUIDE.md` for complete step-by-step instructions and troubleshooting. 
