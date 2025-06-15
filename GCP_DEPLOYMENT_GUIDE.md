# TradeTaper Backend - Google Cloud Platform Deployment Guide

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Google Cloud SDK** installed locally
3. **Docker** installed and running
4. **Node.js** (v20.x) installed
5. **Git** installed

## Step 1: Initial Setup

### 1.1 Install Google Cloud SDK
```bash
# macOS
brew install google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

### 1.2 Authenticate with Google Cloud
```bash
gcloud auth login
gcloud auth configure-docker
```

### 1.3 Set Your Project
```bash
# Replace with your project ID
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID
```

## Step 2: Enable Required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

## Step 3: Create Cloud SQL Instance (Optional)

If you need a database:

```bash
# Create PostgreSQL instance
gcloud sql instances create tradetaper-postgres \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --storage-type=SSD \
    --storage-size=10GB

# Create database
gcloud sql databases create tradetaper \
    --instance=tradetaper-postgres

# Create user
gcloud sql users create tradetaper \
    --instance=tradetaper-postgres \
    --password=YOUR_SECURE_PASSWORD
```

## Step 4: Prepare Environment Variables

### 4.1 Create `.env.yaml` in `tradetaper-backend/`
```yaml
NODE_ENV: "production"
DATABASE_URL: "postgresql://tradetaper:YOUR_PASSWORD@/tradetaper?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME"
JWT_SECRET: "your-secure-jwt-secret"
JWT_EXPIRATION_TIME: "7d"
METAAPI_TOKEN: "your-metaapi-token"
METAAPI_ACCOUNT_ID: "your-metaapi-account-id"
STRIPE_SECRET_KEY: "your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET: "your-stripe-webhook-secret"
STRIPE_PRICE_BASIC_MONTHLY: "price_xxx"
STRIPE_PRICE_BASIC_YEARLY: "price_xxx"
STRIPE_PRICE_PRO_MONTHLY: "price_xxx"
STRIPE_PRICE_PRO_YEARLY: "price_xxx"
STRIPE_PRICE_ENTERPRISE_MONTHLY: "price_xxx"
STRIPE_PRICE_ENTERPRISE_YEARLY: "price_xxx"
STRIPE_PRODUCT_BASIC: "prod_xxx"
STRIPE_PRODUCT_PRO: "prod_xxx"
STRIPE_PRODUCT_ENTERPRISE: "prod_xxx"
FRONTEND_URL: "https://your-frontend-url.com"
ADMIN_EMAILS: "admin@yourdomain.com"
```

## Step 5: Build and Deploy

### 5.1 Navigate to Backend Directory
```bash
cd tradetaper-backend
```

### 5.2 Build Docker Image
```bash
# Build for linux/amd64 (required for Cloud Run)
docker buildx build --platform linux/amd64 \
    -t gcr.io/$PROJECT_ID/tradetaper-backend:latest .
```

### 5.3 Push to Container Registry
```bash
docker push gcr.io/$PROJECT_ID/tradetaper-backend:latest
```

### 5.4 Deploy to Cloud Run
```bash
gcloud run deploy tradetaper-backend \
    --image gcr.io/$PROJECT_ID/tradetaper-backend:latest \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 900 \
    --add-cloudsql-instances $PROJECT_ID:us-central1:tradetaper-postgres \
    --env-vars-file .env.yaml
```

## Step 6: Verify Deployment

### 6.1 Get Service URL
```bash
gcloud run services describe tradetaper-backend \
    --region us-central1 \
    --format 'value(status.url)'
```

### 6.2 Test Endpoints
```bash
# Health check
curl https://YOUR-SERVICE-URL/api/v1/health

# Ping
curl https://YOUR-SERVICE-URL/api/v1/ping

# Admin dashboard stats
curl https://YOUR-SERVICE-URL/api/v1/admin/dashboard-stats
```

## Step 7: Update Frontend Configuration

Update your frontend applications to use the new backend URL:

### For Admin Dashboard (`tradetaper-admin/`)
Update `next.config.ts`:
```typescript
env: {
  NEXT_PUBLIC_API_URL: 'https://YOUR-SERVICE-URL/api/v1',
}
```

### For Main Frontend (`tradetaper-frontend/`)
Create `.env.production`:
```
NEXT_PUBLIC_API_URL=https://YOUR-SERVICE-URL/api/v1
```

## Step 8: Set Up CI/CD (Optional)

### 8.1 Create `cloudbuild.yaml` in `tradetaper-backend/`
```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/tradetaper-backend:$COMMIT_SHA', '.']
  
  # Push the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/tradetaper-backend:$COMMIT_SHA']
  
  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'tradetaper-backend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/tradetaper-backend:$COMMIT_SHA'
      - '--region'
      - 'us-central1'

images:
  - 'gcr.io/$PROJECT_ID/tradetaper-backend:$COMMIT_SHA'
```

### 8.2 Set Up Build Trigger
```bash
# Connect your GitHub repository
gcloud builds triggers create github \
    --repo-name=tradetaper \
    --repo-owner=YOUR_GITHUB_USERNAME \
    --branch-pattern="^main$" \
    --build-config=tradetaper-backend/cloudbuild.yaml
```

## Troubleshooting

### Container Fails to Start
1. Check logs: `gcloud run services logs read tradetaper-backend --region us-central1`
2. Ensure PORT environment variable is not hardcoded
3. Verify all required environment variables are set

### Database Connection Issues
1. Ensure Cloud SQL instance is in the same region
2. Check DATABASE_URL format
3. Verify Cloud SQL connections are added to Cloud Run service
4. Set `ssl: false` in database config for Cloud SQL

### Build Failures
1. Ensure Docker is using linux/amd64 platform
2. Check for missing dependencies in package.json
3. Verify Dockerfile syntax

## Quick Deploy Script

Save this as `deploy-backend.sh`:
```bash
#!/bin/bash
set -e

PROJECT_ID=${1:-"your-project-id"}
REGION="us-central1"
SERVICE_NAME="tradetaper-backend"

echo "🚀 Deploying TradeTaper Backend to GCP..."

# Build
echo "📦 Building Docker image..."
docker buildx build --platform linux/amd64 \
    -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest .

# Push
echo "⬆️ Pushing to Container Registry..."
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

# Deploy
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 900 \
    --env-vars-file .env.yaml

# Get URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region $REGION --format 'value(status.url)')

echo "✅ Deployment complete!"
echo "🌐 Service URL: $SERVICE_URL"
```

## Security Best Practices

1. **Use Secret Manager** for sensitive values:
   ```bash
   # Create secret
   echo -n "your-secret-value" | gcloud secrets create jwt-secret --data-file=-
   
   # Grant access
   gcloud secrets add-iam-policy-binding jwt-secret \
       --member="serviceAccount:YOUR-SERVICE-ACCOUNT" \
       --role="roles/secretmanager.secretAccessor"
   ```

2. **Enable VPC Connector** for private Cloud SQL access
3. **Set up Cloud Armor** for DDoS protection
4. **Configure Identity Platform** for authentication
5. **Enable Cloud Monitoring** and set up alerts

## Cost Optimization

1. **Set minimum instances to 0** for development
2. **Use Cloud Scheduler** to warm up instances
3. **Enable CPU boost** only when needed
4. **Set appropriate memory limits**
5. **Use Cloud CDN** for static assets

## Next Steps

1. Set up custom domain with Cloud Load Balancing
2. Configure SSL certificates
3. Set up monitoring and logging
4. Implement backup strategies
5. Configure auto-scaling policies 