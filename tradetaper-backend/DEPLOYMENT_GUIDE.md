# TradeTaper Backend - Google Cloud Run Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the TradeTaper NestJS backend to Google Cloud Run with full database connectivity and all environment variables properly configured.

## Prerequisites

### 1. Google Cloud Setup
- Google Cloud Project: `tradetaper`
- Project ID: `481634875325`
- Region: `us-central1`
- Billing enabled
- Required APIs enabled:
  - Cloud Run API
  - Cloud SQL Admin API
  - Cloud Build API
  - Secret Manager API
  - Google Cloud Storage API

### 2. Cloud SQL PostgreSQL Instance
- **Instance Name**: `tradetaper-postgres`
- **Connection Name**: `tradetaper:us-central1:tradetaper-postgres`
- **Database Version**: PostgreSQL 15
- **Tier**: `db-f1-micro`
- **Region**: `us-central1`
- **Database Name**: `tradetaper`
- **Users**:
  - `postgres` (superuser) - Password: `TradeTaper2024`
  - `tradetaper` (application user) - Password: `TradeTaper2024`

### 3. Google Cloud Storage
- **Bucket Name**: `tradetaper-uploads`
- **Service Account**: `tradetaperimageuploader@tradetaper.iam.gserviceaccount.com`

## Required Environment Variables

The following environment variables MUST be configured exactly as shown:

```bash
NODE_ENV=production
DATABASE_HOST=/cloudsql/tradetaper:us-central1:tradetaper-postgres
DATABASE_PORT=5432
DATABASE_USERNAME=tradetaper
DATABASE_PASSWORD=TradeTaper2024
DATABASE_NAME=tradetaper
JWT_SECRET=your-jwt-secret-here-make-it-long-and-secure-production-key-2024
FRONTEND_URL=https://tradetaper-frontend-benniejosephs-projects.vercel.app
ADMIN_URL=https://tradetaper-admin.vercel.app
GCS_BUCKET_NAME=tradetaper-uploads
TRADERMADE_API_KEY=X4FgwHzL7HpukWs4FjYV
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"tradetaper","private_key_id":"161a7b4779bc41e6e14ee6596a63dc2ada6713e6","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCfoujWkS+BQvoA\n8RHCrAMGTKTCVlGJcxe51LXQtE1Qm6DEtcaSCHyb9y1b0W9jND6yS4kNZdzuq3g6\n4vBAigR4AbHKXHjn+BHD0HCJg/S5aAlktJ3cq/JmU+d3pSQl/35W7R1Rq7o3JUcp\nytV6h/pgqK3Ybf5tCuopG8kky9XMtoUYSPo375reFaKC9PrrPyShGFiGhNOq2FdD\nKFT+Gq8XufKerFA/WDBJJHShw77BRaLoIrZ5mzEsJ/m7jHXAxfP5FZhcVM2A5ONl\n4iMU64avFkgwyQ7wzcA/4hv96USj2L/LtJIiIkWA7Jd98nELyETAxTCOHEbZUdaB\nQMmxRgkvAgMBAAECggEAKwxab6o9PkVad7CKko2iTyuR7poqaL9xsXosAXjttIQT\nSZifULgbKk/wmmcS+5SWJ6x46/UBLBdvV6nlEfJmHBqQ4DopnJxn5f8qqdq8vtbQ\nWajfPSfdOTz9GWWeJuUMI9LTaje+Aqr50spQ4TcUDMbQAqI+zxb3aFiG2HZjVE2i\nZX5pPEWZSywPRgq+x9avcuRhYeMSnod8TYb7Ug8ZQILWZfRKjc0IlTAUZv6gOrMu\naAenhyz+M21QAWadUwEfvJs8Rx53O08nNuAHyXKQ5y5NNdQoS9X1w73huL/zVC+x\nWM1Wlfx+ADo4RUk+i986qvPZ9HpcjAxGELZ6ZCfmIQKBgQDftm3jPK3Z3lM7mjxu\n89/t3Jeu4xh634yOI9Jc6To3ZqpyPs97gP2uUIw2cwV1pcDGx5RIcR4olX27mNaK\nfQgCXT7Rf9Uv0w3XbB0WBQ7PauSC3Q7rcitK759FPk5FfM9sehq28isMs6XTeXOl\n+BDGXtKwguAXgkl6SjM0d/D8cQKBgQC2rQmmUZ788V7LSo4I5OkrIKHNG/MNsXeT\nzTMa3/Sn2L/KLjJf0PklXOV0tFdr9F+hhCvgs6tD8YnvHz1Yw9vNSIizyx6pBj0a\nZxZZC5kuFD6vo/w4F8yaHFYN4pemQPcF0JlM1bw1apWaNJgAEBWNytt4Qq42onme\npSm5+oivnwKBgDIsDdUKxMq569zQKIGRvETyVipo0BKulC1Ep2ci/2VxZwScRZgj\nQ8GWWvvTLARImkV6eS0OAX+El2A9VNBWXjd5hh8iFkPVh6MqohNQKxQlmv4mabQw\nNLlnqEa1RISdCz/+2oLxKOp+V9BnyqIMUmbK2WGw2GUtWSFOBtHbnHZhAoGAGTCB\nLSMCJmTuKmAsd8OA94Z3aT4aZN/82i+ohWMubFqyD6IRJi89u840gcRAbc1zxmTg\nXArKagMLfyKypePUElmXKBuxLaODl3lxlnPH+pemETgullmJyBJyN1XwjWdV6MJb\n8UFjw4Xf/TSVZSTSpAu9+bZQKY578MlbmJ6YbIcCgYAtR0uFg5o2BV494pPsFTs5\nR3CQccCPodoIANQkIrestlrBdybpjFOydyhnd45qP/NOcJFKA87eNSpVkHD96/Vw\n6Sqf+mfjC88/DWbhD+fqlhtBK8jqX9IYyonGcexxJ9Fajild1lmhOd6pnqLbZXfJ\nP05GuEPAuQqaHQRVLXs/AA==\n-----END PRIVATE KEY-----\n","client_email":"tradetaperimageuploader@tradetaper.iam.gserviceaccount.com","client_id":"102459760304364716399","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/tradetaperimageuploader%40tradetaper.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
```

## Deployment Steps

### Step 1: Verify Cloud SQL Configuration

```bash
# Verify Cloud SQL instance exists and is running
gcloud sql instances describe tradetaper-postgres --format="value(state,connectionName)"

# Should output:
# RUNNABLE    tradetaper:us-central1:tradetaper-postgres

# Verify database exists
gcloud sql databases list --instance=tradetaper-postgres

# Should show:
# NAME        CHARSET  COLLATION
# postgres    UTF8     en_US.UTF8
# tradetaper  UTF8     en_US.UTF8

# Verify users exist
gcloud sql users list --instance=tradetaper-postgres

# Should show:
# NAME        HOST  TYPE      PASSWORD_POLICY
# postgres          BUILT_IN
# tradetaper        BUILT_IN
```

### Step 2: Configure Cloud SQL Connection in Cloud Run

```bash
# Add Cloud SQL instance connection to Cloud Run service
gcloud run services update tradetaper-backend \
  --region us-central1 \
  --add-cloudsql-instances=tradetaper:us-central1:tradetaper-postgres
```

### Step 3: Verify Application Code Configuration

Ensure `src/app.module.ts` has the correct TypeORM configuration:

```typescript
// For production, use Cloud SQL with Unix socket
if (isProduction) {
  console.log('Using Cloud SQL configuration for production');
  const dbConfig = {
    host: configService.get<string>('DATABASE_HOST') || '/cloudsql/tradetaper:us-central1:tradetaper-postgres',
    username: configService.get<string>('DATABASE_USERNAME') || 'tradetaper',
    password: configService.get<string>('DATABASE_PASSWORD') || 'TradeTaper2024',
    database: configService.get<string>('DATABASE_NAME') || 'tradetaper',
  };
  
  return {
    type: 'postgres' as const,
    host: dbConfig.host,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    entities: [User, Account, Trade, Tag, MT5Account, Subscription, Usage, Strategy],
    synchronize: false,
    ssl: false,
    retryAttempts: 3,
    retryDelay: 2000,
    autoLoadEntities: true,
    logging: ['error', 'warn', 'info', 'query'],
    connectTimeoutMS: 30000,
    extra: {
      max: 5,
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 10000,
    }
  };
}
```

### Step 4: Create Environment Variables YAML File

Create `env-vars.yaml` with ALL required environment variables:

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: tradetaper-backend
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/cloudsql-instances: tradetaper:us-central1:tradetaper-postgres
    spec:
      containers:
      - image: us-central1-docker.pkg.dev/tradetaper/cloud-run-source-deploy/tradetaper-backend
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_HOST
          value: "/cloudsql/tradetaper:us-central1:tradetaper-postgres"
        - name: DATABASE_PORT
          value: "5432"
        - name: DATABASE_USERNAME
          value: "tradetaper"
        - name: DATABASE_PASSWORD
          value: "TradeTaper2024"
        - name: DATABASE_NAME
          value: "tradetaper"
        - name: JWT_SECRET
          value: "your-jwt-secret-here-make-it-long-and-secure-production-key-2024"
        - name: FRONTEND_URL
          value: "https://tradetaper-frontend-benniejosephs-projects.vercel.app"
        - name: ADMIN_URL
          value: "https://tradetaper-admin.vercel.app"
        - name: GCS_BUCKET_NAME
          value: "tradetaper-uploads"
        - name: TRADERMADE_API_KEY
          value: "X4FgwHzL7HpukWs4FjYV"
        - name: GOOGLE_APPLICATION_CREDENTIALS_JSON
          value: '{"type":"service_account","project_id":"YOUR_PROJECT_ID","private_key_id":"YOUR_PRIVATE_KEY_ID","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT_HERE\n-----END PRIVATE KEY-----\n","client_email":"YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com","client_id":"YOUR_CLIENT_ID","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/YOUR_SERVICE_ACCOUNT%40YOUR_PROJECT.iam.gserviceaccount.com","universe_domain":"googleapis.com"}'
        resources:
          limits:
            cpu: "2"
            memory: "2Gi"
        ports:
        - containerPort: 8080
      serviceAccountName: 481634875325-compute@developer.gserviceaccount.com
      timeoutSeconds: 900
```

### Step 5: Deploy Application

```bash
# Build the application
npm run build

# Deploy to Cloud Run using source deployment
gcloud run deploy tradetaper-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10 \
  --timeout 900
```

### Step 6: Apply Environment Variables

```bash
# Apply environment variables using YAML file
gcloud run services replace env-vars.yaml --region us-central1

# Clean up the temporary file
rm env-vars.yaml
```

### Step 7: Verification

```bash
# Test health endpoint
curl https://tradetaper-backend-481634875325.us-central1.run.app/health

# Expected response:
# {"status":"ok","timestamp":"...","uptime":...,"memory":{...}}

# Test deployment endpoint
curl https://tradetaper-backend-481634875325.us-central1.run.app/api/v1/test-deployment

# Expected response:
# {"message":"TradeTaper Backend deployed successfully!","timestamp":"...","version":"1.0.0","environment":"production","features":["User Management","Trade Tracking","Admin Dashboard","Database Integration"]}

# Verify environment variables are set
gcloud run services describe tradetaper-backend \
  --region us-central1 \
  --format="yaml" | grep -A 30 env: | grep -E "name:|value:" | head -30
```

## Troubleshooting

### Common Issues and Solutions

1. **Database Connection Errors**
   - Verify Cloud SQL instance is running: `gcloud sql instances describe tradetaper-postgres`
   - Check Cloud SQL connection is added to Cloud Run
   - Verify database user passwords are correct

2. **Environment Variables Missing**
   - Never use individual `gcloud run services update --set-env-vars` commands
   - Always use the YAML file approach to set ALL variables at once
   - Verify all 12 environment variables are present after deployment

3. **Authentication Errors**
   - Ensure `tradetaper` user password is set: `gcloud sql users set-password tradetaper --instance=tradetaper-postgres --password=TradeTaper2024`
   - Check that the service account has proper IAM permissions

4. **Module Dependency Errors**
   - Ensure all modules are enabled in `src/app.module.ts`
   - Verify TypeORM configuration matches the environment variables

## Final Service Configuration

After successful deployment, the service should have:

- **URL**: `https://tradetaper-backend-481634875325.us-central1.run.app`
- **Memory**: 2Gi
- **CPU**: 2 cores
- **Timeout**: 900 seconds
- **Max Instances**: 10
- **Database**: Connected to Cloud SQL PostgreSQL
- **All Environment Variables**: Properly configured
- **All Modules**: Enabled and functional

## Important Notes

1. **DO NOT** use `gcloud run services update --set-env-vars` for multiple variables as it overwrites existing ones
2. **ALWAYS** use the YAML file approach for environment variable deployment
3. **VERIFY** all 12 environment variables are present after deployment
4. **TEST** both health and deployment endpoints after successful deployment
5. The `GOOGLE_APPLICATION_CREDENTIALS_JSON` must be the complete JSON string, not base64 encoded

## Module Dependencies

Ensure these modules are enabled in the correct order:
1. ConfigModule (always first)
2. TypeOrmModule (database connection)
3. UsersModule (basic user functionality)
4. SimpleWebSocketModule (required by TradesModule)
5. AuthModule (authentication)
6. TagsModule (trade tags)
7. TradesModule (requires SimpleWebSocketModule)
8. StrategiesModule (trading strategies)
9. AdminModule (admin functionality)
10. FilesModule (file uploads)
11. MarketDataModule (market data)
12. CommonModule (shared utilities)

This deployment guide ensures consistent and error-free deployments of the TradeTaper backend to Google Cloud Run. 