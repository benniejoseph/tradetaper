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
curl https://tradetaper-backend-481634875325.us-central1.run.app/health
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
12. `GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"tradetaper","private_key_id":"161a7b4779bc41e6e14ee6596a63dc2ada6713e6","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCfoujWkS+BQvoA\n8RHCrAMGTKTCVlGJcxe51LXQtE1Qm6DEtcaSCHyb9y1b0W9jND6yS4kNZdzuq3g6\n4vBAigR4AbHKXHjn+BHD0HCJg/S5aAlktJ3cq/JmU+d3pSQl/35W7R1Rq7o3JUcp\nytV6h/pgqK3Ybf5tCuopG8kky9XMtoUYSPo375reFaKC9PrrPyShGFiGhNOq2FdD\nKFT+Gq8XufKerFA/WDBJJHShw77BRaLoIrZ5mzEsJ/m7jHXAxfP5FZhcVM2A5ONl\n4iMU64avFkgwyQ7wzcA/4hv96USj2L/LtJIiIkWA7Jd98nELyETAxTCOHEbZUdaB\nQMmxRgkvAgMBAAECggEAKwxab6o9PkVad7CKko2iTyuR7poqaL9xsXosAXjttIQT\nSZifULgbKk/wmmcS+5SWJ6x46/UBLBdvV6nlEfJmHBqQ4DopnJxn5f8qqdq8vtbQ\nWajfPSfdOTz9GWWeJuUMI9LTaje+Aqr50spQ4TcUDMbQAqI+zxb3aFiG2HZjVE2i\nZX5pPEWZSywPRgq+x9avcuRhYeMSnod8TYb7Ug8ZQILWZfRKjc0IlTAUZv6gOrMu\naAenhyz+M21QAWadUwEfvJs8Rx53O08nNuAHyXKQ5y5NNdQoS9X1w73huL/zVC+x\nWM1Wlfx+ADo4RUk+i986qvPZ9HpcjAxGELZ6ZCfmIQKBgQDftm3jPK3Z3lM7mjxu\n89/t3Jeu4xh634yOI9Jc6To3ZqpyPs97gP2uUIw2cwV1pcDGx5RIcR4olX27mNaK\nfQgCXT7Rf9Uv0w3XbB0WBQ7PauSC3Q7rcitK759FPk5FfM9sehq28isMs6XTeXOl\n+BDGXtKwguAXgkl6SjM0d/D8cQKBgQC2rQmmUZ788V7LSo4I5OkrIKHNG/MNsXeT\nzTMa3/Sn2L/KLjJf0PklXOV0tFdr9F+hhCvgs6tD8YnvHz1Yw9vNSIizyx6pBj0a\nZxZZC5kuFD6vo/w4F8yaHFYN4pemQPcF0JlM1bw1apWaNJgAEBWNytt4Qq42onme\npSm5+oivnwKBgDIsDdUKxMq569zQKIGRvETyVipo0BKulC1Ep2ci/2VxZwScRZgj\nQ8GWWvvTLARImkV6eS0OAX+El2A9VNBWXjd5hh8iFkPVh6MqohNQKxQlmv4mabQw\nNLlnqEa1RISdCz/+2oLxKOp+V9BnyqIMUmbK2WGw2GUtWSFOBtHbnHZhAoGAGTCB\nLSMCJmTuKmAsd8OA94Z3aT4aZN/82i+ohWMubFqyD6IRJi89u840gcRAbc1zxmTg\nXArKagMLfyKypePUElmXKBuxLaODl3lxlnPH+pemETgullmJyBJyN1XwjWdV6MJb\n8UFjw4Xf/TSVZSTSpAu9+bZQKY578MlbmJ6YbIcCgYAtR0uFg5o2BV494pPsFTs5\nR3CQccCPodoIANQkIrestlrBdybpjFOydyhnd45qP/NOcJFKA87eNSpVkHD96/Vw\n6Sqf+mfjC88/DWbhD+fqlhtBK8jqX9IYyonGcexxJ9Fajild1lmhOd6pnqLbZXfJ\nP05GuEPAuQqaHQRVLXs/AA==\n-----END PRIVATE KEY-----\n","client_email":"tradetaperimageuploader@tradetaper.iam.gserviceaccount.com","client_id":"102459760304364716399","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/tradetaperimageuploader%40tradetaper.iam.gserviceaccount.com","universe_domain":"googleapis.com"}` (full JSON credentials)

## ⚠️ Critical Rules

- **NEVER** use individual `gcloud run services update --set-env-vars` commands
- **ALWAYS** use the YAML file approach for environment variables
- **VERIFY** all 12 environment variables are present after deployment
- **USE** Unix socket path for Cloud SQL: `/cloudsql/tradetaper:us-central1:tradetaper-postgres`
- **ENSURE** all modules are enabled in `src/app.module.ts` 

## 🎯 Expected Results

- **Service URL**: `https://tradetaper-backend-481634875325.us-central1.run.app`
- **Health Check**: `{"status":"ok",...}`
- **Test Endpoint**: `/api/v1/test-deployment` should return success message
- **All Environment Variables**: Must show all 12 when verified

## 📖 Full Guide

See `DEPLOYMENT_GUIDE.md` for complete step-by-step instructions and troubleshooting. 